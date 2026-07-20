import { forgeMediaClient } from "@/services/api/client";
import type { PaginationParams, QueryParams } from "@/services/api/types";

export type ListAssetsParams = PaginationParams &
  QueryParams & {
    status?: string;
    type?: string;
  };

function toAssetListParams(params?: ListAssetsParams) {
  if (!params) {
    return undefined;
  }

  const { search, type, page, pageSize, ...rest } = params;
  return {
    ...rest,
    q: search,
    asset_type: type,
    page,
    page_size: pageSize,
  };
}

export async function listAssets(params?: ListAssetsParams) {
  const response = await forgeMediaClient.get("/v1/media/assets", { params: toAssetListParams(params) });
  return response.data;
}

export async function listAssetsByKind(kind: "video" | "audio" | "image" | "subtitle", params?: ListAssetsParams) {
  const response = await forgeMediaClient.get("/v1/media/assets", {
    params: {
      ...toAssetListParams(params),
      asset_type: kind,
    },
  });
  return response.data;
}

export async function getAsset(kind: "video" | "audio" | "image" | "subtitle", assetId: string) {
  const response = await forgeMediaClient.get(`/v1/media/assets/${assetId}`);
  return response.data;
}

export async function updateAsset(
  kind: "video" | "audio" | "image" | "subtitle",
  assetId: string,
  payload: Record<string, unknown>,
) {
  const response = await forgeMediaClient.patch(`/v1/media/assets/${assetId}`, payload);
  return response.data;
}

export async function deleteAsset(kind: "video" | "audio" | "image" | "subtitle", assetId: string) {
  const response = await forgeMediaClient.delete(`/v1/media/assets/${assetId}`);
  return response.data;
}

export async function getMediaSummary(mediaId: string) {
  const response = await forgeMediaClient.get(`/internal/v1/media/${mediaId}/summary`);
  return response.data;
}

export async function getCatalogSummary() {
  const response = await forgeMediaClient.get("/internal/v1/admin/media/catalog-summary");
  return response.data;
}

export async function retryProcessing(kind: "video" | "audio", assetId: string) {
  const response = await forgeMediaClient.post(`/v1/media/assets/${assetId}/retry-processing`);
  return response.data;
}
