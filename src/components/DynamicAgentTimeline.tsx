import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Clock, 
  AlertTriangle, 
  X, 
  Sparkles,
  Cpu
} from 'lucide-react';
import { AgentRole, AgentExecution } from '../types';

export interface DynamicAgentTimelineProps {
  executions: AgentExecution[];
  currentRunningAgent?: AgentRole;
  selectedAgentId?: AgentRole | null;
  onSelectAgent?: (agentId: AgentRole) => void;
  workflowCategory?: string;
  isProcessing?: boolean;
}

interface StepDefinition {
  agentId: AgentRole;
  label: string;
  purpose: string;
}

export const DynamicAgentTimeline: React.FC<DynamicAgentTimelineProps> = ({
  executions,
  currentRunningAgent,
  selectedAgentId,
  onSelectAgent,
  workflowCategory = 'business_licensing',
  isProcessing = false
}) => {
  // Collapsed by default as explicitly requested in prompt requirement 7
  const [isOpen, setIsOpen] = useState(false);

  // Map of executed agents
  const executionMap = new Map<AgentRole, AgentExecution>();
  for (const exec of executions) {
    executionMap.set(exec.agentId, exec);
  }

  // Ordered list of candidate workflow workers
  const candidateSteps: StepDefinition[] = [
    { agentId: 'intake_agent', label: 'Intake', purpose: 'Analyzed request context and extracted civic goal' },
    { agentId: 'router_agent', label: 'Router', purpose: 'Determined applicable administrative workflow route' },
    { agentId: 'rag_agent', label: 'Knowledge Search', purpose: 'Retrieved statutory evidence from configured knowledge base' },
    { agentId: 'eligibility_agent', label: 'Requirements Check', purpose: 'Audited applicant eligibility and prerequisite rules' },
    { agentId: 'document_agent', label: 'Document Analysis', purpose: 'Compiled required forms and submission checklist' },
    { agentId: 'workflow_agent', label: 'Workflow Planning', purpose: 'Generated chronological action sequence and fee schedule' },
    { agentId: 'verifier_agent', label: 'Verification', purpose: 'Cross-examined factual claims against retrieved sources' }
  ];

  // Dynamic filter: ONLY show agents that were actually executed or currently running for this request!
  const executedSteps = candidateSteps.filter(step => 
    executionMap.has(step.agentId) || currentRunningAgent === step.agentId
  );

  // If no executions yet and not processing, return minimal placeholder
  if (executedSteps.length === 0 && !isProcessing) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Collapsible Panel Header: "AI Workflow" (collapsed by default) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/60 transition-colors flex items-center justify-between cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span className="text-xs font-bold text-slate-800">
            AI Workflow
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {executedSteps.length} Workers Executed
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            (Only required workers activated)
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <span>{isOpen ? 'Collapse' : 'Expand'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* When Opened: Display status, duration, and short result for ONLY executed agents (NO chain-of-thought) */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-slate-200 divide-y divide-slate-100 space-y-3">
          {executedSteps.map((step) => {
            const exec = executionMap.get(step.agentId);
            const isRunning = currentRunningAgent === step.agentId;
            const isCompleted = exec && exec.status === 'success';
            const isWarning = exec && exec.status === 'warning';
            const isFailed = exec && exec.status === 'error';

            return (
              <div 
                key={step.agentId}
                onClick={() => onSelectAgent?.(step.agentId)}
                className={`pt-3 first:pt-0 flex flex-wrap items-center justify-between gap-3 text-xs p-2 rounded-xl transition-colors cursor-pointer ${
                  selectedAgentId === step.agentId ? 'bg-blue-50/70 border border-blue-200' : 'hover:bg-slate-50'
                }`}
              >
                {/* Left: Status icon & Worker Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isRunning
                      ? 'bg-blue-600 text-white animate-pulse'
                      : isWarning
                      ? 'bg-amber-500 text-white'
                      : isFailed
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isCompleted && '✓'}
                    {isRunning && '◐'}
                    {isWarning && '⚠'}
                    {isFailed && '✕'}
                    {!isCompleted && !isRunning && !isWarning && !isFailed && '○'}
                  </span>

                  <div>
                    <div className="font-bold text-slate-900 leading-snug">
                      {step.label}
                    </div>
                    {/* Short result summary (NO chain-of-thought) */}
                    <p className="text-[11px] text-slate-500 truncate max-w-md">
                      {exec?.outputSummary || step.purpose}
                    </p>
                  </div>
                </div>

                {/* Right: Duration & Status Badge */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-mono text-[11px] text-slate-400">
                    {exec ? `${exec.durationMs}ms` : isRunning ? 'Running...' : '—'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : isRunning
                      ? 'bg-blue-100 text-blue-800 animate-pulse'
                      : isWarning
                      ? 'bg-amber-100 text-amber-800'
                      : isFailed
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isRunning ? 'Running' : exec?.status === 'success' ? 'Completed' : exec?.status || 'Pending'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
