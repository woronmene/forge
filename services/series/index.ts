import { forgeMediaClient } from "@/services/api/client";

export async function createSeries(payload: Record<string, unknown>) {
  const response = await forgeMediaClient.post("/v1/media/series", payload);
  return response.data;
}

export async function getSeries(seriesId: string) {
  const response = await forgeMediaClient.get(`/v1/media/series/${seriesId}`);
  return response.data;
}

export async function updateSeries(seriesId: string, payload: Record<string, unknown>) {
  const response = await forgeMediaClient.patch(`/v1/media/series/${seriesId}`, payload);
  return response.data;
}

export async function createSeason(seriesId: string, payload: Record<string, unknown>) {
  const response = await forgeMediaClient.post(`/v1/media/series/${seriesId}/seasons`, payload);
  return response.data;
}

export async function updateSeason(seasonId: string, payload: Record<string, unknown>) {
  const response = await forgeMediaClient.patch(`/v1/media/seasons/${seasonId}`, payload);
  return response.data;
}

export async function createEpisode(seasonId: string, payload: Record<string, unknown>) {
  const response = await forgeMediaClient.post(`/v1/media/seasons/${seasonId}/episodes`, payload);
  return response.data;
}

export async function updateEpisode(episodeId: string, payload: Record<string, unknown>) {
  const response = await forgeMediaClient.patch(`/v1/media/episodes/${episodeId}`, payload);
  return response.data;
}
