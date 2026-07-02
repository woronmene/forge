"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { LoaderCircle, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { DataCardRow, ToolbarButton, ToolbarSearchField, ToolbarSelect } from "@/components/dashboard-widgets";
import { StatusBadge, SurfaceCard } from "@/components/page-primitives";
import { forgeQueryKeys } from "@/services/api/query-keys";
import type { AssetKind, AssetStatus } from "@/services/api/types";
import { listAssets, retryProcessing } from "@/services/content";

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
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "We could not load the processing queue.";
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

function getTotal(payload: unknown, fallback: number) {
  if (!isRecord(payload)) {
    return fallback;
  }

  const candidates = [
    payload.total,
    payload.count,
    payload.totalCount,
    isRecord(payload.pagination) ? payload.pagination.total : undefined,
    isRecord(payload.meta) ? payload.meta.total : undefined,
    isRecord(payload.data) ? payload.data.total : undefined,
  ];

  for (const candidate of candidates) {
    const numberValue = getNumber(candidate);
    if (numberValue !== undefined) {
      return numberValue;
    }
  }

  return fallback;
}

function toSentenceCase(input: string) {
  return input
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
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

function resolveStatus(value: unknown): AssetStatus {
  const normalized = getString(value)?.toLowerCase();
  if (!normalized) {
    return "Draft";
  }

  if (normalized.includes("pending") || normalized.includes("upload")) {
    return "Queued";
  }
  if (normalized.includes("ready") || normalized.includes("live")) {
    return "Ready";
  }
  if (normalized.includes("queue")) {
    return "Queued";
  }
  if (normalized.includes("process")) {
    return "Processing";
  }
  if (normalized.includes("private")) {
    return "Private";
  }
  if (normalized.includes("publish")) {
    return "Published";
  }
  if (normalized.includes("draft")) {
    return "Draft";
  }

  return "Error";
}

function resolveApiKind(record: Record<string, unknown>): AssetKind | null {
  const joined = [
    getString(record.asset_type),
    getString(record.assetType),
    getString(record.kind),
    getString(record.media_type),
    getString(record.mediaType),
    getString(record.type),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!joined) {
    return null;
  }

  if (joined.includes("audio") || joined.includes("album") || joined.includes("mix") || joined.includes("track")) {
    return "audio";
  }
  if (joined.includes("video") || joined.includes("movie") || joined.includes("series") || joined.includes("episode") || joined.includes("trailer")) {
    return "video";
  }
  if (joined.includes("image") || joined.includes("thumbnail")) {
    return "image";
  }
  if (joined.includes("subtitle")) {
    return "subtitle";
  }

  return null;
}

function resolveDisplayType(record: Record<string, unknown>) {
  const value =
    getString(record.content_type) ??
    getString(record.contentType) ??
    getString(record.asset_type) ??
    getString(record.assetType) ??
    getString(record.type) ??
    "Asset";

  return toSentenceCase(value);
}

function resolveTypeTone(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("mix") || normalized.includes("audio")) {
    return "cyan" as const;
  }
  if (normalized.includes("image") || normalized.includes("subtitle")) {
    return "gray" as const;
  }
  if (normalized.includes("album")) {
    return "blue" as const;
  }
  return "purple" as const;
}

function hashColor(seed: string) {
  const colors = ["#161D2D", "#26254E", "#214A7C", "#352052", "#1C371B", "#4A2320", "#6C2151", "#315B5F", "#5D6024"];
  const hash = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function buildSubtitle(record: Record<string, unknown>) {
  return (
    getString(record.artist_name) ??
    getString(record.artistName) ??
    getString(record.creator_name) ??
    getString(record.creatorName) ??
    getString(record.genre) ??
    "Backend media asset"
  );
}

function adaptProcessingData(payload: unknown) {
  const rows = getList(payload)
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((record, index) => {
      const status = resolveStatus(
        record.processing_status ??
          record.processingStatus ??
          record.status ??
          record.state,
      );

      return {
        id: getString(record.id) ?? getString(record.asset_id) ?? getString(record.assetId) ?? `asset-${index + 1}`,
        title:
          getString(record.title) ??
          getString(record.asset_title) ??
          getString(record.name) ??
          `Asset ${index + 1}`,
        subtitle: buildSubtitle(record),
        type: resolveDisplayType(record),
        typeTone: resolveTypeTone(resolveDisplayType(record)),
        status,
        date: formatDate(record.created_at ?? record.createdAt ?? record.updated_at ?? record.updatedAt),
        swatch: hashColor(getString(record.id) ?? `asset-${index + 1}`),
        apiKind: resolveApiKind(record),
      };
    })
    .filter((row) => ["Queued", "Processing", "Error", "Ready"].includes(row.status));

  return {
    rows,
    total: getTotal(payload, rows.length),
  };
}

function processingTone(status: AssetStatus) {
  if (status === "Ready" || status === "Published") return "ready" as const;
  if (status === "Error") return "error" as const;
  return "gray" as const;
}

export default function ProcessingPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Filter by status");

  const listQuery = useQuery({
    queryKey: forgeQueryKeys.content.list({ search, status: statusFilter }),
    queryFn: async () => adaptProcessingData(await listAssets({ search: search || undefined, status: statusFilter === "Filter by status" ? undefined : statusFilter })),
  });

  const retryMutation = useMutation({
    mutationFn: async ({ assetId, kind }: { assetId: string; kind: "video" | "audio" }) => retryProcessing(kind, assetId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: forgeQueryKeys.content.lists() });
    },
  });

  const rows = useMemo(() => {
    return (listQuery.data?.rows ?? []).filter((row) => {
      const matchesSearch = !search || `${row.title} ${row.subtitle} ${row.type}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "Filter by status" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [listQuery.data?.rows, search, statusFilter]);

  const errorMessage = listQuery.error ? parseError(listQuery.error) : null;
  const unauthorized = errorMessage?.toLowerCase().includes("401") || errorMessage?.toLowerCase().includes("unauthorized");
  const errorRows = rows.filter((row) => row.status === "Error" && (row.apiKind === "video" || row.apiKind === "audio"));

  return (
    <DashboardShell title="Processing queue" description="Track and manage all media asset processing jobs">
      <div className="px-4 py-5 md:px-6 xl:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <ToolbarSearchField placeholder="Search by title, artist, genre..." value={search} onChange={setSearch} />
          <ToolbarButton
            onClick={() => {
              errorRows.forEach((row) => {
                if (row.apiKind === "video" || row.apiKind === "audio") {
                  retryMutation.mutate({ assetId: row.id, kind: row.apiKind });
                }
              });
            }}
          >
            {retryMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Retry all errors
          </ToolbarButton>
          <ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={["Filter by status", "Ready", "Queued", "Processing", "Error"]} />
        </div>

        {errorMessage ? (
          <SurfaceCard className="mt-6 border-[#F7C9D1] bg-[#FFF7F8]">
            <div className="p-4 text-[14px] text-[#7A2230]">
              <p className="font-semibold">{unauthorized ? "Login required for processing data" : "Processing data is unavailable right now"}</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
          </SurfaceCard>
        ) : null}

        <SurfaceCard className="mt-6 border-[#E5E7EB] bg-[#F9FAFB]">
          <div className="p-4 text-[14px] text-[#5A6170]">
            <p className="font-semibold text-[#16181D]">Current backend fit for this page</p>
            <p className="mt-1">
              This screen is powered from the media asset list plus the retry-processing endpoints. A dedicated job queue endpoint with worker-level telemetry was not present in the shared collection, so this page reflects asset processing state rather than a full pipeline log.
            </p>
          </div>
        </SurfaceCard>

        <SurfaceCard className="mt-8 overflow-hidden">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_0.5fr] border-b border-[#ECEEF2] px-[18px] py-4 text-[13px] font-medium uppercase tracking-[0.02em] text-[#8E929B] lg:grid">
            <div className="pl-[110px]">Title</div>
            <div>Type</div>
            <div>Status</div>
            <div>Date added</div>
            <div />
          </div>

          {rows.map((row) => (
            <div
              key={row.id}
              className="grid items-center gap-4 border-b border-[#ECEEF2] px-[18px] py-[18px] lg:grid-cols-[2fr_1fr_1fr_1fr_0.5fr]"
            >
              <DataCardRow title={row.title} subtitle={row.subtitle} swatch={row.swatch} />
              <div className="flex items-center justify-between lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Type</span>
                <StatusBadge tone={row.typeTone}>{row.type}</StatusBadge>
              </div>
              <div className="flex items-center justify-between lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Status</span>
                {row.status === "Processing" ? (
                  <span className="inline-flex items-center gap-1 rounded-[8px] border border-[#F0C299] bg-[#FFF3E8] px-[10px] py-[5px] text-[12px] font-medium text-[#C55D0A]">
                    <span className="h-[7px] w-[7px] rounded-full bg-[#C55D0A]" />
                    Processing
                  </span>
                ) : row.status === "Queued" ? (
                  <span className="inline-flex items-center gap-1 rounded-[8px] border border-[#E5E7EB] bg-[#FAFAFA] px-[10px] py-[5px] text-[12px] font-medium text-[#868B94]">
                    <span className="h-[7px] w-[7px] rounded-full bg-[#9CA3AF]" />
                    Queued
                  </span>
                ) : (
                  <StatusBadge tone={processingTone(row.status)}>{row.status}</StatusBadge>
                )}
              </div>
              <div className="flex items-center justify-between text-[15px] text-[#16181D] lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Date added</span>
                {row.date}
              </div>
              <div className="flex justify-end">
                {row.status === "Error" && (row.apiKind === "video" || row.apiKind === "audio") ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (row.apiKind === "video" || row.apiKind === "audio") {
                        retryMutation.mutate({ assetId: row.id, kind: row.apiKind });
                      }
                    }}
                    className="rounded-full border border-[#F16F73] px-4 py-2 text-[13px] font-medium text-[#F04438]"
                  >
                    Retry
                  </button>
                ) : null}
              </div>
            </div>
          ))}

          {rows.length === 0 && !listQuery.isLoading ? (
            <div className="px-[18px] py-10 text-center text-[14px] text-[#6F7480]">No backend processing rows matched the current filters.</div>
          ) : null}

          {listQuery.isLoading ? (
            <div className="flex items-center justify-center gap-3 px-[18px] py-10 text-[14px] text-[#6F7480]">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading processing assets…
            </div>
          ) : null}

          <div className="flex flex-col gap-4 px-[18px] py-5 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-[15px] text-[#16181D]">Showing {rows.length} backend-backed assets · total seen {listQuery.data?.total ?? rows.length}</p>
            <div className="text-[13px] text-[#6F7480]">Server-driven pagination for the queue was not confirmed in the collection.</div>
          </div>
        </SurfaceCard>
      </div>
    </DashboardShell>
  );
}
