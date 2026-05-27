# Provider Registry

The provider registry is additive. It does not change the current TIMMY runtime path, which remains OpenRouter-first through `@openrouter/sdk`.

## Source

Provider metadata lives in `src/agent/provider-registry.ts`.

The registry includes:

- provider id and label
- API key environment variable name
- default model environment variable name
- default model
- base API URL
- docs URL
- service families
- curated model entries

## OpenRouter

OpenRouter remains the active default provider. TIMMY reads:

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`

The model explorer still fetches the live OpenRouter catalog from `https://openrouter.ai/api/v1/models` through `src/agent/openrouter-client.ts`.

## OpenAI API

The OpenAI provider entry is optional and direct. It reads:

- `OPENAI_API_KEY`
- `OPENAI_DEFAULT_MODEL`

The registry records OpenAI API service families that map to current platform capabilities:

- Responses
- Chat Completions
- Realtime
- Embeddings
- Image generation
- Speech
- Transcription
- Moderation
- Video
- Model catalog

The default OpenAI model is `gpt-5.2`, with additional entries for Codex, mini, nano, realtime, image, embedding, and moderation use cases.

## Runtime Rule

Do not remove OpenRouter behavior when adding direct provider support. A future runtime switch should choose a provider explicitly and keep OpenRouter fallback intact.
