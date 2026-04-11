import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

import { existsSync, readFileSync } from 'node:fs';

describe('getAgentConfig', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(existsSync).mockReset();
    vi.mocked(readFileSync).mockReset();
  });

  it('returns config from agent.config.json when file exists', async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(
      JSON.stringify({
        name: 'Test Bot',
        personality: 'Friendly tester',
        instructions: 'Test products',
        greeting: 'Hello!',
        rules: ['Be nice'],
      }),
    );

    const { getAgentConfig } = await import('./agent-config');
    const config = getAgentConfig();

    expect(config.name).toBe('Test Bot');
    expect(config.personality).toBe('Friendly tester');
    expect(config.rules).toEqual(['Be nice']);
  });

  it('returns defaults when file does not exist', async () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const { getAgentConfig } = await import('./agent-config');
    const config = getAgentConfig();

    expect(config.name).toBe('Shopping Assistant');
    expect(config.rules).toEqual([]);
  });

  it('returns defaults when file has invalid JSON', async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue('not valid json{{{');

    const { getAgentConfig } = await import('./agent-config');
    const config = getAgentConfig();

    expect(config.name).toBe('Shopping Assistant');
  });

  it('merges partial config with defaults', async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ name: 'Custom Name' }));

    const { getAgentConfig } = await import('./agent-config');
    const config = getAgentConfig();

    expect(config.name).toBe('Custom Name');
    expect(config.greeting).toContain('shopping assistant');
  });
});
