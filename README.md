# UCP Agent — AI Brain

AI shopping assistant that connects Claude to any e-commerce store via the [Universal Commerce Protocol](https://github.com/anthropics/ucp).

Built with Next.js App Router, Vercel AI SDK, and `@omnixhq/ucp-client`.

## What It Does

- **Product discovery** — search and browse products from any UCP-connected store
- **Cart management** — create cart, add/remove items
- **Checkout flow** — create checkout, set shipping, apply discounts, complete purchase
- **Order tracking** — check order status after purchase
- **Conversation persistence** — messages saved to SQLite, survive page refresh
- **Multi-user isolation** — each user sees only their own conversations
- **Streaming responses** — real-time SSE streaming with tool call visibility

## Architecture

```
Browser (@assistant-ui/react)
    │
    ├─► POST /api/chat ──► Gemini / Claude
    │                           │
    │                           ├─► search_products, get_product
    │                           ├─► create_cart, update_cart
    │                           ├─► create_checkout, update_checkout
    │                           ├─► complete_checkout, cancel_checkout
    │                           └─► get_order
    │                                   │
    │                                   ▼
    │                           UCP Gateway (localhost:3000)
    │                                   │
    │                                   ▼
    │                           Magento / Shopware / etc.
    │
    ├─► GET  /api/threads ──► SQLite (threads + messages)
    ├─► POST /api/threads/[id]/messages
    └─► PATCH /api/threads/[id]
```

The LLM calls UCP tools in a loop (up to 15 steps per turn) to fulfill user requests. Conversations are persisted to SQLite via Drizzle ORM.

## Quick Start

### Prerequisites

- Node.js >= 22
- [UCP Gateway](https://github.com/GetMomentumToday/ucp-middleware) running on port 3000

### Setup

```bash
# Clone
git clone git@github.com:OmnixHQ/omnix-agent.git
cd omnix-agent

# Install
npm install

# Configure
cp .env.example .env.local
# Edit .env.local — set AI_PROVIDER and your API key

# Run
npm run dev
```

Open [http://localhost:4173](http://localhost:4173) and start chatting. Conversations are saved automatically to `data/ucp-agent.db`.

### AI Model

Supports two providers — switch via `AI_PROVIDER` env var:

| Provider | Model               | Cost        | Rate limits (free) |
| -------- | ------------------- | ----------- | ------------------ |
| `gemini` | `gemini-2.5-flash`  | Free tier   | 10 RPM / 250 RPD   |
| `claude` | `claude-sonnet-4-5` | Pay per use | No free tier       |

```bash
# Use Gemini (default)
AI_PROVIDER=gemini
GOOGLE_GENERATIVE_AI_API_KEY=...   # Get at https://aistudio.google.com/apikey

# Use Claude
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...       # Get at https://console.anthropic.com/settings/keys

# Optional: override model ID
AI_MODEL=gemini-2.5-pro
```

Auto-detects provider from available API key if `AI_PROVIDER` is not set.

### Environment Variables

| Variable                       | Description              | Default                                    |
| ------------------------------ | ------------------------ | ------------------------------------------ |
| `AI_PROVIDER`                  | `gemini` or `claude`     | Auto-detect from API key                   |
| `AI_MODEL`                     | Override model ID        | Provider default                           |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key           | —                                          |
| `ANTHROPIC_API_KEY`            | Claude API key           | —                                          |
| `GATEWAY_URL`                  | UCP Gateway URL          | `http://localhost:3000`                    |
| `UCP_AGENT_PROFILE`            | This agent's profile URL | `http://localhost:3001/agent-profile.json` |

## API

### `POST /api/chat`

Streaming chat endpoint. Accepts Vercel AI SDK message format, returns SSE data stream.

```bash
curl -X POST http://localhost:3001/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages": [{"role": "user", "content": "search for shoes"}]}'
```

### `GET /agent-profile.json`

UCP agent identity — served to the gateway with every request.

## Project Structure

```
app/
├── api/
│   ├── chat/route.ts                      POST /api/chat — streamText + UCP tools
│   └── threads/
│       ├── route.ts                       GET/POST /api/threads
│       └── [threadId]/
│           ├── route.ts                   GET/PATCH/DELETE /api/threads/:id
│           └── messages/route.ts          GET/POST /api/threads/:id/messages
├── agent-profile.json/route.ts            GET /agent-profile.json
├── components/Sidebar.tsx                 Thread list sidebar
├── layout.tsx                             Root layout
└── page.tsx                               Chat UI (assistant-ui + Vercel AI SDK)
lib/
├── db/
│   ├── schema.ts                          Drizzle ORM schema (threads, messages, sessions)
│   ├── connection.ts                      SQLite singleton + auto-migration
│   ├── thread-repository.ts               Thread CRUD (userId-scoped)
│   ├── message-repository.ts              Message load/append
│   └── session-repository.ts              Checkout/cart session state
├── ucp-tools.ts                           UCP tool definitions with session tracking
├── system-prompt.ts                       LLM system prompt
├── session-store.ts                       DB-backed session store
├── remote-thread-list-adapter.ts          HTTP-backed thread list adapter
├── server-thread-history-provider.tsx     Message persistence via ThreadHistoryAdapter
└── user-id.ts                             Cookie-based anonymous user ID
```

## Cost & Optimization

The system prompt and tool calls are optimized for cost-efficiency and low latency:

- **Max 2 tool calls per turn** — protects against rate limits and unnecessary spend
- **No duplicate checkouts** — server-side guard prevents creating multiple sessions
- **Single search per turn** — broad terms cover multiple categories in one call
- **Prompt caching** — Anthropic automatically caches system prompts >1024 tokens (90% discount on repeated calls within 5 min)

### Cost per session (Claude Haiku 4.5)

A typical checkout flow (search → pick → info → address → confirm → order) = ~6 API calls.

| Component            | Tokens/call | Calls | Total  |
| -------------------- | ----------- | ----- | ------ |
| System prompt        | ~1,500      | 6     | 9,000  |
| Conversation history | ~500 avg    | 6     | 3,000  |
| Tool definitions     | ~2,000      | 6     | 12,000 |
| Tool results (JSON)  | ~800        | 4     | 3,200  |
| Model output         | ~150        | 6     | 900    |

**Per session:** ~27K input tokens ($0.022) + ~900 output tokens ($0.004) = **~$0.026 (2.6 cents)**

| Sessions/day | Monthly cost |
| ------------ | ------------ |
| 10           | $7.80        |
| 100          | $78          |
| 1,000        | $780         |

Gemini free tier: $0.00 (limited to ~30-50 sessions/day).

### QA results

15 customer scenarios tested across 20 iterative cycles:

```
Cycle  1: 14/15 (greeting empty)
Cycle  5: 15/15, avg quality 8.6/10
Cycle  6: 15/15, avg quality 9.5/10
Cycles 18-20: 15/15 stable
Multi-turn: full checkout → order ID confirmed
```

Run tests locally: `node scripts/run-scenario.mjs`

## Scripts

```bash
npm run dev            # Dev server (port 4173)
npm run build          # Production build
npm run typecheck      # TypeScript checks
npm run test           # Unit tests (vitest)
npm run verify         # typecheck + tests + build
npm run lint           # ESLint
npm run format         # Prettier
npm run check:comments # No descriptive comments
```

## License

[Elastic License 2.0 (ELv2)](LICENSE.md) — free to use, modify, and self-host. Cannot be offered as a hosted service.

For commercial licensing, contact [Momentum Group s. r. o.](https://getmomentum.today) (momentum.group139@gmail.com)
