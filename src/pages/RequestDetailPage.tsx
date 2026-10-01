import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Play, 
  RotateCw, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  FileText, 
  Layers, 
  Printer, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Languages
} from 'lucide-react';
import { UserRequest, AgentRole, AgentExecution } from '../types';
import { SupportedLanguage } from '../types/agentEngine';
import { storageService } from '../services/storageService';
import { agentOrchestrator } from '../services/agentOrchestrator';
import { DynamicAgentTimeline } from '../components/DynamicAgentTimeline';
import { CleanActionPlanView } from '../components/CleanActionPlanView';
import { AgentInspectorDrawer } from '../components/AgentInspectorDrawer';
import { HumanApprovalModal } from '../components/HumanApprovalModal';
import { PrintableActionPacket } from '../components/PrintableActionPacket';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

interface RequestDetailPageProps {
  requestId: string;
  onNavigate: (path: string) => void;
}

export const RequestDetailPage: React.FC<RequestDetailPageProps> = ({
  requestId,
  onNavigate
}) => {
  const [request, setRequest] = useState<UserRequest | undefined>(
    storageService.getRequestById(requestId)
  );

  const [selectedAgentId, setSelectedAgentId] = useState<AgentRole | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isPrintPacketOpen, setIsPrintPacketOpen] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);
  const workflowStartedRef = useRef(false);

  // The detail page owns the live workflow. This makes processing resilient
  // to navigation/unmounts from the request form and keeps progress visible.
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const updated = storageService.getRequestById(requestId);
      if (updated) {
        setRequest({ ...updated });
      }
    }, 400);

    return () => clearInterval(checkInterval);
  }, [requestId]);

  useEffect(() => {
    if (workflowStartedRef.current) return;
    if (!request || request.status !== 'processing' || request.executions.length > 0) return;

    workflowStartedRef.current = true;
    setIsRerunning(true);

    void agentOrchestrator.runWorkflow(request, selectedLanguage, (agentId, status, _execution, allExecutions) => {
      setRequest(current => current ? {
        ...current,
        currentAgent: status === 'running' ? agentId : current.currentAgent,
        executions: allExecutions || current.executions,
        updatedAt: new Date().toISOString()
      } : current);
    }).then(updated => {
      setRequest(updated);
    }).catch(error => {
      console.error('CivicFlow live workflow failed:', error);
      const current = storageService.getRequestById(requestId);
      if (current) {
        const failed = { ...current, status: 'failed' as const, updatedAt: new Date().toISOString() };
        storageService.saveRequest(failed);
        setRequest(failed);
      }
    }).finally(() => {
      setIsRerunning(false);
    });
  }, [requestId, request, selectedLanguage]);

  if (!request) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Request Record Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested service workflow ID ({requestId}) does not exist in the local registry.
        </p>
        <button
          onClick={() => onNavigate('/dashboard/requests')}
          className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 cursor-pointer"
        >
          Return to Request History
        </button>
      </div>
    );
  }

  const handleRerunWorkflow = async (lang?: SupportedLanguage) => {
    setIsRerunning(true);
    const targetLang = lang || selectedLanguage;
    try {
      await agentOrchestrator.runWorkflow(request, targetLang, (agentId, status, exec) => {
        const current = storageService.getRequestById(requestId);
        if (current) setRequest({ ...current });
      });
      const fresh = storageService.getRequestById(requestId);
      if (fresh) setRequest({ ...fresh });
    } finally {
      setIsRerunning(false);
    }
  };

  const handleToggleStepComplete = (stepId: string) => {
    if (!request.finalActionPlan) return;
    const updatedSteps = request.finalActionPlan.steps.map(s => {
      if (s.id === stepId) {
        return { ...s, completed: !s.completed };
      }
      return s;
    });

    const updatedPlan = {
      ...request.finalActionPlan,
      steps: updatedSteps
    };

    const updatedReq: UserRequest = {
      ...request,
      finalActionPlan: updatedPlan,
      updatedAt: new Date().toISOString()
    };

    storageService.saveRequest(updatedReq);
    setRequest(updatedReq);
  };

  const handleConfirmHumanDecision = (
    decision: 'approved' | 'rejected' | 'changes_requested',
    reviewerName: string,
    notes: string,
    approvedActionIds: string[]
  ) => {
    const updated = agentOrchestrator.recordHumanApproval(
      requestId,
      decision,
      reviewerName,
      notes,
      approvedActionIds
    );
    if (updated) {
      setRequest(updated);
    }
  };

  const selectedExecution = request.executions.find(e => e.agentId === selectedAgentId);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/dashboard/requests')}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Back to History"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">{request.id}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {request.category.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Urgency: {request.citizenProfile.urgency.toUpperCase()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {request.title}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl px-2 py-1 text-xs">
            <Languages className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={selectedLanguage}
              onChange={(e) => {
                const newLang = e.target.value as SupportedLanguage;
                setSelectedLanguage(newLang);
                handleRerunWorkflow(newLang);
              }}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="en">English</option>
              <option value="ur">اردو (Urdu)</option>
              <option value="roman_urdu">Roman Urdu</option>
            </select>
          </div>

          <button
            onClick={() => handleRerunWorkflow()}
            disabled={isRerunning}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Re-run Multi-Agent Pipeline"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRerunning ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRerunning ? 'Running Agents...' : 'Re-run Agent Pipeline'}</span>
          </button>

          {request.finalActionPlan && (
            <button
              onClick={() => setIsPrintPacketOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Export Dossier</span>
            </button>
          )}

          {request.finalActionPlan && (
            <button
              onClick={() => setIsApprovalModalOpen(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                request.humanApproval?.status === 'approved'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>
                {request.humanApproval?.status === 'approved'
                  ? 'Human Caseworker Approved'
                  : 'Human Approval Panel'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Citizen Problem Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1 max-w-3xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Citizen Problem Statement
          </span>
          <p className="text-sm font-medium text-slate-800 leading-relaxed italic">
            "{request.rawQuery}"
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span>Applicant: <strong className="text-slate-800">{request.citizenProfile.entityName || 'Individual'}</strong></span>
            <span>•</span>
            <span>Jurisdiction: <strong className="text-slate-800">{request.jurisdiction.city}, {request.jurisdiction.state}</strong></span>
            <span>•</span>
            <span>Logged: {new Date(request.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Current status pill */}
        <div className="shrink-0">
          {request.status === 'awaiting_human_approval' ? (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <div>AWAITING CASEWORKER APPROVAL</div>
                <div className="text-[10px] text-amber-700 font-normal">Consequential filings gated</div>
              </div>
            </div>
          ) : request.status === 'approved' || request.status === 'completed' ? (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div>VERIFIED ACTION PLAN READY</div>
                <div className="text-[10px] text-emerald-700 font-normal">Grounded in state statutes</div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              <div>
                <div>PROCESSING AGENT GRAPH...</div>
                <div className="text-[10px] text-blue-700 font-normal">{request.executions.length} of 9 agents finished</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 1. Dynamic Agent Execution Timeline (Only activated workers) */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
          AI Workflow Execution
        </span>
        <DynamicAgentTimeline
          executions={request.executions}
          currentRunningAgent={request.currentAgent}
          selectedAgentId={selectedAgentId || undefined}
          onSelectAgent={(agentId) => setSelectedAgentId(agentId)}
          workflowCategory={request.category}
          isProcessing={request.status === 'processing'}
        />
      </div>

      {/* 2. Synthesized & Verified Action Plan (PRIMARY FOCUS) */}
      {request.finalActionPlan ? (
        <CleanActionPlanView
          plan={request.finalActionPlan}
          citations={request.ragSourcesUsed}
          humanApproval={request.humanApproval}
          onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
          onToggleStepComplete={handleToggleStepComplete}
          onPrintPacket={() => setIsPrintPacketOpen(true)}
        />
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
          <Clock className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Synthesizing Verified Action Plan...</h3>
          <p className="text-xs text-slate-400">
            The live workers are retrieving available evidence, checking requirements, and preparing a verified result.
          </p>
        </div>
      )}

      {/* Legal Disclaimer */}
      <LegalDisclaimer />

      {/* Drawer: Detailed Agent Inspector */}
      {selectedAgentId && (
        <AgentInspectorDrawer
          selectedAgentId={selectedAgentId}
          execution={selectedExecution}
          onClose={() => setSelectedAgentId(null)}
        />
      )}

      {/* Modal: Human-in-the-Loop Consequential Filing Gating */}
      {request.finalActionPlan && (
        <HumanApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={() => setIsApprovalModalOpen(false)}
          steps={request.finalActionPlan.steps}
          currentApproval={request.humanApproval}
          onConfirmDecision={handleConfirmHumanDecision}
        />
      )}

      {/* Modal: Printable Official Citizen Action Dossier */}
      {isPrintPacketOpen && (
        <PrintableActionPacket
          request={request}
          onClose={() => setIsPrintPacketOpen(false)}
        />
      )}

    </div>
  );
};
