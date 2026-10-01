import { Agent, AgentContext, WorkflowInput, WorkflowOutput, WorkflowStepItem } from '../../src/types/agentEngine';
import { geminiService } from '../gemini/client';

export class WorkflowAgent implements Agent<WorkflowInput, WorkflowOutput> {
  public id = 'workflow_agent' as const;
  public name = 'Action Plan & Workflow Sequencer';
  public purpose = 'Sequences chronological actionable steps, attaches responsible agencies, and flags consequential steps that incur legal liability or non-refundable fees.';

  public systemInstructions = `You are the CivicFlow Workflow Sequencer Agent.
Construct an actionable step-by-step roadmap grounded strictly in the verified legal gazettes.
Each step must specify:
- "stepNumber": integer
- "title": concise action title
- "description": clear procedural instruction
- "requiredDocuments": list of document names needed for this step
- "responsibleParty": Government agency or department
- "estimatedEffort": statutory timeline if stated in source, otherwise strictly "REQUIRES_VERIFICATION"
- "source": authoritative statute or ordinance
- "verificationRequired": true if any detail is conditional or requires local clerk confirmation
- "isConsequentialAction": true if step submits an irrevocable application, incurs a statutory fee, or establishes legal entity liability.

SAFETY RULE: Never invent government fees, deadlines, URLs, or addresses. If unverified, mark estimatedEffort as "REQUIRES_VERIFICATION".`;

  public async execute(input: WorkflowInput, context: AgentContext): Promise<WorkflowOutput> {
    const workflow = input.selectedWorkflow;
    const sources = input.retrievedSources;

    const fallbackGenerator = (): WorkflowOutput => {
      throw new Error('Live model output is unavailable. CivicFlow will not substitute demo civic data.');
    };

    const userPrompt = `Workflow: ${workflow}
Retrieved Grounding Sources:
${sources.map(s => `[${s.source}]: ${s.chunk}`).join('\n\n')}

Output Schema:
{
  "steps": [
    {
      "stepNumber": number,
      "title": string,
      "description": string,
      "requiredDocuments": string[],
      "responsibleParty": string,
      "estimatedEffort": string (or "REQUIRES_VERIFICATION"),
      "source": string,
      "verificationRequired": boolean,
      "isConsequentialAction": boolean
    }
  ],
  "consequentialStepsCount": number,
  "criticalDependencies": string[]
}`;

    const result = await geminiService.callStructured<WorkflowOutput>({
      systemPrompt: this.systemInstructions,
      userPrompt,
      temperature: 0.1,
      fallbackGenerator,
      schemaValidator: (d: any): d is WorkflowOutput => {
        return (
          Array.isArray(d?.steps) &&
          d.steps.every((s: any) => 
            typeof s?.stepNumber === 'number' &&
            typeof s?.title === 'string' &&
            typeof s?.description === 'string' &&
            typeof s?.source === 'string'
          )
        );
      }
    });

    return result.data;
  }
}

export const workflowAgent = new WorkflowAgent();
