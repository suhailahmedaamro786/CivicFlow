import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ExternalLink, 
  AlertTriangle, 
  FileText, 
  Building2, 
  Printer, 
  ShieldCheck, 
  Lock, 
  Download,
  Share2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { FinalActionPlan, HumanApprovalRecord, WorkflowActionStep } from '../types';

interface ActionPlanViewerProps {
  plan: FinalActionPlan;
  humanApproval?: HumanApprovalRecord;
  onOpenApprovalModal?: () => void;
  onToggleStepComplete?: (stepId: string) => void;
  onPrintPacket?: () => void;
}

export const ActionPlanViewer: React.FC<ActionPlanViewerProps> = ({
  plan,
  humanApproval,
  onOpenApprovalModal,
  onToggleStepComplete,
  onPrintPacket
}) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'documents' | 'contacts'>('steps');
  const [expandedStepId, setExpandedStepId] = useState<string | null>(plan.steps[0]?.id || null);

  const completedStepsCount = plan.steps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedStepsCount / plan.steps.length) * 100);

  // Group steps by phase
  const phases = Array.from(new Set(plan.steps.map(s => s.phase)));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Header Banner */}
      <div className="px-6 py-6 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Action Plan
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Jurisdiction: {plan.jurisdictionContext}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Citizen Action & Permitting Roadmap
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {plan.executiveSummary}
            </p>
          </div>

          {/* Quick Actions & Print */}
          <div className="flex items-center gap-2">
            {onPrintPacket && (
              <button
                onClick={onPrintPacket}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Export Dossier</span>
              </button>
            )}

            {onOpenApprovalModal && (
              <button
                onClick={onOpenApprovalModal}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                  humanApproval?.status === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>
                  {humanApproval?.status === 'approved'
                    ? 'Caseworker Approved'
                    : 'Review Consequential Steps'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[11px]">Total Statutory Fees</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              ${plan.estimatedTotalFees.toFixed(2)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[11px]">Estimated Turnaround</span>
            <span className="text-lg font-bold text-white">
              {plan.estimatedTotalTime}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[11px]">Verification Confidence</span>
            <span className="text-lg font-bold font-mono text-blue-400">
              {Math.round(plan.verificationResult.overallConfidence * 100)}%
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[11px]">Citizen Milestone Progress</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-bold font-mono text-amber-300">
                {completedStepsCount}/{plan.steps.length}
              </span>
              <div className="flex-1 bg-white/10 rounded-full h-2">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Advisory Alerts */}
      {plan.criticalAlerts && plan.criticalAlerts.length > 0 && (
        <div className="p-4 bg-amber-50/80 border-b border-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-900">Critical Compliance & Fraud-Prevention Notices</h4>
              <ul className="list-disc pl-4 space-y-0.5 text-xs text-amber-900/90">
                {plan.criticalAlerts.map((alert, i) => (
                  <li key={i}>{alert}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Human Approval Status Banner */}
      {humanApproval && (
        <div className={`p-4 border-b text-xs flex flex-wrap items-center justify-between gap-3 ${
          humanApproval.status === 'approved'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : humanApproval.status === 'rejected'
            ? 'bg-rose-50 border-rose-200 text-rose-950'
            : 'bg-amber-50/90 border-amber-200 text-amber-950'
        }`}>
          <div className="flex items-center gap-2.5">
            {humanApproval.status === 'approved' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : humanApproval.status === 'rejected' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                Caseworker Status: {humanApproval.status.toUpperCase()}
              </span>
              <span className="text-slate-600 ml-2">
                Reviewed by {humanApproval.approvedBy} ({humanApproval.role})
              </span>
              {humanApproval.notes && (
                <p className="mt-0.5 text-slate-700 italic">"{humanApproval.notes}"</p>
              )}
            </div>
          </div>

          {onOpenApprovalModal && (
            <button
              onClick={onOpenApprovalModal}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold text-xs text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Modify Decision
            </button>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="px-6 border-b border-slate-200 flex items-center gap-8 text-sm font-semibold text-slate-600 bg-slate-50/50">
        <button
          onClick={() => setActiveTab('steps')}
          className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'steps'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Action Steps ({plan.steps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Required Documents ({plan.requiredDocumentChecklist.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('contacts')}
          className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'contacts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Official Agency Contacts ({plan.officialContacts.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        
        {/* STEPS TAB */}
        {activeTab === 'steps' && (
          <div className="space-y-6">
            {phases.map((phase) => {
              const phaseSteps = plan.steps.filter(s => s.phase === phase);
              return (
                <div key={phase} className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {phase}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      ({phaseSteps.length} step{phaseSteps.length > 1 ? 's' : ''})
                    </span>
                  </div>

                  <div className="space-y-3">
                    {phaseSteps.map((step) => {
                      const isExpanded = expandedStepId === step.id;

                      return (
                        <div
                          key={step.id}
                          className={`rounded-xl border transition-all ${
                            step.completed
                              ? 'border-emerald-200 bg-emerald-50/30'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="p-4 flex items-start justify-between gap-4">
                            
                            {/* Checkbox & Title */}
                            <div className="flex items-start gap-3 flex-1">
                              <button
                                onClick={() => onToggleStepComplete?.(step.id)}
                                className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                  step.completed
                                    ? 'bg-emerald-600 text-white'
                                    : 'border-2 border-slate-300 hover:border-slate-400 bg-white'
                                }`}
                                title={step.completed ? 'Mark incomplete' : 'Mark completed'}
                              >
                                {step.completed && <CheckCircle2 className="w-4 h-4" />}
                              </button>

                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-mono font-bold text-slate-400">
                                    Step {step.order}
                                  </span>
                                  <h4 className={`text-sm font-bold ${
                                    step.completed ? 'line-through text-slate-500' : 'text-slate-900'
                                  }`}>
                                    {step.title}
                                  </h4>

                                  {step.isConsequentialAction && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                                      <Lock className="w-2.5 h-2.5" /> Consequential Action
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {step.description}
                                </p>
                              </div>
                            </div>

                            {/* Meta & Expand Toggle */}
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <div className="text-xs font-mono font-bold text-emerald-700">
                                  {step.estimatedFee === 0 ? 'FREE ($0.00)' : `$${step.estimatedFee.toFixed(2)}`}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {step.estimatedDuration}
                                </div>
                              </div>

                              <button
                                onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>

                          </div>

                          {/* Expanded Step Details */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 rounded-b-xl space-y-3 text-xs">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <span className="font-semibold text-slate-500 block mb-1">
                                    Responsible Agency
                                  </span>
                                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                    {step.responsibleAgency}
                                  </span>
                                </div>

                                <div>
                                  <span className="font-semibold text-slate-500 block mb-1">
                                    Required Documents
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {step.requiredDocuments.map((doc, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono text-[11px]"
                                      >
                                        {doc}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {step.officialPortalUrl && (
                                <div className="pt-2 flex items-center justify-between">
                                  <a
                                    href={step.officialPortalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold hover:underline"
                                  >
                                    <span>Access Official Agency Filing Portal</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>

                                  <span className="text-[11px] text-slate-400 italic">
                                    External State/Municipal Endpoint
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-3 rounded-l-lg">Document / Form Title</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Official Template</th>
                    <th className="p-3 rounded-r-lg">Compliance Guidance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {plan.requiredDocumentChecklist.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{doc.name}</span>
                      </td>
                      <td className="p-3">
                        {doc.isMandatory ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[10px]">
                            Mandatory
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-semibold text-[10px]">
                            Conditional
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {doc.templateAvailable ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> State Form Available
                          </span>
                        ) : (
                          <span className="text-slate-400">Citizen Prepared</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600">
                        {doc.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTACTS TAB */}
        {activeTab === 'contacts' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plan.officialContacts.map((contact, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{contact.agency}</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{contact.address}</span>
                  </div>
                </div>

                <div className="pt-1">
                  <a
                    href={contact.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <span>Visit Agency Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
