export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const GET_CACHE_TTL_MS = 5_000;
const getCache = new Map<string, { expiresAt: number; value: unknown }>();
const envelopeCache = new Map<string, { expiresAt: number; value: { data: unknown; meta?: Record<string, unknown>; message?: string } }>();

function clearRequestCaches() {
  getCache.clear();
  envelopeCache.clear();
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function buildHeaders(init?: RequestInit): HeadersInit {
  const headers = new Headers(init?.headers ?? {});
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const method = (init?.method ?? "GET").toUpperCase();
  const csrfToken = getCookieValue("csrf_token");
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && csrfToken && !headers.has("x-csrf-token")) {
    headers.set("x-csrf-token", csrfToken);
  }
  return headers;
}

export async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const cacheKey = `${method}:${input}`;
  if (method === "GET") {
    const cached = getCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }
  }

  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: buildHeaders(init),
  });

  const body = await parseResponse(response);
  if (method !== "GET") {
    clearRequestCaches();
  }
  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message?: unknown }).message ?? "Request failed")
        : "Request failed";
    const code =
      typeof body === "object" && body && "code" in body
        ? String((body as { code?: unknown }).code ?? "")
        : undefined;
    throw new ApiClientError(message, response.status, code, body);
  }

  if (typeof body === "object" && body && "data" in body) {
    const data = (body as { data: T }).data;
    if (method === "GET") {
      getCache.set(cacheKey, { expiresAt: Date.now() + GET_CACHE_TTL_MS, value: data });
    }
    return data;
  }

  if (method === "GET") {
    getCache.set(cacheKey, { expiresAt: Date.now() + GET_CACHE_TTL_MS, value: body as T });
  }
  return body as T;
}

export async function apiRequestEnvelope<T>(
  input: string,
  init?: RequestInit,
): Promise<{ data: T; meta?: Record<string, unknown>; message?: string }> {
  const method = (init?.method ?? "GET").toUpperCase();
  const cacheKey = `${method}:${input}`;
  if (method === "GET") {
    const cached = envelopeCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as { data: T; meta?: Record<string, unknown>; message?: string };
    }
  }

  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: buildHeaders(init),
  });
  const body = await parseResponse(response);
  if (method !== "GET") {
    clearRequestCaches();
  }
  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message?: unknown }).message ?? "Request failed")
        : "Request failed";
    throw new ApiClientError(message, response.status);
  }

  if (typeof body === "object" && body && "data" in body) {
    const data = body as { data: T; meta?: Record<string, unknown>; message?: string };
    if (method === "GET") {
      envelopeCache.set(cacheKey, { expiresAt: Date.now() + GET_CACHE_TTL_MS, value: data });
    }
    return data;
  }

  const fallback = { data: body as T };
  if (method === "GET") {
    envelopeCache.set(cacheKey, { expiresAt: Date.now() + GET_CACHE_TTL_MS, value: fallback });
  }
  return fallback;
}
