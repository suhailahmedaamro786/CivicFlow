export type ExecutionStageStatus = 'pending' | 'running' | 'completed' | 'needs_review' | 'failed';

export interface ExecutionStage {
  id: string;
  label: string;
  description: string;
  status: ExecutionStageStatus;
  durationMs?: number;
}

export const CIVICFLOW_STAGES: ExecutionStage[] = [
  { id: 'intake', label: 'Intake', description: 'Understanding the citizen request', status: 'pending' },
  { id: 'routing', label: 'Dynamic Routing', description: 'Selecting the required AI workers', status: 'pending' },
  { id: 'evidence', label: 'Evidence Retrieval', description: 'Finding relevant knowledge', status: 'pending' },
  { id: 'requirements', label: 'Requirements', description: 'Checking requirements and constraints', status: 'pending' },
  { id: 'documents', label: 'Documents', description: 'Building the document checklist', status: 'pending' },
  { id: 'workflow', label: 'Action Workflow', description: 'Organizing the recommended steps', status: 'pending' },
  { id: 'verification', label: 'Verification', description: 'Checking claims against evidence', status: 'pending' },
  { id: 'approval', label: 'Human Approval', description: 'Ready for human review', status: 'pending' },
];

export function playExecutionTone(kind: 'start' | 'running' | 'success' | 'warning' | 'complete' = 'running') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const notes: Record<string, number[]> = {
      start: [392, 523.25],
      running: [440],
      success: [523.25, 659.25],
      warning: [330, 277.18],
      complete: [523.25, 659.25, 783.99],
    };
    notes[kind].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      const t = ctx.currentTime + index * 0.075;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(kind === 'running' ? 0.018 : 0.028, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(t);
      oscillator.stop(t + 0.13);
    });
    window.setTimeout(() => void ctx.close(), 500);
  } catch {}
}
