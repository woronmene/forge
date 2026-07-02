import axios, { type AxiosInstance } from "axios";
import { getServiceBaseUrl, type ForgeServiceName } from "@/services/api/config";
import type { QueryParams } from "@/services/api/types";
import { refreshAdmin } from "@/services/auth";
import {
  clearForgeSession,
  getForgeRefreshToken,
  getForgeSessionPersistence,
  persistForgeSession,
} from "@/services/auth/storage";

export type ForgeTokenProvider = () => string | null | undefined;

function readBrowserToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("forge_access_token") ?? window.sessionStorage.getItem("forge_access_token");
}

let tokenProvider: ForgeTokenProvider | null = readBrowserToken;
let refreshPromise: Promise<string | null> | null = null;

export function setForgeTokenProvider(provider: ForgeTokenProvider | null) {
  tokenProvider = provider;
}

function compactParams(params?: QueryParams) {
  if (!params) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

function createForgeClient(service: ForgeServiceName): AxiosInstance {
  const client = axios.create({
    baseURL: getServiceBaseUrl(service),
  });

  client.interceptors.request.use((config) => {
    const token = tokenProvider?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.params) {
      config.params = compactParams(config.params as QueryParams);
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error.response?.status;
      const requestConfig = error.config as (typeof error.config & { _forgeRetried?: boolean }) | undefined;
      const requestUrl = typeof requestConfig?.url === "string" ? requestConfig.url : "";

      if (status !== 401 || !requestConfig || requestConfig._forgeRetried || requestUrl.includes("/auth/")) {
        throw error;
      }

      const refreshToken = getForgeRefreshToken();
      if (!refreshToken || typeof window === "undefined") {
        throw error;
      }

      if (!refreshPromise) {
        refreshPromise = refreshAdmin({ refreshToken })
          .then((session) => {
            persistForgeSession(session, getForgeSessionPersistence());
            return session.accessToken;
          })
          .catch(() => {
            clearForgeSession();
            return null;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const accessToken = await refreshPromise;
      if (!accessToken) {
        throw error;
      }

      requestConfig._forgeRetried = true;
      requestConfig.headers = requestConfig.headers ?? {};
      requestConfig.headers.Authorization = `Bearer ${accessToken}`;

      return client.request(requestConfig);
    },
  );

  return client;
}

export const forgeApiClient = createForgeClient("api");
export const forgeMediaClient = createForgeClient("media");
export const forgeAnalyticsClient = createForgeClient("analytics");
export const forgeUserClient = createForgeClient("user");
export const forgeWalletClient = createForgeClient("wallet");
export const forgeJavaClient = createForgeClient("java");
