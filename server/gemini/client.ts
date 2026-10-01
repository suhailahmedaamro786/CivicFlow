import { GoogleGenAI } from '@google/genai';
import { GEMINI_CONFIG } from './config';

export interface GeminiCallParams<T> {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  schemaValidator?: (data: any) => data is T;
  fallbackGenerator?: () => T;
}

export interface GeminiCallResult<T> {
  data: T;
  latencyMs: number;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  isFromGemini: boolean;
  rawText?: string;
  warnings?: string[];
}

export class GeminiService {
  private client: GoogleGenAI | null = null;
  private apiKeyConfigured = false;
  private quotaExhaustedUntil = 0;

  constructor() {
    this.initClient();
  }

  private initClient() {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY' && key.trim().length > 0) {
      try {
        this.client = new GoogleGenAI({ apiKey: key.trim() });
        this.apiKeyConfigured = true;
      } catch (err) {
        console.warn('[GeminiService] Failed to initialize GoogleGenAI with provided key:', err);
        this.client = null;
        this.apiKeyConfigured = false;
      }
    } else {
      this.client = null;
      this.apiKeyConfigured = false;
    }
  }

  public isConfigured(): boolean {
    if (!this.apiKeyConfigured) {
      // Re-check in case .env was populated after boot
      this.initClient();
    }
    return this.apiKeyConfigured && this.client !== null;
  }

  /**
   * Cleans potential Markdown code block wrappers (e.g. ```json ... ```)
   */
  public cleanJsonString(raw: string): string {
    let clean = raw.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return clean.trim();
  }

  /**
   * Executes a structured JSON call using Gemini SDK with timeout, retry, and validation.
   */
  public async callStructured<T>(params: GeminiCallParams<T>): Promise<GeminiCallResult<T>> {
    const startTime = Date.now();
    const warnings: string[] = [];

    // Check if client is available or in temporary quota cool-down
    if (!this.isConfigured() || !this.client || Date.now() < this.quotaExhaustedUntil) {
      const reason = Date.now() < this.quotaExhaustedUntil
        ? 'Gemini quota is temporarily unavailable.'
        : 'GEMINI_API_KEY is not configured.';
      throw new Error(reason + ' CivicFlow will not substitute demo or fabricated civic data.');
    }

    let lastError: any = null;

    // Retry loop for rate-limits / transient network timeouts
    for (let attempt = 0; attempt <= GEMINI_CONFIG.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise(res => setTimeout(res, GEMINI_CONFIG.retryDelayMs * attempt));
        }

        // Construct prompt with system instructions
        const promptText = `${params.systemPrompt}\n\nTask Input:\n${params.userPrompt}\n\nIMPORTANT: Return ONLY a valid JSON object matching the requested schema. No conversational prose or explanations outside the JSON.`;

        // Execution with configured timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Gemini API call timed out after ${GEMINI_CONFIG.requestTimeoutMs}ms`)), GEMINI_CONFIG.requestTimeoutMs);
        });

        const apiPromise = this.client.models.generateContent({
          model: GEMINI_CONFIG.model,
          contents: promptText,
          config: {
            temperature: params.temperature ?? GEMINI_CONFIG.defaultTemperature,
            responseMimeType: 'application/json'
          }
        });

        const response: any = await Promise.race([apiPromise, timeoutPromise]);
        const duration = Date.now() - startTime;

        const rawText = response.text || '';
        const cleanedText = this.cleanJsonString(rawText);

        if (!cleanedText) {
          throw new Error('Gemini returned an empty response text.');
        }

        let parsed: any;
        try {
          parsed = JSON.parse(cleanedText);
        } catch (jsonErr: any) {
          throw new Error(`Malformed JSON returned by Gemini: ${jsonErr.message}. Raw output snippet: ${cleanedText.slice(0, 100)}`);
        }

        // Validate schema if validator function provided
        if (params.schemaValidator && !params.schemaValidator(parsed)) {
          throw new Error('Gemini response failed structural schema validation rules.');
        }

        const promptTokens = response.usageMetadata?.promptTokenCount || 150;
        const completionTokens = response.usageMetadata?.candidatesTokenCount || 200;

        return {
          data: parsed as T,
          latencyMs: duration,
          tokens: {
            prompt: promptTokens,
            completion: completionTokens,
            total: promptTokens + completionTokens
          },
          isFromGemini: true,
          rawText: cleanedText,
          warnings: warnings.length > 0 ? warnings : undefined
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[GeminiService] Attempt ${attempt + 1}/${GEMINI_CONFIG.maxRetries + 1} failed:`, err?.message || err);
        
        // If it's a fatal schema, auth error, or quota limit (429), set cool-down and do not retry blindly
        const msg = err?.message || '';
        if (
          msg.includes('RESOURCE_EXHAUSTED') || 
          msg.includes('quota') ||
          msg.includes('429')
        ) {
          // Cooldown for 35 seconds to allow rate limiter bucket to refill
          this.quotaExhaustedUntil = Date.now() + 35000;
          break;
        }

        if (
          msg.includes('API_KEY_INVALID') || 
          msg.includes('schema validation')
        ) {
          break;
        }
      }
    }

    throw new Error(`Gemini API execution failed: ${lastError?.message || 'Unknown error'}`);
  }
}

export const geminiService = new GeminiService();
