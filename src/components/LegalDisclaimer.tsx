import React from 'react';
import { AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface LegalDisclaimerProps {
  compact?: boolean;
}

export const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          CivicFlow provides informational guidance, not legal or government decisions. Verify important requirements with the relevant authority before submitting documents, making payments, or taking consequential action.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
              Safety & Verification Notice
            </h4>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
              Informational Guidance
            </span>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            CivicFlow provides informational guidance, not legal or government decisions. Verify important requirements with the relevant authority before submitting documents, making payments, or taking consequential action.
          </p>
          <div className="pt-1 flex flex-wrap items-center gap-4 text-[11px] text-amber-800">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Evidence-grounded responses with claim verification
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Human review recommended for consequential filings
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
