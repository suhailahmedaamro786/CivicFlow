import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  X, 
  DollarSign, 
  Calendar, 
  FileCheck,
  Building2,
  Lock
} from 'lucide-react';
import { WorkflowActionStep, HumanApprovalRecord } from '../types';

interface HumanApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: WorkflowActionStep[];
  currentApproval?: HumanApprovalRecord;
  onConfirmDecision: (
    decision: 'approved' | 'rejected' | 'changes_requested',
    reviewerName: string,
    notes: string,
    approvedActionIds: string[]
  ) => void;
}

export const HumanApprovalModal: React.FC<HumanApprovalModalProps> = ({
  isOpen,
  onClose,
  steps,
  currentApproval,
  onConfirmDecision
}) => {
  const consequentialSteps = steps.filter(s => s.isConsequentialAction);
  
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>(
    consequentialSteps.map(s => s.id)
  );
  const [reviewerName, setReviewerName] = useState(currentApproval?.approvedBy || 'Sarah Jenkins');
  const [notes, setNotes] = useState(
    currentApproval?.notes || 'Verified all required articles, registered agent physical address, and designated fee payments.'
  );

  if (!isOpen) return null;

  const toggleAction = (id: string) => {
    if (selectedActionIds.includes(id)) {
      setSelectedActionIds(selectedActionIds.filter(a => a !== id));
    } else {
      setSelectedActionIds([...selectedActionIds, id]);
    }
  };

  const handleApprove = () => {
    onConfirmDecision('approved', reviewerName, notes, selectedActionIds);
    onClose();
  };

  const handleReject = () => {
    onConfirmDecision('rejected', reviewerName, notes, []);
    onClose();
  };

  const handleRequestChanges = () => {
    onConfirmDecision('changes_requested', reviewerName, notes, []);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Human-in-the-Loop Consequential Action Gating</h3>
              <p className="text-xs text-amber-100">
                Statutory Safeguard: Explicit human officer authorization required prior to external filing.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-amber-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Statutory Risk Notice */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Consequential Action Safeguard Protocol</span>
            </div>
            <p className="leading-relaxed">
              AI agents are prohibited from executing filings that incur non-refundable statutory fees or establish binding commercial liabilities without human casework review.
            </p>
          </div>

          {/* Consequential Actions to Approve */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Review Consequential Action Items ({consequentialSteps.length})
            </h4>

            {consequentialSteps.map((step) => {
              const isChecked = selectedActionIds.includes(step.id);
              return (
                <div
                  key={step.id}
                  onClick={() => toggleAction(step.id)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    isChecked
                      ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 bg-slate-50/60 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleAction(step.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900">{step.title}</span>
                        <span className="text-xs font-bold text-blue-700 font-mono bg-blue-100 px-2 py-0.5 rounded-md">
                          Fee: ${step.estimatedFee.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{step.description}</p>
                      
                      <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {step.responsibleAgency}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {step.estimatedDuration}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Caseworker Reviewer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Authorized Reviewer / Caseworker Name
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Officer Role / Accreditation
              </label>
              <input
                type="text"
                disabled
                value="Senior Civic Caseworker & Public Advocate"
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 text-slate-600 rounded-lg"
              />
            </div>
          </div>

          {/* Audit Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Case Verification Notes (Appended to Audit Trail)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter specific verification remarks or conditions..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleReject}
            className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
          >
            Reject Filing
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRequestChanges}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Request Citizen Changes
            </button>
            <button
              onClick={handleApprove}
              disabled={selectedActionIds.length === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Authorize Consequential Action</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
