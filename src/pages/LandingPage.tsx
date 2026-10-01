import React, { useState } from 'react';
import { 
  Building2, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  Search, 
  Scale,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

interface LandingPageProps {
  onNavigate: (path: string) => void;
  onLaunchDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onLaunchDemo }) => {
  const [problemInput, setProblemInput] = useState('');
  const [showHowItWorksDetails, setShowHowItWorksDetails] = useState(false);

  const handleAnalyze = (query?: string) => {
    const q = query || problemInput;
    if (q.trim()) {
      onNavigate('/dashboard');
    } else {
      onNavigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      
      {/* Hero Section */}
      <section className="pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-center space-y-6">
        
        {/* Brand */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Civic Problem Solving</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            CivicFlow AI
          </h1>

          <p className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            Turn complex civic processes into verified action plans.
          </p>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Describe what you need. CivicFlow finds relevant evidence, checks requirements, and builds a clear step-by-step plan.
          </p>
        </div>

        {/* User Problem Input Box */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-300 shadow-sm p-4 text-left space-y-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <textarea
            rows={3}
            value={problemInput}
            onChange={(e) => setProblemInput(e.target.value)}
            placeholder="Describe what you need help with (e.g., registering a business, applying for a scholarship, or civil service employment)..."
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden resize-none bg-transparent"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {/* Example Requests */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium text-slate-400">Examples:</span>
              <button
                type="button"
                onClick={() => {
                  setProblemInput('Business registration');
                  handleAnalyze('Business registration');
                }}
                className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
              >
                Business registration
              </button>
              <button
                type="button"
                onClick={() => {
                  setProblemInput('Scholarship application');
                  handleAnalyze('Scholarship application');
                }}
                className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
              >
                Scholarship application
              </button>
              <button
                type="button"
                onClick={() => {
                  setProblemInput('Employment application');
                  handleAnalyze('Employment application');
                }}
                className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
              >
                Employment application
              </button>
            </div>

            <button
              onClick={() => handleAnalyze()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>Analyze Request</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      {/* How It Works Section */}
      <section className="py-12 bg-slate-50 border-t border-b border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              User Problem → Verified Information → Action Plan
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              How It Works
            </h2>
          </div>

          {/* 4 Clean Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="text-xs font-bold text-slate-900">Understand</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Extracts your civic objective, jurisdiction, and prerequisites without bureaucratic confusion.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="text-xs font-bold text-slate-900">Find Evidence</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Searches the configured knowledge base for governing statutes, deadlines, and official sources.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="text-xs font-bold text-slate-900">Build Plan</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Assembles required documents, chronological action steps, and fee estimates into a clear checklist.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center mx-auto">
                4
              </div>
              <h3 className="text-xs font-bold text-slate-900">Verify</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Cross-examines claims against citations and flags consequential actions for caseworker review.
              </p>
            </div>

          </div>

          {/* Small attribution notice */}
          <div className="text-center pt-2">
            <span className="text-xs text-slate-400 font-medium">
              Powered by live evidence retrieval, AI orchestration, and claim verification
            </span>
          </div>

        </div>
      </section>

      {/* Safety Notice & Trust Boundary */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <LegalDisclaimer />
      </section>

    </div>
  );
};
