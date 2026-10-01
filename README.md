# CivicFlow AI

> **From Citizen Problems to Verified Action Plans.**

CivicFlow AI is a multi-agent civic workflow platform that transforms complex citizen questions into structured, evidence-grounded action plans.

Instead of behaving like a single chatbot, CivicFlow orchestrates specialized AI agents for request understanding, routing, knowledge retrieval, requirements analysis, document planning, workflow generation, verification, and final response generation.

## 🚀 What CivicFlow Does

**Citizen Request → Understanding → Evidence → Requirements → Documents → Workflow → Verification → Action Plan**

CivicFlow is designed around one core principle:

> **AI should help people understand what to do next — while clearly showing the evidence behind important claims.**

### Core capabilities

- 🤖 **Multi-Agent Orchestration** — specialized agents collaborate instead of producing one monolithic response.
- 🔎 **RAG Knowledge Grounding** — retrieves relevant knowledge from the configured document store.
- 🧭 **Dynamic Routing** — selects the workflow and agents relevant to the current request.
- 📋 **Requirement Analysis** — converts retrieved requirements into structured guidance.
- 📄 **Document Planning** — creates organized document/checklist outputs.
- 🔄 **Workflow Generation** — turns information into practical sequential steps.
- 🛡️ **Claim Verification** — checks generated claims against retrieved evidence and flags unsupported information.
- 📚 **Source-Aware Responses** — preserves evidence so users can inspect where important information came from.
- 👤 **Human-in-the-Loop** — consequential actions require explicit human authorization.
- 📡 **Execution Observability** — exposes useful workflow status, events, errors, and verification metrics without exposing private chain-of-thought.
- 🧪 **Automated Testing** — includes integration coverage for the multi-agent and RAG workflow.

## 🧠 Multi-Agent Architecture

CivicFlow currently uses a 9-agent conceptual workflow:

| Agent | Responsibility |
|---|---|
| **Intake Agent** | Understands the citizen request and extracts structured entities/context. |
| **Router Agent** | Determines which workflow and specialized agents are required. |
| **Research Agent** | Identifies relevant information and research needs. |
| **RAG Grounding Agent** | Retrieves relevant knowledge from the configured knowledge base. |
| **Eligibility Agent** | Organizes eligibility and requirement information from available evidence. |
| **Document Agent** | Builds a structured document/checklist plan. |
| **Workflow Agent** | Converts requirements into actionable sequential steps. |
| **Verifier Agent** | Audits claims against available evidence and identifies unsupported claims. |
| **Response Agent** | Produces the final user-facing action plan with relevant evidence. |

### Execution model

```text
Citizen Request
      ↓
Intake
      ↓
Dynamic Routing
      ↓
Research + RAG
      ↓
Requirements / Eligibility
      ↓
Documents
      ↓
Workflow
      ↓
Verification
      ↓
Final Action Plan
      ↓
Human Approval (when required)
```

The UI should show only the agents actually selected for the current request, while the complete architecture remains inspectable for technical evaluation.

## 🔐 Trust & Safety Principles

CivicFlow is designed for evidence-grounded civic assistance rather than unsupported automated decision-making.

- Do not invent official requirements, fees, deadlines, forms, or procedures.
- Retrieved documents are treated as data, not instructions to the AI.
- Important unsupported claims should be flagged instead of presented as established facts.
- Evidence and source metadata are preserved where available.
- The system does not expose hidden chain-of-thought.
- Consequential external actions require explicit human authorization.
- Demo/sample knowledge must be clearly distinguished from verified live official information.
- CivicFlow provides guidance and workflow assistance; it does not replace an official authority or professional advice.

## 🧪 Verification & Testing

The project has an automated integration suite covering the core orchestration and RAG behavior.

Reported verification coverage includes:

- Intake entity extraction and language detection
- Dynamic workflow routing
- Workflow state schema enforcement
- Document checklist structuring
- Adversarial claim verification
- Malformed AI response handling
- API-key fallback resilience
- Error-state recording
- Unsupported-claim detection
- End-to-end multi-agent execution

The project has also been reported to pass TypeScript compilation and the Vite production build.

> **Note:** These results describe the project's current reported test status; run the commands locally or in CI to independently verify the latest commit.

## 🛠️ Technology Direction

CivicFlow is built around a modern AI application stack:

- **Frontend:** React + TypeScript
- **UI:** Tailwind CSS
- **AI:** Google Gemini
- **RAG / Vector Search:** Qdrant
- **Backend:** Node.js + Express API layer
- **Document Processing:** PDF ingestion and chunking
- **Architecture:** Multi-agent orchestration + typed workflow state
- **Testing:** Automated integration tests
- **Deployment:** Vercel-compatible frontend/API configuration

## ⚡ Local Development

### 1. Clone

```bash
git clone https://github.com/suhailahmedaamro786/CivicFlow.git
cd CivicFlow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` or appropriate local environment file:

```env
GEMINI_API_KEY=your_gemini_api_key

QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=civicflow_documents

EMBEDDING_PROVIDER=gemini
```

Never commit real API keys or secrets to GitHub.

### 4. Run the application

```bash
npm run dev
```

### 5. Run checks

```bash
npm run lint
npm test
npm run build
```

## 🎬 Judge Demo Flow

For a hackathon demonstration, the recommended flow is:

1. Enter a realistic citizen problem.
2. Show the Intake Agent understanding the request.
3. Show dynamic routing selecting the required workflow.
4. Retrieve relevant evidence through RAG.
5. Generate requirements and document guidance.
6. Build the step-by-step action plan.
7. Run verification against retrieved evidence.
8. Present the final result first.
9. Open the workflow/evidence panels to demonstrate how the answer was produced.
10. Show the human-approval boundary for any consequential action.

The primary experience should remain **citizen-focused**, while the agent timeline, evidence, and verification details provide technical depth for judges and developers.

## 🗺️ Roadmap

### Phase 1 — Hackathon MVP

- Multi-agent civic workflow
- RAG knowledge grounding
- Dynamic agent routing
- Claim verification
- Structured action plans
- Human approval boundaries
- Judge/demo workflow
- Automated integration testing

### Phase 2 — Production Knowledge Layer

- Official-source connectors
- Scheduled source ingestion
- Source freshness tracking
- Document versioning
- Evidence-level citations
- Knowledge-base administration
- Regional knowledge collections
- Source change detection

### Phase 3 — Advanced Civic Intelligence

- Country → Province → District → City → Department routing
- English / Urdu / Sindhi and additional languages
- Smart form assistance
- Document readiness checks
- Request history and case tracking
- Organization dashboards
- Role-based access control
- Analytics and workflow insights

### Phase 4 — Agentic Automation

- Human-approved workflow actions
- Secure third-party/service integrations
- Notifications and reminders
- Case management
- Complete audit trails
- Permission-aware agent tools
- Agent retry and recovery policies
- Cost, latency, reliability, and quality evaluation

### Future Research Direction

A longer-term CivicFlow ecosystem could include specialized domain agents for:

- Business services
- Education and scholarships
- Employment applications
- Housing and local services
- Licensing and permits
- Public benefits
- Tax-information workflows
- Document preparation

These are roadmap ideas, not claims that all of these capabilities are currently implemented.

## 📊 Future Evaluation Layer

As CivicFlow moves toward production, evaluation should measure the system using observable metrics such as:

- Retrieval relevance
- Evidence coverage
- Unsupported-claim rate
- Verification coverage
- Workflow completion reliability
- Agent failure/retry rate
- Latency
- Token/API cost
- Source freshness
- Human approval frequency

The goal is to make the system measurable rather than relying on a single opaque "AI confidence" number.

## 🌍 Vision

CivicFlow aims to become an evidence-grounded workflow layer between people and complex civic processes.

```text
A citizen has a problem
        ↓
CivicFlow understands it
        ↓
Finds relevant evidence
        ↓
Identifies requirements
        ↓
Organizes documents
        ↓
Builds the workflow
        ↓
Verifies important claims
        ↓
Produces a clear action plan
        ↓
Human remains in control
```

## 📁 Project

**Repository:** https://github.com/suhailahmedaamro786/CivicFlow

**Project:** CivicFlow AI  
**Category:** Multi-Agent AI + RAG + Workflow Automation  
**Purpose:** Evidence-grounded civic workflow assistance

---

Built as an experimental multi-agent AI platform with a focus on **grounding, verification, transparency, and human control**.
