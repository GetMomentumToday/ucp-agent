import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { SYSTEM_PROMPT } from '@/lib/system-prompt';
import { createUcpTools } from '@/lib/ucp-tools';

export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as { messages?: UIMessage[]; sessionId?: string };
  const { messages, sessionId = 'default' } = body;

  if (!Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages array is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const modelMessages = await convertToModelMessages(messages);
    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      tools: createUcpTools(sessionId),
      stopWhen: stepCountIs(15),
      onError: ({ error }) => {
        console.error('[chat route] streamText error:', error);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[chat route] error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
