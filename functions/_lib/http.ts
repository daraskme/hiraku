export interface Env {
  HIRAKU_KV: KVNamespace;
}

export function jsonResponse(
  data: unknown,
  init: { status?: number; headers?: HeadersInit } = {}
): Response {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  return new Response(JSON.stringify(data), { status: init.status ?? 200, headers });
}
