# UCP Agent — AI Brain

Next.js App Router project. AI shopping assistant using Vercel AI SDK + Claude + UCP.

## Architecture

- `POST /api/chat` — main endpoint, streams Claude responses with tool calls via SSE
- `GET /agent-profile.json` — agent identity for UCP protocol
- 8 tools wrap `@momentum/ucp-client` methods (discover, search, checkout flow, orders)
- In-memory session store maps chat sessionId → checkoutSessionId

## Stack

- Next.js 15, App Router
- Vercel AI SDK v4 (`ai` + `@ai-sdk/anthropic` + `@ai-sdk/react`)
- `claude-sonnet-4-6` model, `maxSteps: 15`
- `@momentum/ucp-client` linked from `../ucp-client/packages/ucp-client`

## Commands

```bash
npm run dev          # Start dev server on port 3001
npm run build        # Production build
npm run typecheck    # Type checking
npm run lint         # ESLint
npm run format       # Prettier
```

## Env Vars

Copy `.env.example` to `.env.local` and fill in:
- `ANTHROPIC_API_KEY` — Claude API key
- `GATEWAY_URL` — UCP gateway (default: http://localhost:3000)
- `UCP_AGENT_PROFILE` — This agent's profile URL (default: http://localhost:3001/agent-profile.json)

## Rules

- No descriptive comments (comments that restate what code does)
- Immutable patterns — create new objects, never mutate
- Payment handler IDs come from `ucp_discover` — never hardcode them
- All tool executions must catch errors and return `{ error: string }` — never throw
