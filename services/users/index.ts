import { forgeUserClient } from "@/services/api/client";
import type { QueryParams } from "@/services/api/types";

export async function exportUsers(params?: QueryParams) {
  const response = await forgeUserClient.get("/v2/admin/users/export", {
    params,
    responseType: "blob",
  });
  return response.data;
}

export async function inviteAdminUser(payload: Record<string, unknown>) {
  const response = await forgeUserClient.post("/v2/admin/users/invite", payload);
  return response.data;
}

export async function getUserDetail(userId: string) {
  const response = await forgeUserClient.get(`/v2/admin/users/${userId}`);
  return response.data;
}

export async function updateUserRole(userId: string, payload: Record<string, unknown>) {
  const response = await forgeUserClient.patch(`/v2/admin/users/${userId}/role`, payload);
  return response.data;
}

export async function updateUserStatus(userId: string, payload: Record<string, unknown>) {
  const response = await forgeUserClient.patch(`/v2/admin/users/${userId}/status`, payload);
  return response.data;
}

export async function updateUserFlag(userId: string, payload: Record<string, unknown>) {
  const response = await forgeUserClient.patch(`/v2/admin/users/${userId}/flag`, payload);
  return response.data;
}

export async function triggerPasswordReset(userId: string) {
  const response = await forgeUserClient.post(`/v2/admin/users/${userId}/password-reset`);
  return response.data;
}

export async function revokeSpecificSession(userId: string, payload: Record<string, unknown>) {
  const response = await forgeUserClient.post(`/v2/admin/users/${userId}/sessions/revoke`, payload);
  return response.data;
}

export async function revokeAllSessions(userId: string) {
  const response = await forgeUserClient.post(`/v2/admin/users/${userId}/sessions/revoke-all`);
  return response.data;
}

export async function getUserAudit(userId: string, params?: QueryParams) {
  const response = await forgeUserClient.get(`/v2/admin/users/${userId}/audit`, { params });
  return response.data;
}

export async function savePlaybackPosition(payload: Record<string, unknown>) {
  const response = await forgeUserClient.post("/v2/playback/positions", payload);
  return response.data;
}

export async function listPlaybackPositions(params?: QueryParams) {
  const response = await forgeUserClient.get("/v2/playback/positions", { params });
  return response.data;
}

export async function deletePlaybackPosition(positionId: string) {
  const response = await forgeUserClient.delete(`/v2/playback/positions/${positionId}`);
  return response.data;
}
