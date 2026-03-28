import { dynamicTool, jsonSchema } from 'ai';
import { UCPClient, type AgentTool } from '@omnixhq/ucp-client';
import type { ConnectedClient } from '@omnixhq/ucp-client';
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

function wrapWithSessionTracking(
  agentTool: AgentTool,
  sessionId: string,
): (params: Record<string, unknown>) => Promise<unknown> {
  const { name, execute } = agentTool;

  if (name === 'create_checkout') {
    return async (params) => {
      const existing = getCheckoutSessionId(sessionId);
      if (existing) {
        const client = await getClient();
        const current = await client.checkout!.get(existing);
        return { ...current, _note: 'Checkout already exists. Use update_checkout to modify it.' };
      }
      const result = (await execute(params)) as { id?: string };
      if (result?.id) {
        setCheckoutSessionId(sessionId, result.id);
      }
      return result;
    };
  }

  if (name === 'update_checkout' || name === 'get_checkout') {
    return async (params) => {
      const id = (params['id'] as string) || getCheckoutSessionId(sessionId);
      if (!id) return { error: 'No active checkout session. Create one first.' };
      return execute({ ...params, id });
    };
  }

  if (name === 'complete_checkout') {
    return async (params) => {
      const id = (params['id'] as string) || getCheckoutSessionId(sessionId);
      if (!id) return { error: 'No active checkout session. Create one first.' };
      const result = await execute({ ...params, id });
      clearCheckoutSessionId(sessionId);
      return result;
    };
  }

  if (name === 'cancel_checkout') {
    return async (params) => {
      const id = (params['id'] as string) || getCheckoutSessionId(sessionId);
      if (!id) return { error: 'No active checkout session to cancel.' };
      const result = await execute({ ...params, id });
      clearCheckoutSessionId(sessionId);
      return result;
    };
  }

  if (name === 'set_fulfillment' || name === 'select_destination' || name === 'select_fulfillment_option') {
    return async (params) => {
      const id = (params['id'] as string) || getCheckoutSessionId(sessionId);
      if (!id) return { error: 'No active checkout session.' };
      return execute({ ...params, id });
    };
  }

  if (name === 'apply_discount_codes') {
    return async (params) => {
      const id = (params['id'] as string) || getCheckoutSessionId(sessionId);
      if (!id) return { error: 'No active checkout session.' };
      return execute({ ...params, id });
    };
  }

  return execute;
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function createUcpTools(sessionId: string) {
  const client = await getClient();
  const agentTools = client.getAgentTools();

  const tools: Record<string, ReturnType<typeof dynamicTool>> = {};

  for (const agentTool of agentTools) {
    const wrappedExecute = wrapWithSessionTracking(agentTool, sessionId);

    tools[agentTool.name] = dynamicTool({
      description: agentTool.description,
      inputSchema: jsonSchema(agentTool.parameters),
      execute: async (params) => {
        try {
          return await wrappedExecute(params as Record<string, unknown>);
        } catch (error) {
          return { error: formatError(error) };
        }
      },
    });
  }

  return tools;
}
