import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, MapPin, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

const DRAFT_KEY = 'civicflow_request_draft';

export const LandingPage: React.FC<{ onNavigate: (path: string) => void; onLaunchDemo?: () => void }> = ({ onNavigate }) => {
  const [problemInput, setProblemInput] = useState('');

  const startRequest = () => {
    const query = problemInput.trim();
    if (query) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ rawQuery: query }));
      } catch {
        // Continue normally if browser storage is unavailable.
      }
    }
    onNavigate('/dashboard/new-request');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-12 sm:pt-14 sm:pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
          <Sparkles className="w-3.5 h-3.5" />
          Evidence-grounded civic guidance
        </div>

        <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight">CivicFlow AI</h1>
        <p className="mt-3 text-lg sm:text-2xl font-bold text-slate-800">
          Turn a civic problem into a clear next-step plan.
        </p>
        <p className="mt-3 max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
          Tell us what you need and where it applies. CivicFlow retrieves available evidence, routes the request to the workers it needs, verifies claims, and shows supporting sources.
        </p>

        <div className="max-w-3xl mx-auto mt-6 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-lg shadow-slate-200/40 text-left">
          <label htmlFor="civic-problem" className="sr-only">Describe your civic problem</label>
          <textarea
            id="civic-problem"
            value={problemInput}
            onChange={e => setProblemInput(e.target.value)}
            rows={3}
            placeholder="Example: I need to understand the documents and steps for a local business registration."
            className="w-full resize-none bg-slate-50 rounded-xl p-4 text-sm outline-none border border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-slate-600">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Set your jurisdiction</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-slate-600">
              <Search className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Retrieve available evidence</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Verify before you act</span>
            </div>
          </div>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              No preset civic case or fabricated answer is used.
            </div>
            <button
              type="button"
              onClick={startRequest}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 active:scale-[0.99] transition"
            >
              {problemInput.trim() ? 'Continue request' : 'Start a request'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 border-y border-slate-200 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">How CivicFlow works</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-extrabold">One request. One evidence-grounded workflow.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              ['1', 'Understand', 'Extract the goal and jurisdiction.'],
              ['2', 'Find evidence', 'Search the configured knowledge base.'],
              ['3', 'Build a plan', 'Turn supported findings into steps.'],
              ['4', 'Verify', 'Flag unsupported or uncertain claims.']
            ].map(([n, title, body]) => (
              <div key={n} className="rounded-xl bg-white border border-slate-200 p-4">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{n}</div>
                <h2 className="mt-2 text-sm font-bold">{title}</h2>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-8">
        <LegalDisclaimer />
      </section>
    </div>
  );
};
