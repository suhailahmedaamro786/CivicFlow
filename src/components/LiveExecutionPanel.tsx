import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Circle, Loader2, Volume2, VolumeX, AlertTriangle, Sparkles, ShieldCheck } from 'lucide-react';
import { ExecutionStage, CIVICFLOW_STAGES, playExecutionTone } from '../services/liveExecutionService';

interface LiveExecutionPanelProps {
  active?: boolean;
  stages?: ExecutionStage[];
  title?: string;
  compact?: boolean;
}

const icons: Record<string, React.ReactNode> = {
  intake: <Sparkles className="h-4 w-4" />,
  routing: <Sparkles className="h-4 w-4" />,
  evidence: <Circle className="h-4 w-4" />,
  requirements: <ShieldCheck className="h-4 w-4" />,
  documents: <Check className="h-4 w-4" />,
  workflow: <Sparkles className="h-4 w-4" />,
  verification: <ShieldCheck className="h-4 w-4" />,
  approval: <Check className="h-4 w-4" />,
};

export const LiveExecutionPanel: React.FC<LiveExecutionPanelProps> = ({ active = false, stages = CIVICFLOW_STAGES, title = 'Live AI Execution', compact = false }) => {
  const [soundOn, setSoundOn] = useState(false);
  const progress = useMemo(() => stages.length ? Math.round(stages.filter(s => s.status === 'completed').length / stages.length * 100) : 0, [stages]);
  const running = stages.find(s => s.status === 'running');

  useEffect(() => {
    if (!active || !soundOn) return;
    if (running) playExecutionTone('running');
    if (progress === 100) playExecutionTone('complete');
  }, [active, soundOn, running?.id, progress]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    if (next) playExecutionTone('start');
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            {active && <span className="absolute inset-0 animate-ping rounded-xl bg-blue-400/20" />}
            <Sparkles className="relative h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-[11px] text-slate-500">{active ? progress + '% workflow progress' : 'Ready when execution starts'}</p>
          </div>
        </div>
        <button type="button" onClick={toggleSound} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50" aria-pressed={soundOn}>
          {soundOn ? <Volume2 className="h-4 w-4 text-blue-600" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
          <span className="hidden sm:inline">{soundOn ? 'Sound On' : 'Sound Off'}</span>
        </button>
      </div>
      <div className="h-1 bg-slate-100">
        <motion.div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400" initial={{ width: 0 }} animate={{ width: progress + '%' }} transition={{ duration: 0.5 }} />
      </div>
      <div className={compact ? 'p-3' : 'p-4 sm:p-5'}>
        <div className="space-y-1">
          {stages.map((stage, index) => {
            const complete = stage.status === 'completed';
            const activeStage = stage.status === 'running';
            const review = stage.status === 'needs_review';
            const failed = stage.status === 'failed';
            return (
              <motion.div key={stage.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03, duration: 0.2 }} className="relative flex items-start gap-3 rounded-xl px-2 py-2.5 sm:px-3">
                <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
                  {activeStage ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : complete ? <Check className="h-4 w-4 text-emerald-600" /> : review ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : icons[stage.id]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <span className="text-sm font-semibold text-slate-800">{stage.label}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{stage.status.replace('_', ' ')}</span>
                  </div>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">{stage.description}</p>
                </div>
                {failed && <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />}
                {stage.durationMs != null && <span className="hidden shrink-0 font-mono text-[10px] text-slate-400 sm:block">{stage.durationMs}ms</span>}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
