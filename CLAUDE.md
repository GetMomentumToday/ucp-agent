# UCP Agent — AI Brain

Next.js App Router project. AI shopping assistant using Vercel AI SDK + Gemini + UCP.

## Architecture

- `POST /api/chat` — main endpoint, streams Gemini responses with tool calls via SSE
- `GET /agent-profile.json` — agent identity for UCP protocol
- Tools auto-generated from `@omnixhq/ucp-client` capabilities: catalog, cart, checkout, orders, fulfillment, identity linking
- `agent.config.json` — static config for agent name, personality, instructions, greeting

### Conversation Persistence

SQLite database (`data/ucp-agent.db`) via Drizzle ORM with three tables:
- `threads` — conversation metadata (id, userId, status, title)
- `messages` — message history per thread (ai-sdk/v6 format)
- `sessions` — checkout/cart session state per thread

API routes: `/api/threads` (list + create), `/api/threads/[id]` (get, update, delete), `/api/threads/[id]/messages` (load, append).

Multi-user isolation via `ucp-agent-uid` httpOnly cookie — all thread queries scoped by userId.

On page load, `GET /api/threads` prefetches the latest thread's messages in the same response. `ResumeLastThread` component auto-switches to the most recent conversation.

## Stack

- Next.js 15, App Router
- Vercel AI SDK v6 (`ai` + `@ai-sdk/google` + `@ai-sdk/react`)
- `@assistant-ui/react` + `@assistant-ui/react-ai-sdk` — headless chat UI with thread management
- `gemini-2.5-flash` model, `stopWhen: stepCountIs(15)`
- `@omnixhq/ucp-client` v3.0.0 from GitHub Packages registry
- Drizzle ORM + `better-sqlite3` for conversation persistence (WAL mode)

## Commands

```bash
npm run dev          # Start dev server on port 4173
npm run build        # Production build
npm run typecheck    # Type checking
npm run test         # Unit tests (vitest)
npm run test:e2e     # E2E tests (playwright, needs dev server)
npm run test:all     # Unit + E2E tests
npm run verify       # Full verification: typecheck + unit tests + build
npm run lint         # ESLint
npm run format       # Prettier
```

## Verification

After any code change, run `npm run verify` (typecheck + tests + build).
A Stop hook in `.claude/settings.local.json` auto-runs typecheck + unit tests when Claude finishes a task.

## Env Vars

Copy `.env.example` to `.env.local` and fill in:

- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API key
- `GATEWAY_URL` — UCP gateway (default: http://localhost:3000)
- `UCP_AGENT_PROFILE` — This agent's profile URL (default: http://localhost:4173/agent-profile.json)

## Rules

- No descriptive comments (comments that restate what code does)
- Immutable patterns — create new objects, never mutate
- Payment handler IDs come from `ucp_discover` — never hardcode them
- All tool executions must catch errors and return `{ error: string }` — never throw
