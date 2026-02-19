export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export async function api<T>(
  path: string,
  options?: { method?: HttpMethod; body?: unknown; headers?: Record<string, string> }
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: options?.method ?? "GET",
    credentials: "include", // cookie-based auth; keep this if backend uses sessions
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}
