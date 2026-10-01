# CivicFlow AI

> **From Citizen Problems to Verified Action Plans.**

CivicFlow AI is an evidence-grounded, multi-agent civic workflow platform designed to turn complex citizen-service questions into clear, structured action plans.

Instead of returning a single chatbot response, CivicFlow orchestrates specialized AI agents that understand the request, route the task, retrieve relevant knowledge, structure requirements, build a workflow, verify claims, and present the result with source-aware evidence and human approval controls.

## ✨ What CivicFlow Does

- 🧠 **Multi-Agent Orchestration** — specialized agents collaborate through a typed workflow state.
- 🔎 **RAG Knowledge Grounding** — semantic retrieval through Qdrant-backed knowledge infrastructure.
- 📋 **Requirement & Document Planning** — converts a request into structured requirements and document checklists.
- 🔄 **Dynamic Workflow Routing** — only the agents relevant to a request are executed.
- 🛡️ **Claim Verification** — checks generated claims against retrieved evidence and flags unsupported information.
- 📚 **Source-Aware Responses** — keeps evidence connected to the final result.
- 👤 **Human-in-the-Loop** — consequential actions require explicit human approval.
- 📊 **Execution Observability** — tracks workflow states, agent execution, verification signals, and errors.
- 🧪 **Automated Testing** — agent, schema, RAG, error-handling, and end-to-end workflow tests.
- ⚡ **Gemini-Powered AI** — designed for Google Gemini models through a server-side AI layer.

## 🤖 Agent Architecture

CivicFlow currently uses a specialized agent pipeline:

1. **Intake Agent** — extracts intent, entities, constraints, and language.
2. **Router Agent** — selects the appropriate workflow and agents.
3. **Research Agent** — identifies information that needs evidence.
4. **RAG / Knowledge Agent** — retrieves relevant knowledge-base content.
5. **Eligibility Agent** — structures applicable conditions and requirements.
6. **Document Agent** — builds a document and requirement checklist.
7. **Workflow Agent** — converts requirements into ordered action steps.
8. **Verifier Agent** — audits claims against available evidence.
9. **Response Agent** — produces the user-facing action plan.

The interface is designed to show only the agents actually involved in the current request rather than exposing the entire architecture to every user.

## 🔐 Trust & Safety Principles

CivicFlow is designed around evidence-first AI behavior:

- No invented official requirements, fees, deadlines, or procedures.
- Retrieved documents are treated as data, not instructions.
- Unsupported claims should be flagged rather than presented as facts.
- Source/evidence context is preserved where available.
- AI execution details are summarized without exposing hidden chain-of-thought.
- External or consequential actions require explicit human authorization.
- Demo knowledge should be clearly distinguished from live official information.

> CivicFlow provides informational workflow assistance. Users should confirm current requirements with the relevant official authority before making consequential decisions.

## 🧪 Current Verification

The current development checkpoint includes:

- TypeScript compilation passing
- Production build passing
- **10/10 automated integration tests passing**
- Intake extraction and language detection
- Dynamic routing
- Workflow state validation
- Document checklist structuring
- Adversarial claim verification
- Malformed response handling
- API-key fallback resilience
- Error-state recording
- Unsupported-claim detection
- End-to-end multi-agent execution

## 🏗️ Core Technology Direction

- **Frontend:** React / TypeScript / modern SaaS UI
- **AI:** Google Gemini
- **RAG:** Qdrant
- **Backend/API:** server-side AI and workflow APIs
- **Orchestration:** multi-agent workflow architecture
- **Validation:** typed schemas + automated tests
- **Deployment:** designed for modern cloud deployment

## 🚀 Product Roadmap

### Phase 1 — Hackathon MVP
- Multi-agent civic workflow
- RAG retrieval
- Evidence-aware verification
- Dynamic agent execution
- Action-plan generation
- Human approval controls
- Judge/demo experience

### Phase 2 — Production Knowledge Layer
- Official-source ingestion pipelines
- Document versioning
- Source freshness tracking
- Citation-level evidence
- Knowledge-base administration
- Regional/service-specific knowledge collections

### Phase 3 — Advanced Civic Intelligence
- Personalized service workflows
- Multilingual citizen assistance
- Form/document preparation
- Workflow status tracking
- Organization dashboards
- Analytics and observability
- Role-based access control

### Phase 4 — Agentic Automation
- Human-approved workflow actions
- Secure integrations with supported service systems
- Notification workflows
- Case management
- Audit logs
- Policy-aware automation

## 🎯 Vision

CivicFlow aims to make complex civic processes easier to understand by connecting:

**Citizen Request → Understanding → Evidence → Requirements → Documents → Workflow → Verification → Action Plan**

The goal is not to replace public authorities. The goal is to help people understand what information and steps they need, while keeping evidence, uncertainty, and human approval visible.

## 📁 Repository

GitHub: https://github.com/suhailahmedaamro786/CivicFlow

---

Built for the **Pak Angels Generative & Agentic AI Hackathon** with a focus on Generative AI, Agentic AI, RAG, Multi-Agent Systems, and AI-powered workflow automation.
