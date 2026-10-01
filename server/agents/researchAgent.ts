import { Agent, AgentContext, ResearchInput, ResearchOutput } from '../../src/types/agentEngine';
import { geminiService } from '../gemini/client';

export class ResearchAgent implements Agent<ResearchInput, ResearchOutput> {
  public id = 'research_agent' as const;
  public name = 'Statutory Research & Policy Agent';
  public purpose = 'Determines statutory factual requirements, flags potentially outdated information, and identifies claims requiring verification.';

  public systemInstructions = `You are the CivicFlow Research Agent.
Your responsibility:
1. Determine what official facts and statutes are required to solve the citizen request.
2. Identify areas where regulations or fee schedules may be outdated or locally variable.
3. Identify which claims must strictly be verified by authoritative RAG gazettes before advising the citizen.
4. Output discrete research tasks.
CRITICAL: Never present model internal memory as verified official government truth. Flag all unverified claims as needing verification.`;

  public async execute(input: ResearchInput, context: AgentContext): Promise<ResearchOutput> {
    const intake = input.normalizedRequest;
    const workflow = input.selectedWorkflow;

    const fallbackGenerator = (): ResearchOutput => {
      if (workflow === 'Business Registration') {
        return {
          factualRequirements: [
            'State entity formation statute and mandatory Articles of Organization filing rules',
            'Federal Employer Identification Number (EIN) issuance protocol and cost',
            'County Fictitious Business Name (DBA) registration and legal publication requirements',
            'Municipal Business Tax Registration Certificate (BTRC) base fees and deadlines'
          ],
          potentiallyOutdatedInformation: [
            'Annual Franchise Tax minimum exemption years',
            'Local municipal gross receipt brackets and tax exemption caps',
            'Newspaper publication legal ad rates'
          ],
          claimsRequiringVerification: [
            'Statutory state filing fee amount for Articles of Organization',
            'Mandatory timeline for filing Form LLC-12 Statement of Information',
            'County clerk DBA filing fees'
          ],
          researchTasks: [
            'Retrieve State Corporation Code section on LLC formation',
            'Retrieve IRS rules regarding official EIN fees',
            'Retrieve County Business & Professions Code for FBN publication',
            'Retrieve Municipal Code Title 5 for Business Tax Registration'
          ]
        };
      }

      return {
        factualRequirements: [
          `Governing statutory framework for ${workflow}`,
          'Official eligibility prerequisites and documentation requirements',
          'Official application deadline and agency filing channels'
        ],
        potentiallyOutdatedInformation: [
          'Current fiscal year application deadlines',
          'Income threshold requirements'
        ],
        claimsRequiringVerification: [
          'Mandatory residency requirements',
          'Official filing fee schedules'
        ],
        researchTasks: [
          `Query gazettes for ${workflow} administrative codes`,
          'Check agency contact directory and authorized application portal'
        ]
      };
    };

    const userPrompt = `Workflow: ${workflow}
Citizen Query: "${intake.userGoal}"
Jurisdiction: ${intake.location.city}, ${intake.location.state}
Known Information: ${JSON.stringify(intake.knownInformation)}
Missing Information: ${JSON.stringify(intake.missingInformation)}

Output Schema:
{
  "factualRequirements": string[],
  "potentiallyOutdatedInformation": string[],
  "claimsRequiringVerification": string[],
  "researchTasks": string[]
}`;

    const result = await geminiService.callStructured<ResearchOutput>({
      systemPrompt: this.systemInstructions,
      userPrompt,
      temperature: 0.1,
      fallbackGenerator,
      schemaValidator: (d: any): d is ResearchOutput => {
        return (
          Array.isArray(d?.factualRequirements) &&
          Array.isArray(d?.potentiallyOutdatedInformation) &&
          Array.isArray(d?.claimsRequiringVerification) &&
          Array.isArray(d?.researchTasks)
        );
      }
    });

    return result.data;
  }
}

export const researchAgent = new ResearchAgent();
