"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { DataCardRow, ToolbarButton, ToolbarSearchField, ToolbarSelect } from "@/components/dashboard-widgets";
import { FieldLabel, StatusBadge, SurfaceCard, TextAreaField, TextField } from "@/components/page-primitives";
import { forgeQueryKeys } from "@/services/api/query-keys";
import { createAlbum, createMix, getAlbum, getMix, updateAlbum, updateMix, addAlbumTrack } from "@/services/albums";
import { listAssets } from "@/services/content";

type AlbumRow = {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  genre: string;
  tracks: string;
  status: string;
  dateAdded: string;
  tone: "purple" | "cyan" | "blue" | "gray";
  swatch: string;
  linkedEntityType: string | null;
  linkedEntityId: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function parseError(error: unknown) {
  if (error instanceof AxiosError) {
    const detail = error.response?.data;

    if (typeof detail === "string") {
      return detail;
    }

    if (isRecord(detail) && typeof detail.detail === "string") {
      return detail.detail;
    }

    if (isRecord(detail) && Array.isArray(detail.detail) && detail.detail.length > 0) {
      const first = detail.detail[0];
      if (isRecord(first) && typeof first.msg === "string") {
        return first.msg;
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "We could not complete the music request.";
}

function getList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [
    payload.items,
    payload.assets,
    payload.results,
    payload.records,
    isRecord(payload.data) ? payload.data.items : undefined,
    isRecord(payload.data) ? payload.data.assets : undefined,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function toSentenceCase(input: string) {
  return input
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function resolveStatus(value: unknown) {
  const normalized = getString(value)?.toLowerCase();
  if (!normalized) {
    return "Unknown";
  }

  if (normalized.includes("pending") || normalized.includes("upload")) return "Queued";
  if (normalized.includes("ready") || normalized.includes("live")) return "Ready";
  if (normalized.includes("process")) return "Processing";
  if (normalized.includes("queue")) return "Queued";
  if (normalized.includes("draft")) return "Draft";
  return toSentenceCase(normalized);
}

function hashColor(seed: string) {
  const colors = ["#161D2D", "#26254E", "#214A7C", "#352052", "#1C371B", "#4A2320", "#6C2151", "#315B5F", "#5D6024"];
  const hash = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function resolveType(record: Record<string, unknown>) {
  const linkedEntityType = getString(record.linked_entity_type)?.toUpperCase();
  if (linkedEntityType === "DJ_MIX") {
    return "DJ Mix";
  }

  const joined = [
    getString(record.content_type),
    getString(record.contentType),
    getString(record.asset_type),
    getString(record.assetType),
    getString(record.type),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (joined.includes("mix")) {
    return "DJ Mix";
  }

  return "Album";
}

function resolveTone(type: string) {
  if (type === "DJ Mix") {
    return "cyan" as const;
  }

  if (type === "Album") {
    return "purple" as const;
  }

  return "blue" as const;
}

function adaptRows(payload: unknown): AlbumRow[] {
  return getList(payload)
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .filter((record) => {
      const joined = [
        getString(record.content_type),
        getString(record.contentType),
        getString(record.asset_type),
        getString(record.assetType),
        getString(record.type),
        getString(record.linked_entity_type),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return joined.includes("album") || joined.includes("mix") || joined.includes("audio") || joined.includes("track");
    })
    .map((record, index) => {
      const type = resolveType(record);

      return {
        id: getString(record.media_id) ?? getString(record.id) ?? `album-${index + 1}`,
        title:
          getString(record.title) ??
          getString(record.asset_title) ??
          getString(record.name) ??
          `${type} ${index + 1}`,
        subtitle:
          getString(record.artist_name) ??
          getString(record.artist) ??
          getString(record.creator_name) ??
          getString(record.linked_entity_type) ??
          "Backend music asset",
        type,
        genre: toSentenceCase(getString(record.genre) ?? getString(record.category) ?? "Unspecified"),
        tracks: String(getNumber(record.track_count ?? record.tracks) ?? "—"),
        status: resolveStatus(record.processing_status ?? record.status ?? record.state),
        dateAdded: formatDate(record.created_at ?? record.createdAt ?? record.updated_at),
        tone: resolveTone(type),
        swatch: hashColor(getString(record.media_id) ?? getString(record.id) ?? `album-${index + 1}`),
        linkedEntityType: getString(record.linked_entity_type) ?? null,
        linkedEntityId: getString(record.linked_entity_id) ?? null,
      };
    });
}

function parseArtistNames(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AlbumsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [statusFilter, setStatusFilter] = useState("All status");
  const [editorKind, setEditorKind] = useState<"album" | "mix">("album");
  const [entityIdInput, setEntityIdInput] = useState("");
  const [createAlbumTitle, setCreateAlbumTitle] = useState("");
  const [createMixTitle, setCreateMixTitle] = useState("");
  const [createMixArtist, setCreateMixArtist] = useState("");
  const [createMixAssetId, setCreateMixAssetId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editArtists, setEditArtists] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMixArtist, setEditMixArtist] = useState("");
  const [editMixAssetId, setEditMixAssetId] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [trackNumber, setTrackNumber] = useState("1");
  const [trackAssetMediaId, setTrackAssetMediaId] = useState("");
  const [localActionMessage, setLocalActionMessage] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: forgeQueryKeys.content.list({ search, domain: "albums" }),
    queryFn: async () => adaptRows(await listAssets({ search: search || undefined })),
  });

  const rows = useMemo(
    () =>
      (listQuery.data ?? []).filter((row) => {
        const matchesSearch = !search || `${row.title} ${row.subtitle} ${row.genre}`.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === "All types" || row.type === typeFilter;
        const matchesStatus = statusFilter === "All status" || row.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
      }),
    [listQuery.data, search, statusFilter, typeFilter],
  );

  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const derivedKind = selected?.linkedEntityType?.toUpperCase() === "DJ_MIX" ? "mix" : "album";
  const derivedEntityId = selected?.linkedEntityId ?? "";
  const activeKind = entityIdInput.trim() ? editorKind : derivedEntityId ? derivedKind : editorKind;
  const activeEntityId = entityIdInput.trim() || derivedEntityId;

  const detailQuery = useQuery({
    queryKey: activeKind === "album" ? forgeQueryKeys.albums.detail(activeEntityId) : forgeQueryKeys.albums.mixDetail(activeEntityId),
    queryFn: () => (activeKind === "album" ? getAlbum(activeEntityId) : getMix(activeEntityId)),
    enabled: activeEntityId.length > 0,
  });

  useEffect(() => {
    if (!detailQuery.data || !isRecord(detailQuery.data)) {
      return;
    }

    setEditTitle(getString(detailQuery.data.title) ?? "");
    setEditGenre(getString(detailQuery.data.genre) ?? "");
    setEditDescription(getString(detailQuery.data.description) ?? "");

    if (activeKind === "album") {
      const artistNames = Array.isArray(detailQuery.data.artist_names)
        ? detailQuery.data.artist_names.filter((value): value is string => typeof value === "string")
        : [];
      setEditArtists(artistNames.join(", "));
    } else {
      setEditMixArtist(getString(detailQuery.data.artist_name) ?? "");
      setEditMixAssetId(getString(detailQuery.data.asset_media_id) ?? "");
    }
  }, [activeKind, detailQuery.data]);

  const createAlbumMutation = useMutation({
    mutationFn: () => createAlbum({ title: createAlbumTitle.trim() }),
    onSuccess: async (data) => {
      const createdId = isRecord(data) ? getString(data.media_id) : undefined;
      setLocalActionMessage(createdId ? `Album created: ${createdId}` : "Album created successfully.");
      setCreateAlbumTitle("");
      if (createdId) {
        setEditorKind("album");
        setEntityIdInput(createdId);
        await queryClient.invalidateQueries({ queryKey: forgeQueryKeys.albums.detail(createdId) });
      }
    },
  });

  const createMixMutation = useMutation({
    mutationFn: () =>
      createMix({
        title: createMixTitle.trim(),
        artist_name: createMixArtist.trim(),
        asset_media_id: createMixAssetId.trim(),
      }),
    onSuccess: async (data) => {
      const createdId = isRecord(data) ? getString(data.media_id) : undefined;
      setLocalActionMessage(createdId ? `Mix created: ${createdId}` : "Mix created successfully.");
      setCreateMixTitle("");
      setCreateMixArtist("");
      setCreateMixAssetId("");
      if (createdId) {
        setEditorKind("mix");
        setEntityIdInput(createdId);
        await queryClient.invalidateQueries({ queryKey: forgeQueryKeys.albums.mixDetail(createdId) });
      }
    },
  });

  const updateEntityMutation = useMutation({
    mutationFn: () =>
      activeKind === "album"
        ? updateAlbum(activeEntityId, {
            title: editTitle.trim(),
            artist_names: parseArtistNames(editArtists),
            genre: editGenre.trim() || null,
            description: editDescription.trim() || null,
          })
        : updateMix(activeEntityId, {
            title: editTitle.trim(),
            artist_name: editMixArtist.trim(),
            asset_media_id: editMixAssetId.trim(),
            genre: editGenre.trim() || null,
            description: editDescription.trim() || null,
          }),
    onSuccess: async () => {
      setLocalActionMessage(`${activeKind === "album" ? "Album" : "Mix"} updated successfully.`);
      await queryClient.invalidateQueries({
        queryKey: activeKind === "album" ? forgeQueryKeys.albums.detail(activeEntityId) : forgeQueryKeys.albums.mixDetail(activeEntityId),
      });
      await queryClient.invalidateQueries({ queryKey: forgeQueryKeys.content.lists() });
    },
  });

  const addTrackMutation = useMutation({
    mutationFn: () =>
      addAlbumTrack(activeEntityId, {
        title: trackTitle.trim(),
        track_number: Number(trackNumber),
        asset_media_id: trackAssetMediaId.trim(),
      }),
    onSuccess: async () => {
      setLocalActionMessage("Track added to album successfully.");
      setTrackTitle("");
      setTrackNumber("1");
      setTrackAssetMediaId("");
      await queryClient.invalidateQueries({ queryKey: forgeQueryKeys.albums.detail(activeEntityId) });
    },
  });

  const errorMessage = listQuery.error ? parseError(listQuery.error) : null;
  const detailError = detailQuery.error ? parseError(detailQuery.error) : null;
  const actionError = createAlbumMutation.error
    ? parseError(createAlbumMutation.error)
    : createMixMutation.error
      ? parseError(createMixMutation.error)
      : updateEntityMutation.error
        ? parseError(updateEntityMutation.error)
        : addTrackMutation.error
          ? parseError(addTrackMutation.error)
          : null;
  const unauthorized =
    errorMessage?.toLowerCase().includes("401") ||
    errorMessage?.toLowerCase().includes("unauthorized") ||
    detailError?.toLowerCase().includes("401") ||
    detailError?.toLowerCase().includes("unauthorized");
  const types = Array.from(new Set(rows.map((row) => row.type)));
  const statuses = Array.from(new Set(rows.map((row) => row.status)));

  return (
    <DashboardShell title="Albums & mixes" description="Browse backend-backed music assets and manage the live album and mix entity routes">
      <div className="space-y-5 px-4 py-5 md:px-6 xl:px-8">
        <SurfaceCard className="border-[#E5E7EB] bg-[#F9FAFB]">
          <div className="p-4 text-[14px] text-[#5A6170]">
            <p className="font-semibold text-[#16181D]">Backend fit for albums and mixes</p>
            <p className="mt-1">
              Album create/detail/update and track creation are live. Mix create/detail/update are also live when you provide an uploaded audio `media_id`. This page now uses those real routes instead of a placeholder drawer.
            </p>
          </div>
        </SurfaceCard>

        <div className="flex flex-wrap items-center gap-4">
          <ToolbarSearchField placeholder="Search by title, artist, genre..." value={search} onChange={setSearch} />
          <ToolbarSelect value={typeFilter} onChange={setTypeFilter} options={["All types", ...types]} />
          <ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={["All status", ...statuses]} />
        </div>

        {errorMessage || detailError ? (
          <SurfaceCard className="border-[#F7C9D1] bg-[#FFF7F8]">
            <div className="p-4 text-[14px] text-[#7A2230]">
              <p className="font-semibold">{unauthorized ? "Login required for music assets" : "Music data is unavailable right now"}</p>
              <p className="mt-1">{errorMessage ?? detailError}</p>
            </div>
          </SurfaceCard>
        ) : null}

        {actionError ? (
          <SurfaceCard className="border-[#F7C9D1] bg-[#FFF7F8]">
            <div className="p-4 text-[14px] text-[#7A2230]">
              <p className="font-semibold">The last music action failed</p>
              <p className="mt-1">{actionError}</p>
            </div>
          </SurfaceCard>
        ) : null}

        {localActionMessage ? (
          <SurfaceCard className="border-[#CFE0FF] bg-[#F6F8FF]">
            <div className="p-4 text-[14px] text-[#3150FF]">{localActionMessage}</div>
          </SurfaceCard>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <SurfaceCard className="overflow-hidden">
            <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] border-b border-[#ECEEF2] px-[18px] py-4 text-[13px] font-medium uppercase tracking-[0.02em] text-[#8E929B] lg:grid">
              <div className="pl-[110px]">Title</div>
              <div>Type</div>
              <div>Genre</div>
              <div>Tracks</div>
              <div>Status</div>
              <div>Date added</div>
            </div>

            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  setSelectedId(row.id);
                  if (row.linkedEntityId) {
                    setEntityIdInput(row.linkedEntityId);
                    setEditorKind(row.linkedEntityType?.toUpperCase() === "DJ_MIX" ? "mix" : "album");
                  }
                }}
                className="grid w-full items-center gap-4 border-b border-[#ECEEF2] px-[18px] py-[18px] text-left transition hover:bg-[#FAFBFF] lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr]"
              >
                <DataCardRow title={row.title} subtitle={row.subtitle} swatch={row.swatch} />
                <div className="flex items-center justify-between lg:block">
                  <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Type</span>
                  <StatusBadge tone={row.tone}>{row.type}</StatusBadge>
                </div>
                <div className="flex items-center justify-between text-[15px] text-[#16181D] lg:block">
                  <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Genre</span>
                  {row.genre}
                </div>
                <div className="flex items-center justify-between text-[15px] text-[#16181D] lg:block">
                  <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Tracks</span>
                  {row.tracks}
                </div>
                <div className="flex items-center justify-between lg:block">
                  <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Status</span>
                  <StatusBadge tone={row.status === "Ready" ? "ready" : row.status === "Processing" ? "blue" : row.status === "Queued" ? "gray" : "purple"}>
                    {row.status}
                  </StatusBadge>
                </div>
                <div className="flex items-center justify-between text-[15px] text-[#16181D] lg:block">
                  <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Date added</span>
                  {row.dateAdded}
                </div>
              </button>
            ))}

            {listQuery.isLoading ? (
              <div className="flex items-center justify-center gap-3 px-[18px] py-10 text-[14px] text-[#6F7480]">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading backend music assets…
              </div>
            ) : null}

            {rows.length === 0 && !listQuery.isLoading ? (
              <div className="px-[18px] py-10 text-center text-[14px] text-[#6F7480]">No album or mix assets were found in the current backend response.</div>
            ) : null}
          </SurfaceCard>

          <div className="space-y-4">
            <SurfaceCard>
              <div className="p-5">
                <p className="text-[16px] font-semibold text-[#16181D]">Create new music entities</p>
                <p className="mt-1 text-[14px] text-[#6F7480]">Albums only need a title. Mixes need a title, artist name, and uploaded audio `media_id`.</p>

                <div className="mt-4 space-y-5">
                  <div className="rounded-[16px] border border-[#ECEEF2] p-4">
                    <p className="text-[14px] font-semibold text-[#16181D]">Create album</p>
                    <div className="mt-3 space-y-3">
                      <div>
                        <FieldLabel required>Album title</FieldLabel>
                        <TextField value={createAlbumTitle} onChange={setCreateAlbumTitle} placeholder="e.g. Motherland" />
                      </div>
                      <button
                        type="button"
                        onClick={() => void createAlbumMutation.mutate()}
                        disabled={!createAlbumTitle.trim() || createAlbumMutation.isPending}
                        className="inline-flex h-[46px] w-full items-center justify-center rounded-full bg-[#3150FF] text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {createAlbumMutation.isPending ? "Creating…" : "Create live album"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[16px] border border-[#ECEEF2] p-4">
                    <p className="text-[14px] font-semibold text-[#16181D]">Create mix</p>
                    <div className="mt-3 space-y-3">
                      <div>
                        <FieldLabel required>Mix title</FieldLabel>
                        <TextField value={createMixTitle} onChange={setCreateMixTitle} placeholder="e.g. Afrobeats Vibes Vol. 3" />
                      </div>
                      <div>
                        <FieldLabel required>Artist / DJ</FieldLabel>
                        <TextField value={createMixArtist} onChange={setCreateMixArtist} placeholder="e.g. DJ Kobby" />
                      </div>
                      <div>
                        <FieldLabel required>Uploaded audio media ID</FieldLabel>
                        <TextField value={createMixAssetId} onChange={setCreateMixAssetId} placeholder="Paste an audio media_id from /upload" />
                      </div>
                      <button
                        type="button"
                        onClick={() => void createMixMutation.mutate()}
                        disabled={!createMixTitle.trim() || !createMixArtist.trim() || !createMixAssetId.trim() || createMixMutation.isPending}
                        className="inline-flex h-[46px] w-full items-center justify-center rounded-full border border-[#16181D] bg-[#16181D] text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {createMixMutation.isPending ? "Creating…" : "Create live mix"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[16px] font-semibold text-[#16181D]">Album / mix editor</p>
                    <p className="mt-1 text-[14px] text-[#6F7480]">Load a known entity `media_id` and manage its live payload.</p>
                  </div>
                  <ToolbarButton onClick={() => void detailQuery.refetch()}>Reload</ToolbarButton>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEditorKind("album")}
                      className={`inline-flex h-[42px] items-center rounded-full px-4 text-[14px] font-medium ${
                        activeKind === "album" ? "bg-[#3150FF] text-white" : "border border-[#E6E7EC] bg-white text-[#16181D]"
                      }`}
                    >
                      Album
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorKind("mix")}
                      className={`inline-flex h-[42px] items-center rounded-full px-4 text-[14px] font-medium ${
                        activeKind === "mix" ? "bg-[#16181D] text-white" : "border border-[#E6E7EC] bg-white text-[#16181D]"
                      }`}
                    >
                      Mix
                    </button>
                  </div>

                  <div>
                    <FieldLabel>{activeKind === "album" ? "Album media ID" : "Mix media ID"}</FieldLabel>
                    <TextField value={entityIdInput} onChange={setEntityIdInput} placeholder={`Paste a ${activeKind} media_id`} />
                  </div>

                  {detailQuery.isLoading ? (
                    <div className="flex items-center gap-3 rounded-[16px] border border-[#ECEEF2] p-4 text-[14px] text-[#6F7480]">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Loading {activeKind} detail…
                    </div>
                  ) : null}

                  {detailQuery.data && isRecord(detailQuery.data) ? (
                    <>
                      <div className="rounded-[16px] border border-[#ECEEF2] bg-[#FCFCFD] p-4">
                        <p className="text-[12px] font-semibold uppercase text-[#7B8088]">Live {activeKind} metadata</p>
                        <p className="mt-2 text-[15px] font-semibold text-[#16181D]">{getString(detailQuery.data.title) ?? `Untitled ${activeKind}`}</p>
                        <p className="mt-1 text-[13px] text-[#6F7480]">Entity ID: {getString(detailQuery.data.media_id) ?? activeEntityId}</p>
                        {activeKind === "album" ? (
                          <p className="mt-1 text-[13px] text-[#6F7480]">Tracks returned: {Array.isArray(detailQuery.data.tracks) ? detailQuery.data.tracks.length : 0}</p>
                        ) : (
                          <p className="mt-1 text-[13px] text-[#6F7480]">Audio asset: {getString(detailQuery.data.asset_media_id) ?? "Unavailable"}</p>
                        )}
                      </div>

                      <div>
                        <FieldLabel required>Title</FieldLabel>
                        <TextField value={editTitle} onChange={setEditTitle} placeholder="Entity title" />
                      </div>

                      {activeKind === "album" ? (
                        <div>
                          <FieldLabel mutedSuffix="comma separated">Artists</FieldLabel>
                          <TextField value={editArtists} onChange={setEditArtists} placeholder="e.g. Burna Boy, Wizkid" />
                        </div>
                      ) : (
                        <>
                          <div>
                            <FieldLabel required>Artist / DJ</FieldLabel>
                            <TextField value={editMixArtist} onChange={setEditMixArtist} placeholder="DJ / Artist" />
                          </div>
                          <div>
                            <FieldLabel required>Audio asset media ID</FieldLabel>
                            <TextField value={editMixAssetId} onChange={setEditMixAssetId} placeholder="Uploaded audio media_id" />
                          </div>
                        </>
                      )}

                      <div>
                        <FieldLabel>Genre</FieldLabel>
                        <TextField value={editGenre} onChange={setEditGenre} placeholder="e.g. Afrobeats" />
                      </div>
                      <div>
                        <FieldLabel>Description</FieldLabel>
                        <TextAreaField value={editDescription} onChange={setEditDescription} placeholder="Optional description" rows={5} />
                      </div>
                      <button
                        type="button"
                        onClick={() => void updateEntityMutation.mutate()}
                        disabled={
                          !activeEntityId ||
                          !editTitle.trim() ||
                          (activeKind === "mix" && (!editMixArtist.trim() || !editMixAssetId.trim())) ||
                          updateEntityMutation.isPending
                        }
                        className="inline-flex h-[48px] w-full items-center justify-center rounded-full bg-[#3150FF] text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {updateEntityMutation.isPending ? "Saving…" : `Save live ${activeKind} changes`}
                      </button>

                      {activeKind === "album" ? (
                        <div className="rounded-[16px] border border-[#ECEEF2] p-4">
                          <p className="text-[14px] font-semibold text-[#16181D]">Add album track</p>
                          <div className="mt-3 space-y-3">
                            <div>
                              <FieldLabel required>Track title</FieldLabel>
                              <TextField value={trackTitle} onChange={setTrackTitle} placeholder="e.g. Midnight in Accra" />
                            </div>
                            <div>
                              <FieldLabel required>Track number</FieldLabel>
                              <TextField value={trackNumber} onChange={setTrackNumber} placeholder="1" type="number" />
                            </div>
                            <div>
                              <FieldLabel required>Uploaded audio media ID</FieldLabel>
                              <TextField value={trackAssetMediaId} onChange={setTrackAssetMediaId} placeholder="Paste an audio media_id from /upload" />
                            </div>
                            <button
                              type="button"
                              onClick={() => void addTrackMutation.mutate()}
                              disabled={!trackTitle.trim() || !trackAssetMediaId.trim() || !trackNumber.trim() || addTrackMutation.isPending}
                              className="inline-flex h-[46px] w-full items-center justify-center rounded-full border border-[#16181D] bg-white text-[14px] font-medium text-[#16181D] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {addTrackMutation.isPending ? "Adding…" : "Add live track"}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="rounded-[16px] border border-[#ECEEF2] p-4 text-[14px] text-[#6F7480]">
                      Load an album or mix ID to manage a real entity. Selecting a catalog row auto-loads detail when the backend exposes a linked album or DJ mix ID.
                    </div>
                  )}
                </div>
              </div>
            </SurfaceCard>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
