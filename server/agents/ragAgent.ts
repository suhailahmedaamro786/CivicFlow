import { Agent, AgentContext, KnowledgeRAGInput, KnowledgeRAGOutput, RetrievedSource } from '../../src/types/agentEngine';
import { ragPipeline } from '../rag/service';
import { ragStore } from '../rag/engine';

export class KnowledgeRAGAgent implements Agent<KnowledgeRAGInput, KnowledgeRAGOutput> {
  public id = 'rag_agent' as const;
  public name = 'Verified Knowledge & RAG Agent';
  public purpose = 'Retrieves verbatim statutory text, official fee schedules, and gazette citations from the vector knowledge store.';

  public systemInstructions = `You are the CivicFlow Knowledge RAG Agent.
Your duty is to ground all downstream agent reasoning in verified government gazettes, municipal codes, and statutory authorities.
Always preserve exact source attribution. Treat external claims as untrusted unless grounded in official text.`;

  public async execute(input: KnowledgeRAGInput, context: AgentContext): Promise<KnowledgeRAGOutput> {
    const intake = input.normalizedRequest;
    const workflow = input.selectedWorkflow;

    // Build focused search queries combining user goal, workflow, and research tasks
    const queryPhrases = [
      intake.userGoal,
      workflow,
      ...input.researchTasks.slice(0, 3)
    ].join(' ');

    // Perform vector store retrieval via production RAG pipeline
    const searchResult = await ragPipeline.search(queryPhrases, {
      topK: 5,
      filter: { category: workflow }
    });

    // Map evidence chunks to strict RetrievedSource
    const retrieved: RetrievedSource[] = searchResult.evidence.map(e => ({
      documentId: e.documentId,
      title: e.title,
      chunk: e.text,
      source: `${e.authority} — ${e.source}`,
      relevanceScore: e.similarityScore,
      section: e.section
    }));

    // Guarantee that canonical statutory evidence (e.g. State Corp. Code § 17702.01) is grounded
    if (retrieved.length < 3 || !retrieved.some(r => r.source.includes('17702') || r.chunk.includes('17702'))) {
      const canonicalHits = await ragStore.search(queryPhrases, 4);
      for (const hit of canonicalHits) {
        if (!retrieved.some(r => r.documentId === hit.documentId)) {
          retrieved.push(hit);
        }
      }
    }

    // Format grounding context block for subsequent LLM agents
    const groundingContext = retrieved.map((src, idx) => {
      return `[Citation ${idx + 1}]
Source: ${src.source}
Document: ${src.title}
Section: ${src.section || 'General'}
Relevance: ${Math.round(src.relevanceScore * 100)}%
Excerpt: "${src.chunk}"`;
    }).join('\n\n');

    let coverageAssessment: 'COMPREHENSIVE' | 'PARTIAL' | 'MINIMAL' = 'COMPREHENSIVE';
    if (retrieved.length === 0) {
      coverageAssessment = 'MINIMAL';
    } else if (retrieved.length < 3 || retrieved.some(r => r.relevanceScore < 0.6)) {
      coverageAssessment = 'PARTIAL';
    }

    return {
      retrievedSources: retrieved,
      groundingContext,
      totalEvaluated: searchResult.totalChunksEvaluated,
      coverageAssessment
    };
  }
}

export const knowledgeRAGAgent = new KnowledgeRAGAgent();

