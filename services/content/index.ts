import { forgeMediaClient } from "@/services/api/client";
import type { PaginationParams, QueryParams } from "@/services/api/types";

export type ListAssetsParams = PaginationParams &
  QueryParams & {
    status?: string;
    type?: string;
  };

export async function listAssets(params?: ListAssetsParams) {
  const response = await forgeMediaClient.get("/v1/media/assets", { params });
  return response.data;
}

export async function listAssetsByKind(kind: "video" | "audio" | "image" | "subtitle", params?: ListAssetsParams) {
  const response = await forgeMediaClient.get(`/v1/media/assets/${kind}`, { params });
  return response.data;
}

export async function getAsset(kind: "video" | "audio" | "image" | "subtitle", assetId: string) {
  const response = await forgeMediaClient.get(`/v1/media/assets/${kind}/${assetId}`);
  return response.data;
}

export async function updateAsset(
  kind: "video" | "audio" | "image" | "subtitle",
  assetId: string,
  payload: Record<string, unknown>,
) {
  const response = await forgeMediaClient.patch(`/v1/media/assets/${kind}/${assetId}`, payload);
  return response.data;
}

export async function deleteAsset(kind: "video" | "audio" | "image" | "subtitle", assetId: string) {
  const response = await forgeMediaClient.delete(`/v1/media/assets/${kind}/${assetId}`);
  return response.data;
}

export async function getMediaSummary() {
  const response = await forgeMediaClient.get("/v1/media/internal/summary");
  return response.data;
}

export async function getCatalogSummary() {
  const response = await forgeMediaClient.get("/v1/media/internal/catalog-summary");
  return response.data;
}

export async function retryProcessing(kind: "video" | "audio", assetId: string) {
  const response = await forgeMediaClient.post(`/v1/media/assets/${kind}/${assetId}/retry-processing`);
  return response.data;
}
