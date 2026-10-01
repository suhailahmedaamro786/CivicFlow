import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

export const LandingPage: React.FC<{ onNavigate: (path: string) => void; onLaunchDemo?: () => void }> = ({ onNavigate }) => {
  const [problemInput, setProblemInput] = useState('');

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
          <Sparkles className="w-3.5 h-3.5" /> Evidence-grounded civic guidance
        </div>
        <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight">CivicFlow AI</h1>
        <p className="mt-4 text-xl sm:text-2xl font-bold text-slate-800">From a real civic problem to a clear action plan.</p>
        <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
          Describe what you need and where it applies. CivicFlow retrieves available evidence, routes the request to the required AI workers, verifies claims, and shows the sources behind the result.
        </p>

        <div className="max-w-3xl mx-auto mt-9 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/40 text-left">
          <textarea
            value={problemInput}
            onChange={e => setProblemInput(e.target.value)}
            rows={4}
            placeholder="What civic process or problem do you need help with?"
            className="w-full resize-none bg-slate-50 rounded-xl p-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
          />
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-500">You will enter the exact jurisdiction on the next screen.</span>
            <button
              onClick={() => onNavigate(problemInput.trim() ? '/dashboard' : '/dashboard/new-request')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              {problemInput.trim() ? 'Continue with request' : 'Start a request'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 border-y border-slate-200 py-14 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            ['1', 'Understand', 'Extract the goal and jurisdiction from your request.'],
            ['2', 'Find evidence', 'Search the configured knowledge base for relevant sources.'],
            ['3', 'Build a plan', 'Turn supported requirements into documents and steps.'],
            ['4', 'Verify', 'Flag unsupported claims and consequential actions.']
          ].map(([n, title, body]) => (
            <div key={n} className="rounded-2xl bg-white border border-slate-200 p-5">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">{n}</div>
              <h2 className="mt-3 text-sm font-bold">{title}</h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-10">
        <LegalDisclaimer />
      </section>
    </div>
  );
};
