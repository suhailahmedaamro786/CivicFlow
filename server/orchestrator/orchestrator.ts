import { 
  WorkflowState, 
  AgentRole, 
  SupportedLanguage, 
  AgentExecutionRecord,
  IntakeInput
} from '../../src/types/agentEngine';

import { intakeAgent } from '../agents/intakeAgent';
import { routerAgent } from '../agents/routerAgent';
import { researchAgent } from '../agents/researchAgent';
import { knowledgeRAGAgent } from '../agents/ragAgent';
import { eligibilityAgent } from '../agents/eligibilityAgent';
import { documentAgent } from '../agents/documentAgent';
import { workflowAgent } from '../agents/workflowAgent';
import { verifierAgent } from '../agents/verifierAgent';
import { responseAgent } from '../agents/responseAgent';

export type ProgressCallback = (
  agentId: AgentRole,
  status: 'running' | 'completed' | 'failed' | 'needs_verification',
  record: AgentExecutionRecord,
  state: WorkflowState
) => void;

export class AgentOrchestrator {
  /**
   * Initializes a pristine WorkflowState
   */
  public createInitialState(query: string, language: SupportedLanguage = 'en', locationHint?: any): WorkflowState {
    const id = `wf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    return {
      workflowId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      originalRequest: query,
      targetLanguage: language,
      isExecuting: false,
      retrievedSources: [],
      requiredDocuments: [],
      missingDocuments: [],
      workflowSteps: [],
      agentExecutions: [],
      errors: [],
      confidence: 1.0,
      humanApprovalRequired: false,
      locationHint
    } as WorkflowState & { locationHint?: IntakeInput['locationHint'] };
  }

  /**
   * Runs the complete sequential multi-agent pipeline
   */
  public async executePipeline(
    initialState: WorkflowState,
    onProgress?: ProgressCallback
  ): Promise<WorkflowState> {
    const state: WorkflowState = {
      ...initialState,
      isExecuting: true,
      updatedAt: new Date().toISOString()
    };

    const runAgentStep = async <TInput, TOutput>(
      agentId: AgentRole,
      agentName: string,
      fn: () => Promise<{ output: TOutput; summary: string; sources?: string[] }>
    ): Promise<TOutput> => {
      state.currentAgent = agentId;
      const startMs = Date.now();

      // Emit running event
      const pendingRecord: AgentExecutionRecord = {
        agentId,
        name: agentName,
        status: 'running',
        executionTimeMs: 0,
        shortSummary: `Agent ${agentName} executing...`,
        sourcesUsed: [],
        outputData: null,
        timestamp: new Date().toISOString()
      };
      onProgress?.(agentId, 'running', pendingRecord, state);

      try {
        // Never allow one external/model call to block the entire 9-agent workflow indefinitely.
        const timeoutMs = 15000;
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Agent ${agentName} timed out after ${timeoutMs / 1000}s.`)), timeoutMs)
        );
        const { output, summary, sources } = await Promise.race([fn(), timeout]);
        const duration = Date.now() - startMs;

        const record: AgentExecutionRecord = {
          agentId,
          name: agentName,
          status: 'completed',
          executionTimeMs: duration,
          shortSummary: summary,
          sourcesUsed: sources || [],
          outputData: output,
          timestamp: new Date().toISOString()
        };

        state.agentExecutions.push(record);
        state.updatedAt = new Date().toISOString();
        onProgress?.(agentId, 'completed', record, state);

        return output;
      } catch (err: any) {
        const duration = Date.now() - startMs;
        const errMsg = err?.message || 'Agent failed to complete task';

        const record: AgentExecutionRecord = {
          agentId,
          name: agentName,
          status: 'failed',
          executionTimeMs: duration,
          shortSummary: `Execution halted: ${errMsg}`,
          sourcesUsed: [],
          outputData: null,
          error: errMsg,
          timestamp: new Date().toISOString()
        };

        state.agentExecutions.push(record);
        state.errors.push({
          agentId,
          message: errMsg,
          timestamp: new Date().toISOString(),
          recoverable: true
        });
        state.updatedAt = new Date().toISOString();
        onProgress?.(agentId, 'failed', record, state);

        throw err;
      }
    };

    const agentCtx = {
      state,
      log: (msg: string) => console.log(`[Orchestrator] ${msg}`),
      language: state.targetLanguage
    };

    try {
      // 1. INTAKE AGENT
      const intakeInput: IntakeInput = {
        rawQuery: state.originalRequest,
        languageHint: state.targetLanguage,
        locationHint: (initialState as WorkflowState & { locationHint?: IntakeInput['locationHint'] }).locationHint
      };
      state.normalizedRequest = await runAgentStep('intake_agent', intakeAgent.name, async () => {
        const out = await intakeAgent.execute(intakeInput, agentCtx);
        return {
          output: out,
          summary: `Identified goal: "${out.userGoal}". Mapped to category: ${out.serviceCategory}. Missing info items: ${out.missingInformation.length}.`
        };
      });

      // 2. ROUTER AGENT
      state.detectedService = await runAgentStep('router_agent', routerAgent.name, async () => {
        const out = await routerAgent.execute({ normalizedRequest: state.normalizedRequest! }, agentCtx);
        return {
          output: out,
          summary: `Routed to: ${out.selectedWorkflow}. ${out.reasoningSummary}`
        };
      });

      // 3. RESEARCH AGENT & 4. KNOWLEDGE/RAG AGENT
      // Run Research Agent first to identify statutory needs
      state.researchResults = await runAgentStep('research_agent', researchAgent.name, async () => {
        const out = await researchAgent.execute({
          normalizedRequest: state.normalizedRequest!,
          selectedWorkflow: state.detectedService!.selectedWorkflow
        }, agentCtx);
        return {
          output: out,
          summary: `Generated ${out.researchTasks.length} statutory research tasks and ${out.claimsRequiringVerification.length} verification checkpoints.`
        };
      });

      // Run Knowledge/RAG Agent to query official vector gazettes
      const ragOutput = await runAgentStep('rag_agent', knowledgeRAGAgent.name, async () => {
        const out = await knowledgeRAGAgent.execute({
          normalizedRequest: state.normalizedRequest!,
          selectedWorkflow: state.detectedService!.selectedWorkflow,
          researchTasks: state.researchResults!.researchTasks
        }, agentCtx);
        return {
          output: out,
          summary: `Retrieved ${out.retrievedSources.length} official citations with coverage: ${out.coverageAssessment}.`,
          sources: out.retrievedSources.map(s => s.source)
        };
      });
      state.retrievedSources = ragOutput.retrievedSources;

      // 5. ELIGIBILITY AGENT
      state.eligibilityResult = await runAgentStep('eligibility_agent', eligibilityAgent.name, async () => {
        const out = await eligibilityAgent.execute({
          normalizedRequest: state.normalizedRequest!,
          selectedWorkflow: state.detectedService!.selectedWorkflow,
          retrievedSources: state.retrievedSources,
          researchResults: state.researchResults!
        }, agentCtx);
        return {
          output: out,
          summary: `Status: ${out.eligibilityStatus}. Known criteria: ${out.knownRequirements.length}, conditions: ${out.conditions.length}.`
        };
      });

      // 6. DOCUMENT AGENT
      const docOutput = await runAgentStep('document_agent', documentAgent.name, async () => {
        const out = await documentAgent.execute({
          normalizedRequest: state.normalizedRequest!,
          selectedWorkflow: state.detectedService!.selectedWorkflow,
          retrievedSources: state.retrievedSources,
          eligibilityResult: state.eligibilityResult!
        }, agentCtx);
        return {
          output: out,
          summary: `Compiled ${out.documents.length} official forms (${out.missingMandatoryCount} mandatory missing).`
        };
      });
      state.requiredDocuments = docOutput.documents.filter(d => d.required);
      state.missingDocuments = docOutput.documents.filter(d => d.status === 'MISSING');

      // 7. WORKFLOW AGENT
      const workflowOutput = await runAgentStep('workflow_agent', workflowAgent.name, async () => {
        const out = await workflowAgent.execute({
          normalizedRequest: state.normalizedRequest!,
          selectedWorkflow: state.detectedService!.selectedWorkflow,
          retrievedSources: state.retrievedSources,
          eligibilityResult: state.eligibilityResult!,
          documents: docOutput.documents
        }, agentCtx);
        return {
          output: out,
          summary: `Assembled ${out.steps.length} sequential action steps with ${out.consequentialStepsCount} consequential steps requiring human sign-off.`
        };
      });
      state.workflowSteps = workflowOutput.steps;

      // Check if any step requires human authorization
      if (workflowOutput.consequentialStepsCount > 0) {
        state.humanApprovalRequired = true;
        state.consequentialActionNotice = `Human approval required: Step includes non-refundable statutory filing fees or legally binding entity creation.`;
      }

      // 8. VERIFIER AGENT
      state.verificationResult = await runAgentStep('verifier_agent', verifierAgent.name, async () => {
        const out = await verifierAgent.execute({
          normalizedRequest: state.normalizedRequest!,
          selectedWorkflow: state.detectedService!.selectedWorkflow,
          retrievedSources: state.retrievedSources,
          eligibilityResult: state.eligibilityResult!,
          documents: docOutput.documents,
          steps: state.workflowSteps
        }, agentCtx);

        // Verification audit status
        const isVerified = out.verificationStatus === 'VERIFIED';
        return {
          output: out,
          summary: `Status: ${out.verificationStatus} (${Math.round(out.overallConfidence * 100)}% confidence). Verified claims: ${out.verifiedClaims.length}, Unsupported: ${out.unsupportedClaims.length}.`
        };
      });

      // Update state confidence
      state.confidence = state.verificationResult.overallConfidence;

      // 9. RESPONSE AGENT
      state.finalResponse = await runAgentStep('response_agent', responseAgent.name, async () => {
        const out = await responseAgent.execute({
          normalizedRequest: state.normalizedRequest!,
          selectedWorkflow: state.detectedService!.selectedWorkflow,
          eligibilityResult: state.eligibilityResult!,
          documents: docOutput.documents,
          steps: state.workflowSteps,
          verificationResult: state.verificationResult!,
          retrievedSources: state.retrievedSources,
          targetLanguage: state.targetLanguage
        }, agentCtx);
        return {
          output: out,
          summary: `Citizen action packet formulated in ${out.language.toUpperCase()} with ${out.stepByStepWorkflow.length} steps and official legal disclaimers.`
        };
      });

    } finally {
      state.isExecuting = false;
      state.currentAgent = undefined;
      state.updatedAt = new Date().toISOString();
    }

    return state;
  }
}

export const orchestrator = new AgentOrchestrator();
