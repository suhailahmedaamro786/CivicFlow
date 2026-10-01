import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  PlusCircle, 
  ShieldCheck, 
  ExternalLink, 
  Scale, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  X,
  FileText,
  Clock,
  Code
} from 'lucide-react';
import { KnowledgeDocument, SourceCitation } from '../types';
import { ragService } from '../services/ragService';

export const KnowledgeBasePage: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(ragService.getAllDocuments());
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(documents[0] || null);

  // Search Tester state
  const [testQuery, setTestQuery] = useState('register small business fees and articles of organization');
  const [testResults, setTestResults] = useState<SourceCitation[]>([]);
  const [testLatency, setTestLatency] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Ingest Document modal
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCodeRef, setNewCodeRef] = useState('');
  const [newAuthority, setNewAuthority] = useState('');
  const [newCategory, setNewCategory] = useState('business_licensing');
  const [newContent, setNewContent] = useState('');

  const handleTestSearch = async () => {
    if (!testQuery.trim()) return;
    setIsSearching(true);
    const res = await ragService.search(testQuery, { topK: 3 });
    setTestResults(res.citations);
    setTestLatency(res.searchLatencyMs);
    setIsSearching(false);
  };

  const handleIngestDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const created = ragService.addDocument({
      title: newTitle.trim(),
      codeReference: newCodeRef.trim() || 'Mun. Code Unassigned',
      authority: newAuthority.trim() || 'City Regulatory Office',
      jurisdiction: 'Municipal Jurisdiction',
      category: newCategory,
      lastUpdated: new Date().toISOString().split('T')[0],
      verifiedByLegalOfficer: true,
      content: newContent.trim()
    });

    setDocuments(ragService.getAllDocuments());
    setSelectedDoc(created);
    setIsIngestModalOpen(false);

    // Reset form
    setNewTitle('');
    setNewCodeRef('');
    setNewAuthority('');
    setNewContent('');
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Knowledge Base (RAG)
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Statutory Corpus & Vector Ingestion Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Trusted municipal ordinances, state licensing codes, and official fee schedules powering zero-hallucination agent retrieval.
          </p>
        </div>

        <button
          onClick={() => setIsIngestModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Ingest Regulatory Gazette</span>
        </button>
      </div>

      {/* Live Interactive Vector Search Tester */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Live Semantic Vector Search Tester (Qdrant / PGVector Abstraction)
            </h3>
          </div>
          {testLatency !== null && (
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Retrieved in {testLatency}ms
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="Test query: e.g. What is the state fee for LLC-1 filing?"
            className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
          <button
            onClick={handleTestSearch}
            disabled={isSearching}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isSearching ? 'Querying...' : 'Query Vector Store'}</span>
          </button>
        </div>

        {/* Results preview */}
        {testResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {testResults.map((r, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-800 truncate">{r.title}</span>
                  <span className="font-mono text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded-md">
                    {Math.round(r.relevanceScore * 100)}% match
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">{r.section}</div>
                <p className="text-[11px] text-slate-600 line-clamp-3 italic">
                  "{r.exactQuote}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Layout: Document List + Chunk Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Document List (Left 5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Indexed Regulatory Documents ({documents.length})
            </h3>
            <span className="text-[11px] font-mono text-slate-400">pgvector ready</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {documents.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-4 transition-colors cursor-pointer space-y-1.5 ${
                    isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {doc.codeReference}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                      {doc.chunks.length} Chunks
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {doc.title}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate">{doc.authority}</span>
                    <span>Updated {doc.lastUpdated}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chunk Inspector (Right 7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          {selectedDoc ? (
            <div className="space-y-5">
              
              {/* Doc Meta Header */}
              <div className="space-y-1 pb-4 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    {selectedDoc.codeReference}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedDoc.authority}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  {selectedDoc.title}
                </h2>
                <p className="text-xs text-slate-400">
                  Jurisdiction: {selectedDoc.jurisdiction} • Last statutory verification: {selectedDoc.lastUpdated}
                </p>
              </div>

              {/* Semantic Chunks Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Semantic Chunks & Vector Preview</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    Embedding Model: gemini-embedding-2-preview
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedDoc.chunks.map((chk, i) => (
                    <div key={chk.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          {chk.title}
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                          {chk.tokens} tokens
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                        {chk.content}
                      </p>

                      {/* Vector Embedding Preview Bar */}
                      {chk.embeddingVectorPreview && (
                        <div className="pt-1 flex items-center gap-2 text-[10px] font-mono text-slate-500">
                          <Code className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Vector [1x5]:</span>
                          <span className="bg-slate-900 text-emerald-400 px-2 py-0.5 rounded-sm">
                            [{chk.embeddingVectorPreview.map(v => v.toFixed(3)).join(', ')}]
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Raw Document Text */}
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Full Gazette Text Reference
                </span>
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedDoc.content}
                </pre>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
              Select a document to inspect semantic chunks.
            </div>
          )}
        </div>

      </div>

      {/* Ingest Document Modal */}
      {isIngestModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold">Ingest Statutory Ordinance or Gazette</h3>
              </div>
              <button
                onClick={() => setIsIngestModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIngestDocument} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document / Statute Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. County Health Sanitation Code Title 8"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Statutory Code Reference</label>
                  <input
                    type="text"
                    value={newCodeRef}
                    onChange={(e) => setNewCodeRef(e.target.value)}
                    placeholder="e.g. Health Code § 8.04.110"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Regulatory Authority</label>
                  <input
                    type="text"
                    value={newAuthority}
                    onChange={(e) => setNewAuthority(e.target.value)}
                    placeholder="e.g. County Department of Public Health"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Administrative Domain</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="business_licensing">Business Licensing</option>
                  <option value="housing_permits">Housing & Tenancy</option>
                  <option value="zoning_planning">Zoning & Planning</option>
                  <option value="social_services">Social Services</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Official Regulatory Text</label>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    Auto-chunked & Sanitized
                  </span>
                </div>
                <textarea
                  required
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste verbatim municipal code text, filing fees, and deadlines..."
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIngestModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Ingest & Index Chunks
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
