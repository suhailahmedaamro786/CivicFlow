import { PDFParse } from 'pdf-parse';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractionResult {
  fullText: string;
  pages: ExtractedPage[];
  totalPages: number;
  info?: Record<string, any>;
}

export class DocumentExtractor {
  /**
   * Extracts clean text and page segments from PDF, TXT, or Markdown buffers
   */
  public static async extract(buffer: Buffer, fileType: 'pdf' | 'txt' | 'md'): Promise<ExtractionResult> {
    if (fileType === 'pdf') {
      return this.extractFromPdf(buffer);
    }
    return this.extractFromTextOrMarkdown(buffer);
  }

  private static async extractFromPdf(buffer: Buffer): Promise<ExtractionResult> {
    let parser: InstanceType<typeof PDFParse> | null = null;
    try {
      parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      let infoResult: Record<string, any> | undefined;
      try {
        const info = await parser.getInfo();
        infoResult = info as any;
      } catch {
        // info extraction optional
      }

      const rawText = textResult?.text || '';
      const cleanText = this.cleanExtractedText(rawText);

      const pages: ExtractedPage[] = [];
      if (textResult?.pages && textResult.pages.length > 0) {
        for (const p of textResult.pages) {
          const pageClean = this.cleanExtractedText(p.text || '');
          if (pageClean.length > 0) {
            pages.push({
              pageNumber: p.num || pages.length + 1,
              text: pageClean
            });
          }
        }
      }

      const numPages = pages.length > 0 ? pages.length : (textResult?.total || 1);

      return {
        fullText: cleanText,
        pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: cleanText }],
        totalPages: Math.max(1, numPages),
        info: infoResult
      };
    } catch (err: any) {
      console.warn('[DocumentExtractor] PDF parsing warning, attempting fallback text extraction:', err?.message || err);
      // Fallback: extract ASCII string content from buffer
      const fallbackText = buffer.toString('utf-8').replace(/[^\x20-\x7E\t\n\r]/g, ' ');
      const clean = this.cleanExtractedText(fallbackText);
      return {
        fullText: clean,
        pages: [{ pageNumber: 1, text: clean }],
        totalPages: 1
      };
    } finally {
      if (parser) {
        try {
          await parser.destroy();
        } catch {
          // ignore cleanup errors
        }
      }
    }
  }

  private static extractFromTextOrMarkdown(buffer: Buffer): ExtractionResult {
    const raw = buffer.toString('utf-8');
    const clean = this.cleanExtractedText(raw);
    return {
      fullText: clean,
      pages: [{ pageNumber: 1, text: clean }],
      totalPages: 1
    };
  }

  /**
   * Cleans raw text: removes null bytes, normalizes excessive linebreaks, fixes spacing
   */
  public static cleanExtractedText(text: string): string {
    return text
      .replace(/\0/g, '') // strip null bytes
      .replace(/\r\n/g, '\n') // standardize newlines
      .replace(/[ \t]+\n/g, '\n') // strip trailing spaces on lines
      .replace(/\n{3,}/g, '\n\n') // collapse triple+ newlines to double
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove invisible ASCII control codes
      .trim();
  }
}
