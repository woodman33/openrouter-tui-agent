/**
 * TIMMY Telemetry Secrets Redaction Utility
 * Designed to sweep and redact API tokens, Authorization headers, and environment variables.
 */

export function redactString(input: string): string {
  if (!input) return input;
  let redacted = input;

  // Redact OpenRouter API keys
  redacted = redacted.replace(/sk-or-v1-[a-f0-9]+/gi, '[REDACTED_OPENROUTER_KEY]');

  // Redact OpenAI style sk-* keys
  redacted = redacted.replace(/sk-[a-zA-Z0-9]{20,}/gi, '[REDACTED_API_KEY]');

  // Redact Authorization headers or Bearer tokens
  redacted = redacted.replace(/Bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED_TOKEN]');

  // Redact query parameters or config variables: password, token, secret, api_key
  redacted = redacted.replace(/(?:password|token|secret|api_key|api-key|apikey)\s*=\s*['"]?[a-zA-Z0-9\-._~+/]+/gi, (match) => {
    const parts = match.split('=');
    return `${parts[0]}=[REDACTED_SENSITIVE_PARAM]`;
  });

  // Redact JSON fields
  redacted = redacted.replace(/"(password|token|secret|api_key|apiKey|openrouter_api_key)"\s*:\s*"[^"]+"/gi, '"$1":"[REDACTED]"');

  // Redact Authorization: Bearer explicitly
  redacted = redacted.replace(/Authorization\s*:\s*Bearer\s+[^\s"']+/gi, 'Authorization: Bearer [REDACTED_TOKEN]');

  return redacted;
}

export function redactTelemetryPayload<T>(payload: T): T {
  if (!payload) return payload;

  if (typeof payload === 'string') {
    return redactString(payload) as unknown as T;
  }

  if (Array.isArray(payload)) {
    return payload.map(item => redactTelemetryPayload(item)) as unknown as T;
  }

  if (typeof payload === 'object') {
    const redactedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
      const lowercaseKey = key.toLowerCase();
      if (
        lowercaseKey.includes('key') ||
        lowercaseKey.includes('token') ||
        lowercaseKey.includes('secret') ||
        lowercaseKey.includes('password') ||
        lowercaseKey.includes('auth')
      ) {
        if (typeof value === 'string') {
          redactedObj[key] = '[REDACTED_SENSITIVE_KEY]';
        } else {
          redactedObj[key] = redactTelemetryPayload(value);
        }
      } else {
        redactedObj[key] = redactTelemetryPayload(value);
      }
    }
    return redactedObj as T;
  }

  return payload;
}

/**
 * Safely stringifies an object even if it contains circular references.
 */
export function safeStringify(obj: any): string {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return '[Circular]';
      }
      cache.add(value);
    }
    return value;
  });
}
