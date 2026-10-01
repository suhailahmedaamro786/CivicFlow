import crypto from 'crypto';

export class DocumentValidator {
  public static readonly MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
  public static readonly ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md'];
  public static readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/octet-stream'
  ];

  /**
   * Validates file size and extension
   */
  public static validateFile(filename: string, buffer: Buffer, mimeType?: string): { valid: boolean; error?: string; fileType: 'pdf' | 'txt' | 'md' } {
    if (!buffer || buffer.length === 0) {
      return { valid: false, error: 'Uploaded file is completely empty.', fileType: 'txt' };
    }

    if (buffer.length > this.MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File size exceeds maximum permitted threshold (${(this.MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)}MB). Received: ${(buffer.length / (1024 * 1024)).toFixed(2)}MB.`,
        fileType: 'txt'
      };
    }

    const lowerName = filename.toLowerCase();
    let fileType: 'pdf' | 'txt' | 'md' = 'txt';

    if (lowerName.endsWith('.pdf')) {
      fileType = 'pdf';
    } else if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown')) {
      fileType = 'md';
    } else if (lowerName.endsWith('.txt')) {
      fileType = 'txt';
    } else {
      return {
        valid: false,
        error: `Unsupported file format. CivicFlow AI accepts only PDF (.pdf), Plain Text (.txt), and Markdown (.md).`,
        fileType: 'txt'
      };
    }

    return { valid: true, fileType };
  }

  /**
   * Computes SHA-256 checksum for deduplication and integrity
   */
  public static computeChecksum(buffer: Buffer | string): string {
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  }

  /**
   * Sanitizes metadata strings to prevent injection, control characters, or path traversal
   */
  public static sanitizeString(input: string, maxLength: number = 200): string {
    if (!input) return '';
    return input
      .replace(/[^\w\s.,!?:;()\-–—/'"§&]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLength);
  }

  /**
   * Defends against prompt injection in untrusted documents.
   * Treats all uploaded text strictly as data evidence.
   */
  public static sanitizeEvidenceText(rawText: string): { sanitizedText: string; injectionPatternsDetected: string[] } {
    const maliciousPatterns: { regex: RegExp; label: string }[] = [
      { regex: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/gi, label: 'Instruction Override Attempt' },
      { regex: /disregard\s+(all\s+)?(preceding|prior)\s+rules/gi, label: 'Rule Disregard Directive' },
      { regex: /system\s+prompt\s+override/gi, label: 'System Override Pattern' },
      { regex: /you\s+are\s+now\s+(in\s+developer\s+mode|unrestricted|jailbroken)/gi, label: 'Persona Alteration Attempt' },
      { regex: /forget\s+all\s+your\s+safety\s+guidelines/gi, label: 'Safety Bypass Directive' },
      { regex: /<script[\s\S]*?>[\s\S]*?<\/script>/gi, label: 'Embedded Script Tag' },
      { regex: /javascript:\s*/gi, label: 'Javascript URI Scheme' }
    ];

    let sanitized = rawText;
    const detected: string[] = [];

    for (const pattern of maliciousPatterns) {
      if (pattern.regex.test(sanitized)) {
        detected.push(pattern.label);
        sanitized = sanitized.replace(pattern.regex, '[UNTRUSTED INSTRUCTION DIRECTIVE NEUTRALIZED BY CIVICFLOW SHIELD]');
      }
    }

    return { sanitizedText: sanitized, injectionPatternsDetected: detected };
  }
}
