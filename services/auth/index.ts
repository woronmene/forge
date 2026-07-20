import axios from "axios";
import { getServiceBaseUrl } from "@/services/api/config";
import {
  clearForgeSession,
  getForgeRefreshToken,
  getForgeSessionPersistence,
  type ForgeAuthSession,
  type ForgeSessionPersistence,
  persistForgeSession,
} from "@/services/auth/storage";

type LoginAdminInput = {
  username: string;
  password: string;
};

type RefreshAdminInput = {
  refreshToken: string;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableAuthError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  if (status !== undefined) {
    return status >= 500;
  }

  const code = typeof error.code === "string" ? error.code : "";
  return ["ECONNRESET", "ETIMEDOUT", "UND_ERR_SOCKET", "ERR_NETWORK"].includes(code);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function getPayloadRecord(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (isRecord(payload.data)) {
    return payload.data;
  }

  if (isRecord(payload.result)) {
    return payload.result;
  }

  return payload;
}

function normalizeAuthSession(payload: unknown): ForgeAuthSession {
  const record = getPayloadRecord(payload);

  if (!record) {
    throw new Error("Authentication response was empty.");
  }

  const accessToken =
    readString(record.access_token) ??
    readString(record.accessToken) ??
    readString(record.token) ??
    readString(record.id_token);

  const refreshToken =
    readString(record.refresh_token) ??
    readString(record.refreshToken) ??
    readString(record.refresh);

  if (!accessToken || !refreshToken) {
    throw new Error("Authentication response is missing token fields.");
  }

  return {
    accessToken,
    refreshToken,
  };
}

const forgeUserAuthClient = axios.create({
  baseURL: getServiceBaseUrl("user"),
});

export async function loginAdmin(input: LoginAdminInput) {
  const body = new URLSearchParams();
  body.set("username", input.username);
  body.set("password", input.password);

  const { data } = await forgeUserAuthClient.post("/internal/v1/admin/auth/login", body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return normalizeAuthSession(data);
}

export async function refreshAdmin(input: RefreshAdminInput) {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < 3) {
    try {
      const { data } = await forgeUserAuthClient.post("/internal/v1/admin/auth/refresh", {
        refresh_token: input.refreshToken,
      });

      return normalizeAuthSession(data);
    } catch (error) {
      lastError = error;
      attempt += 1;

      if (!isRetryableAuthError(error) || attempt >= 3) {
        throw error;
      }

      await delay(300 * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Refresh failed.");
}

export async function bootstrapForgeSession(persistence?: ForgeSessionPersistence) {
  const refreshToken = getForgeRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const session = await refreshAdmin({ refreshToken });
    persistForgeSession(session, persistence ?? getForgeSessionPersistence());
    return session;
  } catch {
    clearForgeSession();
    return null;
  }
}
