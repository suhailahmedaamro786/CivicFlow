import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Sparkles, 
  ArrowRight, 
  RotateCw, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Search,
  BookOpen,
  ChevronRight,
  Database,
  Lock,
  Play
} from 'lucide-react';
import { UserRequest, AgentRole, AgentExecution } from '../types';
import { storageService } from '../services/storageService';
import { agentOrchestrator } from '../services/agentOrchestrator';
import { DynamicAgentTimeline } from '../components/DynamicAgentTimeline';
import { CleanActionPlanView } from '../components/CleanActionPlanView';
import { AgentInspectorDrawer } from '../components/AgentInspectorDrawer';
import { HumanApprovalModal } from '../components/HumanApprovalModal';
import { PrintableActionPacket } from '../components/PrintableActionPacket';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

interface DashboardCommandCenterProps {
  onNavigate: (path: string) => void;
  onLaunchDemo: () => void;
}

const EXAMPLE_SUGGESTIONS = [
  {
    label: 'Business registration',
    query: 'How can I register a small business and what documents and steps do I need?'
  },
  {
    label: 'Scholarship application',
    query: 'How do I apply for state higher education need-based financial aid grants and what eligibility criteria apply?'
  },
  {
    label: 'Employment application',
    query: 'What are the civil service application standards, minimum qualification proofs, and background clearance steps?'
  }
];

export const DashboardCommandCenter: React.FC<DashboardCommandCenterProps> = ({
  onNavigate,
  onLaunchDemo
}) => {
  const [queryInput, setQueryInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [activeRequest, setActiveRequest] = useState<UserRequest | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<AgentRole | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [kbStatus, setKbStatus] = useState<{ documents: number; chunks: number; store: string }>({
    documents: 4,
    chunks: 8,
    store: 'Authoritative Store'
  });

  const recentRequests = storageService.getRequests();

  // Load real knowledge base status
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.ragStatus) {
          setKbStatus({
            documents: data.ragStatus.totalDocuments || 4,
            chunks: data.ragStatus.totalChunks || 8,
            store: data.ragStatus.activeVectorStore?.includes('Qdrant') ? 'Qdrant Cloud' : 'In-Memory Semantic Store'
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleAnalyze = async (customQuery?: string) => {
    const query = (customQuery || queryInput).trim();
    if (!query) return;

    setIsAnalyzing(true);
    setStatusMessage('Using configured knowledge sources...');

    const newReq: UserRequest = {
      id: `req-${Date.now().toString(36)}`,
      title: query.length > 50 ? query.substring(0, 50) + '...' : query,
      rawQuery: query,
      category: query.toLowerCase().includes('education') || query.toLowerCase().includes('scholarship')
        ? 'social_services'
        : query.toLowerCase().includes('employment') || query.toLowerCase().includes('job')
        ? 'social_services'
        : 'business_licensing',
      jurisdiction: {
        city: 'Los Angeles',
        county: 'Central District',
        state: 'California',
        country: 'US'
      },
      citizenProfile: {
        applicantType: 'small_business_owner',
        urgency: 'medium'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'processing',
      executions: [],
      ragSourcesUsed: []
    };

    setActiveRequest(newReq);
    storageService.saveRequest(newReq);

    try {
      const completed = await agentOrchestrator.runWorkflow(newReq, 'en', (agentId, status, exec, all) => {
        setStatusMessage(`Worker active: ${agentId.replace('_', ' ')}...`);
        setActiveRequest(prev => prev ? {
          ...prev,
          currentAgent: status === 'running' ? agentId : undefined,
          executions: all ? [...all] : prev.executions
        } : null);
      });

      setActiveRequest({ ...completed });
      setStatusMessage('');
    } catch (err) {
      console.error('Execution error:', err);
      setStatusMessage('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleStepComplete = (stepId: string) => {
    if (!activeRequest?.finalActionPlan) return;
    const updatedSteps = activeRequest.finalActionPlan.steps.map(s => {
      if (s.id === stepId) return { ...s, completed: !s.completed };
      return s;
    });
    const updated: UserRequest = {
      ...activeRequest,
      finalActionPlan: {
        ...activeRequest.finalActionPlan,
        steps: updatedSteps
      }
    };
    storageService.saveRequest(updated);
    setActiveRequest(updated);
  };

  const handleConfirmHumanDecision = (
    decision: 'approved' | 'rejected' | 'changes_requested',
    reviewerName: string,
    notes: string,
    approvedActionIds: string[]
  ) => {
    if (!activeRequest) return;
    const updated = agentOrchestrator.recordHumanApproval(
      activeRequest.id,
      decision,
      reviewerName,
      notes,
      approvedActionIds
    );
    if (updated) setActiveRequest(updated);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Value Proposition Hero (No jargon, user-centric) */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          CivicFlow AI
        </h1>

        <p className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
          Turn complex civic processes into verified action plans.
        </p>

        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-normal">
          Describe what you need. CivicFlow finds relevant evidence, checks requirements, and builds a clear step-by-step plan.
        </p>
      </div>

      {/* 2. Main Input Box */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-4 sm:p-5 space-y-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
        <textarea
          rows={3}
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="What problem can we help you solve?"
          className="w-full text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-hidden resize-none bg-transparent"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleAnalyze();
            }
          }}
        />

        {/* Suggestion Chips & Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Examples:</span>
            {EXAMPLE_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQueryInput(s.query);
                  handleAnalyze(s.query);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                • {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !queryInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            {isAnalyzing ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Analyzing Request...</span>
              </>
            ) : (
              <>
                <span>Analyze Request</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Explicit Demo Scenario Callout */}
      {!activeRequest && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Demo Scenario
            </span>
            <div className="text-xs font-bold text-slate-900">
              Business Registration
            </div>
            <p className="text-[11px] text-slate-500">
              "How can I register a small business and what documents and steps do I need?"
            </p>
          </div>

          <button
            onClick={() => handleAnalyze(EXAMPLE_SUGGESTIONS[0].query)}
            className="px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Play className="w-3 h-3 fill-indigo-700" />
            <span>Run Demo Scenario</span>
          </button>
        </div>
      )}

      {/* ACTIVE WORKFLOW & FINAL RESULT */}
      {activeRequest && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* Status Alert */}
          {statusMessage && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* AI WORKFLOW (Collapsible Panel, Collapsed by Default) */}
          <DynamicAgentTimeline
            executions={activeRequest.executions}
            currentRunningAgent={activeRequest.currentAgent}
            selectedAgentId={selectedAgentId}
            onSelectAgent={(agentId) => setSelectedAgentId(agentId)}
            workflowCategory={activeRequest.category}
            isProcessing={isAnalyzing}
          />

          {/* YOUR VERIFIED ACTION PLAN (PRIMARY FOCUS) */}
          {activeRequest.finalActionPlan ? (
            <CleanActionPlanView
              plan={activeRequest.finalActionPlan}
              citations={activeRequest.ragSourcesUsed}
              humanApproval={activeRequest.humanApproval}
              onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
              onToggleStepComplete={handleToggleStepComplete}
              onPrintPacket={() => setIsPrintModalOpen(true)}
            />
          ) : isAnalyzing ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
              <RotateCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Synthesizing Verified Action Plan...</h3>
              <p className="text-xs text-slate-400">
                Cross-referencing evidence from configured sources and verifying requirements.
              </p>
            </div>
          ) : null}

          {/* Start New Query Button */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setActiveRequest(null);
                setQueryInput('');
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              ← Start New Inquiry
            </button>
          </div>

        </div>
      )}

      {/* REAL COMMAND CENTER STATUS (Only Real Metrics: Recent Requests, Active Workflow, Verification, Knowledge Base) */}
      {!activeRequest && (
        <div className="space-y-6 pt-2">
          
          {/* Status Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Verification Status
              </span>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Claim Verification Active</span>
              </div>
              <p className="text-[11px] text-slate-500">Adversarial audit against citations</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Knowledge Base Status
              </span>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{kbStatus.documents} Documents Indexed</span>
              </div>
              <p className="text-[11px] text-slate-500">{kbStatus.chunks} chunks in {kbStatus.store}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Active Workflow Gating
              </span>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Consequential Review</span>
              </div>
              <p className="text-[11px] text-slate-500">Non-refundable filings require officer authorization</p>
            </div>
          </div>

          {/* Recent Requests List */}
          {recentRequests.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Recent Inquiries
                </span>
                <button
                  onClick={() => onNavigate('/dashboard/requests')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All ({recentRequests.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {recentRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    onClick={() => onNavigate(`/dashboard/requests/${req.id}`)}
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">
                          {req.title}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                          {req.category.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-slate-500 truncate italic">
                        "{req.rawQuery}"
                      </p>
                    </div>

                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal Safety Notice */}
          <LegalDisclaimer compact />

        </div>
      )}

      {/* Side Inspector Drawer */}
      {selectedAgentId && activeRequest && (
        <AgentInspectorDrawer
          selectedAgentId={selectedAgentId}
          execution={activeRequest.executions.find(e => e.agentId === selectedAgentId)}
          onClose={() => setSelectedAgentId(null)}
        />
      )}

      {/* Human Approval Modal */}
      {activeRequest && activeRequest.finalActionPlan && (
        <HumanApprovalModal
          isOpen={isApprovalModalOpen}
          steps={activeRequest.finalActionPlan.steps}
          currentApproval={activeRequest.humanApproval}
          onClose={() => setIsApprovalModalOpen(false)}
          onConfirmDecision={handleConfirmHumanDecision}
        />
      )}

      {/* Printable Action Packet */}
      {isPrintModalOpen && activeRequest && activeRequest.finalActionPlan && (
        <PrintableActionPacket
          request={activeRequest}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

    </div>
  );
};
