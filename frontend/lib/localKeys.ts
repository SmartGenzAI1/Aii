// frontend/lib/localKeys.ts

type Provider = "groq" | "openrouter" | "huggingface";

const KEY_PREFIX = "byo_api_key_";

export function saveApiKey(provider: Provider, key: string) {
  localStorage.setItem(KEY_PREFIX + provider, key);
}

export function getApiKey(provider: Provider): string | null {
  return localStorage.getItem(KEY_PREFIX + provider);
}

export function removeApiKey(provider: Provider) {
  localStorage.removeItem(KEY_PREFIX + provider);
}
