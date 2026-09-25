import axios, { AxiosError, type AxiosRequestConfig, type Method } from "axios";

import type { Tokens } from "@/services/types";

const REFRESH_KEY = "shop.refresh";
export const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

const httpClient = axios.create({
  baseURL: API_BASE,
});

let accessToken: string | null = null;
let refreshRequestInFlight: Promise<boolean> | null = null;
let sessionExpiredCallback: (() => void) | null = null;

export class ApiError extends Error {
  status: number;
  silent: boolean;

  constructor(status: number, message: string, silent = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.silent = silent;
  }
}

export function setSessionExpiredHandler(handler: () => void) {
  sessionExpiredCallback = handler;
}

export function setSession(tokens: Tokens) {
  accessToken = tokens.access_token;
  if (!tokens.refresh_token) {
    return;
  }
  try {
    sessionStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  } catch {
    accessToken = null;
    throw new Error("This browser could not store your session.");
  }
}

export function clearSession() {
  accessToken = null;
  try {
    sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    accessToken = null;
  }
}

export function hasRefreshToken(): boolean {
  return Boolean(sessionStorage.getItem(REFRESH_KEY));
}

function buildErrorMessage(path: string, status: number, responseBody: unknown): string {
  const detail =
    responseBody &&
    typeof responseBody === "object" &&
    "detail" in responseBody &&
    typeof responseBody.detail === "string"
      ? responseBody.detail
      : "";
  const isLoginRequest = /\/login$/.test(path);
  const containsSensitiveServerDetails = /response=|keycloak|traceback/i.test(detail);

  if (isLoginRequest && (status === 401 || detail === "User not found" || detail === "Invalid username or password")) {
    return "Sign-in failed. Check your username and password.";
  }

  if (detail && !containsSensitiveServerDetails) {
    return detail;
  }

  if (status === 403) {
    return "You do not have access to this page.";
  }

  if (status === 404) {
    return "Not found.";
  }

  return "Something went wrong. Try again.";
}

function toApiError(path: string, error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (!axiosError.response) {
      return new ApiError(0, "The network request failed. Check your connection and try again.");
    }
    const status = axiosError.response.status;
    const body = axiosError.response.data;
    return new ApiError(status, buildErrorMessage(path, status, body));
  }
  return new ApiError(0, "Something went wrong. Try again.");
}

async function refreshSession(): Promise<boolean> {
  let refreshToken: string | null = null;
  try {
    refreshToken = sessionStorage.getItem(REFRESH_KEY);
  } catch {
    clearSession();
    return false;
  }
  if (!refreshToken) {
    clearSession();
    return false;
  }

  if (!refreshRequestInFlight) {
    refreshRequestInFlight = (async () => {
      try {
        const response = await httpClient.post<Tokens>("/auth/refresh", { refresh_token: refreshToken });
        if (!response.data?.access_token) {
          clearSession();
          return false;
        }
        setSession(response.data);
        return true;
      } catch {
        clearSession();
        return false;
      } finally {
        refreshRequestInFlight = null;
      }
    })();
  }

  return refreshRequestInFlight;
}

export type ApiRequestOptions = {
  method?: string;
  body?: string | FormData;
  auth?: boolean;
  headers?: Record<string, string>;
};

export async function api<T>(path: string, options: ApiRequestOptions = {}, allowTokenRefresh = true): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase() as Method;
  const sendAuth = options.auth !== false;

  let requestData: string | FormData | undefined;
  const requestHeaders: Record<string, string> = { ...options.headers };

  if (options.body instanceof FormData) {
    requestData = options.body;
  } else if (options.body) {
    requestData = options.body;
    if (!requestHeaders["Content-Type"]) {
      requestHeaders["Content-Type"] = "application/json";
    }
  }

  const axiosConfig: AxiosRequestConfig = {
    url: path,
    method,
    data: requestData,
    headers: requestHeaders,
  };

  if (sendAuth && accessToken) {
    axiosConfig.headers = {
      ...axiosConfig.headers,
      Authorization: `Bearer ${accessToken}`,
    };
  }

  try {
    const response = await httpClient.request<T>(axiosConfig);
    return response.data;
  } catch (error) {
    const isAuthPath = path.startsWith("/auth/refresh") || path.endsWith("/login");
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;

    if (status === 401 && !isAuthPath && sendAuth && hasRefreshToken() && allowTokenRefresh) {
      const sessionRefreshed = await refreshSession();
      if (sessionRefreshed) {
        return api<T>(path, options, false);
      }
      clearSession();
      const expiredError = new ApiError(401, "Your session expired. Sign in again.", true);
      sessionExpiredCallback?.();
      throw expiredError;
    }

    throw toApiError(path, error);
  }
}

export async function restoreSession(): Promise<boolean> {
  if (!hasRefreshToken()) {
    return false;
  }
  return refreshSession();
}
