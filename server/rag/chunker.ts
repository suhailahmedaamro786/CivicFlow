import { DocumentChunkRecord, KnowledgeDocumentMetadata } from './types';
import { DocumentValidator } from './validator';
import { ExtractedPage } from './extractor';

export interface ChunkOptions {
  targetChunkChars?: number;
  maxChunkChars?: number;
  overlapChars?: number;
}

export class IntelligentChunker {
  private static readonly DEFAULT_TARGET_CHARS = 550;
  private static readonly DEFAULT_MAX_CHARS = 950;
  private static readonly DEFAULT_OVERLAP_CHARS = 100;

  /**
   * Splits extracted pages into semantically cohesive chunks without splitting sentences
   */
  public static chunkDocument(
    document: KnowledgeDocumentMetadata,
    pages: ExtractedPage[],
    options: ChunkOptions = {}
  ): DocumentChunkRecord[] {
    const targetSize = options.targetChunkChars ?? this.DEFAULT_TARGET_CHARS;
    const maxSize = options.maxChunkChars ?? this.DEFAULT_MAX_CHARS;
    const overlap = options.overlapChars ?? this.DEFAULT_OVERLAP_CHARS;

    const chunks: DocumentChunkRecord[] = [];
    const seenChecksums = new Set<string>();
    let chunkIndex = 1;

    for (const page of pages) {
      const pageText = page.text.trim();
      if (!pageText) continue;

      // Extract section headings if present on this page
      const currentSection = this.detectSectionHeader(pageText) || `Section on Page ${page.pageNumber || 1}`;

      // Split page into cohesive sentences / paragraphs
      const units = this.splitIntoSentenceUnits(pageText);

      let currentChunkText = '';
      let currentSectionHeader = currentSection;

      for (let i = 0; i < units.length; i++) {
        const unit = units[i];

        // Check if unit is a major header
        const unitHeader = this.detectSectionHeader(unit);
        if (unitHeader) {
          currentSectionHeader = unitHeader;
        }

        if ((currentChunkText.length + unit.length) <= targetSize) {
          currentChunkText += (currentChunkText ? ' ' : '') + unit;
        } else {
          // If we reached target, commit the current chunk
          if (currentChunkText.length > 30) {
            const finalChunkText = currentChunkText.trim();
            const checksum = DocumentValidator.computeChecksum(finalChunkText);

            // Deduplication check
            if (!seenChecksums.has(checksum)) {
              seenChecksums.add(checksum);
              chunks.push({
                chunkId: `chk-${document.documentId}-${chunkIndex++}`,
                documentId: document.documentId,
                text: finalChunkText,
                pageNumber: page.pageNumber,
                section: currentSectionHeader,
                tokenCount: Math.ceil(finalChunkText.length / 4),
                checksum,
                metadata: {
                  title: document.title,
                  authority: document.authority,
                  category: document.category,
                  source: document.source,
                  publicationDate: document.publicationDate
                }
              });
            }
          }

          // Build overlap for next chunk from end of current text
          const overlapText = this.extractSentenceOverlap(currentChunkText, overlap);
          currentChunkText = (overlapText ? overlapText + ' ' : '') + unit;

          // If a single unit itself exceeds maxSize, force split it at sentence/word boundary
          if (currentChunkText.length > maxSize) {
            const trimmed = currentChunkText.slice(0, maxSize);
            const checksum = DocumentValidator.computeChecksum(trimmed);
            if (!seenChecksums.has(checksum)) {
              seenChecksums.add(checksum);
              chunks.push({
                chunkId: `chk-${document.documentId}-${chunkIndex++}`,
                documentId: document.documentId,
                text: trimmed,
                pageNumber: page.pageNumber,
                section: currentSectionHeader,
                tokenCount: Math.ceil(trimmed.length / 4),
                checksum,
                metadata: {
                  title: document.title,
                  authority: document.authority,
                  category: document.category,
                  source: document.source,
                  publicationDate: document.publicationDate
                }
              });
            }
            currentChunkText = currentChunkText.slice(maxSize - overlap).trim();
          }
        }
      }

      // Add any remaining tail text
      if (currentChunkText.trim().length > 30) {
        const tailText = currentChunkText.trim();
        const checksum = DocumentValidator.computeChecksum(tailText);
        if (!seenChecksums.has(checksum)) {
          seenChecksums.add(checksum);
          chunks.push({
            chunkId: `chk-${document.documentId}-${chunkIndex++}`,
            documentId: document.documentId,
            text: tailText,
            pageNumber: page.pageNumber,
            section: currentSectionHeader,
            tokenCount: Math.ceil(tailText.length / 4),
            checksum,
            metadata: {
              title: document.title,
              authority: document.authority,
              category: document.category,
              source: document.source,
              publicationDate: document.publicationDate
            }
          });
        }
      }
    }

    return chunks;
  }

  /**
   * Splits text into sentence units preserving punctuation, avoiding mid-sentence cuts
   */
  private static splitIntoSentenceUnits(text: string): string[] {
    // Splits on paragraphs first, or punctuation followed by whitespace and capital letter
    const rawParagraphs = text.split(/\n\s*\n/);
    const units: string[] = [];

    for (const para of rawParagraphs) {
      const cleanPara = para.replace(/\s+/g, ' ').trim();
      if (!cleanPara) continue;

      // Sentence boundary regex (e.g. '. ', '! ', '? ')
      const sentences = cleanPara.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
      if (sentences && sentences.length > 0) {
        for (const s of sentences) {
          const trimmed = s.trim();
          if (trimmed.length > 0) units.push(trimmed);
        }
      } else {
        units.push(cleanPara);
      }
    }

    return units;
  }

  /**
   * Extracts clean overlap text at sentence/word boundary
   */
  private static extractSentenceOverlap(text: string, overlapChars: number): string {
    if (text.length <= overlapChars) return '';
    const slice = text.slice(-overlapChars);
    const firstSpace = slice.indexOf(' ');
    if (firstSpace !== -1 && firstSpace < slice.length - 10) {
      return slice.slice(firstSpace + 1).trim();
    }
    return slice.trim();
  }

  /**
   * Detects legal/statutory section headers
   */
  private static detectSectionHeader(text: string): string | null {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const firstLine = lines[0] || '';

    // Check common legal heading patterns
    if (/^(#+\s+|Section\s+§|Article\s+|Chapter\s+|Title\s+|Part\s+|§\s*\d+)/i.test(firstLine)) {
      return firstLine.replace(/^#+\s*/, '').slice(0, 80);
    }
    if (firstLine.length < 60 && firstLine.endsWith(':')) {
      return firstLine.slice(0, -1);
    }
    return null;
  }
}
