"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { MediaThumb, ToolbarButton, ToolbarSearchField, ToolbarSelect } from "@/components/dashboard-widgets";
import { FieldLabel, StatusBadge, SurfaceCard, TextAreaField, TextField } from "@/components/page-primitives";
import { forgeQueryKeys } from "@/services/api/query-keys";
import { listAssets } from "@/services/content";
import { createSeries, getSeries, updateSeries } from "@/services/series";

type SeriesRow = {
  id: string;
  title: string;
  subtitle: string;
  genre: string;
  seasons: string;
  episodes: string;
  status: string;
  dateAdded: string;
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

  return "We could not complete the series request.";
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

function adaptRows(payload: unknown): SeriesRow[] {
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

      return joined.includes("series") || joined.includes("episode") || joined.includes("season");
    })
    .map((record, index) => ({
      id: getString(record.media_id) ?? getString(record.id) ?? `series-${index + 1}`,
      title:
        getString(record.title) ??
        getString(record.asset_title) ??
        getString(record.name) ??
        `Series asset ${index + 1}`,
      subtitle:
        getString(record.description_short) ??
        getString(record.description) ??
        getString(record.linked_entity_type) ??
        "Backend series asset",
      genre: toSentenceCase(getString(record.genre) ?? getString(record.category) ?? "Unspecified"),
      seasons: String(getNumber(record.season_count ?? record.seasons) ?? "—"),
      episodes: String(getNumber(record.episode_count ?? record.episodes) ?? "—"),
      status: resolveStatus(record.processing_status ?? record.status ?? record.state),
      dateAdded: formatDate(record.created_at ?? record.createdAt ?? record.updated_at),
      swatch: hashColor(getString(record.media_id) ?? getString(record.id) ?? `series-${index + 1}`),
      linkedEntityType: getString(record.linked_entity_type) ?? null,
      linkedEntityId: getString(record.linked_entity_id) ?? null,
    }));
}

function genreTone(genre: string) {
  if (genre === "Drama") return "purple" as const;
  if (genre === "Comedy" || genre === "Romance" || genre === "Unspecified") return "gray" as const;
  if (genre === "Thriller") return "cyan" as const;
  return "blue" as const;
}

export default function SeriesPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [statusFilter, setStatusFilter] = useState("All status");
  const [seriesIdInput, setSeriesIdInput] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [localActionMessage, setLocalActionMessage] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: forgeQueryKeys.content.list({ search, domain: "series" }),
    queryFn: async () => adaptRows(await listAssets({ search: search || undefined })),
  });

  const rows = useMemo(
    () =>
      (listQuery.data ?? []).filter((row) => {
        const matchesSearch = !search || `${row.title} ${row.genre} ${row.subtitle}`.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === "All types" || row.genre === typeFilter;
        const matchesStatus = statusFilter === "All status" || row.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
      }),
    [listQuery.data, search, statusFilter, typeFilter],
  );

  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const derivedSeriesId =
    selected?.linkedEntityType?.toUpperCase() === "SERIES" && selected.linkedEntityId ? selected.linkedEntityId : null;
  const activeSeriesId = seriesIdInput.trim() || derivedSeriesId || "";

  const detailQuery = useQuery({
    queryKey: forgeQueryKeys.series.detail(activeSeriesId),
    queryFn: () => getSeries(activeSeriesId),
    enabled: activeSeriesId.length > 0,
  });

  useEffect(() => {
    if (!detailQuery.data || !isRecord(detailQuery.data)) {
      return;
    }

    setEditTitle(getString(detailQuery.data.title) ?? "");
    setEditDescription(getString(detailQuery.data.description) ?? "");
    setEditCategory(getString(detailQuery.data.category) ?? "");
  }, [detailQuery.data]);

  const createSeriesMutation = useMutation({
    mutationFn: () => createSeries({ title: createTitle.trim() }),
    onSuccess: async (data) => {
      const createdId = isRecord(data) ? getString(data.media_id) : undefined;
      setLocalActionMessage(createdId ? `Series created: ${createdId}` : "Series created successfully.");
      setCreateTitle("");
      if (createdId) {
        setSeriesIdInput(createdId);
        await queryClient.invalidateQueries({ queryKey: forgeQueryKeys.series.detail(createdId) });
      }
    },
  });

  const updateSeriesMutation = useMutation({
    mutationFn: () =>
      updateSeries(activeSeriesId, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        category: editCategory.trim() || null,
      }),
    onSuccess: async () => {
      setLocalActionMessage("Series updated successfully.");
      await queryClient.invalidateQueries({ queryKey: forgeQueryKeys.series.detail(activeSeriesId) });
      await queryClient.invalidateQueries({ queryKey: forgeQueryKeys.content.lists() });
    },
  });

  const errorMessage = listQuery.error ? parseError(listQuery.error) : null;
  const detailError = detailQuery.error ? parseError(detailQuery.error) : null;
  const actionError =
    createSeriesMutation.error ? parseError(createSeriesMutation.error) : updateSeriesMutation.error ? parseError(updateSeriesMutation.error) : null;
  const unauthorized =
    errorMessage?.toLowerCase().includes("401") ||
    errorMessage?.toLowerCase().includes("unauthorized") ||
    detailError?.toLowerCase().includes("401") ||
    detailError?.toLowerCase().includes("unauthorized");
  const genres = Array.from(new Set(rows.map((row) => row.genre))).filter(Boolean);
  const statuses = Array.from(new Set(rows.map((row) => row.status))).filter(Boolean);

  return (
    <DashboardShell title="Series & seasons" description="Browse backend-backed series assets and manage the live series entity routes that are available today">
      <div className="space-y-5 px-4 py-5 md:px-6 xl:px-8">
        <SurfaceCard className="border-[#E5E7EB] bg-[#F9FAFB]">
          <div className="p-4 text-[14px] text-[#5A6170]">
            <p className="font-semibold text-[#16181D]">Backend fit for series management</p>
            <p className="mt-1">
              Series create, detail, and update are live and now wired into this page. The staging environment still returns `404` for season and episode endpoints, so nested series editing remains partially blocked even though wrappers exist in the codebase.
            </p>
          </div>
        </SurfaceCard>

        <div className="flex flex-wrap items-center gap-4">
          <ToolbarSearchField placeholder="Search by title, genre, cast..." value={search} onChange={setSearch} />
          <ToolbarSelect value={typeFilter} onChange={setTypeFilter} options={["All types", ...genres]} />
          <ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={["All status", ...statuses]} />
        </div>

        {errorMessage || detailError ? (
          <SurfaceCard className="border-[#F7C9D1] bg-[#FFF7F8]">
            <div className="p-4 text-[14px] text-[#7A2230]">
              <p className="font-semibold">{unauthorized ? "Login required for series assets" : "Series data is unavailable right now"}</p>
              <p className="mt-1">{errorMessage ?? detailError}</p>
            </div>
          </SurfaceCard>
        ) : null}

        {actionError ? (
          <SurfaceCard className="border-[#F7C9D1] bg-[#FFF7F8]">
            <div className="p-4 text-[14px] text-[#7A2230]">
              <p className="font-semibold">The last series action failed</p>
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
            <div className="hidden grid-cols-[2fr_1fr_0.9fr_0.9fr_1fr_1fr] border-b border-[#ECEEF2] px-[18px] py-4 text-[13px] font-medium uppercase tracking-[0.02em] text-[#8E929B] lg:grid">
              <div className="pl-[110px]">Title</div>
              <div>Genre</div>
              <div>Seasons</div>
              <div>Episodes</div>
              <div>Status</div>
              <div>Date added</div>
            </div>

            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  setSelectedId(row.id);
                  if (row.linkedEntityType?.toUpperCase() === "SERIES" && row.linkedEntityId) {
                    setSeriesIdInput(row.linkedEntityId);
                  }
                }}
                className="grid w-full items-center gap-4 border-b border-[#ECEEF2] px-[18px] py-[18px] text-left transition hover:bg-[#FAFBFF] lg:grid-cols-[2fr_1fr_0.9fr_0.9fr_1fr_1fr]"
              >
                <div className="flex items-center gap-4">
                  <MediaThumb swatch={row.swatch} />
                  <div>
                    <p className="text-[16px] font-semibold text-[#16181D]">{row.title}</p>
                    <p className="mt-1 text-[13px] text-[#7D828B]">{row.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:block">
                  <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Genre</span>
                  <StatusBadge tone={genreTone(row.genre)}>{row.genre}</StatusBadge>
                </div>
                <div className="flex items-center justify-between text-[15px] text-[#16181D] lg:block">
                  <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Seasons</span>
                  {row.seasons}
                </div>
                <div className="flex items-center justify-between text-[15px] text-[#16181D] lg:block">
                  <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Episodes</span>
                  {row.episodes}
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
                Loading backend series assets…
              </div>
            ) : null}

            {rows.length === 0 && !listQuery.isLoading ? (
              <div className="px-[18px] py-10 text-center text-[14px] text-[#6F7480]">No series-like assets were found in the current backend response.</div>
            ) : null}
          </SurfaceCard>

          <div className="space-y-4">
            <SurfaceCard>
              <div className="p-5">
                <p className="text-[16px] font-semibold text-[#16181D]">Create a series</p>
                <p className="mt-1 text-[14px] text-[#6F7480]">The live create route only requires a title on this environment.</p>
                <div className="mt-4 space-y-3">
                  <div>
                    <FieldLabel required>Series title</FieldLabel>
                    <TextField value={createTitle} onChange={setCreateTitle} placeholder="e.g. Kings of Lagos" />
                  </div>
                  <button
                    type="button"
                    onClick={() => void createSeriesMutation.mutate()}
                    disabled={!createTitle.trim() || createSeriesMutation.isPending}
                    className="inline-flex h-[48px] w-full items-center justify-center rounded-full bg-[#3150FF] px-5 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {createSeriesMutation.isPending ? "Creating…" : "Create live series"}
                  </button>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[16px] font-semibold text-[#16181D]">Series editor</p>
                    <p className="mt-1 text-[14px] text-[#6F7480]">Load a known series `media_id` to edit the real entity payload.</p>
                  </div>
                  <ToolbarButton onClick={() => void detailQuery.refetch()}>Reload</ToolbarButton>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <FieldLabel>Series media ID</FieldLabel>
                    <TextField value={seriesIdInput} onChange={setSeriesIdInput} placeholder="Paste a series media_id" />
                  </div>

                  {detailQuery.isLoading ? (
                    <div className="flex items-center gap-3 rounded-[16px] border border-[#ECEEF2] p-4 text-[14px] text-[#6F7480]">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Loading series detail…
                    </div>
                  ) : null}

                  {detailQuery.data && isRecord(detailQuery.data) ? (
                    <>
                      <div className="rounded-[16px] border border-[#ECEEF2] bg-[#FCFCFD] p-4">
                        <p className="text-[12px] font-semibold uppercase text-[#7B8088]">Live series metadata</p>
                        <p className="mt-2 text-[15px] font-semibold text-[#16181D]">{getString(detailQuery.data.title) ?? "Untitled series"}</p>
                        <p className="mt-1 text-[13px] text-[#6F7480]">Series ID: {getString(detailQuery.data.media_id) ?? activeSeriesId}</p>
                        <p className="mt-1 text-[13px] text-[#6F7480]">Seasons returned: {Array.isArray(detailQuery.data.seasons) ? detailQuery.data.seasons.length : 0}</p>
                      </div>

                      <div>
                        <FieldLabel required>Title</FieldLabel>
                        <TextField value={editTitle} onChange={setEditTitle} placeholder="Series title" />
                      </div>
                      <div>
                        <FieldLabel>Description</FieldLabel>
                        <TextAreaField value={editDescription} onChange={setEditDescription} placeholder="Series description" rows={5} />
                      </div>
                      <div>
                        <FieldLabel>Category</FieldLabel>
                        <TextField value={editCategory} onChange={setEditCategory} placeholder="e.g. Drama" />
                      </div>
                      <button
                        type="button"
                        onClick={() => void updateSeriesMutation.mutate()}
                        disabled={!activeSeriesId || !editTitle.trim() || updateSeriesMutation.isPending}
                        className="inline-flex h-[48px] w-full items-center justify-center rounded-full border border-[#3150FF] bg-[#3150FF] px-5 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {updateSeriesMutation.isPending ? "Saving…" : "Save live series changes"}
                      </button>
                    </>
                  ) : (
                    <div className="rounded-[16px] border border-[#ECEEF2] p-4 text-[14px] text-[#6F7480]">
                      Load a series ID to edit a real entity. Selecting a catalog row only auto-loads detail when the backend exposes a linked `SERIES` entity ID.
                    </div>
                  )}
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard className="border-[#F1D088] bg-[#FFF9E8]">
              <div className="p-5 text-[14px] text-[#8B5E18]">
                <p className="font-semibold text-[#A55917]">Still backend-blocked</p>
                <p className="mt-1">
                  `POST /v1/media/seasons` and `POST /v1/media/episodes` are returning `404` on this environment, so nested season and episode management cannot be completed from the frontend yet.
                </p>
              </div>
            </SurfaceCard>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
