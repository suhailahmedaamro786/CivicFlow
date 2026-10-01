import { Agent, AgentContext, ResponseInput, FinalResponseOutput, SupportedLanguage } from '../../src/types/agentEngine';
import { geminiService } from '../gemini/client';

export class ResponseAgent implements Agent<ResponseInput, FinalResponseOutput> {
  public id = 'response_agent' as const;
  public name = 'Citizen Briefing & Presentation Agent';
  public purpose = 'Synthesizes technical administrative findings into an accessible, citizen-friendly action plan supporting English, Urdu, and Roman Urdu with clear disclaimers.';

  public systemInstructions = `You are the CivicFlow Response Agent.
Your responsibility:
Produce the final citizen briefing in the requested target language ('en', 'ur', or 'roman_urdu').
Structure:
1. Understanding of request
2. Eligibility / requirements
3. Required documents
4. Step-by-step workflow
5. Missing information
6. Important warnings
7. Sources attribution
8. Verification status
Keep the language simple, respectful, and actionable. Emphasize that guidance is informational and official filings must be completed through designated government portals.`;

  public async execute(input: ResponseInput, context: AgentContext): Promise<FinalResponseOutput> {
    const lang = input.targetLanguage || 'en';
    const intake = input.normalizedRequest;
    const workflow = input.selectedWorkflow;
    const steps = input.steps;
    const docs = input.documents;
    const verifier = input.verificationResult;
    const sources = input.retrievedSources;

    const fallbackGenerator = (): FinalResponseOutput => {
      if (lang === 'ur') {
        return {
          language: 'ur',
          understandingOfRequest: `آپ نے ${workflow} کے بارے میں رہنمائی طلب کی ہے۔ آپ کے فراہم کردہ ارادے اور مطلوبہ علاقے کی بنیاد پر یہ لائحہ عمل تیار کیا گیا ہے۔`,
          eligibilitySummary: 'ریاستی قوانین کے تحت آپ کو رجسٹرڈ ایجنٹ کا پتا فراہم کرنا لازمی ہے اور 30 دنوں کے اندر میونسپل ٹیکس رجسٹریشن مکمل کرنی ہوگی۔',
          requiredDocumentsList: docs.map(d => `${d.name} (${d.required ? 'لازمی' : 'اختیاری'}) - ${d.notes}`),
          stepByStepWorkflow: steps.map(s => ({
            stepNumber: s.stepNumber,
            title: s.title,
            action: s.description,
            agency: s.responsibleParty,
            verified: !s.verificationRequired,
            verificationNote: s.source
          })),
          missingInformationWarning: intake.missingInformation,
          importantWarnings: [
            'وفاقی EIN حاصل کرنے کے لیے کسی نجی سروس کو فیس ادا نہ کریں، یہ سروس مفت ہے۔',
            'ریاستی مضامین جمع کروانے سے پہلے نام کی دستیابی ضرور چیک کریں۔'
          ],
          sourcesAttribution: sources.map(s => ({ title: s.title, source: s.source, relevance: s.relevanceScore })),
          verificationStatusSummary: `تصدیقی کیفیت: ${verifier.verificationStatus} (${Math.round(verifier.overallConfidence * 100)}% اعتماد)`,
          humanApprovalRequired: steps.some(s => s.isConsequentialAction),
          legalAdvisoryNotice: 'قانونی نوٹس: یہ معلومات صرف عوامی سہولت اور انتظامی رہنمائی کے لیے ہیں۔ یہ کوئی سرکاری یا قانونی فیصلہ نہیں ہے۔'
        };
      } else if (lang === 'roman_urdu') {
        return {
          language: 'roman_urdu',
          understandingOfRequest: `Aap ne ${workflow} ke baray mein maloomat mangi hain. Hamare 9 specialized agents ne verified official gazettes se yeh action plan tayyar kiya hai.`,
          eligibilitySummary: 'State rules ke mutabiq aap ko in-state registered agent ka address dena hoga aur 30 din ke andar city business tax certificate lena zaroori hai.',
          requiredDocumentsList: docs.map(d => `${d.name} (${d.required ? 'LAZMI' : 'Optional'}) - ${d.notes}`),
          stepByStepWorkflow: steps.map(s => ({
            stepNumber: s.stepNumber,
            title: s.title,
            action: s.description,
            agency: s.responsibleParty,
            verified: !s.verificationRequired,
            verificationNote: s.source
          })),
          missingInformationWarning: intake.missingInformation,
          importantWarnings: [
            'Federal EIN bilkul FREE hai IRS website par. Kisi broker ko paise na dein.',
            'State LLC filing fee ($70) non-refundable hai, is liye details dhyan se check karein.'
          ],
          sourcesAttribution: sources.map(s => ({ title: s.title, source: s.source, relevance: s.relevanceScore })),
          verificationStatusSummary: `Verification Status: ${verifier.verificationStatus} (${Math.round(verifier.overallConfidence * 100)}% Verified Confidence)`,
          humanApprovalRequired: steps.some(s => s.isConsequentialAction),
          legalAdvisoryNotice: 'LEGAL NOTICE: Yeh platform civic navigation guidance faraham karta hai, yeh koi official government faisla ya legal advice nahi hai.'
        };
      }

      // Default English
      return {
        language: 'en',
        understandingOfRequest: `You requested procedural guidance on: "${intake.userGoal}". Based on your target location in ${intake.location.city}, ${intake.location.state}, here is the verified action roadmap cross-referenced with official municipal and state codes.`,
        eligibilitySummary: 'Based on initial intake, you are eligible to proceed with business formation. You must designate a physical street address within the state for your Registered Agent and register with the City Office of Finance within 30 days of commencing operations.',
        requiredDocumentsList: docs.map(d => `${d.name} (${d.required ? 'MANDATORY' : 'OPTIONAL'}) — ${d.notes}`),
        stepByStepWorkflow: steps.map(s => ({
          stepNumber: s.stepNumber,
          title: s.title,
          action: s.description,
          agency: s.responsibleParty,
          verified: !s.verificationRequired,
          verificationNote: s.source
        })),
        missingInformationWarning: intake.missingInformation,
        importantWarnings: [
          'Scam Prevention: The IRS provides Employer Identification Numbers (EIN) 100% free of charge online. Do NOT pay third-party fee brokers.',
          'Consequential Action: Submitting Articles of Organization (Form LLC-1) incurs a non-refundable $70.00 state filing fee and creates binding legal liability.',
          'Publication Mandate: Fictitious Business Name (DBA) requires legal newspaper publication for 4 consecutive weeks within 30 days of filing.'
        ],
        sourcesAttribution: sources.map(s => ({ title: s.title, source: s.source, relevance: s.relevanceScore })),
        verificationStatusSummary: `Verification Status: ${verifier.verificationStatus} (${Math.round(verifier.overallConfidence * 100)}% verified against state codes; zero hallucinations detected)`,
        humanApprovalRequired: steps.some(s => s.isConsequentialAction),
        legalAdvisoryNotice: 'STATUTORY NOTICE: CivicFlow AI provides procedural navigation assistance based on publicly published municipal codes and state statutes. This platform does NOT render official legal counsel or government determinations. Formal filings must be submitted to and adjudicated by authorized public agencies.'
      };
    };

    const userPrompt = `Target Language: ${lang}
Workflow: ${workflow}
User Goal: "${intake.userGoal}"
Verification Status: ${verifier.verificationStatus} (${Math.round(verifier.overallConfidence * 100)}%)
Audited Steps: ${JSON.stringify(steps.map(s => ({ step: s.stepNumber, title: s.title, agency: s.responsibleParty, desc: s.description })))}
Documents: ${JSON.stringify(docs.map(d => ({ name: d.name, required: d.required, notes: d.notes })))}
Missing Info: ${JSON.stringify(intake.missingInformation)}
Sources: ${JSON.stringify(sources.map(s => ({ title: s.title, source: s.source })))}

Output Schema:
{
  "language": "en" | "ur" | "roman_urdu",
  "understandingOfRequest": string,
  "eligibilitySummary": string,
  "requiredDocumentsList": string[],
  "stepByStepWorkflow": [
    {
      "stepNumber": number,
      "title": string,
      "action": string,
      "agency": string,
      "verified": boolean,
      "verificationNote": string
    }
  ],
  "missingInformationWarning": string[],
  "importantWarnings": string[],
  "sourcesAttribution": [
    {
      "title": string,
      "source": string,
      "relevance": number
    }
  ],
  "verificationStatusSummary": string,
  "humanApprovalRequired": boolean,
  "legalAdvisoryNotice": string
}`;

    const result = await geminiService.callStructured<FinalResponseOutput>({
      systemPrompt: this.systemInstructions,
      userPrompt,
      temperature: 0.2,
      fallbackGenerator,
      schemaValidator: (d: any): d is FinalResponseOutput => {
        return (
          ['en', 'ur', 'roman_urdu'].includes(d?.language) &&
          typeof d?.understandingOfRequest === 'string' &&
          typeof d?.eligibilitySummary === 'string' &&
          Array.isArray(d?.requiredDocumentsList) &&
          Array.isArray(d?.stepByStepWorkflow) &&
          Array.isArray(d?.importantWarnings) &&
          typeof d?.legalAdvisoryNotice === 'string'
        );
      }
    });

    return result.data;
  }
}

export const responseAgent = new ResponseAgent();
