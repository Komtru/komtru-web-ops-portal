import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import queryString from 'query-string';

import type {
  IBlobResponse,
  IDelete,
  IGet,
  IPatch,
  IPost,
  IPostMultipart,
  IPut,
  QueryParams,
  RequestError,
} from '@/interfaces/IAxios';
import { useAuthStore } from '@/store/auth.store';

/**
 * The browser only ever talks to this origin; `next.config.ts` rewrites
 * `/api/:path*` to `NEXT_PUBLIC_BASE_URL`. No CORS, no baked-in backend host.
 */
const BASE_URL = '/api/';

/**
 * Stable machine-readable codes the API returns alongside a 401. We branch on
 * these — never on human-readable message text, which is free to change.
 */
export const AUTH_ERROR_CODES = {
  ACCESS_TOKEN_EXPIRED: 'access_token_expired',
  ACCESS_TOKEN_REVOKED: 'access_token_revoked',
  REFRESH_TOKEN_EXPIRED: 'refresh_token_expired',
  SESSION_TERMINATED: 'session_terminated',
} as const;

const EXPIRED_CODES: string[] = [AUTH_ERROR_CODES.ACCESS_TOKEN_EXPIRED];

const REVOKED_CODES: string[] = [
  AUTH_ERROR_CODES.ACCESS_TOKEN_REVOKED,
  AUTH_ERROR_CODES.REFRESH_TOKEN_EXPIRED,
  AUTH_ERROR_CODES.SESSION_TERMINATED,
];

const LOGOUT_PATH = '/auth/logout';

/** Requests carry a `_retry` flag so a replayed request can't loop forever. */
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function serializeQuery(query?: QueryParams): string {
  if (!query) return '';

  const qs = queryString.stringify(query, {
    skipNull: true,
    skipEmptyString: true,
    arrayFormat: 'comma',
  });

  return qs ? `?${qs}` : '';
}

function withQuery(url: string, query?: QueryParams): string {
  return `${url}${serializeQuery(query)}`;
}

function readErrorCode(response?: AxiosResponse): string | undefined {
  const data = response?.data as Partial<RequestError> | undefined;
  return typeof data?.code === 'string' ? data.code : undefined;
}

function hardRedirectToLogout(code: string): void {
  if (typeof window === 'undefined') return;
  window.location.href = `${LOGOUT_PATH}?code=${code}`;
}

/** Parses `filename="…"` (and RFC 5987 `filename*=`) out of content-disposition. */
function parseFilename(disposition: string | undefined, fallback: string): string {
  if (!disposition) return fallback;

  const utf8 = /filename\*=UTF-8''([^;\n]*)/i.exec(disposition);
  if (utf8?.[1]) return decodeURIComponent(utf8[1].trim());

  const plain = /filename="?([^";\n]*)"?/i.exec(disposition);
  if (plain?.[1]) return plain[1].trim();

  return fallback;
}

/* -------------------------------------------------------------------------- */
/* Single-flight token refresh                                                 */
/* -------------------------------------------------------------------------- */

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
let failedQueue: QueuedRequest[] = [];

function flushQueue(error: unknown, token?: string): void {
  const queue = failedQueue;
  failedQueue = [];

  queue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
}

/**
 * Bare axios instance for the refresh call itself — deliberately free of
 * interceptors so a failing refresh can never re-enter this logic.
 */
const refreshClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

async function performRefresh(): Promise<string> {
  const refreshToken = useAuthStore.getState().refresh?.token;

  if (!refreshToken) {
    throw new Error('No refresh token available.');
  }

  const { data } = await refreshClient.post('auth/refresh-tokens', {
    refreshToken,
  });

  // Accept either the bare token pair or the standard `{ data }` envelope.
  const tokens = data?.data?.tokens ?? data?.tokens ?? data?.data ?? data;

  if (!tokens?.access?.token) {
    throw new Error('Refresh response did not contain an access token.');
  }

  useAuthStore.getState().setAccess(tokens);

  return tokens.access.token as string;
}

/**
 * N concurrent 401s trigger exactly one `POST /auth/refresh-tokens`; everyone
 * else waits on the same promise and replays with the fresh token.
 */
function refreshAccessToken(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  refreshPromise = performRefresh()
    .then((token) => {
      flushQueue(null, token);
      return token;
    })
    .catch((error) => {
      flushQueue(error);
      throw error;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

/* -------------------------------------------------------------------------- */
/* Interceptors — written once, attached to both instances                     */
/* -------------------------------------------------------------------------- */

function attachRequestInterceptor(instance: AxiosInstance): void {
  instance.interceptors.request.use((config) => {
    const alreadySet = Boolean(config.headers?.Authorization);

    if (!alreadySet && typeof window !== 'undefined') {
      const token = useAuthStore.getState().access?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  });
}

function attachResponseInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const response = error.response;
      const originalRequest = error.config as RetriableConfig | undefined;
      const code = readErrorCode(response);
      const status = response?.status;

      if (status === 401 && code && REVOKED_CODES.includes(code)) {
        hardRedirectToLogout('access_revoked');
        return Promise.reject(response?.data ?? error);
      }

      const isExpired = status === 401 && code ? EXPIRED_CODES.includes(code) : false;

      if (isExpired && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const token = await refreshAccessToken();
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return instance(originalRequest);
        } catch {
          hardRedirectToLogout('access_revoked');
          return Promise.reject(response?.data ?? error);
        }
      }

      // Always reject — including network/timeout errors where `response` is
      // undefined. Resolving `undefined` here would silently break callers.
      return Promise.reject(response?.data ?? normalizeTransportError(error));
    },
  );
}

function normalizeTransportError(error: AxiosError): RequestError {
  return {
    status: false,
    code: error.code,
    message:
      error.code === 'ECONNABORTED'
        ? 'The request timed out. Check your connection and try again.'
        : (error.message || 'Network request failed. Check your connection and try again.'),
  };
}

/* -------------------------------------------------------------------------- */
/* Facade                                                                      */
/* -------------------------------------------------------------------------- */

class HttpFacade {
  private readonly http: AxiosInstance;
  private readonly httpMultipart: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: BASE_URL,
      timeout: 60_000,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });

    this.httpMultipart = axios.create({
      baseURL: BASE_URL,
      timeout: 120_000,
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    [this.http, this.httpMultipart].forEach((instance) => {
      attachRequestInterceptor(instance);
      attachResponseInterceptor(instance);
    });
  }

  async get<D>({ url, query, headers }: IGet): Promise<D> {
    const response = await this.http.get<D>(withQuery(url, query), { headers });
    return response.data;
  }

  async getBlob({ url, query, headers }: IGet): Promise<IBlobResponse> {
    const response = await this.http.get(withQuery(url, query), {
      headers,
      responseType: 'blob',
    });

    return {
      blob: response.data as Blob,
      filename: parseFilename(
        response.headers['content-disposition'] as string | undefined,
        'komtru-download',
      ),
      contentType: (response.headers['content-type'] as string | undefined) ?? 'application/octet-stream',
    };
  }

  async post<D>({ url, body, query, headers }: IPost): Promise<D> {
    const response = await this.http.post<D>(withQuery(url, query), body, { headers });
    return response.data;
  }

  /** Same as `post` but hands back the whole response (for headers/status). */
  async postEntire<D>({ url, body, query, headers }: IPost): Promise<AxiosResponse<D>> {
    return this.http.post<D>(withQuery(url, query), body, { headers });
  }

  async patch<D>({ url, body, query, headers }: IPatch): Promise<D> {
    const response = await this.http.patch<D>(withQuery(url, query), body, { headers });
    return response.data;
  }

  async put<D>({ url, body, query, headers }: IPut): Promise<D> {
    const response = await this.http.put<D>(withQuery(url, query), body, { headers });
    return response.data;
  }

  async delete<D>({ url, body, headers }: IDelete): Promise<D> {
    const response = await this.http.delete<D>(url, { headers, data: body });
    return response.data;
  }

  async upload<D>({ url, data, query, headers }: IPostMultipart): Promise<D> {
    const response = await this.httpMultipart.post<D>(withQuery(url, query), data, { headers });
    return response.data;
  }
}

/** The single HTTP entry point for the app. Only `*.services.ts` may import it. */
export const http = new HttpFacade();
