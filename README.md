# Amjad Healthcare AI

A multi-agent AI platform for medical coding, billing, revenue cycle management (RCM), claims review, and audit. Upload clinical documents, press **Analyze**, and nine specialized agents work the case the way a hospital coding department would — extraction, coding, billing, compliance, independent audit, evidence verification, and a final decision report.

This is not a chatbot. There is no manual prompting. Every agent has one job, structured input/output, and traceable evidence.

---

## Architecture

```
Upload → Agent 1  Document Intake (OCR + classification)
       → Agent 2  Clinical Information Extraction
       → Agent 3  Medical Coding (ICD-10-CM / CPT / HCPCS / Modifiers)
       → Agent 4  Medical Billing
       → Agent 5  Compliance (NCCI, bundling, medical necessity, denial risk)
       → Agent 6  Independent Medical Auditor (re-codes from scratch, diffs)
       → Agent 8  Evidence Verification (links every code to source text)
       → Agent 7  Final Decision (merges everything into one report)

Agent 9 Continuous Learning runs asynchronously off human review actions
(approve / reject / modify a code), building a corrections knowledge base
that feeds the AI Performance Dashboard — it never rewrites official
coding rules, only surfaces patterns for humans.
```

Every agent call goes through a single structured-output layer
(`backend/app/services/ai_client.py`) that forces the model to return JSON
matching a strict Pydantic schema, retries on malformed output, and never
lets an agent silently fabricate a code without evidence — unsupported
codes are marked `evidence_found=false` and routed to manual review.

### Folder structure

```
amjad-healthcare-ai/
├── backend/                    FastAPI service
│   ├── app/
│   │   ├── agents/             The 9 agents + orchestrator
│   │   ├── api/                /api/analyze, /api/feedback routes
│   │   ├── db/                 SQLAlchemy models (Case, Correction)
│   │   ├── models/schemas.py   Shared Pydantic contracts
│   │   ├── services/           ai_client, document_service (OCR), export_service
│   │   └── main.py             App entrypoint
│   ├── requirements.txt
│   └── .env.example
└── frontend/                   Next.js 14 + TypeScript + Tailwind
    ├── app/                    page.tsx (upload+report), dashboard/page.tsx
    ├── components/             FileUpload, AgentTimeline, CodeTable,
    │                           CompliancePanel, AuditPanel, ReportView
    └── lib/                    api.ts, types.ts
```

---

## Running it locally

### 1. Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY=sk-ant-...

uvicorn app.main:app --reload --port 8000
```

OCR for scanned PDFs/images requires the `tesseract-ocr` and `poppler-utils`
system packages (for `pdf2image`):

```bash
# Debian/Ubuntu
sudo apt-get install tesseract-ocr poppler-utils
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`. The dev server proxies `/api/*` to the
FastAPI backend on port 8000 (see `next.config.mjs`).

---

## API surface

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/analyze` | Upload files, run the full 9-agent pipeline, return `PipelineResult` |
| GET | `/api/cases` | List all analyzed cases |
| GET | `/api/cases/{id}` | Retrieve a stored case |
| GET | `/api/cases/{id}/export/pdf` | Download the final report as PDF |
| GET | `/api/cases/{id}/export/excel` | Download coding/billing tables as Excel |
| GET | `/api/cases/{id}/export/json` | Download the raw structured result |
| POST | `/api/feedback/correction` | Record a coder's approve/reject/modify action (Agent 9) |
| GET | `/api/feedback/quality-report` | Aggregate accuracy / correction metrics for the dashboard |

---

## Design rules encoded in the system

- Every ICD-10-CM, CPT, HCPCS, and modifier must include a description,
  reason, supporting evidence, and confidence score.
- Codes without clear documentary support are marked **Evidence Not
  Found** and routed to manual review rather than guessed.
- Agent 6 performs a genuinely independent re-review — it is given only
  the raw documentation, never the other agents' prior coding — then the
  two analyses are diffed and reconciled.
- Agent 9 stores human corrections as a learning signal only. It never
  changes ICD-10-CM / CPT / HCPCS / NCCI / payer-policy logic; those
  stay authoritative in the coding/compliance agent prompts.
- Final status is `READY_FOR_SUBMISSION` only when confidence is high,
  there are no unresolved audit differences, no high-severity compliance
  issues, and no missing-evidence codes — otherwise `REQUIRES_MANUAL_REVIEW`.

## What's stubbed vs. production-ready

This scaffold is a working, runnable implementation of the full pipeline,
schemas, storage, exports, and UI. Before real clinical/billing use, you'd
still want to add: authentication & role-based access (coder vs. admin),
audit logging for HIPAA compliance, a production Postgres database instead
of SQLite, streaming agent progress over WebSocket instead of the current
end-to-end request, and validation of AI-generated codes against a live
NCCI/payer rules engine rather than prompt-encoded guidelines alone.
