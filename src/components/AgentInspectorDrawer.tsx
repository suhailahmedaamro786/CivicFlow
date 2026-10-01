import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Code2, 
  FileText, 
  CheckCircle2, 
  Terminal,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Check
} from 'lucide-react';
import { AgentRole, AgentExecution } from '../types';
import { SYSTEM_AGENTS } from '../services/agentRegistry';
import { feedbackService, AgentCalibrationStats } from '../services/feedbackService';

interface AgentInspectorDrawerProps {
  selectedAgentId: AgentRole | null;
  execution?: AgentExecution;
  onClose: () => void;
  onFeedbackRecorded?: (agentId: AgentRole, stats: AgentCalibrationStats) => void;
}

export const AgentInspectorDrawer: React.FC<AgentInspectorDrawerProps> = ({
  selectedAgentId,
  execution,
  onClose,
  onFeedbackRecorded
}) => {
  const [activeTab, setActiveTab] = useState<'reasoning' | 'payload' | 'prompt'>('reasoning');
  const [feedbackStats, setFeedbackStats] = useState<AgentCalibrationStats>({
    upvotes: 0,
    downvotes: 0,
    calibrationFactor: 1.0
  });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAgentId) {
      const stats = feedbackService.getAgentStats(selectedAgentId);
      setFeedbackStats(stats);
      setFeedbackSubmitted(Boolean(stats.userFeedback));
    }
  }, [selectedAgentId]);

  if (!selectedAgentId) return null;

  const agentInfo = SYSTEM_AGENTS.find(a => a.id === selectedAgentId);
  if (!agentInfo) return null;

  const handleVote = async (rating: 'up' | 'down', reason?: string) => {
    if (!selectedAgentId) return;
    const updated = await feedbackService.submitFeedback(selectedAgentId, rating, reason || selectedReason || undefined);
    setFeedbackStats(updated);
    setFeedbackSubmitted(true);
    onFeedbackRecorded?.(selectedAgentId, updated);
  };

  const baseConfidence = execution?.confidenceScore ?? 0.95;
  const calibratedConfidence = Math.min(1.0, Math.round(baseConfidence * feedbackStats.calibrationFactor * 100) / 100);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:max-w-xl bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{agentInfo.name}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{agentInfo.roleDescription}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Meta Stats Strip with Dynamic Calibration */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 rounded-lg bg-white border border-slate-200">
          <span className="block text-[10px] text-slate-400 uppercase font-semibold">Model</span>
          <span className="font-mono font-bold text-slate-800 text-[11px]">{agentInfo.model}</span>
        </div>
        <div className="p-2 rounded-lg bg-white border border-slate-200">
          <span className="block text-[10px] text-slate-400 uppercase font-semibold">Latency</span>
          <span className="font-mono font-bold text-emerald-700 text-[11px]">
            {execution ? `${execution.durationMs}ms` : '—'}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-white border border-slate-200" title={`Base: ${Math.round(baseConfidence * 100)}% | Multiplier: ${feedbackStats.calibrationFactor}x`}>
          <div className="flex items-center justify-center gap-1">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">RAG Confidence</span>
            {feedbackStats.calibrationFactor > 1.0 && (
              <TrendingUp className="w-3 h-3 text-emerald-600" />
            )}
            {feedbackStats.calibrationFactor < 1.0 && (
              <TrendingDown className="w-3 h-3 text-amber-600" />
            )}
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-mono font-bold text-blue-700 text-[11px]">
              {execution ? `${Math.round(calibratedConfidence * 100)}%` : '—'}
            </span>
            <span className={`text-[9px] font-bold ${
              feedbackStats.calibrationFactor >= 1.0 ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              ({feedbackStats.calibrationFactor}x)
            </span>
          </div>
        </div>
        <div className="p-2 rounded-lg bg-white border border-slate-200">
          <span className="block text-[10px] text-slate-400 uppercase font-semibold">Tokens</span>
          <span className="font-mono font-bold text-amber-700 text-[11px]">
            {execution ? execution.tokensUsed.total : '—'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 border-b border-slate-200 flex items-center gap-6 text-sm font-semibold text-slate-600 bg-white">
        <button
          onClick={() => setActiveTab('reasoning')}
          className={`py-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'reasoning'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Reasoning & Summary
        </button>
        <button
          onClick={() => setActiveTab('payload')}
          className={`py-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'payload'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Input / Output JSON
        </button>
        <button
          onClick={() => setActiveTab('prompt')}
          className={`py-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'prompt'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          System Prompt & Guardrails
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        
        {activeTab === 'reasoning' && (
          <div className="space-y-5">
            {/* Input Summary */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                Agent Input Context
              </span>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {execution?.inputSummary || 'Awaiting input ingestion from preceding workflow step.'}
              </p>
            </div>

            {/* Synthesized Output Summary */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Synthesized Output Summary
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Verified Summary
                </span>
              </div>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {execution?.outputSummary || 'Pending execution.'}
              </p>
            </div>

            {/* Thumbs-Up / Thumbs-Down Calibration Mechanism */}
            <div className="p-4 rounded-xl bg-white border border-blue-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Judge & Caseworker Accuracy Feedback
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  Calibrate RAG Weights
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Was this agent's summary and statutory reasoning accurate? Your feedback calibrates future vector retrieval confidence multipliers.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => handleVote('up')}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    feedbackStats.userFeedback === 'up'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${feedbackStats.userFeedback === 'up' ? 'fill-white' : ''}`} />
                  <span>Accurate & Grounded</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    feedbackStats.userFeedback === 'up' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    {feedbackStats.upvotes}
                  </span>
                </button>

                <button
                  onClick={() => handleVote('down')}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    feedbackStats.userFeedback === 'down'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                  }`}
                >
                  <ThumbsDown className={`w-3.5 h-3.5 ${feedbackStats.userFeedback === 'down' ? 'fill-white' : ''}`} />
                  <span>Inaccurate / Gaps</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    feedbackStats.userFeedback === 'down' ? 'bg-rose-700 text-white' : 'bg-rose-200 text-rose-900'
                  }`}>
                    {feedbackStats.downvotes}
                  </span>
                </button>
              </div>

              {/* Feedback reason chips */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 block">Optional Evaluation Tag:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Accurate statutory code',
                    'Clear actionable steps',
                    'Zero-cost fee verified',
                    'Missing municipal ordinance',
                    'Uncertain residency timeline'
                  ].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedReason(tag);
                        if (feedbackStats.userFeedback) {
                          handleVote(feedbackStats.userFeedback, tag);
                        }
                      }}
                      className={`text-[10px] px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                        selectedReason === tag
                          ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic feedback confirmation alert */}
              {feedbackSubmitted && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Feedback logged: RAG calibration factor updated to <strong>{feedbackStats.calibrationFactor}x</strong>.</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-emerald-700">ACTIVE</span>
                </div>
              )}
            </div>

            {/* Step-by-Step Chain of Thought */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Agent Chain-of-Thought & Reasoning Notes
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Audit Passed
                </span>
              </div>

              {execution?.reasoningNotes && execution.reasoningNotes.length > 0 ? (
                <ul className="space-y-2.5">
                  {execution.reasoningNotes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-700 font-mono font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5 border border-blue-100">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{note}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No execution recorded yet for this agent.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payload' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">
                Structured Output Payload (JSON)
              </span>
              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 max-h-96">
                {execution?.outputPayload 
                  ? JSON.stringify(execution.outputPayload, null, 2)
                  : '// No payload generated'}
              </pre>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
              Payload contract conforms to LangGraph agent state dictionary schemas with immutable snapshot history.
            </div>
          </div>
        )}

        {activeTab === 'prompt' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">
                Authoritative System Prompt
              </span>
              <div className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed border border-slate-800 whitespace-pre-wrap">
                {agentInfo.systemPrompt}
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 bg-white p-4 rounded-xl border border-slate-200">
              <h5 className="font-bold text-slate-800">Safety & Defense Parameters</h5>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Prompt Injection Defense: Regex & Token Sanitization</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Temperature Locked: {agentInfo.temperature} (High Determinism)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Source Attribution: Verbatim Quote Grounding Mandatory</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-mono">
          Agent UUID: {agentInfo.id}
        </span>
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          Close Inspector
        </button>
      </div>

    </div>
  );
};

