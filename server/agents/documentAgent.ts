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
      if (workflow === 'Business Registration') {
        const docs: DocumentItem[] = [
          {
            name: 'Articles of Organization (Form LLC-1)',
            purpose: 'Official registration of LLC with State Secretary of State',
            required: true,
            status: 'MISSING',
            notes: 'Must designate in-state Registered Agent with physical street address. Statutory filing fee: $70.',
            source: 'State Corp. Code § 17702.01'
          },
          {
            name: 'Application for Employer Identification Number (IRS Form SS-4)',
            purpose: 'Federal tax identifier for commercial banking and tax compliance',
            required: true,
            status: 'MISSING',
            notes: 'Free online government service ($0.00). Do not pay third-party brokers.',
            source: '26 U.S.C. § 6109'
          },
          {
            name: 'Fictitious Business Name Statement (Form FBN-100)',
            purpose: 'County filing if operating under a trade name different from legal name',
            required: false,
            status: 'UNKNOWN',
            notes: 'Required if commercial DBA is utilized. Requires 4-week legal newspaper publication ($26 base fee).',
            source: 'Bus. & Prof. Code § 17900'
          },
          {
            name: 'Business Tax Registration Certificate (BTRC) Application',
            purpose: 'Municipal authorization to carry on trade within city jurisdiction',
            required: true,
            status: 'MISSING',
            notes: 'Must be submitted within 30 days of commercial operations ($50 base fee).',
            source: 'Mun. Code Title 5 Chapter 5.04'
          },
          {
            name: 'Statement of Information (Form LLC-12)',
            purpose: 'Periodic statutory disclosure of corporate managers/members',
            required: true,
            status: 'NOT_REQUIRED',
            notes: 'Mandatory within 90 days after formation ($20 fee). Not required on initial day 1.',
            source: 'State Corp. Code § 17702.04'
          }
        ];

        return {
          documents: docs,
          missingMandatoryCount: docs.filter(d => d.required && d.status === 'MISSING').length,
          instructions: 'Prepare mandatory state and federal forms first before applying for municipal certificates.'
        };
      }

      const defaultDocs: DocumentItem[] = [
        {
          name: 'Government-Issued Photo ID (Driver License or Passport)',
          purpose: 'Proof of applicant legal identity',
          required: true,
          status: 'MISSING',
          notes: 'Must be current and unexpired',
          source: 'Standard Statutory Intake Requirement'
        },
        {
          name: 'Proof of Jurisdiction Residency',
          purpose: 'Demonstrate qualification within municipal or state boundaries',
          required: true,
          status: 'MISSING',
          notes: 'Utility bill, lease agreement, or mortgage deed',
          source: 'Administrative Code Prerequisite'
        }
      ];

      return {
        documents: defaultDocs,
        missingMandatoryCount: 2,
        instructions: 'Assemble certified identity and residency records.'
      };
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
