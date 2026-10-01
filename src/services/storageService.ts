import { UserRequest, SystemAnalytics } from '../types';

const STORAGE_KEY = 'civicflow_requests_v1';

// Seed initial realistic demo request: "How can I register a small business and what documents and steps do I need?"
export const INITIAL_DEMO_REQUEST: UserRequest = {
  id: 'req-civic-101',
  title: 'Small Business Registration & Licensing Workflow',
  rawQuery: 'How can I register a small business and what documents and steps do I need?',
  category: 'business_licensing',
  jurisdiction: {
    city: 'Los Angeles',
    county: 'Los Angeles County',
    state: 'California',
    country: 'United States'
  },
  citizenProfile: {
    applicantType: 'small_business_owner',
    entityName: 'Apex Artisan Design Studio LLC',
    urgency: 'medium',
    email: 'citizen.founder@example.org',
    notes: 'Starting a small design consultancy & physical goods boutique. Planning to operate initially from a home office.'
  },
  createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  status: 'awaiting_human_approval',
  currentAgent: 'verifier_agent',
  currentWorkflowId: 'WF-BUS-REG-2026',
  ragSourcesUsed: [
    {
      id: 'cite-chk-001-a',
      docId: 'kb-sb-001',
      title: 'Uniform Business Organizations Code — LLC Formation & Articles of Organization',
      section: '§ 17702.01(a)-(c)',
      authority: 'Secretary of State, Division of Corporations',
      statutoryUrl: 'https://leginfo.gov/statutes/CorpCode17702',
      exactQuote: 'Form LLC-1 must be filed with the Secretary of State along with the mandatory $70 filing fee. Must designate an in-state registered agent with physical address.',
      relevanceScore: 0.98,
      isOfficialCode: true,
      lastVerifiedDate: '2026-01-15'
    },
    {
      id: 'cite-chk-002-a',
      docId: 'kb-sb-002',
      title: 'Municipal General Business Tax & Local Licensing Ordinance',
      section: 'Mun. Code § 5.04.010',
      authority: 'City Office of Finance & Revenue',
      statutoryUrl: 'https://finance.citygov.org/code5',
      exactQuote: 'Every business operating within city limits must secure a Business Tax Registration Certificate within 30 days of commencing operations. $50 initial filing fee.',
      relevanceScore: 0.94,
      isOfficialCode: true,
      lastVerifiedDate: '2026-02-01'
    },
    {
      id: 'cite-chk-003-a',
      docId: 'kb-sb-003',
      title: 'Fictitious Business Name (DBA) Statements & Publication Mandate',
      section: 'Bus. & Prof. Code § 17910',
      authority: 'County Clerk-Recorder',
      statutoryUrl: 'https://clerk.county.gov/code17910',
      exactQuote: 'File Fictitious Business Name statement with County Clerk within 40 days of starting business. $26 base fee for first business name.',
      relevanceScore: 0.91,
      isOfficialCode: true,
      lastVerifiedDate: '2025-11-20'
    },
    {
      id: 'cite-chk-005-a',
      docId: 'kb-sb-005',
      title: 'Federal Employer Identification Number (FEIN / EIN) Issuance Protocol',
      section: '26 U.S.C. § 6109',
      authority: 'Internal Revenue Service (IRS)',
      statutoryUrl: 'https://irs.gov/ein',
      exactQuote: 'Free online issuance via IRS Form SS-4. Essential prerequisite for corporate bank account and employee payroll tax filing.',
      relevanceScore: 0.89,
      isOfficialCode: true,
      lastVerifiedDate: '2025-10-01'
    }
  ],
  executions: [
    {
      id: 'exec-demo-1',
      agentId: 'intake_agent',
      agentName: 'Citizen Intake & Entity Extraction Agent',
      timestamp: new Date(Date.now() - 3600000 * 3.9).toISOString(),
      durationMs: 410,
      status: 'success',
      inputSummary: 'Citizen natural query: "How can I register a small business and what documents and steps do I need?"',
      outputSummary: 'Extracted intent: Business Formation & Licensing. Jurisdiction: Los Angeles, CA. Urgency: Medium.',
      reasoningNotes: [
        'Sanitized citizen prompt against malicious instructions.',
        'Extracted primary intention: Multi-jurisdictional small enterprise startup.',
        'Mapped jurisdiction to California State + Los Angeles County + City of Los Angeles.'
      ],
      outputPayload: { intent: 'business_formation', targetEntity: 'LLC' },
      confidenceScore: 0.98,
      tokensUsed: { prompt: 145, completion: 82, total: 227 }
    },
    {
      id: 'exec-demo-2',
      agentId: 'router_agent',
      agentName: 'Workflow Router & Orchestration Agent',
      timestamp: new Date(Date.now() - 3600000 * 3.8).toISOString(),
      durationMs: 380,
      status: 'success',
      inputSummary: 'Route entity to standard commercial enterprise setup pipeline.',
      outputSummary: 'Dispatched to Multi-Jurisdiction Commercial Registration Workflow (4 Phases).',
      reasoningNotes: [
        'Identified prerequisite ladder: State Articles -> IRS EIN -> County FBN -> Municipal Tax Permit.',
        'Instantiated research dependencies for California Secretary of State & City Finance.'
      ],
      outputPayload: { routeId: 'WF-BUS-REG-2026', phases: 4 },
      confidenceScore: 0.96,
      tokensUsed: { prompt: 198, completion: 94, total: 292 }
    },
    {
      id: 'exec-demo-3',
      agentId: 'research_agent',
      agentName: 'Statutory Research & Policy Agent',
      timestamp: new Date(Date.now() - 3600000 * 3.7).toISOString(),
      durationMs: 520,
      status: 'success',
      inputSummary: 'Retrieve statutory references for California LLC formation and Los Angeles municipal tax.',
      outputSummary: 'Found governing codes: Corp Code § 17702, Mun Code § 5.04, Bus & Prof Code § 17900.',
      reasoningNotes: [
        'Confirmed state filing requirement under Revised Uniform LLC Act.',
        'Identified mandatory 4-week publication rule for fictitious business names.'
      ],
      outputPayload: { statutesFound: 4 },
      confidenceScore: 0.97,
      tokensUsed: { prompt: 240, completion: 120, total: 360 }
    },
    {
      id: 'exec-demo-4',
      agentId: 'rag_agent',
      agentName: 'Verified Knowledge & RAG Grounding Agent',
      timestamp: new Date(Date.now() - 3600000 * 3.6).toISOString(),
      durationMs: 440,
      status: 'success',
      inputSummary: 'Semantic vector retrieval across verified municipal corpus.',
      outputSummary: 'Retrieved 4 verified statutory chunks with 0.93 average semantic relevance.',
      reasoningNotes: [
        'Filtered uncertified documents; matched Secretary of State and Municipal Code gazettes.',
        'Extracted verified fee figures: $70 state fee, $26 county fee, $50 city base tax.'
      ],
      outputPayload: { chunksMatched: 4, topRelevance: 0.98 },
      confidenceScore: 0.99,
      tokensUsed: { prompt: 310, completion: 154, total: 464 }
    },
    {
      id: 'exec-demo-5',
      agentId: 'eligibility_agent',
      agentName: 'Statutory Eligibility & Criteria Agent',
      timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(),
      durationMs: 430,
      status: 'success',
      inputSummary: 'Evaluate applicant criteria against statutory prerequisites.',
      outputSummary: 'Applicant eligible for Domestic LLC. Flagged Home Occupation zoning compliance requirement.',
      reasoningNotes: [
        'Verified in-state registered agent requirement.',
        'Noted applicant planned home-based setup: flagged City Home Occupation Permit condition.'
      ],
      outputPayload: { eligible: true, specialPermits: ['Home Occupation Affidavit'] },
      confidenceScore: 0.95,
      tokensUsed: { prompt: 230, completion: 110, total: 340 }
    },
    {
      id: 'exec-demo-6',
      agentId: 'document_agent',
      agentName: 'Document Identification & Checklist Agent',
      timestamp: new Date(Date.now() - 3600000 * 3.4).toISOString(),
      durationMs: 480,
      status: 'success',
      inputSummary: 'Assemble required and conditional application documents.',
      outputSummary: 'Generated checklist of 5 documents (3 mandatory, 2 conditional).',
      reasoningNotes: [
        'Specified Form LLC-1, IRS SS-4, Form FBN-100, and City BTRC.',
        'Noted bank account prerequisite: CP 575 EIN letter required.'
      ],
      outputPayload: { documentCount: 5 },
      confidenceScore: 0.98,
      tokensUsed: { prompt: 280, completion: 140, total: 420 }
    },
    {
      id: 'exec-demo-7',
      agentId: 'workflow_agent',
      agentName: 'Action Plan & Execution Sequencer Agent',
      timestamp: new Date(Date.now() - 3600000 * 3.3).toISOString(),
      durationMs: 560,
      status: 'success',
      inputSummary: 'Build chronological action sequence and flag consequential actions.',
      outputSummary: 'Assembled 5 sequential action steps. Flagged Step 1 ($70 filing fee) for human sign-off.',
      reasoningNotes: [
        'Identified non-refundable state fee and legal entity creation as consequential action.',
        'Gated Step 1 behind human-in-the-loop confirmation before external dispatch.'
      ],
      outputPayload: { stepsCount: 5, totalFees: 146 },
      confidenceScore: 0.97,
      tokensUsed: { prompt: 350, completion: 210, total: 560 }
    },
    {
      id: 'exec-demo-8',
      agentId: 'verifier_agent',
      agentName: 'Fact-Check & Hallucination Verifier Agent',
      timestamp: new Date(Date.now() - 3600000 * 3.2).toISOString(),
      durationMs: 510,
      status: 'success',
      inputSummary: 'Cross-examine workflow plan, fees, and timelines against RAG citations.',
      outputSummary: 'Verified 100% of claims against citations. Hallucination risk: LOW (0.02).',
      reasoningNotes: [
        'State fee of $70 cross-referenced against Corp Code § 17702.01: VERIFIED.',
        'IRS EIN $0 fee cross-referenced: VERIFIED.',
        'County FBN fee of $26 cross-referenced against Bus & Prof Code § 17910: VERIFIED.',
        'City base fee of $50 cross-referenced against Mun Code § 5.04: VERIFIED.'
      ],
      outputPayload: { verified: true, hallucinationRisk: 'low', confidence: 0.974 },
      confidenceScore: 0.99,
      tokensUsed: { prompt: 410, completion: 180, total: 590 }
    },
    {
      id: 'exec-demo-9',
      agentId: 'response_agent',
      agentName: 'Citizen Briefing & Presentation Agent',
      timestamp: new Date(Date.now() - 3600000 * 3.1).toISOString(),
      durationMs: 460,
      status: 'success',
      inputSummary: 'Format final action plan package and enforce statutory disclaimers.',
      outputSummary: 'Action plan finalized. Placed in review queue for Human-in-the-Loop authorization.',
      reasoningNotes: [
        'Rendered plain-language roadmap.',
        'Included official agency contact telephone numbers and physical offices.',
        'Attached mandatory non-legal-advice civic disclaimer.'
      ],
      outputPayload: { ready: true },
      confidenceScore: 0.98,
      tokensUsed: { prompt: 320, completion: 220, total: 540 }
    }
  ],
  finalActionPlan: {
    id: 'plan-req-civic-101',
    generatedAt: new Date(Date.now() - 3600000 * 3.1).toISOString(),
    executiveSummary: 'Here is your verified, step-by-step roadmap to legally register and license your small business in Los Angeles, California. All fees and statutory timelines have been verified against official State and Municipal codes.',
    jurisdictionContext: 'City of Los Angeles, Los Angeles County, California',
    estimatedTotalTime: '10 to 14 business days',
    estimatedTotalFees: 146.00,
    criticalAlerts: [
      'Do NOT pay third-party services for an EIN: The IRS provides this identification number 100% free of charge online.',
      'Consequential Action: Submitting Articles of Organization incurs a non-refundable $70.00 filing fee and establishes legal entity liability.',
      'Fictitious Business Name (DBA) requires legal publication in an adjudicated local newspaper for 4 consecutive weeks within 30 days of filing.'
    ],
    steps: [
      {
        id: 'step-1',
        order: 1,
        phase: 'Phase 1: Legal Formation',
        title: 'File Articles of Organization (Form LLC-1)',
        description: 'Submit Form LLC-1 with the Secretary of State to officially establish your business entity. Designate your in-state Registered Agent with a physical street address.',
        responsibleAgency: 'Secretary of State (Division of Corporations)',
        estimatedDuration: '3-5 business days (electronic)',
        estimatedFee: 70.00,
        feeCurrency: 'USD',
        actionType: 'form_submission',
        requiredDocuments: ['Form LLC-1', 'Registered Agent Consent Form'],
        officialPortalUrl: 'https://bizfileonline.sos.ca.gov',
        requiresHumanApproval: true,
        isConsequentialAction: true,
        completed: false
      },
      {
        id: 'step-2',
        order: 2,
        phase: 'Phase 2: Tax & Identifiers',
        title: 'Obtain Federal Employer Identification Number (EIN)',
        description: 'Apply for your 9-digit Federal Tax ID directly through the IRS electronic portal. Issued immediately upon completion at zero cost.',
        responsibleAgency: 'Internal Revenue Service (IRS)',
        estimatedDuration: 'Immediate (online portal)',
        estimatedFee: 0.00,
        feeCurrency: 'USD',
        actionType: 'form_submission',
        requiredDocuments: ['IRS Form SS-4 data', 'Principal Officer SSN/ITIN'],
        officialPortalUrl: 'https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online',
        requiresHumanApproval: false,
        isConsequentialAction: false,
        completed: true
      },
      {
        id: 'step-3',
        order: 3,
        phase: 'Phase 1: Legal Formation',
        title: 'File Fictitious Business Name (DBA) Statement',
        description: 'File Form FBN-100 with the County Clerk-Recorder if transacting under a commercial brand name that differs from your exact legal LLC name. Publish in an adjudicated newspaper for 4 weeks.',
        responsibleAgency: 'County Clerk-Recorder Department',
        estimatedDuration: '1-2 business days to file; 4 weeks publication',
        estimatedFee: 26.00,
        feeCurrency: 'USD',
        actionType: 'form_submission',
        requiredDocuments: ['Form FBN-100', 'Certified Copy of Articles of Organization'],
        officialPortalUrl: 'https://clerk.county.gov/fbn',
        requiresHumanApproval: true,
        isConsequentialAction: true,
        completed: false
      },
      {
        id: 'step-4',
        order: 4,
        phase: 'Phase 3: Municipal Licensing',
        title: 'Secure Municipal Business Tax Registration Certificate (BTRC)',
        description: 'Register with the City Office of Finance within 30 days of commencing operations. Includes local zoning clearance and Home Occupation affidavit if operating from a residence.',
        responsibleAgency: 'City Office of Finance & Revenue',
        estimatedDuration: '5-7 business days',
        estimatedFee: 50.00,
        feeCurrency: 'USD',
        actionType: 'form_submission',
        requiredDocuments: ['Municipal BTRC Application', 'EIN Confirmation Letter', 'Lease or Home Deed'],
        officialPortalUrl: 'https://finance.citygov.org/business-tax',
        requiresHumanApproval: false,
        isConsequentialAction: false,
        completed: false
      },
      {
        id: 'step-5',
        order: 5,
        phase: 'Phase 4: Operational Compliance',
        title: 'Register for State Seller\'s Permit (If Selling Goods)',
        description: 'If selling or leasing tangible goods or taxable services, secure an official Seller\'s Permit through the State Department of Tax and Fee Administration.',
        responsibleAgency: 'State Department of Tax and Fee Administration',
        estimatedDuration: '1-2 business days',
        estimatedFee: 0.00,
        feeCurrency: 'USD',
        actionType: 'form_submission',
        requiredDocuments: ['EIN Letter', 'Anticipated Gross Receipts Estimate'],
        officialPortalUrl: 'https://cdtfa.ca.gov/services',
        requiresHumanApproval: false,
        isConsequentialAction: false,
        completed: false
      }
    ],
    requiredDocumentChecklist: [
      {
        name: 'Articles of Organization (Form LLC-1)',
        isMandatory: true,
        templateAvailable: true,
        notes: 'Must include physical address of Registered Agent.'
      },
      {
        name: 'IRS EIN Confirmation Notice (CP 575)',
        isMandatory: true,
        templateAvailable: true,
        notes: 'Required by all commercial banks to open business accounts.'
      },
      {
        name: 'County FBN Statement (Form FBN-100)',
        isMandatory: true,
        templateAvailable: true,
        notes: 'Required if DBA trade name is utilized.'
      },
      {
        name: 'Municipal Business Tax Certificate Application',
        isMandatory: true,
        templateAvailable: true,
        notes: 'Due within 30 days of commercial operations.'
      },
      {
        name: 'Home Occupation Permit Affidavit',
        isMandatory: false,
        templateAvailable: true,
        notes: 'Only required if operating from residential dwelling.'
      }
    ],
    officialContacts: [
      {
        agency: 'Secretary of State (Business Programs)',
        phone: '(916) 653-3795',
        email: 'bizfile@sos.state.gov',
        address: '1500 11th Street, 3rd Floor, State Capital',
        portalUrl: 'https://bizfileonline.sos.state.gov'
      },
      {
        agency: 'City Office of Finance',
        phone: '(213) 473-5901',
        email: 'finance.customerservice@citygov.org',
        address: '200 N. Spring Street, Room 101, City Hall',
        portalUrl: 'https://finance.citygov.org'
      },
      {
        agency: 'County Clerk-Recorder',
        phone: '(800) 201-4999',
        email: 'clerkrecords@county.gov',
        address: '12400 Imperial Hwy, County Administration Center',
        portalUrl: 'https://clerk.county.gov'
      }
    ],
    verificationResult: {
      verified: true,
      overallConfidence: 0.95,
      hallucinationRisk: 'low',
      claimsCheckedCount: 6,
      unverifiedClaims: [],
      complianceNotes: [
        'Demo Knowledge Base: Illustrative demo information — verify with the relevant authority.',
        'Initial state filing fee cross-referenced against statutory reference § 17702.01.',
        'Local licensing procedure cross-referenced against local administrative schedules.'
      ],
      disclaimer: 'Illustrative demo information based on configured knowledge base. Verify with the relevant authority.',
      verifiedAt: new Date(Date.now() - 3600000 * 3.1).toISOString()
    },
    legalDisclaimer: 'CivicFlow provides informational guidance, not legal or government decisions. Verify important requirements with the relevant authority before submitting documents, making payments, or taking consequential action.'
  },
  humanApproval: {
    id: 'appr-req-civic-101',
    approvedBy: 'Elena Rostova',
    role: 'Senior Civic Caseworker',
    status: 'pending',
    notes: 'Awaiting applicant authorization before filing Form LLC-1 with the Secretary of State ($70 non-refundable statutory fee).',
    consequentialActionsApproved: []
  }
};

class StorageService {
  private requests: UserRequest[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.requests = JSON.parse(stored);
      } else {
        this.requests = [INITIAL_DEMO_REQUEST];
        this.save();
      }
    } catch {
      this.requests = [INITIAL_DEMO_REQUEST];
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
    return this.requests;
  }

  public getRequestById(id: string): UserRequest | undefined {
    return this.requests.find(r => r.id === id);
  }

  public saveRequest(request: UserRequest): void {
    const idx = this.requests.findIndex(r => r.id === request.id);
    if (idx >= 0) {
      this.requests[idx] = { ...request, updatedAt: new Date().toISOString() };
    } else {
      this.requests.unshift(request);
    }
    this.save();
  }

  public deleteRequest(id: string): void {
    this.requests = this.requests.filter(r => r.id !== id);
    this.save();
  }

  public getAnalytics(): SystemAnalytics {
    const completed = this.requests.filter(r => r.status === 'completed' || r.status === 'approved').length;
    const pendingAppr = this.requests.filter(r => r.status === 'awaiting_human_approval').length;
    const inProg = this.requests.filter(r => r.status === 'processing' || r.status === 'intake').length;

    return {
      totalRequests: this.requests.length,
      completedRequests: completed,
      inProgressRequests: inProg,
      pendingApprovals: pendingAppr,
      avgTurnaroundMinutes: 12.4,
      verificationPassRate: 99.4,
      hallucinationFlaggedCount: 1,
      tokensConsumedToday: 18450,
      categoryBreakdown: [
        { category: 'Business Licensing', count: this.requests.filter(r => r.category === 'business_licensing').length || 1 },
        { category: 'Housing & Habitability', count: this.requests.filter(r => r.category === 'housing_permits').length },
        { category: 'Zoning & Planning', count: this.requests.filter(r => r.category === 'zoning_planning').length },
        { category: 'Social Services', count: this.requests.filter(r => r.category === 'social_services').length }
      ],
      agentPerformance: [
        { agentId: 'intake_agent', name: 'Intake Agent', avgLatencyMs: 415, accuracyRate: 99.8 },
        { agentId: 'router_agent', name: 'Router Agent', avgLatencyMs: 382, accuracyRate: 99.4 },
        { agentId: 'research_agent', name: 'Research Agent', avgLatencyMs: 512, accuracyRate: 98.9 },
        { agentId: 'rag_agent', name: 'RAG Agent', avgLatencyMs: 448, accuracyRate: 99.7 },
        { agentId: 'eligibility_agent', name: 'Eligibility Agent', avgLatencyMs: 432, accuracyRate: 99.1 },
        { agentId: 'document_agent', name: 'Document Agent', avgLatencyMs: 485, accuracyRate: 99.3 },
        { agentId: 'workflow_agent', name: 'Workflow Agent', avgLatencyMs: 574, accuracyRate: 98.7 },
        { agentId: 'verifier_agent', name: 'Verifier Agent', avgLatencyMs: 518, accuracyRate: 99.9 },
        { agentId: 'response_agent', name: 'Response Agent', avgLatencyMs: 470, accuracyRate: 99.6 }
      ]
    };
  }
}

export const storageService = new StorageService();
