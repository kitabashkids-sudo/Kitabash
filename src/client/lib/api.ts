import { useCallback, useEffect, useRef, useState } from 'react';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; raw?: Blob | ArrayBuffer; headers?: Record<string, string> } = {}): Promise<T> {
  const method = opts.method || (opts.body !== undefined || opts.raw ? 'POST' : 'GET');
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: {
      ...(opts.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(method !== 'GET' ? { 'x-kitabash': '1' } : {}),
      ...opts.headers,
    },
    body: opts.raw ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, data?.error || `Request failed (${res.status})`);
  return data as T;
}

export function upload<T = any>(path: string, file: File, query: Record<string, string> = {}, method = 'PUT') {
  const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== '' && v !== undefined)).toString();
  return api<T>(`${path}${qs ? `?${qs}` : ''}`, { method, raw: file, headers: { 'x-filename': encodeURIComponent(file.name), 'content-type': file.type || 'application/octet-stream' } });
}

/** Fetch-on-mount hook with reload(). */
export function useApi<T = any>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);
  const seq = useRef(0);
  const load = useCallback(async () => {
    if (!path) return;
    const n = ++seq.current;
    setLoading(true);
    try {
      const d = await api<T>(path);
      if (n === seq.current) {
        setData(d);
        setError(null);
      }
    } catch (e) {
      if (n === seq.current) setError((e as Error).message);
    } finally {
      if (n === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  useEffect(() => {
    void load();
  }, [load]);
  return { data, error, loading, reload: load, setData };
}
