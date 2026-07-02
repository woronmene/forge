export const forgeApiConfig = {
  apiBaseUrl: "/api/forge/api",
  mediaBaseUrl: "/api/forge/media",
  analyticsBaseUrl: "/api/forge/analytics",
  userBaseUrl: "/api/forge/user",
  walletBaseUrl: "/api/forge/wallet",
  javaBaseUrl: "/api/forge/java",
} as const;

export type ForgeServiceName =
  | "api"
  | "media"
  | "analytics"
  | "user"
  | "wallet"
  | "java";

export function getServiceBaseUrl(service: ForgeServiceName): string {
  const baseUrl = {
    api: forgeApiConfig.apiBaseUrl,
    media: forgeApiConfig.mediaBaseUrl,
    analytics: forgeApiConfig.analyticsBaseUrl,
    user: forgeApiConfig.userBaseUrl,
    wallet: forgeApiConfig.walletBaseUrl,
    java: forgeApiConfig.javaBaseUrl,
  }[service];

  return baseUrl;
}
