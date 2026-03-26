import type { LanguageModel } from 'ai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';

type ModelProvider = 'gemini' | 'claude';

interface ModelConfig {
  readonly provider: ModelProvider;
  readonly modelId: string;
}

const MODELS: Record<ModelProvider, ModelConfig> = {
  gemini: { provider: 'gemini', modelId: 'gemini-2.5-flash' },
  claude: { provider: 'claude', modelId: 'claude-sonnet-4-5-20250514' }, // best value: strong tool calling, 5x cheaper than Opus
};

function resolveProvider(): ModelProvider {
  const env = process.env['AI_PROVIDER']?.toLowerCase();
  if (env === 'claude' || env === 'anthropic') return 'claude';
  if (env === 'gemini' || env === 'google') return 'gemini';

  if (process.env['ANTHROPIC_API_KEY']) return 'claude';
  if (process.env['GOOGLE_GENERATIVE_AI_API_KEY']) return 'gemini';

  return 'gemini';
}

export function getModel(): LanguageModel {
  const provider = resolveProvider();
  const config = MODELS[provider];

  const modelId = process.env['AI_MODEL'] ?? config.modelId;

  if (provider === 'claude') {
    return anthropic(modelId);
  }

  return google(modelId);
}

export function getActiveProvider(): string {
  return resolveProvider();
}
