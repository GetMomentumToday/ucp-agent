import { dynamicTool, jsonSchema } from 'ai';
import { UCPClient } from '@omnixhq/ucp-client';
import { toVercelAITools } from '@omnixhq/ucp-client/vercel-ai';
import type { ConnectedClient, AgentTool } from '@omnixhq/ucp-client';
import {
  getCheckoutSessionId,
  setCheckoutSessionId,
  clearCheckoutSessionId,
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

function withSessionTracking(agentTool: AgentTool, sessionId: string): AgentTool {
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

export async function createUcpTools(sessionId: string) {
  const client = await getClient();
  const tracked = client.getAgentTools().map((t) => withSessionTracking(t, sessionId));
  const adapterTools = toVercelAITools(tracked, { catchErrors: true });

  // Bridge: wrap adapter's JsonSchema with AI SDK's jsonSchema() for type compatibility
  const tools: Record<string, ReturnType<typeof dynamicTool>> = {};
  for (const [name, def] of Object.entries(adapterTools)) {
    tools[name] = dynamicTool({
      description: def.description,
      inputSchema: jsonSchema(def.inputSchema),
      execute: async (params) => def.execute(params as Record<string, unknown>),
    });
  }
  return tools;
}
