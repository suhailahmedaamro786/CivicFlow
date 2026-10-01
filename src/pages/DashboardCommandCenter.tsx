import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Database, Lock, MapPin, RotateCw, ShieldCheck } from 'lucide-react';
import { UserRequest, AgentRole } from '../types';
import { storageService } from '../services/storageService';
import { agentOrchestrator } from '../services/agentOrchestrator';
import { DynamicAgentTimeline } from '../components/DynamicAgentTimeline';
import { CleanActionPlanView } from '../components/CleanActionPlanView';
import { AgentInspectorDrawer } from '../components/AgentInspectorDrawer';
import { HumanApprovalModal } from '../components/HumanApprovalModal';
import { PrintableActionPacket } from '../components/PrintableActionPacket';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

interface Props {
  onNavigate: (path: string) => void;
  onLaunchDemo?: () => void;
}

const emptyRequest = (query: string, city: string, state: string, country: string): UserRequest => ({
  id: `req-${Date.now().toString(36)}`,
  title: query.length > 72 ? `${query.slice(0, 72)}…` : query,
  rawQuery: query,
  category: 'business_licensing',
  jurisdiction: { city, county: '', state, country },
  citizenProfile: { applicantType: 'individual', urgency: 'medium' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'processing',
  executions: [],
  ragSourcesUsed: []
});

export const DashboardCommandCenter: React.FC<Props> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeRequest, setActiveRequest] = useState<UserRequest | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<AgentRole | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [kbStatus, setKbStatus] = useState({ documents: 0, chunks: 0, store: 'Unavailable' });

  const recentRequests = storageService.getRequests();

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(data => {
      const s = data.ragStatus;
      if (s) setKbStatus({
        documents: s.totalDocuments || 0,
        chunks: s.totalChunks || 0,
        store: s.activeVectorStore || 'Configured knowledge store'
      });
    }).catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    const text = query.trim();
    if (!text || !city.trim() || !state.trim() || !country.trim()) {
      setStatusMessage('Please enter the problem and its city, state/province, and country so CivicFlow can use the correct jurisdiction.');
      return;
    }

    const request = emptyRequest(text, city.trim(), state.trim(), country.trim());
    storageService.saveRequest(request);
    setActiveRequest(request);
    setIsAnalyzing(true);
    setStatusMessage('Connecting to the live knowledge base and agent workflow…');

    try {
      const completed = await agentOrchestrator.runWorkflow(request, 'en', (agentId, status, _exec, all) => {
        setStatusMessage(
          status === 'running'
            ? `Working: ${agentId.replace(/_/g, ' ')}`
            : `Completed: ${agentId.replace(/_/g, ' ')}`
        );
        setActiveRequest(prev => prev ? {
          ...prev,
          currentAgent: status === 'running' ? agentId : undefined,
          executions: all || prev.executions
        } : null);
      });
      setActiveRequest(completed);
      setStatusMessage('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The workflow could not be completed.';
      setStatusMessage(message);
      setActiveRequest(prev => prev ? { ...prev, status: 'failed' } : null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setActiveRequest(null);
    setQuery('');
    setStatusMessage('');
  };

  const handleToggleStepComplete = (stepId: string) => {
    if (!activeRequest?.finalActionPlan) return;
    const updated = {
      ...activeRequest,
      finalActionPlan: {
        ...activeRequest.finalActionPlan,
        steps: activeRequest.finalActionPlan.steps.map(step =>
          step.id === stepId ? { ...step, completed: !step.completed } : step
        )
      }
    };
    storageService.saveRequest(updated);
    setActiveRequest(updated);
  };

  const stats = useMemo(() => ({
    total: recentRequests.length,
    completed: recentRequests.filter(r => r.status === 'completed' || r.status === 'approved').length,
    review: recentRequests.filter(r => r.status === 'awaiting_human_approval').length
  }), [recentRequests]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10 space-y-7">
      {!activeRequest ? (
        <>
          <section className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">CivicFlow workspace</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">What civic process do you need help with?</h1>
            <p className="max-w-2xl text-sm sm:text-base text-slate-600">
              Describe the real problem. CivicFlow uses your jurisdiction, retrieves available evidence, verifies claims, and returns an action plan with sources.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              rows={5}
              placeholder="Example: I want to register a small business. What documents, offices, fees, and steps apply to me?"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />

            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <MapPin className="w-4 h-4 text-blue-600" /> Where does this request apply?
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="City / municipality" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
              <input value={state} onChange={e => setState(e.target.value)} placeholder="State / province / region" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
              <input value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
            </div>

            {statusMessage && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-900">
                {statusMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500">No preset case is loaded. Every request starts from the information you provide.</p>
              <button onClick={handleAnalyze} disabled={isAnalyzing} className="inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">
                {isAnalyzing ? <RotateCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {isAnalyzing ? 'Processing…' : 'Analyze my request'}
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Your requests</span>
              <div className="mt-1 text-2xl font-extrabold">{stats.total}</div>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Completed</span>
              <div className="mt-1 text-2xl font-extrabold">{stats.completed}</div>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Human review</span>
              <div className="mt-1 text-2xl font-extrabold">{stats.review}</div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
              <Database className="w-4 h-4 text-blue-600" /> Knowledge base
            </div>
            <p className="mt-2 text-sm text-slate-700">
              {kbStatus.documents} documents · {kbStatus.chunks} indexed chunks · {kbStatus.store}
            </p>
            <p className="mt-1 text-xs text-slate-500">Only evidence actually available to the system can be used in an action plan.</p>
          </section>

          {recentRequests.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-sm font-bold">Recent requests</h2>
                <button onClick={() => onNavigate('/dashboard/requests')} className="text-xs font-semibold text-blue-600">View all</button>
              </div>
              {recentRequests.slice(0, 5).map(r => (
                <button key={r.id} onClick={() => onNavigate(`/dashboard/requests/${r.id}`)} className="w-full text-left px-5 py-4 border-b last:border-b-0 border-slate-100 hover:bg-slate-50">
                  <div className="text-sm font-semibold truncate">{r.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{r.jurisdiction.city}, {r.jurisdiction.state}, {r.jurisdiction.country} · {r.status.replace(/_/g, ' ')}</div>
                </button>
              ))}
            </section>
          )}
          <LegalDisclaimer compact />
        </>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl bg-white border border-slate-200 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-blue-600">Live request</span>
                <h1 className="mt-1 text-xl sm:text-2xl font-extrabold">{activeRequest.title}</h1>
                <p className="mt-2 text-sm text-slate-600">{activeRequest.jurisdiction.city}, {activeRequest.jurisdiction.state}, {activeRequest.jurisdiction.country}</p>
              </div>
              <button onClick={reset} className="text-xs font-bold text-blue-600 hover:text-blue-800">New request</button>
            </div>
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed">“{activeRequest.rawQuery}”</p>
          </section>

          {statusMessage && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900 flex items-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin" /> {statusMessage}
            </div>
          )}

          {activeRequest.executions.length > 0 && (
            <DynamicAgentTimeline
              executions={activeRequest.executions}
              currentRunningAgent={activeRequest.currentAgent}
              selectedAgentId={selectedAgentId}
              onSelectAgent={setSelectedAgentId}
              workflowCategory={activeRequest.category}
              isProcessing={isAnalyzing}
            />
          )}

          {activeRequest.finalActionPlan ? (
            <CleanActionPlanView
              plan={activeRequest.finalActionPlan}
              citations={activeRequest.ragSourcesUsed}
              humanApproval={activeRequest.humanApproval}
              onToggleStepComplete={handleToggleStepComplete}
              onOpenApprovalModal={() => setApprovalOpen(true)}
              onPrintPacket={() => setPrintOpen(true)}
            />
          ) : isAnalyzing ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <RotateCw className="mx-auto w-8 h-8 text-blue-600 animate-spin" />
              <h2 className="mt-3 font-bold">Building your evidence-grounded plan…</h2>
              <p className="mt-1 text-xs text-slate-500">You will see each selected worker as it actually runs.</p>
            </div>
          ) : activeRequest.status === 'failed' ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
              This request could not be completed. No fabricated answer was substituted.
            </div>
          ) : null}

          <LegalDisclaimer />

          {selectedAgentId && (
            <AgentInspectorDrawer selectedAgentId={selectedAgentId} execution={activeRequest.executions.find(e => e.agentId === selectedAgentId)} onClose={() => setSelectedAgentId(null)} />
          )}

          {activeRequest.finalActionPlan && (
            <HumanApprovalModal
              isOpen={approvalOpen}
              steps={activeRequest.finalActionPlan.steps}
              currentApproval={activeRequest.humanApproval}
              onClose={() => setApprovalOpen(false)}
              onConfirmDecision={(decision, reviewerName, notes, approvedActionIds) => {
                const updated = agentOrchestrator.recordHumanApproval(activeRequest.id, decision, reviewerName, notes, approvedActionIds);
                if (updated) setActiveRequest(updated);
                setApprovalOpen(false);
              }}
            />
          )}

          {printOpen && activeRequest.finalActionPlan && (
            <PrintableActionPacket request={activeRequest} onClose={() => setPrintOpen(false)} />
          )}
        </div>
      )}
    </div>
  );
};
