import { forgeMediaClient } from "@/services/api/client";

export async function createAlbum(payload: Record<string, unknown>) {
  const response = await forgeMediaClient.post("/v1/media/albums", payload);
  return response.data;
}

export async function getAlbum(albumId: string) {
  const response = await forgeMediaClient.get(`/v1/media/albums/${albumId}`);
  return response.data;
}

export async function updateAlbum(albumId: string, payload: Record<string, unknown>) {
  const response = await forgeMediaClient.patch(`/v1/media/albums/${albumId}`, payload);
  return response.data;
}

export async function addAlbumTrack(albumId: string, payload: Record<string, unknown>) {
  const response = await forgeMediaClient.post(`/v1/media/albums/${albumId}/tracks`, payload);
  return response.data;
}

export async function reorderAlbumTracks(albumId: string, payload: Record<string, unknown>) {
  const response = await forgeMediaClient.patch(`/v1/media/albums/${albumId}/tracks/reorder`, payload);
  return response.data;
}

export async function deleteAlbumTrack(albumId: string, trackId: string) {
  const response = await forgeMediaClient.delete(`/v1/media/albums/${albumId}/tracks/${trackId}`);
  return response.data;
}

export async function createMix(payload: Record<string, unknown>) {
  const response = await forgeMediaClient.post("/v1/media/mixes", payload);
  return response.data;
}

export async function getMix(mixId: string) {
  const response = await forgeMediaClient.get(`/v1/media/mixes/${mixId}`);
  return response.data;
}

export async function updateMix(mixId: string, payload: Record<string, unknown>) {
  const response = await forgeMediaClient.patch(`/v1/media/mixes/${mixId}`, payload);
  return response.data;
}
