import React, { useState } from 'react';
import { 
  Play, 
  RotateCw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  BookOpen, 
  Building2, 
  GraduationCap, 
  Briefcase, 
  Lock, 
  Printer, 
  Scale,
  Sparkles
} from 'lucide-react';
import { AgentRole, AgentExecution, UserRequest } from '../types';
import { DynamicAgentTimeline } from '../components/DynamicAgentTimeline';
import { CleanActionPlanView } from '../components/CleanActionPlanView';
import { AgentInspectorDrawer } from '../components/AgentInspectorDrawer';
import { HumanApprovalModal } from '../components/HumanApprovalModal';
import { PrintableActionPacket } from '../components/PrintableActionPacket';
import { LegalDisclaimer } from '../components/LegalDisclaimer';
import { agentOrchestrator } from '../services/agentOrchestrator';

interface DemoScenario {
  id: string;
  badge: string;
  category: string;
  title: string;
  location: { city: string; state: string; country: string };
  rawQuery: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'biz_registration',
    badge: 'Primary Scenario',
    category: 'Business Registration',
    title: 'Business Registration',
    location: { city: 'Los Angeles', state: 'California', country: 'US' },
    rawQuery: 'How can I register a small business and what documents and steps do I need?',
    icon: Building2,
    description: 'Demonstration of statutory formation, required filings, and local business licensing steps.'
  },
  {
    id: 'higher_education',
    badge: 'Scenario B',
    category: 'Education/Scholarship',
    title: 'Scholarship & Financial Aid Guidance',
    location: { city: 'Sacramento', state: 'California', country: 'US' },
    rawQuery: 'How do I apply for state higher education need-based financial aid grants and what eligibility criteria apply?',
    icon: GraduationCap,
    description: 'Demonstration of residency verification, financial aid application criteria, and priority deadlines.'
  },
  {
    id: 'civil_service_job',
    badge: 'Scenario C',
    category: 'Employment/Application',
    title: 'Civil Service Employment Standards',
    location: { city: 'San Francisco', state: 'California', country: 'US' },
    rawQuery: 'What are the civil service application standards, minimum qualification proofs, and background clearance steps?',
    icon: Briefcase,
    description: 'Demonstration of minimum qualification proofs, identification checks, and verification procedures.'
  }
];

export const JudgeDemoPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(DEMO_SCENARIOS[0]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [currentRunningAgent, setCurrentRunningAgent] = useState<AgentRole | undefined>(undefined);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<AgentRole | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [humanApprovalState, setHumanApprovalState] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [actionPlanRequest, setActionPlanRequest] = useState<UserRequest | null>(null);

  const handleStartWorkflow = async (scenario = selectedScenario) => {
    setIsExecuting(true);
    setStatusMessage('Using configured knowledge sources...');
    setExecutions([]);
    setActionPlanRequest(null);
    setHumanApprovalState('none');

    const tempReq: UserRequest = {
      id: `demo-${Date.now().toString(36)}`,
      title: scenario.title,
      rawQuery: scenario.rawQuery,
      category: scenario.category === 'Education/Scholarship' 
        ? 'social_services'
        : scenario.category === 'Employment/Application'
        ? 'social_services'
        : 'business_licensing',
      jurisdiction: {
        city: scenario.location.city,
        county: 'Central District',
        state: scenario.location.state,
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

    try {
      const completed = await agentOrchestrator.runWorkflow(tempReq, 'en', (agentId, status, exec, all) => {
        setCurrentRunningAgent(status === 'running' ? agentId : undefined);
        setStatusMessage(`Worker active: ${agentId.replace('_', ' ')}...`);
        if (all) setExecutions([...all]);
      });

      setActionPlanRequest(completed);
      setExecutions(completed.executions);
      setStatusMessage('');

      if (completed.finalActionPlan) {
        setHumanApprovalState(completed.finalActionPlan.steps.some(s => s.isConsequentialAction) ? 'pending' : 'approved');
      }
    } catch (err) {
      console.error('Demo error:', err);
      setStatusMessage('');
    } finally {
      setIsExecuting(false);
      setCurrentRunningAgent(undefined);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header: Explicitly a Demo */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 uppercase tracking-wider">
              Demonstration Mode
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Interactive Evaluation Demo
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real multi-agent execution grounded in the configured demo knowledge base.
          </p>
        </div>

        <button
          onClick={() => handleStartWorkflow()}
          disabled={isExecuting}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
        >
          {isExecuting ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>Executing Workflow...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Run Selected Scenario</span>
            </>
          )}
        </button>
      </div>

      {/* Scenario Selector Chips */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Choose a Demo Scenario:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DEMO_SCENARIOS.map((sc) => {
            const isSelected = selectedScenario.id === sc.id;
            const Icon = sc.icon;
            return (
              <button
                key={sc.id}
                onClick={() => {
                  setSelectedScenario(sc);
                  handleStartWorkflow(sc);
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {sc.badge}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  )}
                </div>

                <div className="text-xs font-bold text-slate-900 leading-snug">
                  {sc.title}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {sc.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. USER PROBLEM STATEMENT */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Citizen Inquiry
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {selectedScenario.location.city}, {selectedScenario.location.state}
          </span>
        </div>

        <p className="text-sm font-semibold text-slate-900 leading-relaxed italic">
          "{selectedScenario.rawQuery}"
        </p>
      </div>

      {/* Loading state before generation as requested in Section 5 */}
      {statusMessage && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2.5">
          <RotateCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 2. DYNAMIC AGENT WORKFLOW PANEL (Collapsible, Secondary) */}
      {executions.length > 0 && (
        <DynamicAgentTimeline
          executions={executions}
          currentRunningAgent={currentRunningAgent}
          selectedAgentId={selectedAgentId}
          onSelectAgent={(agentId) => setSelectedAgentId(agentId)}
          workflowCategory={selectedScenario.category}
          isProcessing={isExecuting}
        />
      )}

      {/* 3. YOUR VERIFIED ACTION PLAN (PRIMARY FOCUS / HERO) */}
      {actionPlanRequest?.finalActionPlan ? (
        <CleanActionPlanView
          plan={actionPlanRequest.finalActionPlan}
          citations={actionPlanRequest.ragSourcesUsed}
          humanApproval={humanApprovalState === 'pending' ? {
            id: `appr-${actionPlanRequest.id}`,
            approvedBy: 'Senior Civic Caseworker',
            role: 'Senior Civic Caseworker',
            status: 'pending',
            notes: 'Awaiting caseworker approval for non-refundable filing step.',
            consequentialActionsApproved: []
          } : undefined}
          onToggleStepComplete={() => {}}
          onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
          onPrintPacket={() => setIsPrintModalOpen(true)}
        />
      ) : isExecuting ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-3">
          <RotateCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Executing Real Multi-Agent Pipeline...</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Retrieving evidence from configured sources, checking criteria, and auditing claims.
          </p>
        </div>
      ) : null}

      {/* Trust Notice */}
      <LegalDisclaimer />

      {/* Agent Inspector Side Drawer */}
      {selectedAgentId && (
        <AgentInspectorDrawer
          selectedAgentId={selectedAgentId}
          execution={executions.find(e => e.agentId === selectedAgentId)}
          onClose={() => setSelectedAgentId(null)}
        />
      )}

      {/* Human Approval Modal */}
      {actionPlanRequest?.finalActionPlan && (
        <HumanApprovalModal
          isOpen={isApprovalModalOpen}
          steps={actionPlanRequest.finalActionPlan.steps}
          currentApproval={actionPlanRequest.humanApproval}
          onClose={() => setIsApprovalModalOpen(false)}
          onConfirmDecision={(decision, reviewerName, notes, approvedActionIds) => {
            const updated = agentOrchestrator.recordHumanApproval(
              actionPlanRequest.id,
              decision,
              reviewerName,
              notes,
              approvedActionIds
            );
            if (updated) {
              setActionPlanRequest(updated);
              setHumanApprovalState(decision === 'approved' ? 'approved' : 'rejected');
            }
            setIsApprovalModalOpen(false);
          }}
        />
      )}

      {/* Printable Action Packet */}
      {isPrintModalOpen && actionPlanRequest?.finalActionPlan && (
        <PrintableActionPacket
          request={actionPlanRequest}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

    </div>
  );
};
