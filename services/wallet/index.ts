import { forgeApiClient, forgeJavaClient, forgeWalletClient } from "@/services/api/client";
import type { QueryParams } from "@/services/api/types";

export async function getAdminWalletOverview(params?: QueryParams & Record<string, unknown>) {
  const response = await forgeApiClient.get("/v1/admin/wallet/overview", { params });
  return response.data;
}

export async function getAdminWalletProviders() {
  const response = await forgeApiClient.get("/v1/admin/wallet/providers");
  return response.data;
}

export async function getWalletWrapperRoot() {
  const response = await forgeApiClient.get("/");
  return response.data;
}

export async function getWalletWrapperHealth() {
  const response = await forgeApiClient.get("/health");
  return response.data;
}

export async function getUpstreamTest() {
  const response = await forgeApiClient.get("/upstream/test");
  return response.data;
}

export async function getUpstreamBankList() {
  const response = await forgeApiClient.get("/upstream/banks");
  return response.data;
}

export async function getUpstreamKycLevels() {
  const response = await forgeApiClient.get("/upstream/kyc-levels");
  return response.data;
}

export async function getBankList() {
  const response = await forgeJavaClient.get("/wallet/banks");
  return response.data;
}

export async function getKycLevels() {
  const response = await forgeJavaClient.get("/wallet/kyc-levels");
  return response.data;
}

export async function getWallets(params?: QueryParams) {
  const response = await forgeWalletClient.get("/wallets", { params });
  return response.data;
}

export async function getTransactionHistory(payload: Record<string, unknown>) {
  const response = await forgeWalletClient.post("/transactions/history", payload);
  return response.data;
}

export async function exportTransactionHistory(payload: Record<string, unknown>) {
  const response = await forgeWalletClient.post("/transactions/history/export", payload, {
    responseType: "blob",
  });
  return response.data;
}
