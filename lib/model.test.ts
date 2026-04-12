import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    existsSync: vi.fn(() => false),
    readFileSync: vi.fn(() => ''),
  };
});

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn((modelId: string) => ({ provider: 'google', modelId })),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => (modelId: string) => ({ provider: 'anthropic', modelId })),
}));

describe('getModel', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('defaults to gemini when no env vars set', async () => {
    vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'test-key');
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    vi.stubEnv('AI_PROVIDER', '');

    const { getModel } = await import('./model');
    const model = getModel() as { provider: string; modelId: string };

    expect(model.provider).toBe('google');
    expect(model.modelId).toBe('gemini-2.5-flash');
  });

  it('uses claude when AI_PROVIDER=claude', async () => {
    vi.stubEnv('AI_PROVIDER', 'claude');
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');

    const { getModel } = await import('./model');
    const model = getModel() as { provider: string; modelId: string };

    expect(model.provider).toBe('anthropic');
  });

  it('uses claude when ANTHROPIC_API_KEY is set', async () => {
    vi.stubEnv('AI_PROVIDER', '');
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');
    vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', '');

    const { getModel } = await import('./model');
    const model = getModel() as { provider: string; modelId: string };

    expect(model.provider).toBe('anthropic');
  });

  it('throws when claude selected but no API key', async () => {
    vi.stubEnv('AI_PROVIDER', 'claude');
    vi.stubEnv('ANTHROPIC_API_KEY', '');

    const { getModel } = await import('./model');
    expect(() => getModel()).toThrow('ANTHROPIC_API_KEY');
  });

  it('uses custom model ID from AI_MODEL env', async () => {
    vi.stubEnv('AI_MODEL', 'gemini-2.0-pro');
    vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'test-key');

    const { getModel } = await import('./model');
    const model = getModel() as { modelId: string };

    expect(model.modelId).toBe('gemini-2.0-pro');
  });
});

describe('getActiveProvider', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('returns gemini by default', async () => {
    vi.stubEnv('AI_PROVIDER', '');
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', '');

    const { getActiveProvider } = await import('./model');
    expect(getActiveProvider()).toBe('gemini');
  });

  it('returns claude when AI_PROVIDER=anthropic', async () => {
    vi.stubEnv('AI_PROVIDER', 'anthropic');

    const { getActiveProvider } = await import('./model');
    expect(getActiveProvider()).toBe('claude');
  });
});
