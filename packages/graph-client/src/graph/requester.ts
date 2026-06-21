/**
 * Minimal Microsoft Graph requester — plain OAuth2 client-credentials + fetch,
 * no Azure SDK dependency. Honors Retry-After and backs off on 429/503.
 * Metadata only; callers use $select to request the minimum fields.
 */

export interface GraphConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  /** Override for testing / sovereign clouds. */
  baseUrl?: string;
  loginUrl?: string;
}

export interface GraphPage<T = unknown> {
  value: T[];
  nextLink?: string;
  /** Final @odata.deltaLink, present on the last page of a delta query. */
  deltaLink?: string;
}

export interface GraphRequester {
  /** GET an absolute path (e.g. "/users?$select=id") or a full nextLink URL. */
  get<T = unknown>(pathOrUrl: string): Promise<GraphPage<T>>;
  /** POST a JSON body to an absolute path (e.g. "/subscriptions") and return the parsed response. */
  post<T = unknown>(path: string, body: unknown): Promise<T>;
}

export interface RetryOptions {
  maxRetries: number;
  /** Injectable sleep (ms) — tests pass a no-op. */
  sleep: (ms: number) => Promise<void>;
  baseDelayMs?: number;
}

export class GraphError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "GraphError";
  }
}

const isRetryable = (status: number): boolean => status === 429 || status === 503 || status === 504;

/**
 * Retry a Graph call on throttling/transient errors, honoring Retry-After,
 * with exponential backoff otherwise. Deterministic given an injected sleep.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  const base = opts.baseDelayMs ?? 500;
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      const retryable = err instanceof GraphError && isRetryable(err.status);
      if (!retryable || attempt >= opts.maxRetries) throw err;
      const retryAfter = err instanceof GraphError ? err.retryAfterMs : undefined;
      const delay = retryAfter ?? base * 2 ** attempt;
      await opts.sleep(delay);
      attempt += 1;
    }
  }
}

const defaultSleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Acquire an app-only Graph token via the client-credentials flow. */
async function getAppToken(config: GraphConfig): Promise<string> {
  const loginUrl = config.loginUrl ?? "https://login.microsoftonline.com";
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });
  const res = await fetch(`${loginUrl}/${config.tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new GraphError(`token request failed: ${res.status}`, res.status);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

/** Build a live Graph requester. Caches the token; retries throttled calls. */
export function createGraphRequester(config: GraphConfig, retry?: Partial<RetryOptions>): GraphRequester {
  const baseUrl = config.baseUrl ?? "https://graph.microsoft.com/v1.0";
  const sleep = retry?.sleep ?? defaultSleep;
  const maxRetries = retry?.maxRetries ?? 5;
  let token: string | undefined;

  async function rawGet<T>(pathOrUrl: string): Promise<GraphPage<T>> {
    token ??= await getAppToken(config);
    const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${baseUrl}${pathOrUrl}`;
    const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
    if (res.status === 401) {
      token = await getAppToken(config); // refresh once
      throw new GraphError("unauthorized — token refreshed, retry", 503);
    }
    if (!res.ok) {
      const retryAfterHeader = res.headers.get("retry-after");
      const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : undefined;
      throw new GraphError(`graph GET ${url} failed: ${res.status}`, res.status, retryAfterMs);
    }
    const json = (await res.json()) as {
      value?: T[];
      "@odata.nextLink"?: string;
      "@odata.deltaLink"?: string;
    };
    return { value: json.value ?? [], nextLink: json["@odata.nextLink"], deltaLink: json["@odata.deltaLink"] };
  }

  async function rawPost<T>(path: string, body: unknown): Promise<T> {
    token ??= await getAppToken(config);
    const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      token = await getAppToken(config); // refresh once
      throw new GraphError("unauthorized — token refreshed, retry", 503);
    }
    if (!res.ok) {
      const retryAfterHeader = res.headers.get("retry-after");
      const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : undefined;
      throw new GraphError(`graph POST ${url} failed: ${res.status}`, res.status, retryAfterMs);
    }
    return (await res.json()) as T;
  }

  return {
    get: <T>(pathOrUrl: string) => withRetry(() => rawGet<T>(pathOrUrl), { maxRetries, sleep }),
    post: <T>(path: string, body: unknown) => withRetry(() => rawPost<T>(path, body), { maxRetries, sleep }),
  };
}
