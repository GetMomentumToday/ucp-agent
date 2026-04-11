import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/system-prompt', () => ({
  buildSystemPrompt: vi.fn(() => 'mock system prompt'),
}));

vi.mock('@/lib/model', () => ({
  getModel: vi.fn(() => ({ modelId: 'test-model' })),
}));

vi.mock('@/lib/ucp-tools', () => ({
  createUcpTools: vi.fn(async () => ({})),
}));

vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    toUIMessageStreamResponse: () =>
      new Response('mock stream', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      }),
  })),
  convertToModelMessages: vi.fn(async (msgs: unknown[]) => msgs),
  stepCountIs: vi.fn((n: number) => n),
}));

import { POST } from './route';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3001/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when messages is missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('messages');
  });

  it('returns 400 when messages is not an array', async () => {
    const res = await POST(makeRequest({ messages: 'not-an-array' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when messages is null', async () => {
    const res = await POST(makeRequest({ messages: null }));
    expect(res.status).toBe(400);
  });

  it('returns 200 with valid messages', async () => {
    const res = await POST(
      makeRequest({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hello' }] }],
        sessionId: 'test-session',
      }),
    );
    expect(res.status).toBe(200);
  });

  it('uses default sessionId when not provided', async () => {
    const { createUcpTools } = await import('@/lib/ucp-tools');
    const res = await POST(
      makeRequest({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }],
      }),
    );
    expect(res.status).toBe(200);
    expect(createUcpTools).toHaveBeenCalledWith('default');
  });

  it('passes custom sessionId to createUcpTools', async () => {
    const { createUcpTools } = await import('@/lib/ucp-tools');
    await POST(
      makeRequest({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }],
        sessionId: 'custom-session',
      }),
    );
    expect(createUcpTools).toHaveBeenCalledWith('custom-session');
  });

  it('calls streamText with correct model and tools', async () => {
    const { streamText } = await import('ai');
    await POST(
      makeRequest({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }],
      }),
    );
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: 'mock system prompt',
      }),
    );
  });

  it('returns 500 on unexpected error', async () => {
    const { streamText } = await import('ai');
    (streamText as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await POST(
      makeRequest({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }],
      }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('boom');
  });
});
