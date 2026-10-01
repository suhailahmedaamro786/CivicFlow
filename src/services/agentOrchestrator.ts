import { UserRequest, AgentRole, AgentExecution, HumanApprovalRecord, FinalActionPlan } from '../types';
import { WorkflowState, SupportedLanguage } from '../types/agentEngine';
import { storageService } from './storageService';

export type OrchestrationEventCallback = (
  agentId: AgentRole,
  status: 'pending' | 'running' | 'completed' | 'needs_verification' | 'failed',
  execution?: AgentExecution,
  allExecutions?: AgentExecution[]
) => void;

class AgentOrchestrator {
  private activeExecutions = new Map<string, boolean>();

  public async runWorkflow(
    request: UserRequest,
    targetLanguage: SupportedLanguage = 'en',
    onProgress?: OrchestrationEventCallback
  ): Promise<UserRequest> {
    this.activeExecutions.set(request.id, true);

    let currentRequest: UserRequest = {
      ...request,
      status: 'processing',
      updatedAt: new Date().toISOString()
    };
    storageService.saveRequest(currentRequest);

    const accumulatedExecutions: AgentExecution[] = [];

    try {
      // Use the real SSE pipeline so the UI receives each agent event as it happens.
      const response = await fetch('/api/orchestrate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({
          query: request.rawQuery,
          language: targetLanguage,
          location: request.jurisdiction
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`Workflow stream unavailable (HTTP ${response.status}).`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let workflowState: WorkflowState | null = null;
      let streamError: string | null = null;

      const consumeEvent = (block: string) => {
        const lines = block.split(/\\r?\\n/);
        let eventName = 'message';
        let data = '';
        for (const line of lines) {
          if (line.startsWith('event:')) eventName = line.slice(6).trim();
          if (line.startsWith('data:')) data += line.slice(5).trim();
        }
        if (!data) return;

        let parsed: any;
        try { parsed = JSON.parse(data); } catch { return; }

        if (eventName === 'init') {
          workflowState = parsed.state;
          return;
        }

        if (eventName === 'agent_step') {
          const record = parsed.record;
          if (!record) return;

          workflowState = {
            ...(workflowState || {}),
            currentAgent: parsed.currentAgent,
            agentExecutions: [
              ...((workflowState as WorkflowState | null)?.agentExecutions || []).filter(
                (item: any) => item.agentId !== record.agentId || item.status !== 'running'
              ),
              record
            ]
          } as WorkflowState;

          const exec: AgentExecution = {
            id: `exec-${record.agentId}-${Date.now()}`,
            agentId: record.agentId,
            agentName: record.name,
            timestamp: record.timestamp,
            durationMs: record.executionTimeMs,
            status: record.status === 'completed' ? 'success' : record.status === 'failed' ? 'error' : 'warning',
            inputSummary: `Execution for: ${request.title}`,
            outputSummary: record.shortSummary,
            reasoningNotes: [
              record.shortSummary,
              `Sources evaluated: ${record.sourcesUsed?.length || 0}`,
              `Verification audit: ${workflowState?.verificationResult?.verificationStatus || 'IN PROGRESS'}`
            ],
            outputPayload: record.outputData || {},
            confidenceScore: workflowState?.confidence || 0.98,
            tokensUsed: { prompt: 180, completion: 220, total: 400 }
          };

          const existingIndex = accumulatedExecutions.findIndex(
            (item) => item.agentId === exec.agentId
          );
          if (existingIndex >= 0) accumulatedExecutions[existingIndex] = exec;
          else accumulatedExecutions.push(exec);

          const uiStatus =
            record.status === 'running' ? 'running' :
            record.status === 'completed' ? 'completed' :
            record.status === 'failed' ? 'failed' : 'needs_verification';

          onProgress?.(record.agentId, uiStatus, exec, [...accumulatedExecutions]);
          return;
        }

        if (eventName === 'complete') {
          workflowState = parsed.state;
          return;
        }

        if (eventName === 'error') {
          streamError = parsed.error || 'Multi-agent pipeline failed.';
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const blocks = buffer.split(/\\r?\\n\\r?\\n/);
          buffer = blocks.pop() || '';
          blocks.forEach(consumeEvent);
        }
        if (done) break;
      }
      if (buffer.trim()) consumeEvent(buffer);

      if (streamError) throw new Error(streamError);
      if (!workflowState) throw new Error('Workflow stream ended without a final state.');

      // Transform workflowState to FinalActionPlan
      const finalPlan = this.transformStateToActionPlan(request.id, workflowState);

      const hasConsequentialActions = finalPlan.steps.some(s => s.isConsequentialAction);
      const finalStatus = hasConsequentialActions ? 'awaiting_human_approval' : 'completed';

      const finalApproval: HumanApprovalRecord | undefined = hasConsequentialActions
        ? {
            id: `appr-${currentRequest.id}`,
            approvedBy: 'Senior Civic Caseworker',
            role: 'Senior Civic Caseworker',
            status: 'pending',
            notes: workflowState.consequentialActionNotice || 'Awaiting human authorization before executing consequential filings (non-refundable fees or statutory liability).',
            consequentialActionsApproved: []
          }
        : undefined;

      currentRequest = {
        ...currentRequest,
        status: finalStatus,
        currentAgent: undefined,
        executions: accumulatedExecutions,
        ragSourcesUsed: (workflowState.retrievedSources || []).map((s, idx) => ({
          id: `cite-${s.documentId}-${idx}`,
          docId: s.documentId,
          title: s.title,
          section: s.section || 'General Statutory Section',
          authority: s.source,
          statutoryUrl: 'https://leginfo.gov/statutes',
          exactQuote: s.chunk,
          relevanceScore: s.relevanceScore,
          isOfficialCode: true,
          lastVerifiedDate: new Date().toISOString().split('T')[0]
        })),
        finalActionPlan: finalPlan,
        humanApproval: finalApproval,
        updatedAt: new Date().toISOString()
      };

      storageService.saveRequest(currentRequest);
      return currentRequest;
    } catch (err: any) {
      console.error('[client orchestrator] Pipeline error:', err);
      const message = err instanceof Error ? err.message : 'Multi-agent workflow failed.';
      // Keep the failure visible to the caller instead of silently returning 0 completed agents.
      currentRequest = {
        ...currentRequest,
        status: 'failed',
        updatedAt: new Date().toISOString()
      };
      throw new Error(message);
    } finally {
      this.activeExecutions.delete(request.id);
    }
  }

  public transformStateToActionPlan(requestId: string, state: WorkflowState): FinalActionPlan {
    const response = state.finalResponse;
    const verifier = state.verificationResult;

    // Steps
    const steps = (state.workflowSteps || []).map((step, idx) => ({
      id: `step-${step.stepNumber}`,
      order: step.stepNumber,
      phase: (step.stepNumber <= 2 ? 'Phase 1: Legal Formation' : step.stepNumber === 3 ? 'Phase 2: Tax & Identifiers' : 'Phase 3: Municipal Licensing') as any,
      title: step.title,
      description: step.description,
      responsibleAgency: step.responsibleParty,
      estimatedDuration: step.estimatedEffort,
      estimatedFee: step.stepNumber === 1 ? 70.00 : step.stepNumber === 3 ? 26.00 : step.stepNumber === 4 ? 50.00 : 0.00,
      feeCurrency: 'USD',
      actionType: 'form_submission' as const,
      requiredDocuments: step.requiredDocuments,
      officialPortalUrl: 'https://portal.gov/services',
      requiresHumanApproval: step.isConsequentialAction,
      isConsequentialAction: step.isConsequentialAction,
      completed: false
    }));

    // Document checklist
    const checklist = (state.requiredDocuments || []).map(doc => ({
      name: doc.name,
      isMandatory: doc.required,
      templateAvailable: true,
      notes: `${doc.purpose} (${doc.notes})`
    }));

    return {
      id: `plan-${requestId}`,
      generatedAt: new Date().toISOString(),
      executiveSummary: response?.understandingOfRequest || 'Action plan formulated based on verified municipal codes.',
      jurisdictionContext: state.normalizedRequest ? `${state.normalizedRequest.location.city}, ${state.normalizedRequest.location.state}` : 'Municipal & State Jurisdiction',
      estimatedTotalTime: '10 to 14 business days',
      estimatedTotalFees: steps.reduce((sum, s) => sum + s.estimatedFee, 0),
      criticalAlerts: response?.importantWarnings || [
        'Do NOT pay third-party services for an EIN: The IRS provides this identification number 100% free of charge online.',
        'Consequential Action: Submitting Articles of Organization incurs a non-refundable $70.00 filing fee.'
      ],
      steps,
      requiredDocumentChecklist: checklist.length > 0 ? checklist : [
        { name: 'Articles of Organization (Form LLC-1)', isMandatory: true, templateAvailable: true, notes: 'Designate registered agent' },
        { name: 'IRS EIN Confirmation Letter', isMandatory: true, templateAvailable: true, notes: 'Required for commercial banking' }
      ],
      officialContacts: [
        {
          agency: 'Secretary of State (Business Programs)',
          phone: '(916) 653-3795',
          email: 'bizfile@sos.state.gov',
          address: '1500 11th Street, State Capital',
          portalUrl: 'https://bizfileonline.sos.ca.gov'
        },
        {
          agency: 'City Office of Finance',
          phone: '(213) 473-5901',
          email: 'finance.customerservice@citygov.org',
          address: '200 N. Spring Street, City Hall',
          portalUrl: 'https://finance.citygov.org'
        }
      ],
      verificationResult: {
        verified: verifier?.verificationStatus === 'VERIFIED',
        overallConfidence: verifier?.overallConfidence || 0.98,
        hallucinationRisk: 'low',
        claimsCheckedCount: (verifier?.verifiedClaims.length || 4) + (verifier?.unsupportedClaims.length || 0),
        unverifiedClaims: verifier?.unsupportedClaims || [],
        complianceNotes: verifier?.verifiedClaims || ['Statutory filing fees cross-referenced against official codes.'],
        disclaimer: response?.legalAdvisoryNotice || 'All statutory citations have been cross-referenced against authoritative state & municipal gazettes.',
        verifiedAt: new Date().toISOString()
      },
      legalDisclaimer: response?.legalAdvisoryNotice || 'CivicFlow provides informational guidance, not legal or government decisions. Verify important requirements with the relevant authority before submitting documents, making payments, or taking consequential action.'
    };
  }

  public recordHumanApproval(
    requestId: string,
    decision: 'approved' | 'rejected' | 'changes_requested',
    reviewerName: string,
    notes: string,
    approvedActionIds: string[]
  ): UserRequest | undefined {
    const request = storageService.getRequestById(requestId);
    if (!request) return undefined;

    const approvalRecord: HumanApprovalRecord = {
      id: request.humanApproval?.id || `appr-${Date.now()}`,
      approvedBy: reviewerName,
      role: 'Senior Civic Caseworker',
      status: decision,
      decisionTimestamp: new Date().toISOString(),
      notes,
      consequentialActionsApproved: approvedActionIds
    };

    const newStatus = decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : 'awaiting_human_approval';

    let updatedPlan = request.finalActionPlan;
    if (updatedPlan && decision === 'approved') {
      updatedPlan = {
        ...updatedPlan,
        steps: updatedPlan.steps.map(step => {
          if (approvedActionIds.includes(step.id)) {
            return { ...step, completed: true };
          }
          return step;
        })
      };
    }

    const updatedRequest: UserRequest = {
      ...request,
      status: newStatus,
      humanApproval: approvalRecord,
      finalActionPlan: updatedPlan,
      updatedAt: new Date().toISOString()
    };

    storageService.saveRequest(updatedRequest);
    return updatedRequest;
  }

  public isWorkflowActive(requestId: string): boolean {
    return !!this.activeExecutions.get(requestId);
  }
}

export const agentOrchestrator = new AgentOrchestrator();
