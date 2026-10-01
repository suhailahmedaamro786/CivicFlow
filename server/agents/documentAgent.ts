import { Agent, AgentContext, DocumentInput, DocumentOutput, DocumentItem } from '../../src/types/agentEngine';
import { geminiService } from '../gemini/client';

export class DocumentAgent implements Agent<DocumentInput, DocumentOutput> {
  public id = 'document_agent' as const;
  public name = 'Statutory Document & Form Agent';
  public purpose = 'Compiles a verified document checklist with statuses (AVAILABLE, MISSING, UNKNOWN, NOT_REQUIRED) tied to official statutes.';

  public systemInstructions = `You are the CivicFlow Document Agent.
Your responsibility:
Generate a structured document checklist based strictly on the retrieved legal sources.
Each document must have:
- "name": Official form code and title (e.g. "Articles of Organization (Form LLC-1)")
- "purpose": Why this document is required by the agency
- "required": boolean
- "status": "AVAILABLE" | "MISSING" | "UNKNOWN" | "NOT_REQUIRED"
- "notes": Practical instructions (e.g. "Original physical address required")
- "source": Statutory source code reference (e.g. "Corp. Code § 17702.01")
DO NOT invent arbitrary ungrounded forms.`;

  public async execute(input: DocumentInput, context: AgentContext): Promise<DocumentOutput> {
    const workflow = input.selectedWorkflow;
    const sources = input.retrievedSources;

    const fallbackGenerator = (): DocumentOutput => {
      throw new Error('Live model output is unavailable. CivicFlow will not substitute demo civic data.');
    };

    const userPrompt = `Workflow: ${workflow}
Grounding Legal Sources:
${sources.map(s => `[${s.source}]: ${s.chunk}`).join('\n\n')}

Output Schema:
{
  "documents": [
    {
      "name": string,
      "purpose": string,
      "required": boolean,
      "status": "AVAILABLE" | "MISSING" | "UNKNOWN" | "NOT_REQUIRED",
      "notes": string,
      "source": string
    }
  ],
  "missingMandatoryCount": number,
  "instructions": string
}`;

    const result = await geminiService.callStructured<DocumentOutput>({
      systemPrompt: this.systemInstructions,
      userPrompt,
      temperature: 0.1,
      fallbackGenerator,
      schemaValidator: (d: any): d is DocumentOutput => {
        return (
          Array.isArray(d?.documents) &&
          d.documents.every((item: any) => 
            typeof item?.name === 'string' &&
            typeof item?.purpose === 'string' &&
            ['AVAILABLE', 'MISSING', 'UNKNOWN', 'NOT_REQUIRED'].includes(item?.status)
          )
        );
      }
    });

    return result.data;
  }
}

export const documentAgent = new DocumentAgent();
