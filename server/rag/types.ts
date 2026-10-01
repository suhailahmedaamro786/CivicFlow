/**
 * CivicFlow AI - Production RAG & Knowledge Pipeline Types
 */

export type DocumentProcessingStatus =
  | 'UPLOADING'
  | 'PROCESSING'
  | 'INDEXING'
  | 'READY'
  | 'FAILED';

export type VerifierSupportStatus =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'UNSUPPORTED'
  | 'REQUIRES_VERIFICATION';

export interface KnowledgeDocumentMetadata {
  documentId: string;
  title: string;
  filename: string;
  fileType: 'pdf' | 'txt' | 'md';
  category: string;
  source: string;
  authority: string;
  publicationDate: string;
  uploadedAt: string;
  version: string;
  checksum: string;
  fileSizeBytes: number;
  status: DocumentProcessingStatus;
  chunksCount: number;
  isDemoDocument?: boolean;
  errorMessage?: string;
}

export interface DocumentChunkRecord {
  chunkId: string;
  documentId: string;
  text: string;
  pageNumber?: number;
  section: string;
  tokenCount: number;
  checksum: string;
  metadata: {
    title: string;
    authority: string;
    category: string;
    source: string;
    publicationDate: string;
    language?: string;
  };
  embedding?: number[];
}

export interface RetrievalFilter {
  category?: string;
  authority?: string;
  documentId?: string;
  language?: string;
  minScore?: number;
}

export interface RetrievedEvidenceChunk {
  chunkId: string;
  documentId: string;
  title: string;
  authority: string;
  source: string;
  pageNumber?: number;
  section: string;
  text: string;
  similarityScore: number; // 0.0 to 1.0
  metadata: Record<string, any>;
}

export interface RAGSearchResult {
  query: string;
  evidence: RetrievedEvidenceChunk[];
  totalChunksEvaluated: number;
  retrievalLatencyMs: number;
  vectorStoreProvider: 'qdrant' | 'development_in_memory';
  embeddingProvider: string;
  coverageAssessment: 'COMPREHENSIVE' | 'PARTIAL' | 'MINIMAL' | 'INSUFFICIENT';
}

export interface RAGTestConsoleResponse {
  query: string;
  evidence: RetrievedEvidenceChunk[];
  similarityScores: number[];
  sourceDocuments: {
    documentId: string;
    title: string;
    authority: string;
    source: string;
    pageNumber?: number;
    section: string;
  }[];
  generatedAnswer: string;
  verificationStatus: VerifierSupportStatus;
  insufficientEvidenceWarning?: boolean;
  latencyMs: number;
}

export interface RAGSystemStatus {
  isQdrantConfigured: boolean;
  qdrantConnected: boolean;
  qdrantUrl?: string;
  collectionName: string;
  activeVectorStore: 
    | 'Qdrant Vector Database' 
    | 'Development In-Memory Store [Demo Knowledge Base]'
    | 'Development In-Memory Store [Qdrant Fallback Active]';
  embeddingProvider: 'gemini' | 'local';
  embeddingModel: string;
  totalDocuments: number;
  totalChunks: number;
  demoDocumentsCount: number;
  cacheHitCount: number;
}
