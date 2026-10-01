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
      if (workflow === 'Business Registration') {
        const steps: WorkflowStepItem[] = [
          {
            stepNumber: 1,
            title: 'File Articles of Organization (Form LLC-1)',
            description: 'Submit Form LLC-1 with the Secretary of State to formally create the limited liability company. Name an in-state registered agent.',
            requiredDocuments: ['Articles of Organization (Form LLC-1)'],
            responsibleParty: 'Secretary of State (Division of Corporations)',
            estimatedEffort: '3-5 business days (electronic)',
            source: 'State Corp. Code § 17702.01',
            verificationRequired: false,
            isConsequentialAction: true // Incurs $70 non-refundable fee & establishes entity liability
          },
          {
            stepNumber: 2,
            title: 'Obtain Federal Employer Identification Number (EIN)',
            description: 'Apply for the official 9-digit Federal Tax ID via the IRS online portal. Free government service ($0.00).',
            requiredDocuments: ['Principal Officer SSN or ITIN', 'Form LLC-1 Filing Confirmation'],
            responsibleParty: 'Internal Revenue Service (IRS)',
            estimatedEffort: 'Immediate (online portal)',
            source: '26 U.S.C. § 6109',
            verificationRequired: false,
            isConsequentialAction: false
          },
          {
            stepNumber: 3,
            title: 'Register Fictitious Business Name (DBA) & Publish',
            description: 'If operating under a trade name differing from the LLC name, file with the County Clerk and publish in an adjudicated local newspaper for 4 consecutive weeks.',
            requiredDocuments: ['Fictitious Business Name Statement (Form FBN-100)'],
            responsibleParty: 'County Clerk-Recorder',
            estimatedEffort: 'Filing: 1-2 days; Publication: 4 consecutive weeks',
            source: 'Bus. & Prof. Code § 17900',
            verificationRequired: true,
            isConsequentialAction: true // Newspaper publication contract commitment
          },
          {
            stepNumber: 4,
            title: 'Secure Municipal Business Tax Registration Certificate (BTRC)',
            description: 'Register with the municipal Office of Finance within 30 days of commencing operations. File Home Occupation affidavit if operating from residential premises.',
            requiredDocuments: ['Municipal BTRC Application', 'EIN Confirmation Letter (CP 575)'],
            responsibleParty: 'City Office of Finance & Revenue',
            estimatedEffort: '5-7 business days',
            source: 'Mun. Code Title 5 Chapter 5.04.010',
            verificationRequired: false,
            isConsequentialAction: false
          }
        ];

        return {
          steps,
          consequentialStepsCount: steps.filter(s => s.isConsequentialAction).length,
          criticalDependencies: [
            'Step 1 (State Formation) must precede Step 2 (EIN)',
            'Step 1 & Step 2 must be completed before commercial bank account opening',
            'Step 4 must be completed within 30 days of commencing commercial operations'
          ]
        };
      }

      const defaultSteps: WorkflowStepItem[] = [
        {
          stepNumber: 1,
          title: `Submit Initial Intake Application for ${workflow}`,
          description: 'Deliver verified identity and eligibility proof to the governing department.',
          requiredDocuments: ['Government Photo ID', 'Proof of Residency'],
          responsibleParty: 'Department of Public Administration',
          estimatedEffort: 'REQUIRES_VERIFICATION',
          source: 'Municipal Administrative Procedure',
          verificationRequired: true,
          isConsequentialAction: true
        }
      ];

      return {
        steps: defaultSteps,
        consequentialStepsCount: 1,
        criticalDependencies: ['Requires caseworker intake review']
      };
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
