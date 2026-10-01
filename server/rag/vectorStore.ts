import { 
  DocumentChunkRecord, 
  RetrievalFilter, 
  RetrievedEvidenceChunk, 
  KnowledgeDocumentMetadata 
} from './types';

export interface VectorDatabase {
  upsertChunks(chunks: DocumentChunkRecord[]): Promise<number>;
  search(queryVector: number[], queryText: string, topK: number, filter?: RetrievalFilter): Promise<RetrievedEvidenceChunk[]>;
  deleteByDocumentId(documentId: string): Promise<boolean>;
  getChunkCount(): number;
  getDocumentCount(): number;
  getProviderName(): string;
  isConfigured(): boolean;
  isConnected(): boolean;
}

/**
 * Native REST Qdrant Client Implementation
 * Works directly over standard HTTP/REST without fragile SDK version locks.
 */
export class QdrantVectorStore implements VectorDatabase {
  private url: string;
  private apiKey?: string;
  private collection: string;
  private initialized = false;
  private connected = false;
  private disabledUntil = 0;
  private lastWarningLogged = 0;

  constructor() {
    this.url = (process.env.QDRANT_URL || '').replace(/\/$/, '');
    this.apiKey = process.env.QDRANT_API_KEY;
    this.collection = process.env.QDRANT_COLLECTION || 'civicflow_knowledge';
  }

  public isConfigured(): boolean {
    return Boolean(this.url && this.url.startsWith('http'));
  }

  public isConnected(): boolean {
    return this.connected && Date.now() >= this.disabledUntil;
  }

  public getProviderName(): string {
    return 'Qdrant Vector Database';
  }

  public async ensureCollection(dimensions: number = 32): Promise<boolean> {
    if (!this.isConfigured()) return false;
    if (Date.now() < this.disabledUntil) return false;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.apiKey) headers['api-key'] = this.apiKey;

      // 1. Check if collection exists with 3.5s timeout
      const checkRes = await fetch(`${this.url}/collections/${this.collection}`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(3500)
      });

      if (checkRes.ok) {
        this.connected = true;
        this.initialized = true;
        return true;
      }

      // 2. If 404, create collection with cosine distance
      const createRes = await fetch(`${this.url}/collections/${this.collection}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          vectors: {
            size: dimensions,
            distance: 'Cosine'
          }
        }),
        signal: AbortSignal.timeout(3500)
      });

      if (createRes.ok) {
        this.connected = true;
        this.initialized = true;
        return true;
      } else {
        this.connected = false;
        this.disabledUntil = Date.now() + 60000;
        return false;
      }
    } catch (err: any) {
      this.connected = false;
      this.disabledUntil = Date.now() + 120000; // 2 minute backoff cooldown
      const now = Date.now();
      if (now - this.lastWarningLogged > 60000) {
        this.lastWarningLogged = now;
        console.warn(`[Qdrant] Connection to ${this.url} failed (${err?.message || 'ECONNRESET'}). Seamlessly routing RAG operations to In-Memory Vector Store.`);
      }
      return false;
    }
  }

  public async upsertChunks(chunks: DocumentChunkRecord[]): Promise<number> {
    if (!this.isConfigured() || chunks.length === 0 || Date.now() < this.disabledUntil) {
      return 0;
    }

    const isReady = await this.ensureCollection();
    if (!isReady || !this.connected) {
      return 0;
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['api-key'] = this.apiKey;

    // Convert chunks to Qdrant points
    const points = chunks.map((chunk) => {
      const numId = Math.abs(this.hashStringToInteger(chunk.chunkId));
      return {
        id: numId,
        vector: chunk.embedding || [],
        payload: {
          chunkId: chunk.chunkId,
          documentId: chunk.documentId,
          title: chunk.metadata.title,
          authority: chunk.metadata.authority,
          source: chunk.metadata.source,
          category: chunk.metadata.category,
          pageNumber: chunk.pageNumber,
          section: chunk.section,
          text: chunk.text,
          checksum: chunk.checksum,
          publicationDate: chunk.metadata.publicationDate
        }
      };
    });

    try {
      const res = await fetch(`${this.url}/collections/${this.collection}/points`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ points }),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        return points.length;
      }
      return 0;
    } catch (err: any) {
      this.connected = false;
      this.disabledUntil = Date.now() + 120000;
      return 0;
    }
  }

  public async search(
    queryVector: number[],
    queryText: string,
    topK: number = 4,
    filter?: RetrievalFilter
  ): Promise<RetrievedEvidenceChunk[]> {
    if (!this.isConfigured() || Date.now() < this.disabledUntil) return [];
    const isReady = await this.ensureCollection();
    if (!isReady || !this.connected) return [];

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['api-key'] = this.apiKey;

    // Construct Qdrant filter object if filters provided
    const mustFilters: any[] = [];
    if (filter?.category) {
      mustFilters.push({ key: 'category', match: { value: filter.category } });
    }
    if (filter?.authority) {
      mustFilters.push({ key: 'authority', match: { value: filter.authority } });
    }
    if (filter?.documentId) {
      mustFilters.push({ key: 'documentId', match: { value: filter.documentId } });
    }

    const payload: any = {
      vector: queryVector,
      limit: topK,
      with_payload: true
    };
    if (mustFilters.length > 0) {
      payload.filter = { must: mustFilters };
    }

    try {
      const res = await fetch(`${this.url}/collections/${this.collection}/points/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(3500)
      });

      if (!res.ok) return [];

      const data: any = await res.json();
      const hits = data.result || [];

      return hits.map((hit: any) => ({
        chunkId: hit.payload?.chunkId || `chk-${hit.id}`,
        documentId: hit.payload?.documentId || 'unknown',
        title: hit.payload?.title || 'Regulatory Document',
        authority: hit.payload?.authority || 'Government Authority',
        source: hit.payload?.source || 'Statute',
        pageNumber: hit.payload?.pageNumber,
        section: hit.payload?.section || 'Section',
        text: hit.payload?.text || '',
        similarityScore: Math.round(Number(hit.score || 0) * 100) / 100,
        metadata: hit.payload || {}
      }));
    } catch (err: any) {
      this.connected = false;
      this.disabledUntil = Date.now() + 120000;
      return [];
    }
  }

  public async deleteByDocumentId(documentId: string): Promise<boolean> {
    if (!this.isConfigured() || !this.connected || Date.now() < this.disabledUntil) return false;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['api-key'] = this.apiKey;

    try {
      const res = await fetch(`${this.url}/collections/${this.collection}/points/delete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filter: {
            must: [{ key: 'documentId', match: { value: documentId } }]
          }
        }),
        signal: AbortSignal.timeout(3000)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public getChunkCount(): number {
    return 0; // Fetched dynamically from Qdrant stats
  }

  public getDocumentCount(): number {
    return 0;
  }

  private hashStringToInteger(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}

/**
 * In-Memory Vector Database
 * Development fallback used when Qdrant is not configured.
 * Clearly labelled as "Development In-Memory Store [Demo Knowledge Base]".
 */
export class InMemoryVectorStore implements VectorDatabase {
  private chunks: DocumentChunkRecord[] = [];
  private documents = new Map<string, KnowledgeDocumentMetadata>();

  public getProviderName(): string {
    return 'Development In-Memory Store [Demo Knowledge Base]';
  }

  public isConfigured(): boolean {
    return true; // Always available
  }

  public isConnected(): boolean {
    return true;
  }

  public getChunkCount(): number {
    return this.chunks.length;
  }

  public getDocumentCount(): number {
    return this.documents.size;
  }

  public registerDocument(doc: KnowledgeDocumentMetadata) {
    this.documents.set(doc.documentId, doc);
  }

  public getDocuments(): KnowledgeDocumentMetadata[] {
    return Array.from(this.documents.values());
  }

  public async upsertChunks(newChunks: DocumentChunkRecord[]): Promise<number> {
    let count = 0;
    for (const chunk of newChunks) {
      // Prevent duplicate chunks by chunkId or exact checksum
      const existingIdx = this.chunks.findIndex(c => c.chunkId === chunk.chunkId || c.checksum === chunk.checksum);
      if (existingIdx >= 0) {
        this.chunks[existingIdx] = chunk;
      } else {
        this.chunks.push(chunk);
        count++;
      }
    }
    return count;
  }

  public async search(
    queryVector: number[],
    queryText: string,
    topK: number = 4,
    filter?: RetrievalFilter
  ): Promise<RetrievedEvidenceChunk[]> {
    const queryTokens = queryText.toLowerCase().match(/\b[a-z0-9_§-]+\b/g) || [];

    // Apply filtering
    let eligible = this.chunks;
    if (filter?.category) {
      eligible = eligible.filter(c => c.metadata.category.toLowerCase().includes(filter.category!.toLowerCase()));
    }
    if (filter?.authority) {
      eligible = eligible.filter(c => c.metadata.authority.toLowerCase().includes(filter.authority!.toLowerCase()));
    }
    if (filter?.documentId) {
      eligible = eligible.filter(c => c.documentId === filter.documentId);
    }

    const scored = eligible.map(chunk => {
      // 1. Vector Cosine Similarity
      const cosineSim = chunk.embedding ? this.cosineSimilarity(queryVector, chunk.embedding) : 0.5;

      // 2. Lexical keyword overlap
      const chunkTokens: string[] = (chunk.text + ' ' + (chunk.section || '') + ' ' + chunk.metadata.title).toLowerCase().match(/\b[a-z0-9_§-]+\b/g) || [];
      let tokenMatches = 0;
      for (const t of queryTokens) {
        if (chunkTokens.includes(t)) tokenMatches++;
      }
      const lexicalScore = queryTokens.length > 0 ? (tokenMatches / queryTokens.length) : 0;

      // 3. Domain boost
      let boost = 0;
      const q = queryText.toLowerCase();
      const txt = chunk.text.toLowerCase();
      if ((q.includes('business') || q.includes('register')) && (txt.includes('llc-1') || txt.includes('btrc'))) boost += 0.2;
      if (q.includes('fee') && (txt.includes('$') || txt.includes('fee'))) boost += 0.15;
      if (q.includes('document') && (txt.includes('form') || txt.includes('statement'))) boost += 0.15;

      const combinedScore = Math.min(0.99, Math.max(0.1, (cosineSim * 0.45) + (lexicalScore * 0.4) + boost));

      return {
        chunk,
        score: Math.round(combinedScore * 100) / 100
      };
    });

    // Rerank by combined score
    scored.sort((a, b) => b.score - a.score);

    // Apply minScore threshold
    const minScore = filter?.minScore ?? 0.35;
    const filtered = scored.filter(s => s.score >= minScore);

    // Deduplicate near-identical snippets
    const seenTexts = new Set<string>();
    const deduplicated: { chunk: DocumentChunkRecord; score: number }[] = [];

    for (const item of filtered) {
      const signature = item.chunk.text.slice(0, 80);
      if (!seenTexts.has(signature)) {
        seenTexts.add(signature);
        deduplicated.push(item);
      }
      if (deduplicated.length >= topK) break;
    }

    return deduplicated.map(({ chunk, score }) => ({
      chunkId: chunk.chunkId,
      documentId: chunk.documentId,
      title: chunk.metadata.title,
      authority: chunk.metadata.authority,
      source: chunk.metadata.source,
      pageNumber: chunk.pageNumber,
      section: chunk.section,
      text: chunk.text,
      similarityScore: score,
      metadata: chunk.metadata
    }));
  }

  public async deleteByDocumentId(documentId: string): Promise<boolean> {
    const initialLen = this.chunks.length;
    this.chunks = this.chunks.filter(c => c.documentId !== documentId);
    this.documents.delete(documentId);
    return this.chunks.length < initialLen;
  }

  public getChunksByDocumentId(documentId: string): DocumentChunkRecord[] {
    return this.chunks.filter(c => c.documentId === documentId);
  }

  private cosineSimilarity(v1: number[], v2: number[]): number {
    let dot = 0;
    let m1 = 0;
    let m2 = 0;
    for (let i = 0; i < Math.min(v1.length, v2.length); i++) {
      dot += v1[i] * v2[i];
      m1 += v1[i] * v1[i];
      m2 += v2[i] * v2[i];
    }
    const mag = Math.sqrt(m1) * Math.sqrt(m2);
    return mag ? (dot / mag + 1) / 2 : 0.5;
  }
}
