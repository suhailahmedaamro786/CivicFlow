/**
 * CivicFlow AI - Multi-Agent Engine Core Types
 * Strict typed contracts for all 9 agents, orchestrator, and workflow state.
 */

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

export type AgentExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'needs_verification'
  | 'failed';

export type SupportedLanguage = 'en' | 'ur' | 'roman_urdu';

export type WorkflowRoute =
  | 'Business Registration'
  | 'Education/Scholarship'
  | 'Employment/Application'
  | 'General Civic Service';

export type EligibilityStatus =
  | 'ELIGIBLE'
  | 'NOT_ELIGIBLE'
  | 'NEEDS_MORE_INFORMATION'
  | 'REQUIRES_VERIFICATION';

export type DocumentStatus =
  | 'AVAILABLE'
  | 'MISSING'
  | 'UNKNOWN'
  | 'NOT_REQUIRED';

export type VerificationStatus =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'UNSUPPORTED'
  | 'REQUIRES_VERIFICATION'
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'FLAGGED';

// Base Agent Execution Record
export interface AgentExecutionRecord {
  agentId: AgentRole;
  name: string;
  status: AgentExecutionStatus;
  executionTimeMs: number;
  shortSummary: string;
  sourcesUsed: string[];
  outputData: any;
  error?: string;
  timestamp: string;
}

// 1. Intake Agent Input & Output
export interface IntakeInput {
  rawQuery: string;
  languageHint?: SupportedLanguage;
  locationHint?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

export interface IntakeOutput {
  intent: string;
  serviceCategory: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  userGoal: string;
  knownInformation: string[];
  missingInformation: string[];
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  language: SupportedLanguage;
}

// 2. Router Agent Input & Output
export interface RouterInput {
  normalizedRequest: IntakeOutput;
}

export interface RouterOutput {
  selectedWorkflow: WorkflowRoute;
  reasoningSummary: string; // Concise, no private chain-of-thought
  requiredAgents: AgentRole[];
}

// 3. Research Agent Input & Output
export interface ResearchInput {
  normalizedRequest: IntakeOutput;
  selectedWorkflow: WorkflowRoute;
}

export interface ResearchOutput {
  factualRequirements: string[];
  potentiallyOutdatedInformation: string[];
  claimsRequiringVerification: string[];
  researchTasks: string[];
}

// 4. Knowledge/RAG Agent Input & Output
export interface RetrievedSource {
  documentId: string;
  title: string;
  chunk: string;
  source: string;
  relevanceScore: number; // 0.0 - 1.0
  section?: string;
}

export interface KnowledgeRAGInput {
  normalizedRequest: IntakeOutput;
  selectedWorkflow: WorkflowRoute;
  researchTasks: string[];
}

export interface KnowledgeRAGOutput {
  retrievedSources: RetrievedSource[];
  groundingContext: string;
  totalEvaluated: number;
  coverageAssessment: 'COMPREHENSIVE' | 'PARTIAL' | 'MINIMAL';
}

// 5. Eligibility Agent Input & Output
export interface EligibilityInput {
  normalizedRequest: IntakeOutput;
  selectedWorkflow: WorkflowRoute;
  retrievedSources: RetrievedSource[];
  researchResults: ResearchOutput;
}

export interface EligibilityOutput {
  eligibilityStatus: EligibilityStatus;
  knownRequirements: string[];
  missingInformation: string[];
  conditions: string[];
  uncertainty: string;
}

// 6. Document Agent Input & Output
export interface DocumentItem {
  name: string;
  purpose: string;
  required: boolean;
  status: DocumentStatus;
  notes: string;
  source: string;
}

export interface DocumentInput {
  normalizedRequest: IntakeOutput;
  selectedWorkflow: WorkflowRoute;
  retrievedSources: RetrievedSource[];
  eligibilityResult: EligibilityOutput;
}

export interface DocumentOutput {
  documents: DocumentItem[];
  missingMandatoryCount: number;
  instructions: string;
}

// 7. Workflow Agent Input & Output
export interface WorkflowStepItem {
  stepNumber: number;
  title: string;
  description: string;
  requiredDocuments: string[];
  responsibleParty: string;
  estimatedEffort: string; // e.g. "3-5 business days" or "REQUIRES_VERIFICATION"
  source: string;
  verificationRequired: boolean;
  isConsequentialAction: boolean; // Triggers Human-in-the-loop
}

export interface WorkflowInput {
  normalizedRequest: IntakeOutput;
  selectedWorkflow: WorkflowRoute;
  retrievedSources: RetrievedSource[];
  eligibilityResult: EligibilityOutput;
  documents: DocumentItem[];
}

export interface WorkflowOutput {
  steps: WorkflowStepItem[];
  consequentialStepsCount: number;
  criticalDependencies: string[];
}

// 8. Verifier Agent Input & Output
export interface ClaimAuditItem {
  claim: string;
  supportingSource: string;
  isSupported: boolean;
  contradictions: string[];
  uncertainty: string;
}

export interface VerifierInput {
  normalizedRequest: IntakeOutput;
  selectedWorkflow: WorkflowRoute;
  retrievedSources: RetrievedSource[];
  eligibilityResult: EligibilityOutput;
  documents: DocumentItem[];
  steps: WorkflowStepItem[];
}

export interface VerifierOutput {
  verificationStatus: VerificationStatus;
  verifiedClaims: string[];
  unsupportedClaims: string[];
  warnings: string[];
  recommendedCorrections: string[];
  auditedClaims: ClaimAuditItem[];
  overallConfidence: number; // 0.0 - 1.0
}

// 9. Response Agent Input & Output
export interface ResponseInput {
  normalizedRequest: IntakeOutput;
  selectedWorkflow: WorkflowRoute;
  eligibilityResult: EligibilityOutput;
  documents: DocumentItem[];
  steps: WorkflowStepItem[];
  verificationResult: VerifierOutput;
  retrievedSources: RetrievedSource[];
  targetLanguage: SupportedLanguage;
}

export interface FinalResponseOutput {
  language: SupportedLanguage;
  understandingOfRequest: string;
  eligibilitySummary: string;
  requiredDocumentsList: string[];
  stepByStepWorkflow: {
    stepNumber: number;
    title: string;
    action: string;
    agency: string;
    verified: boolean;
    verificationNote?: string;
  }[];
  missingInformationWarning: string[];
  importantWarnings: string[];
  sourcesAttribution: {
    title: string;
    source: string;
    relevance: number;
  }[];
  verificationStatusSummary: string;
  humanApprovalRequired: boolean;
  legalAdvisoryNotice: string;
}

// Complete Shared WorkflowState
export interface WorkflowState {
  workflowId: string;
  createdAt: string;
  updatedAt: string;
  originalRequest: string;
  targetLanguage: SupportedLanguage;
  currentAgent?: AgentRole;
  isExecuting: boolean;

  // Normalized states
  normalizedRequest?: IntakeOutput;
  detectedService?: RouterOutput;
  researchResults?: ResearchOutput;
  retrievedSources: RetrievedSource[];
  eligibilityResult?: EligibilityOutput;
  requiredDocuments: DocumentItem[];
  missingDocuments: DocumentItem[];
  workflowSteps: WorkflowStepItem[];
  verificationResult?: VerifierOutput;
  finalResponse?: FinalResponseOutput;

  // Telemetry & Control
  agentExecutions: AgentExecutionRecord[];
  errors: {
    agentId: AgentRole;
    message: string;
    timestamp: string;
    recoverable: boolean;
  }[];
  confidence: number;
  humanApprovalRequired: boolean;
  consequentialActionNotice?: string;
  humanApprovalGranted?: boolean;
  approvedBy?: string;
  approvalTimestamp?: string;
}

// Generic Agent Interface
export interface AgentContext {
  state: WorkflowState;
  log: (message: string) => void;
  language: SupportedLanguage;
}

export interface Agent<TInput, TOutput> {
  id: AgentRole;
  name: string;
  purpose: string;
  systemInstructions: string;
  execute(input: TInput, context: AgentContext): Promise<TOutput>;
}
