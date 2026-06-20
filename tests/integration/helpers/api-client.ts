import type { BootResult } from '@rangka/core';

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(private bootResult: BootResult) {
    const address = bootResult.server!.addresses()[0];
    this.baseUrl = `http://localhost:${address.port}`;
  }

  async login(email = 'system@rangka.local', password = 'admin'): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/core/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Login failed with status ${res.status}`);
    }
    const body = await res.json();
    this.token = body.data?.token ?? body.token;
  }

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async get(path: string, query?: Record<string, string>): Promise<ApiResponse> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value);
      }
    }
    const res = await fetch(url.toString(), { headers: this.authHeaders() });
    return this.toApiResponse(res);
  }

  async post(path: string, body: Record<string, unknown>): Promise<ApiResponse> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(body),
    });
    return this.toApiResponse(res);
  }

  async put(path: string, body: Record<string, unknown>): Promise<ApiResponse> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.authHeaders(),
      body: JSON.stringify(body),
    });
    return this.toApiResponse(res);
  }

  async delete(path: string): Promise<ApiResponse> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers,
    });
    return this.toApiResponse(res);
  }

  async getRaw(path: string, init?: RequestInit): Promise<Response> {
    const headers = { ...this.authHeaders(), ...(init?.headers ?? {}) };
    return fetch(`${this.baseUrl}${path}`, { ...init, headers });
  }

  private async toApiResponse(res: Response): Promise<ApiResponse> {
    const status = res.status;
    if (status === 204) {
      return { status, data: null, meta: null, error: null };
    }
    const json = await res.json();
    return {
      status,
      data: json.data ?? null,
      meta: json.meta ?? null,
      error: json.error ?? null,
    };
  }
}

export interface ApiResponse {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;
}
