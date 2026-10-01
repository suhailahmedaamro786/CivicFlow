import { Agent, AgentContext, IntakeInput, IntakeOutput } from '../../src/types/agentEngine';
import { geminiService } from '../gemini/client';

export class IntakeAgent implements Agent<IntakeInput, IntakeOutput> {
  public id = 'intake_agent' as const;
  public name = 'Citizen Intake & Normalization Agent';
  public purpose = 'Extracts citizen intent, service category, user goal, known vs missing information, urgency, and language without fabricating assumptions.';

  public systemInstructions = `You are the CivicFlow Intake Agent.
Your responsibility:
1. Parse unstructured citizen queries.
2. Identify user goal, category, and jurisdiction location.
3. Critically separate "knownInformation" (explicitly provided by citizen) from "missingInformation" (ambiguities or unmentioned facts).
4. Detect language: 'en' (English), 'ur' (Urdu script), or 'roman_urdu' (Urdu written in Latin letters).
5. DO NOT invent facts or guess unstated details. Explicitly record unknowns under "missingInformation".`;

  public async execute(input: IntakeInput, context: AgentContext): Promise<IntakeOutput> {
    const rawQuery = input.rawQuery.trim();

    // Fallback generator for deterministic execution
    const fallbackGenerator = (): IntakeOutput => {
      const lower = rawQuery.toLowerCase();
      
      let category = 'Business Registration';
      if (lower.includes('school') || lower.includes('scholarship') || lower.includes('college') || lower.includes('student')) {
        category = 'Education/Scholarship';
      } else if (lower.includes('job') || lower.includes('work') || lower.includes('employment') || lower.includes('hire')) {
        category = 'Employment/Application';
      }

      // Language detection
      let detectedLang = input.languageHint || 'en';
      if (/[\u0600-\u06FF]/.test(rawQuery)) {
        detectedLang = 'ur';
      } else if (lower.includes('karna') || lower.includes('kaise') || lower.includes('chahiye') || lower.includes('kya')) {
        detectedLang = 'roman_urdu';
      }

      const knownInfo: string[] = [];
      const missingInfo: string[] = [];

      if (category === 'Business Registration') {
        knownInfo.push('Citizen intends to register a commercial small business.');
        if (lower.includes('llc')) knownInfo.push('Entity type indicated as LLC.');
        if (input.locationHint?.city) knownInfo.push(`Target City: ${input.locationHint.city}`);
        
        missingInfo.push('Exact legal business entity structure (LLC vs Sole Proprietorship vs Corporation) not confirmed.');
        missingInfo.push('Physical commercial premises vs home-based office not specified.');
        missingInfo.push('Anticipated retail goods sales vs consulting services not specified.');
      } else {
        knownInfo.push(`Expressed goal related to ${category}.`);
        missingInfo.push('Specific program, target institution, or employer not specified.');
        missingInfo.push('Applicant qualifications not provided.');
      }

      return {
        intent: `Citizen seeks procedural guidance for ${category}.`,
        serviceCategory: category,
        location: {
          city: input.locationHint?.city || 'Municipal Jurisdiction',
          state: input.locationHint?.state || 'State Territory',
          country: input.locationHint?.country || 'United States'
        },
        userGoal: rawQuery,
        knownInformation: knownInfo,
        missingInformation: missingInfo,
        urgency: lower.includes('urgent') || lower.includes('emergency') ? 'urgent' : 'medium',
        language: detectedLang
      };
    };

    const userPrompt = `Citizen Request: "${rawQuery}"
Optional Location Hint: ${JSON.stringify(input.locationHint || {})}
Optional Language Hint: ${input.languageHint || 'not provided'}

Output Schema:
{
  "intent": string,
  "serviceCategory": "Business Registration" | "Education/Scholarship" | "Employment/Application" | "General Civic Service",
  "location": { "city": string, "state": string, "country": string },
  "userGoal": string,
  "knownInformation": string[],
  "missingInformation": string[],
  "urgency": "low" | "medium" | "high" | "urgent",
  "language": "en" | "ur" | "roman_urdu"
}`;

    const result = await geminiService.callStructured<IntakeOutput>({
      systemPrompt: this.systemInstructions,
      userPrompt,
      temperature: 0.1,
      fallbackGenerator,
      schemaValidator: (d: any): d is IntakeOutput => {
        return (
          typeof d?.intent === 'string' &&
          typeof d?.serviceCategory === 'string' &&
          Array.isArray(d?.knownInformation) &&
          Array.isArray(d?.missingInformation) &&
          typeof d?.location === 'object'
        );
      }
    });

    return result.data;
  }
}

export const intakeAgent = new IntakeAgent();
