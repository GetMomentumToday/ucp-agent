import { UCPClient } from '@omnixhq/ucp-client';
import { toVercelAITools } from '@omnixhq/ucp-client/vercel-ai';
import type { ConnectedClient, AgentTool } from '@omnixhq/ucp-client';
import {
  getCheckoutSessionId,
  setCheckoutSessionId,
  clearCheckoutSessionId,
  getCartSessionId,
  setCartSessionId,
  clearCartSessionId,
} from './session-store';

let cachedClient: ConnectedClient | null = null;

async function getClient(): Promise<ConnectedClient> {
  if (cachedClient) return cachedClient;

  const gatewayUrl = process.env['GATEWAY_URL'];
  const agentProfileUrl = process.env['UCP_AGENT_PROFILE'];

  if (!gatewayUrl || !agentProfileUrl) {
    throw new Error('GATEWAY_URL and UCP_AGENT_PROFILE env vars are required');
  }

  cachedClient = await UCPClient.connect({ gatewayUrl, agentProfileUrl });
  return cachedClient;
}

const CHECKOUT_TOOLS = new Set([
  'update_checkout',
  'get_checkout',
  'set_fulfillment',
  'select_destination',
  'select_fulfillment_option',
  'apply_discount_codes',
]);

const CART_TOOLS = new Set(['get_cart', 'update_cart']);

export function withCheckoutTracking(agentTool: AgentTool, sessionId: string): AgentTool {
  const { name, execute } = agentTool;

  if (name === 'create_checkout') {
    return {
      ...agentTool,
      execute: async (params) => {
        const existing = getCheckoutSessionId(sessionId);
        if (existing) {
          const client = await getClient();
          const current = await client.checkout!.get(existing);
          return {
            ...current,
            _note: 'Checkout already exists. Use update_checkout to modify it.',
          };
        }
        const result = (await execute(params)) as { id?: string };
        if (result?.id) setCheckoutSessionId(sessionId, result.id);
        return result;
      },
    };
  }

  if (name === 'complete_checkout' || name === 'cancel_checkout') {
    return {
      ...agentTool,
      execute: async (params) => {
        const id = (params['id'] as string) || getCheckoutSessionId(sessionId);
        if (!id) return { error: 'No active checkout session. Create one first.' };
        const result = await execute({ ...params, id });
        clearCheckoutSessionId(sessionId);
        return result;
      },
    };
  }

  if (CHECKOUT_TOOLS.has(name)) {
    return {
      ...agentTool,
      execute: async (params) => {
        const id = (params['id'] as string) || getCheckoutSessionId(sessionId);
        if (!id) return { error: 'No active checkout session.' };
        return execute({ ...params, id });
      },
    };
  }

  return agentTool;
}

export function withCartTracking(agentTool: AgentTool, sessionId: string): AgentTool {
  const { name, execute } = agentTool;

  if (name === 'create_cart') {
    return {
      ...agentTool,
      execute: async (params) => {
        const existing = getCartSessionId(sessionId);
        if (existing) {
          const client = await getClient();
          const current = await client.cart!.get(existing);
          return {
            ...current,
            _note: 'Cart already exists. Use update_cart to modify it.',
          };
        }
        const result = (await execute(params)) as { id?: string };
        if (result?.id) setCartSessionId(sessionId, result.id);
        return result;
      },
    };
  }

  if (name === 'cancel_cart') {
    return {
      ...agentTool,
      execute: async (params) => {
        const id = (params['id'] as string) || getCartSessionId(sessionId);
        if (!id) return { error: 'No active cart. Create one first.' };
        const result = await execute({ ...params, id });
        clearCartSessionId(sessionId);
        return result;
      },
    };
  }

  if (CART_TOOLS.has(name)) {
    return {
      ...agentTool,
      execute: async (params) => {
        const id = (params['id'] as string) || getCartSessionId(sessionId);
        if (!id) return { error: 'No active cart.' };
        return execute({ ...params, id });
      },
    };
  }

  return agentTool;
}

function withSessionTracking(agentTool: AgentTool, sessionId: string): AgentTool {
  const tracked = withCheckoutTracking(agentTool, sessionId);
  if (tracked !== agentTool) return tracked;
  return withCartTracking(agentTool, sessionId);
}

export async function createUcpTools(sessionId: string) {
  const client = await getClient();
  const tracked = client.getAgentTools().map((t) => withSessionTracking(t, sessionId));
  return toVercelAITools(tracked, { catchErrors: true });
}
