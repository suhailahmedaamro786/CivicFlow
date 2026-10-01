/**
 * Centralized Gemini Model & Service Configuration
 * Keep configuration in one place so models can be changed without modifying agent logic.
 */

export const GEMINI_CONFIG = {
  // Primary model for all structured agent reasoning
  model: 'gemini-3.8-flash',
  
  // Safety & determinism parameters
  defaultTemperature: 0.1,
  verifierTemperature: 0.0, // Zero temperature for strict verification fact-checking
  responseTemperature: 0.2,

  // Network timeouts in milliseconds
  requestTimeoutMs: 25000,

  // Maximum retries on transient errors (e.g. 429 rate limit or network glitch)
  maxRetries: 2,
  retryDelayMs: 1000
};
