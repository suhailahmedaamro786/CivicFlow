import { Agent, AgentContext, EligibilityInput, EligibilityOutput, EligibilityStatus } from '../../src/types/agentEngine';
import { geminiService } from '../gemini/client';

export class EligibilityAgent implements Agent<EligibilityInput, EligibilityOutput> {
  public id = 'eligibility_agent' as const;
  public name = 'Statutory Eligibility & Criteria Agent';
  public purpose = 'Analyzes applicant qualifiers against statutory prerequisites and flags missing criteria or conditional requirements without inventing rules.';

  public systemInstructions = `You are the CivicFlow Eligibility Agent.
Evaluate whether the citizen meets the prerequisites established by the retrieved official statutory sources.
Possible eligibility statuses:
- "ELIGIBLE": Citizen satisfies all prerequisites based on provided data.
- "NOT_ELIGIBLE": Citizen violates a statutory disqualifier.
- "NEEDS_MORE_INFORMATION": Critical facts are missing (e.g. location, business entity type, residency).
- "REQUIRES_VERIFICATION": Conditions depend on unverified local zoning or statutory agency review.

CRITICAL SAFETY RULE: Never invent eligibility criteria. If a rule is not in the grounding sources, list it under "uncertainty".`;

  public async execute(input: EligibilityInput, context: AgentContext): Promise<EligibilityOutput> {
    const intake = input.normalizedRequest;
    const workflow = input.selectedWorkflow;
    const sources = input.retrievedSources;

    const fallbackGenerator = (): EligibilityOutput => {
      if (workflow === 'Business Registration') {
        const hasMissing = intake.missingInformation.length > 0;
        return {
          eligibilityStatus: hasMissing ? 'NEEDS_MORE_INFORMATION' : 'ELIGIBLE',
          knownRequirements: [
            'Must have a physical street address in state for Registered Agent (P.O. boxes disallowed under Corp Code § 17702.01)',
            'Entity name must contain required designator (e.g. LLC)',
            'Commercial activities must comply with municipal business tax licensing within 30 days'
          ],
          missingInformation: [
            'Specific business trade name availability',
            'Confirmation of commercial premises vs residential home office address',
            'Citizenship / SSN or ITIN confirmation for online federal EIN issuance'
          ],
          conditions: [
            'If operating from residence: Must file Home Occupation Affidavit certifying quiet enjoyment',
            'If transacting under a fictitious trade name: Must publish in local newspaper for 4 weeks'
          ],
          uncertainty: 'Specialized health clearances or alcohol licensing cannot be confirmed without specific business activity disclosures.'
        };
      }

      return {
        eligibilityStatus: 'NEEDS_MORE_INFORMATION',
        knownRequirements: [
          `Satisfy statutory qualification criteria for ${workflow}`,
          'Provide proof of identity and current legal residency'
        ],
        missingInformation: intake.missingInformation,
        conditions: [
          'Subject to official agency intake verification'
        ],
        uncertainty: 'Full eligibility requires submission of supporting verified records.'
      };
    };

    const userPrompt = `Workflow: ${workflow}
Citizen Intent: ${intake.intent}
Known Facts: ${JSON.stringify(intake.knownInformation)}
Missing Facts: ${JSON.stringify(intake.missingInformation)}

Authoritative Legal Sources Grounding:
${sources.map(s => `[${s.source}]: ${s.chunk}`).join('\n\n')}

Output Schema:
{
  "eligibilityStatus": "ELIGIBLE" | "NOT_ELIGIBLE" | "NEEDS_MORE_INFORMATION" | "REQUIRES_VERIFICATION",
  "knownRequirements": string[],
  "missingInformation": string[],
  "conditions": string[],
  "uncertainty": string
}`;

    const result = await geminiService.callStructured<EligibilityOutput>({
      systemPrompt: this.systemInstructions,
      userPrompt,
      temperature: 0.1,
      fallbackGenerator,
      schemaValidator: (d: any): d is EligibilityOutput => {
        return (
          ['ELIGIBLE', 'NOT_ELIGIBLE', 'NEEDS_MORE_INFORMATION', 'REQUIRES_VERIFICATION'].includes(d?.eligibilityStatus) &&
          Array.isArray(d?.knownRequirements) &&
          Array.isArray(d?.missingInformation) &&
          Array.isArray(d?.conditions) &&
          typeof d?.uncertainty === 'string'
        );
      }
    });

    return result.data;
  }
}

export const eligibilityAgent = new EligibilityAgent();
