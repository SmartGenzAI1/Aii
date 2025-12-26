// frontend/lib/api.ts

import { env } from "./env";

const BACKEND_URL = env("NEXT_PUBLIC_BACKEND_URL");

export async function api(
  path: string,
  options?: RequestInit
): Promise<{
  ok: boolean;
  data: any;
  error: string | null;
}> {
  if (!BACKEND_URL) {
    return {
      ok: false,
      data: null,
      error: "Backend not configured",
    };
  }

  try {
    const response = await fetch(`${BACKEND_URL}${path}`, options);
    const data = await response.json().catch(() => null);

    return {
      ok: response.ok,
      data,
      error: response.ok ? null : "Request failed",
    };
  } catch {
    return {
      ok: false,
      data: null,
      error: "Network error",
    };
  }
}
