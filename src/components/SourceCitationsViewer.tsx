import React from 'react';
import { BookOpenCheck, ExternalLink, ShieldCheck, Scale, FileText } from 'lucide-react';
import { SourceCitation } from '../types';

interface SourceCitationsViewerProps {
  citations: SourceCitation[];
}

export const SourceCitationsViewer: React.FC<SourceCitationsViewerProps> = ({ citations }) => {
  if (!citations || citations.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
        <BookOpenCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-medium">No statutory citations attached to this workflow yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Verified Legal Sources & RAG Grounding</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {citations.length} Grounded Sources
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Every administrative fee, timeline, and prerequisite is cross-referenced with official municipal codes.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Hallucination Defense: Active</span>
        </div>
      </div>

      {/* Citations List */}
      <div className="p-6 divide-y divide-slate-100 space-y-4">
        {citations.map((cite, index) => (
          <div key={cite.id} className="pt-4 first:pt-0 space-y-2">
            
            {/* Top row with Title & Authority */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <h4 className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                  {cite.title}
                </h4>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {cite.section}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {Math.round(cite.relevanceScore * 100)}% Match
                </span>
                {cite.isOfficialCode && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Scale className="w-3 h-3" /> Official Code
                  </span>
                )}
              </div>
            </div>

            {/* Authority & Date */}
            <div className="text-xs text-slate-500 flex items-center gap-3">
              <span>Authority: <strong className="text-slate-700 font-semibold">{cite.authority}</strong></span>
              <span>•</span>
              <span>Verified: {cite.lastVerifiedDate}</span>
            </div>

            {/* Verbatim quote block */}
            <blockquote className="p-3.5 rounded-xl bg-slate-50 border-l-4 border-blue-500 text-xs text-slate-700 font-medium leading-relaxed italic">
              "{cite.exactQuote}"
            </blockquote>

            {cite.statutoryUrl && (
              <div className="pt-1">
                <a
                  href={cite.statutoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <span>View Official Legislative Gazette</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};
