import { ApiError, type Page } from "./types";

export type ApiClientOptions = { baseUrl: string; fetcher?: typeof fetch; getToken?: () => string | undefined };
export class ApiClient {
  private readonly fetcher: typeof fetch;
  constructor(private readonly options: ApiClientOptions) { this.fetcher = options.fetcher ?? fetch; }
  async get<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
    const url = new URL(path, this.options.baseUrl);
    Object.entries(params ?? {}).forEach(([key, value]) => value && url.searchParams.set(key, value));
    return this.request<T>(url.toString(), { method: "GET" });
  }
  async list<T>(path: string, params?: Record<string, string | undefined>): Promise<Page<T>> { return this.get<Page<T>>(path, params); }
  async post<T>(path: string, body: unknown, idempotencyKey: string): Promise<T> { return this.request<T>(new URL(path, this.options.baseUrl).toString(), { method: "POST", headers: { "content-type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify(body) }); }
  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const token = this.options.getToken?.();
    const response = await this.fetcher(url, { ...init, headers: { accept: "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...init.headers } });
    if (!response.ok) { let problem; try { problem = await response.json(); } catch { problem = { type: "about:blank", title: response.statusText, status: response.status }; } throw new ApiError(problem); }
    return response.json() as Promise<T>;
  }
}
