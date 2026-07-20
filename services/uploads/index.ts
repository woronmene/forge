import { forgeMediaClient } from "@/services/api/client";
import type { AssetKind } from "@/services/api/types";

export type CreateUploadUrlInput = {
  title: string;
  fileName: string;
  contentType: string;
  size?: number;
};

export type UploadUrlResponse = {
  uploadUrl: string;
  assetId?: string;
  key?: string;
  fields?: Record<string, string>;
};

export type CompleteUploadInput = {
  assetId?: string;
  key?: string;
  payload?: Record<string, unknown>;
};

const uploadUrlPaths: Record<AssetKind, string> = {
  video: "/v1/media/video/upload-url",
  audio: "/v1/media/audio/upload-url",
  image: "/v1/media/image/upload-url",
  subtitle: "/v1/media/subtitle/upload-url",
};

const completeUploadPaths: Record<AssetKind, string> = {
  video: "/v1/media/assets",
  audio: "/v1/media/assets",
  image: "/v1/media/assets",
  subtitle: "/v1/media/assets",
};

export async function createUploadUrl(kind: AssetKind, input: CreateUploadUrlInput) {
  const response = await forgeMediaClient.post<UploadUrlResponse>(uploadUrlPaths[kind], {
    title: input.title,
    content_type: input.contentType,
  });
  return response.data;
}

export async function createBatchUploadUrls(payload: Record<string, unknown>) {
  const response = await forgeMediaClient.post("/v1/media/assets/upload-batch", payload);
  return response.data;
}

export async function completeUpload(kind: AssetKind, input: CompleteUploadInput) {
  const mediaId = input.assetId;
  if (!mediaId) {
    throw new Error("completeUpload requires an assetId.");
  }

  const response = await forgeMediaClient.post(
    `${completeUploadPaths[kind]}/${mediaId}/complete-upload`,
    input.payload ?? {},
  );
  return response.data;
}
