import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { LanguageModel } from 'ai';
import { google } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';

type ModelProvider = 'gemini' | 'claude';

interface ModelConfig {
  readonly provider: ModelProvider;
  readonly modelId: string;
}

const MODELS: Record<ModelProvider, ModelConfig> = {
  gemini: { provider: 'gemini', modelId: 'gemini-2.5-flash' },
  claude: { provider: 'claude', modelId: 'claude-haiku-4-5-20251001' },
};

let dotenvCache: Record<string, string> | null = null;

function loadDotenvLocal(): Record<string, string> {
  if (dotenvCache) return dotenvCache;
  const envPath = join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) {
    dotenvCache = {};
    return dotenvCache;
  }
  const result: Record<string, string> = {};
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    result[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
  dotenvCache = result;
  return result;
}

function getEnv(key: string): string | undefined {
  const shellVal = process.env[key];
  if (shellVal && shellVal.trim().length > 0) return shellVal.trim();

  const dotenv = loadDotenvLocal();
  const fileVal = dotenv[key];
  if (fileVal && fileVal.trim().length > 0) return fileVal.trim();

  return undefined;
}

function resolveProvider(): ModelProvider {
  const env = getEnv('AI_PROVIDER')?.toLowerCase();
  if (env === 'claude' || env === 'anthropic') return 'claude';
  if (env === 'gemini' || env === 'google') return 'gemini';

  if (getEnv('ANTHROPIC_API_KEY')) return 'claude';
  if (getEnv('GOOGLE_GENERATIVE_AI_API_KEY')) return 'gemini';

  return 'gemini';
}

export function getModel(): LanguageModel {
  const provider = resolveProvider();
  const config = MODELS[provider];
  const modelId = getEnv('AI_MODEL') ?? config.modelId;

  if (provider === 'claude') {
    const apiKey = getEnv('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required for Claude provider');
    const claude = createAnthropic({
      baseURL: 'https://api.anthropic.com/v1',
      apiKey,
    });
    return claude(modelId);
  }

  return google(modelId);
}

export function getActiveProvider(): string {
  return resolveProvider();
}
