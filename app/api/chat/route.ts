import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { SYSTEM_PROMPT } from '@/lib/system-prompt';
import { createUcpTools } from '@/lib/ucp-tools';

export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as { messages?: unknown[]; sessionId?: string };
  const { messages, sessionId = 'default' } = body;

  if (!Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages array is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = streamText({
    model: anthropic('claude-sonnet-4-6-20250514'),
    system: SYSTEM_PROMPT,
    messages: messages as Parameters<typeof streamText>[0]['messages'],
    tools: createUcpTools(sessionId),
    maxSteps: 15,
  });

  return result.toDataStreamResponse();
}
