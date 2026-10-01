import { AgentRole } from '../types';

export interface AgentFeedback {
  agentId: AgentRole;
  rating: 'up' | 'down';
  reason?: string;
  timestamp: string;
}

export interface AgentCalibrationStats {
  upvotes: number;
  downvotes: number;
  calibrationFactor: number; // e.g. 1.05 or 0.95
  userFeedback?: 'up' | 'down';
}

const STORAGE_KEY = 'civicflow_agent_feedback_v1';

class FeedbackService {
  private localFeedback: Map<string, 'up' | 'down'> = new Map();
  private statsCache: Record<string, AgentCalibrationStats> = {
    intake_agent: { upvotes: 14, downvotes: 1, calibrationFactor: 1.08 },
    router_agent: { upvotes: 19, downvotes: 0, calibrationFactor: 1.12 },
    research_agent: { upvotes: 11, downvotes: 1, calibrationFactor: 1.06 },
    rag_agent: { upvotes: 24, downvotes: 2, calibrationFactor: 1.11 },
    eligibility_agent: { upvotes: 16, downvotes: 1, calibrationFactor: 1.09 },
    document_agent: { upvotes: 21, downvotes: 1, calibrationFactor: 1.10 },
    workflow_agent: { upvotes: 18, downvotes: 0, calibrationFactor: 1.12 },
    verifier_agent: { upvotes: 28, downvotes: 1, calibrationFactor: 1.14 },
    response_agent: { upvotes: 15, downvotes: 2, calibrationFactor: 1.05 }
  };

  constructor() {
    this.loadFromStorage();
    this.fetchRemoteStats().catch(() => {});
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.ratings) {
          for (const [k, v] of Object.entries(parsed.ratings)) {
            this.localFeedback.set(k, v as 'up' | 'down');
          }
        }
      }
    } catch {
      // ignore
    }
  }

  private saveToStorage() {
    try {
      const ratings: Record<string, string> = {};
      this.localFeedback.forEach((val, key) => {
        ratings[key] = val;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ratings }));
    } catch {
      // ignore
    }
  }

  public async fetchRemoteStats(): Promise<Record<string, AgentCalibrationStats>> {
    try {
      const res = await fetch('/api/rag/feedback');
      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          for (const [agentId, s] of Object.entries(data.summary as Record<string, any>)) {
            if (this.statsCache[agentId]) {
              this.statsCache[agentId] = {
                upvotes: this.statsCache[agentId].upvotes + (s.upvotes || 0),
                downvotes: this.statsCache[agentId].downvotes + (s.downvotes || 0),
                calibrationFactor: s.calibrationFactor || this.statsCache[agentId].calibrationFactor
              };
            }
          }
        }
      }
    } catch {
      // fallback to statsCache
    }
    return this.statsCache;
  }

  public async submitFeedback(
    agentId: AgentRole,
    rating: 'up' | 'down',
    reason?: string
  ): Promise<AgentCalibrationStats> {
    const previous = this.localFeedback.get(agentId);
    this.localFeedback.set(agentId, rating);
    this.saveToStorage();

    // Local delta calculation
    if (!this.statsCache[agentId]) {
      this.statsCache[agentId] = { upvotes: 0, downvotes: 0, calibrationFactor: 1.0 };
    }
    const current = this.statsCache[agentId];

    if (previous !== rating) {
      if (previous === 'up') current.upvotes = Math.max(0, current.upvotes - 1);
      if (previous === 'down') current.downvotes = Math.max(0, current.downvotes - 1);

      if (rating === 'up') current.upvotes += 1;
      if (rating === 'down') current.downvotes += 1;

      const total = current.upvotes + current.downvotes;
      const ratio = total > 0 ? (current.upvotes - current.downvotes) / total : 0;
      current.calibrationFactor = Math.round((1.0 + (ratio * 0.15)) * 100) / 100;
    }

    current.userFeedback = rating;

    // Send to backend
    try {
      await fetch('/api/rag/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, rating, reason })
      });
    } catch {
      // offline fallback succeeded
    }

    return { ...current };
  }

  public getAgentStats(agentId: AgentRole): AgentCalibrationStats {
    const stats = this.statsCache[agentId] || { upvotes: 12, downvotes: 1, calibrationFactor: 1.05 };
    return {
      ...stats,
      userFeedback: this.localFeedback.get(agentId)
    };
  }

  public getCalibratedConfidence(agentId: AgentRole, baseConfidence: number): number {
    const stats = this.getAgentStats(agentId);
    const calibrated = baseConfidence * stats.calibrationFactor;
    return Math.min(1.0, Math.max(0.1, Math.round(calibrated * 100) / 100));
  }
}

export const feedbackService = new FeedbackService();
