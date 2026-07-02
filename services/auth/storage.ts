"use client";

export type ForgeSessionPersistence = "local" | "session";

export const FORGE_ACCESS_TOKEN_KEY = "forge_access_token";
export const FORGE_REFRESH_TOKEN_KEY = "forge_refresh_token";

export type ForgeAuthSession = {
  accessToken: string;
  refreshToken: string;
};

function readStorage(type: ForgeSessionPersistence) {
  if (typeof window === "undefined") {
    return null;
  }

  return type === "local" ? window.localStorage : window.sessionStorage;
}

function getTokenFromStorage(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
}

export function getForgeAccessToken() {
  return getTokenFromStorage(FORGE_ACCESS_TOKEN_KEY);
}

export function getForgeRefreshToken() {
  return getTokenFromStorage(FORGE_REFRESH_TOKEN_KEY);
}

export function getForgeSessionPersistence(): ForgeSessionPersistence {
  if (typeof window === "undefined") {
    return "local";
  }

  if (window.localStorage.getItem(FORGE_REFRESH_TOKEN_KEY)) {
    return "local";
  }

  return "session";
}

export function persistForgeSession(session: ForgeAuthSession, persistence: ForgeSessionPersistence) {
  if (typeof window === "undefined") {
    return;
  }

  clearForgeSession();

  const storage = readStorage(persistence);
  storage?.setItem(FORGE_ACCESS_TOKEN_KEY, session.accessToken);
  storage?.setItem(FORGE_REFRESH_TOKEN_KEY, session.refreshToken);
}

export function clearForgeSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(FORGE_ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(FORGE_REFRESH_TOKEN_KEY);
  window.sessionStorage.removeItem(FORGE_ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(FORGE_REFRESH_TOKEN_KEY);
}
