export type RequestStatus = 
  | 'intake'
  | 'processing'
  | 'awaiting_human_approval'
  | 'approved'
  | 'rejected'
  | 'completed';

export type AgentRole =
  | 'intake_agent'
  | 'router_agent'
  | 'research_agent'
  | 'rag_agent'
  | 'eligibility_agent'
  | 'document_agent'
  | 'workflow_agent'
  | 'verifier_agent'
  | 'response_agent';

export type AgentStatus = 'idle' | 'running' | 'success' | 'warning' | 'error';

export interface AgentInfo {
  id: AgentRole;
  name: string;
  shortName: string;
  roleDescription: string;
  icon: string;
  systemPrompt: string;
  temperature: number;
  model: string;
  latencyMs?: number;
  successRate: number;
  totalExecutions: number;
  status: AgentStatus;
}

export interface UserRequest {
  id: string;
  title: string;
  rawQuery: string;
  category: 'business_licensing' | 'housing_permits' | 'social_services' | 'zoning_planning' | 'environmental_compliance';
  jurisdiction: {
    city: string;
    county: string;
    state: string;
    country: string;
  };
  citizenProfile: {
    applicantType: 'individual' | 'small_business_owner' | 'non_profit' | 'contractor';
    entityName?: string;
    urgency: 'low' | 'medium' | 'high' | 'urgent';
    email?: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
  status: RequestStatus;
  currentAgent?: AgentRole;
  currentWorkflowId?: string;
  executions: AgentExecution[];
  ragSourcesUsed: SourceCitation[];
  finalActionPlan?: FinalActionPlan;
  humanApproval?: HumanApprovalRecord;
}

export interface AgentExecution {
  id: string;
  agentId: AgentRole;
  agentName: string;
  timestamp: string;
  durationMs: number;
  status: AgentStatus;
  inputSummary: string;
  outputSummary: string;
  reasoningNotes: string[];
  rawPromptPreview?: string;
  outputPayload: Record<string, any>;
  confidenceScore: number; // 0.0 to 1.0
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  codeReference: string; // e.g., "Mun. Code § 14-202"
  authority: string; // e.g., "Department of Commerce & Consumer Affairs"
  jurisdiction: string;
  category: string;
  lastUpdated: string;
  verifiedByLegalOfficer: boolean;
  content: string;
  chunksCount: number;
  chunks: KnowledgeChunk[];
}

export interface KnowledgeChunk {
  id: string;
  docId: string;
  title: string;
  content: string;
  section: string;
  embeddingVectorPreview?: number[]; // [0.012, -0.44, ...]
  tokens: number;
}

export interface SourceCitation {
  id: string;
  docId: string;
  title: string;
  section: string;
  authority: string;
  statutoryUrl?: string;
  exactQuote: string;
  relevanceScore: number; // 0.0 - 1.0
  isOfficialCode: boolean;
  lastVerifiedDate: string;
}

export interface WorkflowActionStep {
  id: string;
  order: number;
  title: string;
  phase: 'Phase 1: Legal Formation' | 'Phase 2: Tax & Identifiers' | 'Phase 3: Municipal Licensing' | 'Phase 4: Operational Compliance' | 'General';
  description: string;
  responsibleAgency: string;
  estimatedDuration: string;
  estimatedFee: number;
  feeCurrency: string;
  actionType: 'form_submission' | 'inspection' | 'fee_payment' | 'document_upload' | 'notarization';
  requiredDocuments: string[];
  officialPortalUrl?: string;
  requiresHumanApproval: boolean;
  isConsequentialAction: boolean; // e.g. filing that incurs legal liability or non-refundable fee
  completed: boolean;
}

export interface VerificationResult {
  verified: boolean;
  overallConfidence: number; // e.g., 0.96
  hallucinationRisk: 'low' | 'medium' | 'high';
  claimsCheckedCount: number;
  unverifiedClaims: string[];
  complianceNotes: string[];
  disclaimer: string;
  verifiedAt: string;
}

export interface FinalActionPlan {
  id: string;
  generatedAt: string;
  executiveSummary: string;
  jurisdictionContext: string;
  estimatedTotalTime: string;
  estimatedTotalFees: number;
  steps: WorkflowActionStep[];
  requiredDocumentChecklist: {
    name: string;
    isMandatory: boolean;
    templateAvailable: boolean;
    notes: string;
  }[];
  criticalAlerts: string[];
  officialContacts: {
    agency: string;
    phone: string;
    email: string;
    address: string;
    portalUrl: string;
  }[];
  verificationResult: VerificationResult;
  legalDisclaimer: string;
}

export interface HumanApprovalRecord {
  id: string;
  approvedBy: string; // reviewer name
  role: 'Municipal Officer' | 'Senior Civic Caseworker' | 'Citizen Supervisor';
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  decisionTimestamp?: string;
  notes: string;
  consequentialActionsApproved: string[];
}

export interface SystemAnalytics {
  totalRequests: number;
  completedRequests: number;
  inProgressRequests: number;
  pendingApprovals: number;
  avgTurnaroundMinutes: number;
  verificationPassRate: number; // e.g., 99.2%
  hallucinationFlaggedCount: number;
  tokensConsumedToday: number;
  categoryBreakdown: {
    category: string;
    count: number;
  }[];
  agentPerformance: {
    agentId: AgentRole;
    name: string;
    avgLatencyMs: number;
    accuracyRate: number;
  }[];
}
