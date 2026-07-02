import { forgeAnalyticsClient } from "@/services/api/client";
import type { QueryParams } from "@/services/api/types";

export async function getMediaOverview(params?: QueryParams) {
  const response = await forgeAnalyticsClient.get("/v1/analytics/media/overview", { params });
  return response.data;
}

export async function getMediaOverviewCsv(params?: QueryParams) {
  const response = await forgeAnalyticsClient.get("/v1/analytics/media/overview/export", {
    params,
    responseType: "blob",
  });
  return response.data;
}

export async function getAssetDrilldown(assetId: string, params?: QueryParams) {
  const response = await forgeAnalyticsClient.get(`/v1/analytics/media/assets/${assetId}/drilldown`, { params });
  return response.data;
}

export async function getUserEngagementOverview(params?: QueryParams) {
  const response = await forgeAnalyticsClient.get("/v1/analytics/users/engagement", { params });
  return response.data;
}

export async function getUserEngagementDetail(userId: string, params?: QueryParams) {
  const response = await forgeAnalyticsClient.get(`/v1/analytics/users/${userId}/engagement-detail`, { params });
  return response.data;
}

export async function getWalletOverview(params?: QueryParams) {
  const response = await forgeAnalyticsClient.get("/v1/analytics/wallet/overview", { params });
  return response.data;
}
