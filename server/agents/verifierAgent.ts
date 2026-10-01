import { Agent, AgentContext, VerifierInput, VerifierOutput, ClaimAuditItem, VerificationStatus } from '../../src/types/agentEngine';
import { geminiService } from '../gemini/client';

export class VerifierAgent implements Agent<VerifierInput, VerifierOutput> {
  public id = 'verifier_agent' as const;
  public name = 'Fact-Check & Hallucination Verifier';
  public purpose = 'Strictly cross-checks every legal claim, fee amount, and deadline against official gazette sources, identifying unsupported claims and contradictions.';

  public systemInstructions = `You are the CivicFlow Verifier Agent.
Your job is adversarial audit:
1. Inspect every proposed action step, requirement, and fee against the provided official gazette sources.
2. For each factual claim, assess if it is strictly SUPPORTED by the text.
3. If an agent hallucinated a fee, a statutory deadline, or an agency name not in the sources, flag it as UNSUPPORTED.
4. If contradictions exist, flag them immediately.
5. Compute overall confidence: 0.95+ if all claims are verified; lower if claims lack official attribution.
6. Provide recommended corrections for any ungrounded items.`;

  public async execute(input: VerifierInput, context: AgentContext): Promise<VerifierOutput> {
    const steps = input.steps;
    const documents = input.documents;
    const sources = input.retrievedSources;

    const fallbackGenerator = (): VerifierOutput => {
      throw new Error('Live model output is unavailable. CivicFlow will not substitute demo civic data.');
    };

    const userPrompt = `Steps to audit:
${JSON.stringify(steps.map(s => ({ step: s.stepNumber, title: s.title, desc: s.description, source: s.source })))}

Documents to audit:
${JSON.stringify(documents.map(d => ({ name: d.name, source: d.source, notes: d.notes })))}

Authoritative Legal Gazettes:
${sources.map(s => `[Source: ${s.source}]: ${s.chunk}`).join('\n\n')}

Output Schema:
{
  "verificationStatus": "VERIFIED" | "PARTIALLY_VERIFIED" | "FLAGGED",
  "verifiedClaims": string[],
  "unsupportedClaims": string[],
  "warnings": string[],
  "recommendedCorrections": string[],
  "auditedClaims": [
    {
      "claim": string,
      "supportingSource": string,
      "isSupported": boolean,
      "contradictions": string[],
      "uncertainty": string
    }
  ],
  "overallConfidence": number (between 0.0 and 1.0)
}`;

    const result = await geminiService.callStructured<VerifierOutput>({
      systemPrompt: this.systemInstructions,
      userPrompt,
      temperature: 0.0, // Strictly deterministic for auditing
      fallbackGenerator,
      schemaValidator: (d: any): d is VerifierOutput => {
        return (
          ['VERIFIED', 'PARTIALLY_VERIFIED', 'UNVERIFIED', 'FLAGGED', 'SUPPORTED', 'PARTIALLY_SUPPORTED'].includes(d?.verificationStatus) &&
          Array.isArray(d?.verifiedClaims) &&
          Array.isArray(d?.unsupportedClaims) &&
          Array.isArray(d?.warnings) &&
          Array.isArray(d?.auditedClaims) &&
          typeof d?.overallConfidence === 'number'
        );
      }
    });

    const out = result.data;
    if ((out.verificationStatus as string) === 'SUPPORTED') {
      out.verificationStatus = 'VERIFIED';
    } else if ((out.verificationStatus as string) === 'PARTIALLY_SUPPORTED') {
      out.verificationStatus = 'PARTIALLY_VERIFIED';
    }

    return out;
  }
}

export const verifierAgent = new VerifierAgent();
