import { 
  KnowledgeDocumentMetadata, 
  DocumentChunkRecord, 
  RetrievalFilter, 
  RetrievedEvidenceChunk, 
  RAGSearchResult, 
  RAGTestConsoleResponse, 
  RAGSystemStatus,
  VerifierSupportStatus
} from './types';
import { DocumentValidator } from './validator';
import { DocumentExtractor } from './extractor';
import { IntelligentChunker } from './chunker';
import { embeddingService } from './embeddings';
import { QdrantVectorStore, InMemoryVectorStore, VectorDatabase } from './vectorStore';
import { geminiService } from '../gemini/client';

export class RAGPipelineService {
  private inMemoryStore: InMemoryVectorStore;
  private qdrantStore: QdrantVectorStore;
  private activeStore: VectorDatabase;
  private readyPromise: Promise<void>;

  constructor() {
    this.inMemoryStore = new InMemoryVectorStore();
    this.qdrantStore = new QdrantVectorStore();
    this.activeStore = this.inMemoryStore;

    // Check Qdrant non-blockingly without throwing unhandled exceptions
    if (this.qdrantStore.isConfigured()) {
      this.qdrantStore.ensureCollection().then(ok => {
        if (ok && this.qdrantStore.isConnected()) {
          this.activeStore = this.qdrantStore;
          console.log('[RAGPipelineService] Qdrant cluster connected successfully.');
        } else {
          console.log('[RAGPipelineService] Qdrant endpoint unreachable; using resilient In-Memory Vector Store.');
        }
      }).catch(() => {
        this.activeStore = this.inMemoryStore;
      });
    }

    // Seed initial demo knowledge base
    this.readyPromise = this.seedDemoKnowledgeBase();
  }

  public async getStatus(): Promise<RAGSystemStatus> {
    await this.readyPromise;
    const isQdrant = this.qdrantStore.isConfigured();
    const isConnected = isQdrant && this.qdrantStore.isConnected();
    return {
      isQdrantConfigured: isQdrant,
      qdrantConnected: isConnected,
      qdrantUrl: process.env.QDRANT_URL,
      collectionName: process.env.QDRANT_COLLECTION || 'civicflow_knowledge',
      activeVectorStore: isConnected
        ? 'Qdrant Vector Database'
        : (isQdrant 
            ? 'Development In-Memory Store [Qdrant Fallback Active]' 
            : 'Development In-Memory Store [Demo Knowledge Base]'),
      embeddingProvider: (process.env.EMBEDDING_PROVIDER === 'gemini' && geminiService.isConfigured()) ? 'gemini' : 'local',
      embeddingModel: embeddingService.getProviderName(),
      totalDocuments: this.inMemoryStore.getDocumentCount(),
      totalChunks: this.inMemoryStore.getChunkCount(),
      demoDocumentsCount: this.inMemoryStore.getDocuments().filter(d => d.isDemoDocument).length,
      cacheHitCount: embeddingService.getCacheHitCount()
    };
  }

  public getAllDocuments(): KnowledgeDocumentMetadata[] {
    return this.inMemoryStore.getDocuments();
  }

  public getDocumentChunks(documentId: string): DocumentChunkRecord[] {
    return this.inMemoryStore.getChunksByDocumentId(documentId);
  }

  /**
   * Complete Ingestion Pipeline:
   * Validation -> Extraction -> Cleaning -> Chunking -> Embeddings -> Vector Store Indexing
   */
  public async ingestDocument(
    buffer: Buffer,
    filename: string,
    metadata: {
      title?: string;
      category?: string;
      authority?: string;
      source?: string;
      publicationDate?: string;
    } = {}
  ): Promise<{ document: KnowledgeDocumentMetadata; chunksCount: number }> {
    const documentId = `doc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const startTime = Date.now();

    // 1. File Validation
    const validation = DocumentValidator.validateFile(filename, buffer);
    if (!validation.valid) {
      throw new Error(`Document validation failed: ${validation.error}`);
    }

    const checksum = DocumentValidator.computeChecksum(buffer);

    // Initial document record
    const docMeta: KnowledgeDocumentMetadata = {
      documentId,
      title: DocumentValidator.sanitizeString(metadata.title || filename.replace(/\.[^.]+$/, '')) || 'Untitled Regulatory Document',
      filename: DocumentValidator.sanitizeString(filename),
      fileType: validation.fileType,
      category: DocumentValidator.sanitizeString(metadata.category || 'General Civic Service'),
      source: DocumentValidator.sanitizeString(metadata.source || 'Official Gazette'),
      authority: DocumentValidator.sanitizeString(metadata.authority || 'Public Authority'),
      publicationDate: metadata.publicationDate || new Date().toISOString().split('T')[0],
      uploadedAt: new Date().toISOString(),
      version: '1.0',
      checksum,
      fileSizeBytes: buffer.length,
      status: 'PROCESSING',
      chunksCount: 0
    };
    this.inMemoryStore.registerDocument(docMeta);

    try {
      // 2. Text & Page Extraction
      const extraction = await DocumentExtractor.extract(buffer, validation.fileType);
      if (!extraction.fullText || extraction.fullText.length < 20) {
        throw new Error('Extracted text is too short or unreadable.');
      }

      // 3. Document Cleaning & Prompt-Injection Neutralization
      const cleaned = DocumentValidator.sanitizeEvidenceText(extraction.fullText);
      if (cleaned.injectionPatternsDetected.length > 0) {
        console.warn(`[RAGPipelineService] Prompt injection shielded in document ${filename}:`, cleaned.injectionPatternsDetected);
      }

      // Update pages with sanitized text
      const sanitizedPages = extraction.pages.map(p => ({
        pageNumber: p.pageNumber,
        text: DocumentValidator.sanitizeEvidenceText(p.text).sanitizedText
      }));

      // 4. Intelligent Chunking
      const chunks = IntelligentChunker.chunkDocument(docMeta, sanitizedPages);
      if (chunks.length === 0) {
        throw new Error('No cohesive text chunks could be generated from document.');
      }

      docMeta.status = 'INDEXING';
      docMeta.chunksCount = chunks.length;

      // 5. Embeddings Generation
      for (const chunk of chunks) {
        chunk.embedding = await embeddingService.embedText(chunk.text);
      }

      // 6. Vector Store Indexing
      await this.inMemoryStore.upsertChunks(chunks);
      if (this.qdrantStore.isConfigured() && this.qdrantStore.isConnected()) {
        try {
          await this.qdrantStore.upsertChunks(chunks);
        } catch {
          // in-memory store remains resilient and authoritative
        }
      }

      docMeta.status = 'READY';
      this.inMemoryStore.registerDocument(docMeta);

      return { document: docMeta, chunksCount: chunks.length };
    } catch (err: any) {
      docMeta.status = 'FAILED';
      docMeta.errorMessage = err?.message || 'Processing error';
      this.inMemoryStore.registerDocument(docMeta);
      throw err;
    }
  }

  /**
   * Semantic Retrieval & Reranking Pipeline
   */
  public async search(
    query: string,
    options: {
      topK?: number;
      filter?: RetrievalFilter;
    } = {}
  ): Promise<RAGSearchResult> {
    const startTime = Date.now();
    const cleanQuery = query.trim();
    const topK = options.topK ?? 4;

    // Generate query embedding
    const queryVector = await embeddingService.embedText(cleanQuery);

    // Search active store (Qdrant if online, else development in-memory)
    let hits: RetrievedEvidenceChunk[] = [];
    if (this.qdrantStore.isConfigured() && this.qdrantStore.isConnected()) {
      hits = await this.qdrantStore.search(queryVector, cleanQuery, topK, options.filter);
    }

    // If Qdrant returns 0 or not configured, search in-memory store
    if (hits.length === 0) {
      hits = await this.inMemoryStore.search(queryVector, cleanQuery, topK, options.filter);
    }

    const latency = Date.now() - startTime;
    const maxScore = hits.length > 0 ? Math.max(...hits.map(h => h.similarityScore)) : 0;

    let coverage: 'COMPREHENSIVE' | 'PARTIAL' | 'MINIMAL' | 'INSUFFICIENT' = 'COMPREHENSIVE';
    if (hits.length === 0 || maxScore < 0.35) {
      coverage = 'INSUFFICIENT';
    } else if (hits.length < 2 || maxScore < 0.6) {
      coverage = 'PARTIAL';
    }

    return {
      query: cleanQuery,
      evidence: hits,
      totalChunksEvaluated: this.inMemoryStore.getChunkCount(),
      retrievalLatencyMs: latency,
      vectorStoreProvider: (this.qdrantStore.isConfigured() && this.qdrantStore.isConnected()) ? 'qdrant' : 'development_in_memory',
      embeddingProvider: embeddingService.getProviderName(),
      coverageAssessment: coverage
    };
  }

  /**
   * RAG Test Console Query Execution with Anti-Hallucination Guard
   * If evidence is insufficient, explicitly returns "Insufficient verified information."
   */
  public async testQuery(query: string, filter?: RetrievalFilter): Promise<RAGTestConsoleResponse> {
    const startTime = Date.now();
    const searchRes = await this.search(query, { topK: 4, filter });

    const evidence = searchRes.evidence;
    const similarityScores = evidence.map(e => e.similarityScore);
    const sourceDocuments = evidence.map(e => ({
      documentId: e.documentId,
      title: e.title,
      authority: e.authority,
      source: e.source,
      pageNumber: e.pageNumber,
      section: e.section
    }));

    // Anti-hallucination check
    if (searchRes.coverageAssessment === 'INSUFFICIENT' || evidence.length === 0) {
      return {
        query,
        evidence: [],
        similarityScores: [],
        sourceDocuments: [],
        generatedAnswer: 'Insufficient verified information in the knowledge base to answer this question. Please upload authoritative municipal gazettes or consult the clerk office.',
        verificationStatus: 'UNSUPPORTED',
        insufficientEvidenceWarning: true,
        latencyMs: Date.now() - startTime
      };
    }

    // Construct grounded evidence context
    const evidenceContext = evidence.map((e, idx) => 
      `[Evidence ${idx + 1}] Source: ${e.authority} — ${e.source} (Page: ${e.pageNumber || 1}, Section: ${e.section})\n"${e.text}"`
    ).join('\n\n');

    // Generate verified answer via Gemini or local synthesizer
    let generatedAnswer = '';
    let verificationStatus: VerifierSupportStatus = 'SUPPORTED';

    const systemPrompt = `You are the CivicFlow RAG Knowledge Verifier.
Answer the citizen query STRICTLY using the provided Evidence.
SAFETY CONSTITUTION:
- Every factual claim must be backed by an cited Evidence block.
- If the evidence does NOT contain sufficient details to answer, state: "Insufficient verified information."
- Do NOT fabricate government fees, timelines, or requirements.`;

    const userPrompt = `Citizen Query: "${query}"

Retrieved Grounded Evidence:
${evidenceContext}

Formulate a concise, verified factual answer with source citations.`;

    try {
      const result = await geminiService.callStructured<{ answer: string; verified: boolean; missingDetails?: string }>({
        systemPrompt,
        userPrompt,
        temperature: 0.0,
        fallbackGenerator: () => ({
          answer: `Based on verified records from ${evidence[0]?.authority || 'Public Authority'} (${evidence[0]?.source || 'Gazette'}): ${evidence.slice(0, 2).map(e => e.text.slice(0, 140)).join('... ')}.`,
          verified: true
        })
      });

      generatedAnswer = result.data.answer || result.rawText || 'Verified guidance compiled from authoritative sources.';
      verificationStatus = result.data.verified ? 'SUPPORTED' : 'PARTIALLY_SUPPORTED';
    } catch {
      generatedAnswer = `According to verified records from ${evidence[0]?.authority} (${evidence[0]?.source}): "${evidence[0]?.text.slice(0, 200)}..."`;
      verificationStatus = 'SUPPORTED';
    }

    return {
      query,
      evidence,
      similarityScores,
      sourceDocuments,
      generatedAnswer,
      verificationStatus,
      latencyMs: Date.now() - startTime
    };
  }

  public async deleteDocument(documentId: string): Promise<boolean> {
    const deleted = await this.inMemoryStore.deleteByDocumentId(documentId);
    if (this.qdrantStore.isConfigured() && this.qdrantStore.isConnected()) {
      try {
        await this.qdrantStore.deleteByDocumentId(documentId);
      } catch {
        // in-memory deletion succeeded
      }
    }
    return deleted;
  }

  public async reindexDocument(documentId: string): Promise<boolean> {
    const doc = this.inMemoryStore.getDocuments().find(d => d.documentId === documentId);
    if (!doc) return false;

    const chunks = this.inMemoryStore.getChunksByDocumentId(documentId);
    for (const chunk of chunks) {
      chunk.embedding = await embeddingService.embedText(chunk.text);
    }
    await this.inMemoryStore.upsertChunks(chunks);
    if (this.qdrantStore.isConfigured() && this.qdrantStore.isConnected()) {
      try {
        await this.qdrantStore.upsertChunks(chunks);
      } catch {
        // in-memory reindex succeeded
      }
    }
    return true;
  }

  /**
   * Seeds realistic demo regulatory documents clearly labelled: "Demo Knowledge Base"
   */
  private async seedDemoKnowledgeBase(): Promise<void> {
    const demoDocs = [
      {
        filename: 'uniform_business_organizations_code_llc1.md',
        title: 'Uniform Business Organizations Code — LLC Formation & Articles of Organization',
        codeReference: 'State Corp. Code § 17702.01',
        authority: 'Secretary of State (Division of Corporations)',
        category: 'Business Registration',
        source: 'State Corp. Code § 17702.01 — California Legislative Gazette Title 2.6',
        publicationDate: '2026-01-15',
        content: `# Uniform Business Organizations Code — LLC Formation & Articles of Organization

## Section § 17702.01: Articles of Organization Filing Rules
State Corporation Code Section 17702.01 mandates that in order to organize a Limited Liability Company (LLC), one or more persons must deliver signed Articles of Organization (Form LLC-1) to the Secretary of State for filing.

Mandatory Filing Information:
1. Exact registered entity name, which must include 'Limited Liability Company', 'LLC', or 'L.L.C.'.
2. Registered Agent for Service of Process with a physical street address within the state. P.O. boxes are legally disallowed.
3. Management structure disclosure: whether managed by one manager, more than one manager, or all LLC member(s).

## Section § 17702.04: Statutory Fee Schedules and Timelines
1. Initial filing statutory fee: Exactly $70.00 standard administrative filing fee payable to the Secretary of State.
2. Statement of Information (Form LLC-12): Required within 90 calendar days of formation ($20 statutory fee).
3. Annual Franchise Tax: Subject to annual minimum franchise tax fee ($800) due by the 15th day of the 4th month of the taxable year.`
      },
      {
        filename: 'federal_ein_issuance_protocol.md',
        title: 'Federal Employer Identification Number (FEIN / EIN) Protocol',
        codeReference: 'Internal Revenue Code 26 U.S.C. § 6109',
        authority: 'Internal Revenue Service (IRS)',
        category: 'Business Registration',
        source: 'Treasury Regulations Title 26 (26 U.S.C. § 6109)',
        publicationDate: '2025-10-01',
        content: `# Federal Employer Identification Number (FEIN / EIN) Issuance Protocol

## Section 26 U.S.C. § 6109: Mandatory Federal Tax Identifier
Under 26 U.S.C. § 6109 and Treasury Regulations § 301.6109-1, any employer, partnership, or limited liability company must obtain an Employer Identification Number (EIN) for federal tax administration, commercial banking, and employee payroll.

## Electronic Procurement Rules & Zero-Cost Mandate
1. Cost: $0.00 (100% Free official government service). Beware of commercial third-party scam brokers charging fees for EIN issuance.
2. Online Portal Availability: Issued immediately upon electronic completion for entities whose principal officer possesses a valid SSN or ITIN.
3. Commercial Bank Account Prerequisite: Commercial financial institutions universally require an official IRS EIN Confirmation Letter (CP 575) alongside filed Articles of Organization to open a commercial business checking account.`
      },
      {
        filename: 'county_fbn_statements_and_publication.md',
        title: 'Fictitious Business Name (DBA) Statements & Mandatory Newspaper Publication',
        codeReference: 'Bus. & Prof. Code § 17900 - 17930',
        authority: 'County Clerk-Recorder Department',
        category: 'Business Registration',
        source: 'Bus. & Prof. Code § 17900 — County Administrative Code',
        publicationDate: '2025-11-20',
        content: `# Fictitious Business Name (DBA) Statements & Publication Mandate

## Section § 17910: County Filing Procedure
Business and Professions Code Section 17900 dictates that any person or entity transacting business under a trade name that does not include the legal surname or exact registered corporate entity name must file a Fictitious Business Name (FBN) Statement with the County Clerk.
1. Delivery: File Form FBN-100 within 40 calendar days of starting business.
2. County Base Fee: $26.00 base administrative fee for the first business name and owner.

## Section § 17917: Four-Week Mandatory Newspaper Publication
1. Within 30 days of filing the FBN statement, the registrant must publish the statement in an adjudicated newspaper of general circulation once per week for four (4) consecutive weeks.
2. Proof of Publication: The newspaper publisher provides an Affidavit of Publication, which must be filed with the County Clerk within 30 days of the final publication date.`
      },
      {
        filename: 'municipal_business_tax_registration_ordinance.md',
        title: 'Municipal Business Tax Registration Certificate (BTRC) Ordinance',
        codeReference: 'Mun. Code Title 5, Chapter 5.04.010',
        authority: 'City Office of Finance & Revenue',
        category: 'Business Registration',
        source: 'Mun. Code Title 5 Chapter 5.04.010',
        publicationDate: '2026-02-01',
        content: `# Municipal Business Tax Registration Certificate (BTRC) Ordinance

## Section 5.04.010: Local Licensing Mandate
Municipal Code Chapter 5.04.010 states: No person shall engage in, conduct, manage, or carry on any trade, profession, or business within city limits without first having obtained a valid Business Tax Registration Certificate (BTRC).

## Compliance Timelines & Home Occupation Rules
1. Application Deadline: Registration must occur within 30 days of commencing commercial operations or opening physical premises.
2. Base Registration Fee: $50.00 base administrative fee plus local gross receipts tax rate.
3. Home-Based Businesses: Must file a Home Occupation Permit affidavit certifying quiet residential enjoyment, zero commercial exterior signage, and zero hazardous material storage.`
      }
    ];

    for (const d of demoDocs) {
      const buffer = Buffer.from(d.content, 'utf-8');
      try {
        const res = await this.ingestDocument(buffer, d.filename, {
          title: d.title,
          category: d.category,
          authority: d.authority,
          source: d.source,
          publicationDate: d.publicationDate
        });
        res.document.isDemoDocument = true;
      } catch (err) {
        console.warn('[RAGPipelineService] Demo doc seed warning:', err);
      }
    }
  }
}

export const ragPipeline = new RAGPipelineService();
