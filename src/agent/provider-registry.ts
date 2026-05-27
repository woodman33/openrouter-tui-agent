export type ProviderId = 'openrouter' | 'openai';

export type ProviderService =
  | 'responses'
  | 'chat-completions'
  | 'realtime'
  | 'embeddings'
  | 'image-generation'
  | 'speech'
  | 'transcription'
  | 'moderation'
  | 'video'
  | 'model-catalog';

export interface ProviderModel {
  id: string;
  label: string;
  use: 'default' | 'coding' | 'fast' | 'low-cost' | 'vision' | 'audio' | 'image' | 'embedding' | 'moderation';
}

export interface ProviderRegistryEntry {
  id: ProviderId;
  label: string;
  apiKeyEnv: string;
  defaultModelEnv: string;
  defaultModel: string;
  baseUrl: string;
  docsUrl: string;
  services: ProviderService[];
  models: ProviderModel[];
}

export const PROVIDER_REGISTRY: readonly ProviderRegistryEntry[] = [
  {
    id: 'openrouter',
    label: 'OpenRouter',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    defaultModelEnv: 'OPENROUTER_MODEL',
    defaultModel: 'anthropic/claude-opus-4.7',
    baseUrl: 'https://openrouter.ai/api/v1',
    docsUrl: 'https://openrouter.ai/docs',
    services: ['chat-completions', 'model-catalog'],
    models: [
      { id: 'anthropic/claude-opus-4.7', label: 'Claude Opus', use: 'default' },
      { id: 'openai/gpt-5.2', label: 'OpenAI GPT-5.2 through OpenRouter', use: 'coding' },
      { id: 'google/gemini-2.5-pro', label: 'Gemini Pro through OpenRouter', use: 'vision' },
      { id: 'qwen/qwen-2.5-coder-32b', label: 'Qwen Coder through OpenRouter', use: 'coding' },
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI API',
    apiKeyEnv: 'OPENAI_API_KEY',
    defaultModelEnv: 'OPENAI_DEFAULT_MODEL',
    defaultModel: 'gpt-5.2',
    baseUrl: 'https://api.openai.com/v1',
    docsUrl: 'https://platform.openai.com/docs',
    services: [
      'responses',
      'chat-completions',
      'realtime',
      'embeddings',
      'image-generation',
      'speech',
      'transcription',
      'moderation',
      'video',
      'model-catalog',
    ],
    models: [
      { id: 'gpt-5.2', label: 'GPT-5.2', use: 'default' },
      { id: 'gpt-5.2-codex', label: 'GPT-5.2 Codex', use: 'coding' },
      { id: 'gpt-5-mini', label: 'GPT-5 mini', use: 'fast' },
      { id: 'gpt-5-nano', label: 'GPT-5 nano', use: 'low-cost' },
      { id: 'gpt-realtime', label: 'GPT Realtime', use: 'audio' },
      { id: 'gpt-image-1.5', label: 'GPT Image 1.5', use: 'image' },
      { id: 'text-embedding-3-large', label: 'Text embedding 3 large', use: 'embedding' },
      { id: 'omni-moderation-latest', label: 'Omni moderation', use: 'moderation' },
    ],
  },
] as const;

export function getProviderRegistry(): readonly ProviderRegistryEntry[] {
  return PROVIDER_REGISTRY;
}

export function getProviderById(id: ProviderId): ProviderRegistryEntry | undefined {
  return PROVIDER_REGISTRY.find((provider) => provider.id === id);
}

export function getEnabledProviders(env: NodeJS.ProcessEnv = process.env): ProviderRegistryEntry[] {
  return PROVIDER_REGISTRY.filter((provider) => Boolean(env[provider.apiKeyEnv]));
}

export function getDefaultModelForProvider(
  id: ProviderId,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const provider = getProviderById(id);
  if (!provider) return undefined;
  return env[provider.defaultModelEnv] || provider.defaultModel;
}
