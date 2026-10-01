import { UserRequest, SystemAnalytics } from '../types';

const STORAGE_KEY = 'civicflow_requests_v2';

class StorageService {
  private requests: UserRequest[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      this.requests = stored ? JSON.parse(stored) : [];
    } catch {
      this.requests = [];
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.requests));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  public getRequests(): UserRequest[] {
    return [...this.requests];
  }

  public getRequestById(id: string): UserRequest | undefined {
    return this.requests.find(r => r.id === id);
  }

  public saveRequest(request: UserRequest): void {
    const idx = this.requests.findIndex(r => r.id === request.id);
    if (idx >= 0) this.requests[idx] = { ...request, updatedAt: new Date().toISOString() };
    else this.requests.unshift(request);
    this.save();
  }

  public deleteRequest(id: string): void {
    this.requests = this.requests.filter(r => r.id !== id);
    this.save();
  }

  public getAnalytics(): SystemAnalytics {
    const completed = this.requests.filter(r => r.status === 'completed' || r.status === 'approved').length;
    const pendingApprovals = this.requests.filter(r => r.status === 'awaiting_human_approval').length;
    const inProgress = this.requests.filter(r => r.status === 'processing' || r.status === 'intake').length;
    const durations = this.requests
      .filter(r => r.status === 'completed' || r.status === 'approved')
      .map(r => Math.max(0, (new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / 60000));
    const avgTurnaroundMinutes = durations.length
      ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
      : 0;

    const allExecutions = this.requests.flatMap(r => r.executions || []);
    const verified = this.requests
      .map(r => r.finalActionPlan?.verificationResult)
      .filter(Boolean) as NonNullable<UserRequest['finalActionPlan']>['verificationResult'][];
    const verificationPassRate = verified.length
      ? Math.round((verified.filter(v => v.verified).length / verified.length) * 1000) / 10
      : 0;
    const hallucinationFlaggedCount = verified.reduce((n, v) => n + (v.unverifiedClaims?.length || 0), 0);
    const tokensConsumedToday = allExecutions
      .filter(e => new Date(e.timestamp).toDateString() === new Date().toDateString())
      .reduce((n, e) => n + (e.tokensUsed?.total || 0), 0);

    const categories = ['Business Licensing', 'Housing & Habitability', 'Zoning & Planning', 'Social Services', 'Environmental Compliance'];
    const categoryMap: Record<string, string> = {
      'Business Licensing': 'business_licensing',
      'Housing & Habitability': 'housing_permits',
      'Zoning & Planning': 'zoning_planning',
      'Social Services': 'social_services',
      'Environmental Compliance': 'environmental_compliance'
    };

    return {
      totalRequests: this.requests.length,
      completedRequests: completed,
      inProgressRequests: inProgress,
      pendingApprovals,
      avgTurnaroundMinutes,
      verificationPassRate,
      hallucinationFlaggedCount,
      tokensConsumedToday,
      categoryBreakdown: categories.map(category => ({
        category,
        count: this.requests.filter(r => r.category === categoryMap[category]).length
      })),
      agentPerformance: []
    };
  }
}

export const storageService = new StorageService();
