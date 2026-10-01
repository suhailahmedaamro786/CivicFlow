import { Agent, AgentContext, RouterInput, RouterOutput, WorkflowRoute, AgentRole } from '../../src/types/agentEngine';
import { geminiService } from '../gemini/client';

export class RouterAgent implements Agent<RouterInput, RouterOutput> {
  public id = 'router_agent' as const;
  public name = 'Administrative Workflow Router';
  public purpose = 'Selects the authoritative service workflow and maps required sequential downstream agents without exposing private chain-of-thought.';

  public systemInstructions = `You are the CivicFlow Router Agent.
Your job is to match the normalized citizen intake request to one of the supported core MVP administrative workflows:
- "Business Registration"
- "Education/Scholarship"
- "Employment/Application"

Return a concise reasoningSummary (max 2 sentences) describing why this route was selected. Never expose internal thoughts.`;

  public async execute(input: RouterInput, context: AgentContext): Promise<RouterOutput> {
    const intake = input.normalizedRequest;

    const fallbackGenerator = (): RouterOutput => {
      const cat = intake.serviceCategory;
      let workflow: WorkflowRoute = 'Business Registration';
      if (cat.includes('Education') || cat.includes('Scholarship')) {
        workflow = 'Education/Scholarship';
      } else if (cat.includes('Employment') || cat.includes('Job')) {
        workflow = 'Employment/Application';
      }

      const defaultAgents: AgentRole[] = [
        'research_agent',
        'rag_agent',
        'eligibility_agent',
        'document_agent',
        'workflow_agent',
        'verifier_agent',
        'response_agent'
      ];

      return {
        selectedWorkflow: workflow,
        reasoningSummary: `Citizen inquiry mapped to ${workflow} based on declared goal and administrative category.`,
        requiredAgents: defaultAgents
      };
    };

    const userPrompt = `Normalized Request:
Category: ${intake.serviceCategory}
Intent: ${intake.intent}
User Goal: ${intake.userGoal}

Supported Workflows:
- "Business Registration"
- "Education/Scholarship"
- "Employment/Application"

Output Schema:
{
  "selectedWorkflow": "Business Registration" | "Education/Scholarship" | "Employment/Application",
  "reasoningSummary": string (concise explanation, max 2 sentences),
  "requiredAgents": ["research_agent", "rag_agent", "eligibility_agent", "document_agent", "workflow_agent", "verifier_agent", "response_agent"]
}`;

    const result = await geminiService.callStructured<RouterOutput>({
      systemPrompt: this.systemInstructions,
      userPrompt,
      temperature: 0.1,
      fallbackGenerator,
      schemaValidator: (d: any): d is RouterOutput => {
        return (
          typeof d?.selectedWorkflow === 'string' &&
          typeof d?.reasoningSummary === 'string' &&
          Array.isArray(d?.requiredAgents)
        );
      }
    });

    return result.data;
  }
}

export const routerAgent = new RouterAgent();
