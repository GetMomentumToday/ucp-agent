# UCP Agent — AI Brain

Next.js App Router project. AI shopping assistant using Vercel AI SDK + Gemini + UCP.

## Architecture

- `POST /api/chat` — main endpoint, streams Gemini responses with tool calls via SSE
- `GET /agent-profile.json` — agent identity for UCP protocol
- Tools auto-generated from `@omnixhq/ucp-client` capabilities: catalog, cart, checkout, orders, fulfillment, identity linking
- In-memory session store maps chat sessionId → checkoutSessionId + cartId
- `agent.config.json` — static config for agent name, personality, instructions, greeting

## Stack

- Next.js 15, App Router
- Vercel AI SDK v6 (`ai` + `@ai-sdk/google` + `@ai-sdk/react`)
- `gemini-2.5-flash` model, `stopWhen: stepCountIs(15)`
- `@omnixhq/ucp-client` v3.0.0 linked from `../ucp-client` (uses `@omnixhq/ucp-js-sdk@2.0.0`)

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
