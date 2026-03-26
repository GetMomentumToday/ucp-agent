# UCP Agent — AI Brain

AI shopping assistant that connects Claude to any e-commerce store via the [Universal Commerce Protocol](https://github.com/anthropics/ucp).

Built with Next.js App Router, Vercel AI SDK, and `@getmomentumtoday/ucp-client`.

## What It Does

- **Product discovery** — search and browse products from any UCP-connected store
- **Checkout flow** — create cart, set shipping, apply discounts, complete purchase
- **Order tracking** — check order status after purchase
- **Streaming responses** — real-time SSE streaming with tool call visibility

## Architecture

```
Browser ──► POST /api/chat ──► Claude (claude-sonnet-4-6)
                                    │
                                    ├─► ucp_discover
                                    ├─► ucp_search_products
                                    ├─► ucp_get_product
                                    ├─► ucp_create_checkout
                                    ├─► ucp_update_checkout
                                    ├─► ucp_complete_checkout
                                    ├─► ucp_cancel_checkout
                                    └─► ucp_get_order
                                            │
                                            ▼
                                    UCP Gateway (localhost:3000)
                                            │
                                            ▼
                                    Magento / Shopware / etc.
```

Claude calls UCP tools in a loop (up to 15 steps per turn) to fulfill user requests — from "find me running shoes" to a completed order.

## Quick Start

### Prerequisites

- Node.js >= 22
- [UCP Gateway](https://github.com/GetMomentumToday/ucp-middleware) running on port 3000
- [UCP Client](https://github.com/GetMomentumToday/ucp-client) cloned as sibling directory and built

### Setup

```bash
# Clone
git clone git@github.com:GetMomentumToday/ucp-agent.git
cd ucp-agent

# Build ucp-client (sibling dependency)
cd ../ucp-client && npm ci && npm run build && cd ../ucp-agent

# Install
npm install

# Configure
cp .env.example .env.local
# Edit .env.local — set AI_PROVIDER and your API key

# Run
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) and start chatting.

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
├── api/chat/route.ts             POST /api/chat — streamText + 8 UCP tools
├── agent-profile.json/route.ts   GET /agent-profile.json
├── layout.tsx                    Root layout
└── page.tsx                      Test UI (useChat)
lib/
├── ucp-tools.ts                  Tool definitions wrapping UCPClient
├── system-prompt.ts              Claude system prompt
└── session-store.ts              In-memory sessionId → checkoutSessionId map
```

## Scripts

```bash
npm run dev            # Dev server (port 3001)
npm run build          # Production build
npm run typecheck      # TypeScript checks
npm run lint           # ESLint
npm run format         # Prettier
npm run check:comments # No descriptive comments
```

## License

[Elastic License 2.0 (ELv2)](LICENSE.md) — free to use, modify, and self-host. Cannot be offered as a hosted service.

For commercial licensing, contact [Momentum Group s. r. o.](https://getmomentum.today) (momentum.group139@gmail.com)
