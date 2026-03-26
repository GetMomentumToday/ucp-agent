import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

interface AgentConfig {
  readonly name: string;
  readonly personality: string;
  readonly instructions: string;
  readonly greeting: string;
  readonly rules: readonly string[];
}

const DEFAULT_CONFIG: AgentConfig = {
  name: 'Shopping Assistant',
  personality:
    'warm, enthusiastic, and knowledgeable — like the best salesperson you have ever met',
  instructions: '',
  greeting: "Hi there! I'm your personal shopping assistant. What can I help you find today?",
  rules: [],
};

let cachedConfig: AgentConfig | null = null;

export function getAgentConfig(): AgentConfig {
  if (cachedConfig) return cachedConfig;

  const configPath = join(process.cwd(), 'agent.config.json');

  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<AgentConfig>;
      cachedConfig = { ...DEFAULT_CONFIG, ...parsed };
    } catch {
      console.error('[agent-config] Failed to parse agent.config.json, using defaults');
      cachedConfig = DEFAULT_CONFIG;
    }
  } else {
    cachedConfig = DEFAULT_CONFIG;
  }

  return cachedConfig;
}
