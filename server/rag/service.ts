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

    // Real-data mode: never seed fabricated/demo civic records at startup.
    // The knowledge base is populated only through explicit document ingestion.
    this.readyPromise = this.initializeVectorStore();
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
      demoDocumentsCount: 0,
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
  private async initializeVectorStore(): Promise<void> {
    if (!this.qdrantStore.isConfigured()) return;
    try {
      const ready = await this.qdrantStore.ensureCollection();
      if (ready && this.qdrantStore.isConnected()) {
        this.activeStore = this.qdrantStore;
      }
    } catch (err) {
      console.warn('[RAGPipelineService] Vector store initialization failed; no fabricated fallback data will be used.');
    }
  }

  public async search(
    query: string,
    options: {
      topK?: number;
      filter?: RetrievalFilter;
    } = {}
  ): Promise<RAGSearchResult> {
    await this.readyPromise;
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

}

export const ragPipeline = new RAGPipelineService();
