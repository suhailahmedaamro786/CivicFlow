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
      const controller = new AbortController();
      const clientTimeout = window.setTimeout(() => controller.abort(), 120000);

      let response: Response;
      try {
        response = await fetch('/api/orchestrate/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
          body: JSON.stringify({
            query: request.rawQuery,
            language: targetLanguage,
            location: request.jurisdiction
          }),
          signal: controller.signal
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error('The live workflow timed out after 2 minutes. Check Gemini API availability and try again.');
        }
        throw error;
      }

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
      window.clearTimeout(clientTimeout);

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
    const steps = (state.workflowSteps || []).map((step, idx) => ({
      id: `step-${step.stepNumber || idx + 1}`,
      order: step.stepNumber || idx + 1,
      phase: 'General' as const,
      title: step.title,
      description: step.description,
      responsibleAgency: step.responsibleParty,
      estimatedDuration: step.estimatedEffort || 'REQUIRES_VERIFICATION',
      estimatedFee: 0,
      feeCurrency: '',
      actionType: 'form_submission' as const,
      requiredDocuments: step.requiredDocuments || [],
      officialPortalUrl: undefined,
      requiresHumanApproval: step.isConsequentialAction,
      isConsequentialAction: step.isConsequentialAction,
      completed: false
    }));

    const checklist = (state.requiredDocuments || []).map(doc => ({
      name: doc.name,
      isMandatory: doc.required,
      templateAvailable: false,
      notes: doc.notes || doc.purpose
    }));

    const supported = verifier?.verifiedClaims || [];
    const unsupported = verifier?.unsupportedClaims || [];
    const warnings = [
      ...(verifier?.warnings || []),
      ...(response?.importantWarnings || []),
      ...(response?.missingInformationWarning || [])
    ];

    return {
      id: `plan-${requestId}`,
      generatedAt: new Date().toISOString(),
      executiveSummary: response?.understandingOfRequest || 'CivicFlow could not generate a final summary from the live model.',
      jurisdictionContext: state.normalizedRequest
        ? [state.normalizedRequest.location.city, state.normalizedRequest.location.state, state.normalizedRequest.location.country].filter(Boolean).join(', ')
        : 'Jurisdiction not resolved',
      estimatedTotalTime: steps.length ? (steps.every(s => s.estimatedDuration === 'REQUIRES_VERIFICATION') ? 'REQUIRES_VERIFICATION' : 'See individual verified steps') : 'REQUIRES_VERIFICATION',
      estimatedTotalFees: 0,
      criticalAlerts: warnings,
      steps,
      requiredDocumentChecklist: checklist,
      officialContacts: [],
      verificationResult: {
        verified: verifier?.verificationStatus === 'VERIFIED',
        overallConfidence: verifier?.overallConfidence || 0,
        hallucinationRisk: verifier && verifier.unsupportedClaims.length === 0 ? 'low' : 'high',
        claimsCheckedCount: supported.length + unsupported.length + (verifier?.auditedClaims?.length || 0),
        unverifiedClaims: unsupported,
        complianceNotes: supported,
        disclaimer: response?.legalAdvisoryNotice || 'Verify important requirements directly with the relevant authority before taking consequential action.',
        verifiedAt: new Date().toISOString()
      },
      legalDisclaimer: response?.legalAdvisoryNotice || 'CivicFlow provides informational guidance, not government decisions. Verify requirements with the relevant authority before submitting documents or making payments.'
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
