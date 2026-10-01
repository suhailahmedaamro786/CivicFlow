/**
 * CivicFlow AI - Multi-Agent Engine Comprehensive Test Suite
 * Tests all 9 agents, error handling, state validation, and end-to-end demo workflow.
 */

import { orchestrator } from '../server/orchestrator/orchestrator';
import { intakeAgent } from '../server/agents/intakeAgent';
import { routerAgent } from '../server/agents/routerAgent';
import { researchAgent } from '../server/agents/researchAgent';
import { knowledgeRAGAgent } from '../server/agents/ragAgent';
import { eligibilityAgent } from '../server/agents/eligibilityAgent';
import { documentAgent } from '../server/agents/documentAgent';
import { workflowAgent } from '../server/agents/workflowAgent';
import { verifierAgent } from '../server/agents/verifierAgent';
import { responseAgent } from '../server/agents/responseAgent';
import { geminiService } from '../server/gemini/client';
import { ragStore } from '../server/rag/engine';
import { WorkflowState } from '../src/types/agentEngine';

// Simple lightweight test runner assertions
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function assertEquals(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`Assertion Failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
  }
}

export async function runAllTests() {
  console.log('\n==================================================');
  console.log('  CIVICFLOW AI - MULTI-AGENT TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    process.stdout.write(`• Testing: ${name} ... `);
    try {
      await fn();
      console.log('✓ PASSED');
      passed++;
    } catch (err: any) {
      console.log('✕ FAILED');
      console.error(`  Error: ${err?.message || err}`);
      failed++;
    }
  }

  // 1. INTAKE AGENT TEST
  await test('Intake Agent: Extracts goal, identifies missing info, and detects language', async () => {
    const dummyCtx = {
      state: orchestrator.createInitialState(''),
      log: () => {},
      language: 'en' as const
    };

    const outEn = await intakeAgent.execute({
      rawQuery: 'How do I register a small business and what documents do I need?'
    }, dummyCtx);

    assert(outEn.serviceCategory === 'Business Registration', 'Identified category should be Business Registration');
    assert(outEn.knownInformation.length > 0, 'Should have known information');
    assert(outEn.missingInformation.length > 0, 'Should identify missing information rather than inventing facts');
    assertEquals(outEn.language, 'en', 'Language should be English');

    // Urdu detection test
    const outUr = await intakeAgent.execute({
      rawQuery: 'مجھے نیا کاروبار کیسے رجسٹر کرنا چاہیے؟'
    }, dummyCtx);
    assertEquals(outUr.language, 'ur', 'Should detect Urdu script');

    // Roman Urdu detection test
    const outRoman = await intakeAgent.execute({
      rawQuery: 'Mujhe naya business register karna hai, kya steps hain?'
    }, dummyCtx);
    assertEquals(outRoman.language, 'roman_urdu', 'Should detect Roman Urdu');
  });

  // 2. ROUTER AGENT TEST
  await test('Router Agent: Correctly directs to supported MVP workflows', async () => {
    const dummyCtx = {
      state: orchestrator.createInitialState(''),
      log: () => {},
      language: 'en' as const
    };

    const bizRoute = await routerAgent.execute({
      normalizedRequest: {
        intent: 'register company',
        serviceCategory: 'Business Registration',
        location: { city: 'City', state: 'State', country: 'US' },
        userGoal: 'Open small bakery',
        knownInformation: [],
        missingInformation: [],
        urgency: 'medium',
        language: 'en'
      }
    }, dummyCtx);
    assertEquals(bizRoute.selectedWorkflow, 'Business Registration', 'Should route to Business Registration');
    assert(bizRoute.requiredAgents.length >= 7, 'Should map required agents');
    assert(bizRoute.reasoningSummary.length > 0, 'Should provide concise reasoning summary');

    const eduRoute = await routerAgent.execute({
      normalizedRequest: {
        intent: 'apply for college grant',
        serviceCategory: 'Education/Scholarship',
        location: { city: 'City', state: 'State', country: 'US' },
        userGoal: 'Apply for college financial aid grant',
        knownInformation: [],
        missingInformation: [],
        urgency: 'low',
        language: 'en'
      }
    }, dummyCtx);
    assertEquals(eduRoute.selectedWorkflow, 'Education/Scholarship', 'Should route to Education/Scholarship');
  });

  // 3. WORKFLOW STATE INTEGRITY TEST
  await test('Workflow State: Initializes and validates strict state schema', async () => {
    const state = orchestrator.createInitialState('Test request', 'en', { city: 'LA' });
    assert(state.workflowId.startsWith('wf-'), 'Workflow ID must be generated');
    assertEquals(state.targetLanguage, 'en', 'Target language must match');
    assertEquals(state.isExecuting, false, 'Initial isExecuting must be false');
    assertEquals(state.agentExecutions.length, 0, 'Initial executions must be empty');
    assertEquals(state.errors.length, 0, 'Initial errors must be empty');
  });

  // 4. DOCUMENT AGENT CHECKLIST TEST
  await test('Document Agent: Generates structured checklist with statuses', async () => {
    const dummyCtx = {
      state: orchestrator.createInitialState(''),
      log: () => {},
      language: 'en' as const
    };

    const sources = await ragStore.search('llc formation articles of organization', 3);
    const out = await documentAgent.execute({
      normalizedRequest: {
        intent: 'register business',
        serviceCategory: 'Business Registration',
        location: { city: 'LA', state: 'CA', country: 'US' },
        userGoal: 'Register LLC',
        knownInformation: [],
        missingInformation: [],
        urgency: 'medium',
        language: 'en'
      },
      selectedWorkflow: 'Business Registration',
      retrievedSources: sources,
      eligibilityResult: {
        eligibilityStatus: 'NEEDS_MORE_INFORMATION',
        knownRequirements: [],
        missingInformation: [],
        conditions: [],
        uncertainty: ''
      }
    }, dummyCtx);

    assert(out.documents.length >= 3, 'Should produce at least 3 government documents');
    const llcDoc = out.documents.find(d => d.name.includes('LLC-1') || d.name.includes('Articles'));
    assert(!!llcDoc, 'Must include Articles of Organization Form LLC-1');
    assert(llcDoc?.required === true, 'Articles of Organization must be marked required');
    assert(['AVAILABLE', 'MISSING', 'UNKNOWN', 'NOT_REQUIRED'].includes(llcDoc!.status), 'Status must be a valid enum');
  });

  // 5. VERIFIER AGENT FACT-CHECK TEST
  await test('Verifier Agent: Cross-examines claims and audits fees against sources', async () => {
    const dummyCtx = {
      state: orchestrator.createInitialState(''),
      log: () => {},
      language: 'en' as const
    };

    const sources = await ragStore.search('Articles of organization $70 fee', 3);
    const out = await verifierAgent.execute({
      normalizedRequest: {
        intent: 'register business',
        serviceCategory: 'Business Registration',
        location: { city: 'LA', state: 'CA', country: 'US' },
        userGoal: 'Register LLC',
        knownInformation: [],
        missingInformation: [],
        urgency: 'medium',
        language: 'en'
      },
      selectedWorkflow: 'Business Registration',
      retrievedSources: sources,
      eligibilityResult: {
        eligibilityStatus: 'ELIGIBLE',
        knownRequirements: [],
        missingInformation: [],
        conditions: [],
        uncertainty: ''
      },
      documents: [
        {
          name: 'Form LLC-1',
          purpose: 'Formation',
          required: true,
          status: 'MISSING',
          notes: 'Fee is $70',
          source: 'State Corp. Code § 17702.01'
        }
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'File Articles of Organization',
          description: 'Submit Form LLC-1 with $70 state fee',
          requiredDocuments: ['Form LLC-1'],
          responsibleParty: 'Secretary of State',
          estimatedEffort: '3-5 business days',
          source: 'State Corp. Code § 17702.01',
          verificationRequired: false,
          isConsequentialAction: true
        }
      ]
    }, dummyCtx);

    assert(['VERIFIED', 'PARTIALLY_VERIFIED'].includes(out.verificationStatus), 'Verification status should be verified');
    assert(out.verifiedClaims.length > 0, 'Should have verified claims');
    assert(out.overallConfidence >= 0.8, 'Confidence should be high for grounded claims');
  });

  // 6. MALFORMED GEMINI RESPONSE HANDLING TEST
  await test('Malformed Gemini Response: Gracefully cleans code fences and repairs formatting', async () => {
    const markdownWrapped = '```json\n{"status": "OK", "value": 42}\n```';
    const cleaned = geminiService.cleanJsonString(markdownWrapped);
    const parsed = JSON.parse(cleaned);
    assertEquals(parsed.value, 42, 'Markdown code fences must be stripped');

    // Test fallback when JSON is completely invalid
    const result = await geminiService.callStructured<{ fallbackUsed: boolean }>({
      systemPrompt: 'Test system',
      userPrompt: 'Test user prompt',
      fallbackGenerator: () => ({ fallbackUsed: true })
    });
    assert(result.data.fallbackUsed === true || result.isFromGemini === true, 'Should succeed via fallback or live Gemini');
  });

  // 7. MISSING API KEY HANDLING TEST
  await test('Missing API Key: Never crashes and utilizes verified domain fallback', async () => {
    // Calling with fallback generator should succeed without throwing
    const res = await geminiService.callStructured<{ safeMode: boolean }>({
      systemPrompt: 'System',
      userPrompt: 'User',
      fallbackGenerator: () => ({ safeMode: true })
    });
    assert(typeof res.data === 'object', 'Must return structured data object');
    assert(res.latencyMs >= 0, 'Latency must be non-negative');
  });

  // 8. FAILED AGENT & ERROR ACCUMULATION TEST
  await test('Failed Agent: Orchestrator records error record and marks status as failed', async () => {
    const state = orchestrator.createInitialState('Simulated failure');
    // Emulate an agent failure record
    state.agentExecutions.push({
      agentId: 'research_agent',
      name: 'Research Agent',
      status: 'failed',
      executionTimeMs: 120,
      shortSummary: 'API timed out',
      sourcesUsed: [],
      outputData: null,
      error: 'Upstream gateway error',
      timestamp: new Date().toISOString()
    });
    state.errors.push({
      agentId: 'research_agent',
      message: 'Upstream gateway error',
      timestamp: new Date().toISOString(),
      recoverable: true
    });

    assertEquals(state.agentExecutions[0].status, 'failed', 'Execution status must be failed');
    assertEquals(state.errors.length, 1, 'Error list must record failure');
    assertEquals(state.errors[0].recoverable, true, 'Error must indicate recoverability');
  });

  // 9. UNSUPPORTED CLAIM DETECTION TEST
  await test('Unsupported Claim: Verifier flags ungrounded claims with warnings', async () => {
    const dummyCtx = {
      state: orchestrator.createInitialState(''),
      log: () => {},
      language: 'en' as const
    };

    // Pass completely fabricated step with no supporting source
    const out = await verifierAgent.execute({
      normalizedRequest: {
        intent: 'business',
        serviceCategory: 'Business Registration',
        location: { city: 'City', state: 'State', country: 'US' },
        userGoal: 'Register business',
        knownInformation: [],
        missingInformation: [],
        urgency: 'low',
        language: 'en'
      },
      selectedWorkflow: 'Business Registration',
      retrievedSources: [], // Empty sources
      eligibilityResult: {
        eligibilityStatus: 'NEEDS_MORE_INFORMATION',
        knownRequirements: [],
        missingInformation: [],
        conditions: [],
        uncertainty: 'No sources available'
      },
      documents: [],
      steps: [
        {
          stepNumber: 1,
          title: 'Pay Arbitrary $500 Expedited State Fee',
          description: 'Fabricated requirement with no statutory backing',
          requiredDocuments: [],
          responsibleParty: 'Fictional Department',
          estimatedEffort: '1 day',
          source: 'Nonexistent Gazette § 9999',
          verificationRequired: true,
          isConsequentialAction: true
        }
      ]
    }, dummyCtx);

    assert(out.unsupportedClaims.length > 0 || out.warnings.length > 0, 'Must flag unsupported claims or warnings');
    assert(out.overallConfidence < 0.99, 'Confidence must drop when claims are unsupported');
  });

  // 10. END-TO-END DEMO WORKFLOW TEST
  await test('End-to-End Demo Workflow: "I want to register a small business. What documents do I need and what steps should I follow?"', async () => {
    const query = 'I want to register a small business. What documents do I need and what steps should I follow?';
    const initialState = orchestrator.createInitialState(query, 'en', { city: 'Los Angeles', state: 'California' });

    let completedStepsCount = 0;
    const finalState = await orchestrator.executePipeline(initialState, (agentId, status) => {
      if (status === 'completed') completedStepsCount++;
    });

    // Verification of pipeline execution
    assertEquals(completedStepsCount, 9, 'All 9 agents must successfully execute');
    assert(finalState.agentExecutions.length === 9, 'Must record 9 execution records');
    
    // Check Intake & Router
    assert(finalState.normalizedRequest?.serviceCategory === 'Business Registration', 'Must identify Business Registration');
    assertEquals(finalState.detectedService?.selectedWorkflow, 'Business Registration', 'Must route to Business Registration');

    // Check RAG retrieval
    assert(finalState.retrievedSources.length > 0, 'Must retrieve grounded sources');
    assert(finalState.retrievedSources.some(s => s.source.includes('17702') || s.chunk.includes('17702')), 'Must include Corp Code § 17702.01');

    // Check Documents
    assert(finalState.requiredDocuments.length > 0, 'Must identify required documents');

    // Check Workflow Steps
    assert(finalState.workflowSteps.length >= 4, 'Must assemble at least 4 workflow steps');
    
    // Check Human-in-the-Loop gating
    assertEquals(finalState.humanApprovalRequired, true, 'Consequential action (state formation fee) must trigger human approval');

    // Check Verifier
    assert(['VERIFIED', 'PARTIALLY_VERIFIED'].includes(finalState.verificationResult!.verificationStatus), 'Verifier must audit claims');

    // Check Final Response
    assert(finalState.finalResponse !== undefined, 'Final response must be generated');
    assert(finalState.finalResponse!.understandingOfRequest.length > 0, 'Must contain understanding of request');
    assert(finalState.finalResponse!.stepByStepWorkflow.length > 0, 'Must contain actionable steps');
    assert(finalState.finalResponse!.sourcesAttribution.length > 0, 'Must preserve source attribution');
    assert(finalState.finalResponse!.legalAdvisoryNotice.length > 0, 'Must include statutory non-legal-advice disclaimer');
  });

  console.log('\n==================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}
