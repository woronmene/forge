"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, LoaderCircle, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { ToolbarSearchField, ToolbarSelect } from "@/components/dashboard-widgets";
import { FieldLabel, SelectField, StatusBadge, SurfaceCard, TextAreaField, TextField } from "@/components/page-primitives";
import { forgeQueryKeys } from "@/services/api/query-keys";
import type { AssetKind, AssetStatus } from "@/services/api/types";
import { getAsset, listAssets, updateAsset } from "@/services/content";
import type { ContentAsset } from "@/types/dashboard";

type ContentLibraryAsset = ContentAsset & {
  apiKind: AssetKind | null;
  rawType: string;
  rawStatus: string;
};

type SummaryCardItem = {
  label: string;
  value: string;
  active?: boolean;
};

type ContentLibraryQueryData = {
  assets: ContentLibraryAsset[];
  total: number;
  mediaSummary: unknown | null;
  catalogSummary: unknown | null;
};

type ContentDrawerProps = {
  asset: ContentLibraryAsset;
  onClose: () => void;
};

function SummaryCard({ label, value, active }: SummaryCardItem) {
  return (
    <SurfaceCard className={active ? "border-[#8EA5FF] bg-[#EEF1FF]" : ""}>
      <div className="p-4 xl:p-[15px]">
        <p className={`text-[14px] font-semibold uppercase ${active ? "text-[#3150FF]" : "text-[#696D76]"}`}>{label}</p>
        <p className="mt-2.5 text-[20px] font-semibold tracking-[-0.04em] text-[#16181D] xl:text-[21px]">{value}</p>
      </div>
    </SurfaceCard>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

function formatCount(value: unknown) {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(numberValue)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US").format(numberValue);
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
    isRecord(payload.data) ? payload.data.results : undefined,
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

function flattenMetrics(input: unknown, prefix = ""): Array<{ path: string; value: number }> {
  if (Array.isArray(input)) {
    return input.flatMap((item, index) => flattenMetrics(item, `${prefix}.${index}`));
  }

  if (!isRecord(input)) {
    const numberValue = getNumber(input);
    return numberValue === undefined ? [] : [{ path: prefix.toLowerCase(), value: numberValue }];
  }

  return Object.entries(input).flatMap(([key, value]) => flattenMetrics(value, `${prefix}.${key}`));
}

function findMetricValue(input: unknown, keywords: string[]) {
  const metrics = flattenMetrics(input);
  const match = metrics.find(({ path }) => keywords.every((keyword) => path.includes(keyword)));
  return match?.value;
}

function toSentenceCase(input: string) {
  return input
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

function resolveStatusTone(status: AssetStatus) {
  switch (status) {
    case "Ready":
    case "Published":
      return "ready" as const;
    case "Processing":
      return "blue" as const;
    case "Queued":
    case "Draft":
      return "gray" as const;
    case "Private":
      return "purple" as const;
    default:
      return "error" as const;
  }
}

function hashColor(seed: string) {
  const colors = ["#161D2D", "#26254E", "#214A7C", "#352052", "#1C371B", "#4A2320", "#6C2151", "#315B5F", "#5D6024"];
  const hash = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function resolveApiKind(record: Record<string, unknown>): AssetKind | null {
  const candidates = [
    getString(record.asset_type),
    getString(record.assetType),
    getString(record.kind),
    getString(record.media_type),
    getString(record.mediaType),
    getString(record.type),
  ];

  const joined = candidates.filter(Boolean).join(" ").toLowerCase();
  if (!joined) {
    return null;
  }

  if (joined.includes("subtitle")) {
    return "subtitle";
  }
  if (joined.includes("image") || joined.includes("thumbnail") || joined.includes("cover")) {
    return "image";
  }
  if (joined.includes("audio") || joined.includes("album") || joined.includes("mix") || joined.includes("track")) {
    return "audio";
  }
  if (joined.includes("video") || joined.includes("movie") || joined.includes("series") || joined.includes("episode") || joined.includes("trailer")) {
    return "video";
  }

  return null;
}

function resolveDisplayType(record: Record<string, unknown>) {
  const value =
    getString(record.content_type) ??
    getString(record.contentType) ??
    getString(record.media_domain_path) ??
    getString(record.mediaDomainPath) ??
    getString(record.asset_type) ??
    getString(record.assetType) ??
    getString(record.type) ??
    "Asset";

  const normalized = value.toLowerCase();
  if (normalized.includes("dj") || normalized.includes("mix")) {
    return "DJ Mix";
  }
  if (normalized.includes("album") || normalized.includes("track") || normalized.includes("audio")) {
    return "Album";
  }
  if (normalized.includes("trailer")) {
    return "Trailer";
  }
  if (normalized.includes("episode")) {
    return "Episode";
  }
  if (normalized.includes("series") || normalized.includes("season")) {
    return "Series";
  }
  if (normalized.includes("movie") || normalized.includes("film") || normalized.includes("video")) {
    return "Movie";
  }

  return toSentenceCase(value);
}

function resolveTypeTone(type: string) {
  if (type === "DJ Mix") {
    return "cyan" as const;
  }
  if (type === "Album") {
    return "blue" as const;
  }
  if (type === "Trailer") {
    return "gray" as const;
  }
  return "purple" as const;
}

function buildSubtitle(record: Record<string, unknown>, type: string) {
  const explicit =
    getString(record.subtitle) ??
    getString(record.tagline) ??
    getString(record.description_short) ??
    getString(record.descriptionShort);

  if (explicit) {
    return explicit;
  }

  const season = getNumber(record.season_number ?? record.seasonNumber);
  const episode = getNumber(record.episode_number ?? record.episodeNumber);
  if (season !== undefined && episode !== undefined) {
    return `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;
  }

  const artist = getString(record.artist_name) ?? getString(record.artistName);
  const runtime = getString(record.duration_human) ?? getString(record.durationHuman) ?? getString(record.duration);
  if (artist && runtime) {
    return `${artist} • ${runtime}`;
  }
  if (artist) {
    return artist;
  }
  if (runtime) {
    return `${type} • ${runtime}`;
  }

  return type;
}

function buildCast(record: Record<string, unknown>) {
  const cast = record.cast;
  if (Array.isArray(cast)) {
    return cast.filter((item): item is string => typeof item === "string").join(", ");
  }

  return getString(cast) ?? getString(record.artist_name) ?? getString(record.artistName) ?? "—";
}

function buildSubtitleFile(record: Record<string, unknown>) {
  const subtitle = record.subtitle_file ?? record.subtitleFile ?? record.subtitle_filename ?? record.subtitleFilename;
  if (Array.isArray(subtitle)) {
    return subtitle.find((item): item is string => typeof item === "string") ?? "No subtitle attached";
  }

  return getString(subtitle) ?? "No subtitle attached";
}

function mapAsset(record: unknown): ContentLibraryAsset | null {
  if (!isRecord(record)) {
    return null;
  }

  const id =
    getString(record.id) ??
    getString(record.asset_id) ??
    getString(record.assetId) ??
    getString(record.media_id) ??
    getString(record.mediaId);

  if (!id) {
    return null;
  }

  const type = resolveDisplayType(record);
  const status = resolveStatus(record.status ?? record.processing_status ?? record.processingStatus ?? record.asset_status ?? record.assetStatus);
  const viewsValue =
    getNumber(record.views) ??
    getNumber(record.view_count) ??
    getNumber(record.viewCount) ??
    getNumber(isRecord(record.metrics) ? record.metrics.views : undefined);

  return {
    id,
    title: getString(record.title) ?? getString(record.name) ?? "Untitled asset",
    subtitle: buildSubtitle(record, type),
    type,
    rawType: getString(record.type) ?? type,
    typeTone: resolveTypeTone(type),
    genre: getString(record.genre) ?? getString(record.category) ?? "—",
    status,
    rawStatus: getString(record.status) ?? status,
    dateAdded: formatDate(record.created_at ?? record.createdAt ?? record.date_added ?? record.dateAdded ?? record.updated_at ?? record.updatedAt),
    views: viewsValue === undefined ? "—" : formatCount(viewsValue),
    swatch: hashColor(id),
    description: getString(record.description) ?? "No description available yet.",
    releaseDate: formatDate(record.release_date ?? record.releaseDate ?? record.published_at ?? record.publishedAt),
    cast: buildCast(record),
    subtitleFile: buildSubtitleFile(record),
    apiKind: resolveApiKind(record),
  };
}

function parseError(error: unknown) {
  if (error instanceof AxiosError) {
    const message =
      (isRecord(error.response?.data) && getString(error.response?.data.message)) ??
      error.message ??
      "Request failed";

    return {
      status: error.response?.status,
      message,
    };
  }

  return {
    status: undefined,
    message: error instanceof Error ? error.message : "Request failed",
  };
}

function buildSummaryCards(data: ContentLibraryQueryData | undefined) {
  const assets = data?.assets ?? [];
  const typeCounts = assets.reduce<Record<string, number>>((acc, asset) => {
    acc[asset.type] = (acc[asset.type] ?? 0) + 1;
    return acc;
  }, {});

  const fallbackTotal = data?.total ?? assets.length;

  const movies =
    findMetricValue(data?.catalogSummary, ["movie"]) ??
    findMetricValue(data?.mediaSummary, ["movie"]) ??
    typeCounts.Movie ??
    0;
  const seriesAndEpisodes =
    findMetricValue(data?.catalogSummary, ["series"]) ??
    findMetricValue(data?.catalogSummary, ["episode"]) ??
    ((typeCounts.Series ?? 0) + (typeCounts.Episode ?? 0));
  const music =
    findMetricValue(data?.catalogSummary, ["album"]) ??
    findMetricValue(data?.catalogSummary, ["music"]) ??
    ((typeCounts.Album ?? 0) + (typeCounts["DJ Mix"] ?? 0));
  const trailers =
    findMetricValue(data?.catalogSummary, ["trailer"]) ??
    findMetricValue(data?.mediaSummary, ["trailer"]) ??
    typeCounts.Trailer ??
    0;

  return [
    { label: "All assets", value: formatCount(fallbackTotal), active: true },
    { label: "Movies", value: formatCount(movies) },
    { label: "Series & episodes", value: formatCount(seriesAndEpisodes) },
    { label: "Music", value: formatCount(music) },
    { label: "Trailers", value: formatCount(trailers) },
  ] satisfies SummaryCardItem[];
}

function ContentDrawer({ asset, onClose }: ContentDrawerProps) {
  const queryClient = useQueryClient();
  const detailQuery = useQuery({
    queryKey: forgeQueryKeys.content.detail(asset.id),
    queryFn: async () => {
      if (!asset.apiKind) {
        return null;
      }

      const response = await getAsset(asset.apiKind, asset.id);
      return mapAsset(response) ?? asset;
    },
    enabled: Boolean(asset.apiKind),
    initialData: asset,
  });

  const resolvedAsset = detailQuery.data ?? asset;
  const [title, setTitle] = useState(resolvedAsset.title);
  const [description, setDescription] = useState(resolvedAsset.description);
  const [genre, setGenre] = useState(resolvedAsset.genre);
  const [releaseDate, setReleaseDate] = useState(resolvedAsset.releaseDate);
  const [cast, setCast] = useState(resolvedAsset.cast);
  const [subtitleFile, setSubtitleFile] = useState(resolvedAsset.subtitleFile);
  const [tier, setTier] = useState("Basic");
  const [visibility, setVisibility] = useState("Published");

  useEffect(() => {
    setTitle(resolvedAsset.title);
    setDescription(resolvedAsset.description);
    setGenre(resolvedAsset.genre);
    setReleaseDate(resolvedAsset.releaseDate);
    setCast(resolvedAsset.cast);
    setSubtitleFile(resolvedAsset.subtitleFile);
  }, [resolvedAsset]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!resolvedAsset.apiKind) {
        throw new Error("This asset does not expose an editable backend media kind yet.");
      }

      return updateAsset(resolvedAsset.apiKind, resolvedAsset.id, {
        title,
        description,
        genre,
        releaseDate,
        cast,
        subtitleFile,
        subscriptionTier: tier,
        visibility,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: forgeQueryKeys.content.lists() }),
        queryClient.invalidateQueries({ queryKey: forgeQueryKeys.content.detail(resolvedAsset.id) }),
      ]);
    },
  });

  const saveError = saveMutation.error ? parseError(saveMutation.error) : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-20 bg-[#1B1F28]/45"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 36 }}
        className="fixed right-0 top-0 z-30 flex h-screen w-[540px] max-w-full flex-col border-l border-[#E6E7EC] bg-white shadow-[0_10px_30px_rgba(17,24,39,0.08)]"
      >
        <div className="flex items-center justify-between border-b border-[#ECEEF2] px-7 py-6">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.05em] text-[#16181D]">{resolvedAsset.title}</h2>
            {detailQuery.isFetching ? <p className="mt-1 text-[13px] text-[#7D828B]">Refreshing asset details…</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E6E7EC] bg-white text-[#16181D]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto px-7 py-7">
          {saveError ? (
            <div className="rounded-[16px] border border-[#F7C9D1] bg-[#FFF5F7] px-4 py-4 text-[14px] text-[#B4233A]">
              {saveError.status === 401
                ? "Saving needs a valid forge_access_token in localStorage or a completed dashboard auth flow."
                : saveError.message}
            </div>
          ) : null}

          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.02em] text-[#8F939E]">Asset details</p>
            <div className="mt-6 space-y-5">
              <div>
                <FieldLabel>Title</FieldLabel>
                <TextField value={title} onChange={setTitle} />
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <TextAreaField className="min-h-[134px] leading-8" value={description} onChange={setDescription} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Genre</FieldLabel>
                  <TextField value={genre} onChange={setGenre} />
                </div>
                <div>
                  <FieldLabel>Release date</FieldLabel>
                  <TextField value={releaseDate} onChange={setReleaseDate} />
                </div>
              </div>
              <div>
                <FieldLabel>Cast</FieldLabel>
                <TextField value={cast} onChange={setCast} />
              </div>
              <div>
                <FieldLabel>SRT / subtitle file</FieldLabel>
                <div className="flex min-h-[60px] items-center justify-between rounded-[14px] border border-[#E6E7EC] px-4">
                  <input
                    value={subtitleFile}
                    onChange={(event) => setSubtitleFile(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-[#3150FF] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSubtitleFile(`${resolvedAsset.id}-updated.srt`)}
                    className="rounded-[12px] border border-[#D8DCE6] bg-white px-4 py-2 text-[14px] font-medium text-[#70747E]"
                  >
                    Replace file
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Subscription tier</FieldLabel>
                  <SelectField value={tier} onChange={setTier} options={["Free", "Basic", "Premium", "VIP"]} />
                </div>
                <div>
                  <FieldLabel>Visibility</FieldLabel>
                  <SelectField value={visibility} onChange={setVisibility} options={["Published", "Private", "Scheduled", "Draft"]} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.02em] text-[#8F939E]">Processing status</p>
            <SurfaceCard className="mt-5">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <span className={`mt-2 h-2.5 w-2.5 rounded-full ${resolveStatusTone(resolvedAsset.status) === "ready" ? "bg-[#1F8A78]" : "bg-[#B4233A]"}`} />
                  <div>
                    <p className="text-[15px] font-semibold text-[#16181D]">Current backend status</p>
                    <div className="mt-2">
                      <StatusBadge tone={resolveStatusTone(resolvedAsset.status)}>{resolvedAsset.status}</StatusBadge>
                    </div>
                  </div>
                </div>
              </div>
            </SurfaceCard>
          </div>

          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.02em] text-[#8F939E]">Version history</p>
            <div className="mt-5 space-y-4">
              <SurfaceCard>
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#1F8A78]" />
                    <div>
                      <p className="text-[15px] font-semibold text-[#16181D]">Current version</p>
                      <p className="mt-1 text-[14px] text-[#7B8088]">
                        Live version history is not confirmed in the current backend inventory yet.
                      </p>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            </div>
          </div>
        </div>

        <div className="border-t border-[#ECEEF2] px-7 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !resolvedAsset.apiKind}
                className="rounded-full bg-[#3150FF] px-6 py-4 text-[15px] font-medium text-white shadow-[0_10px_28px_rgba(49,80,255,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveMutation.isPending ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[#E6E7EC] px-5 py-4 text-[15px] font-medium text-[#16181D]"
              >
                Cancel
              </button>
            </div>
            <button
              type="button"
              disabled
              className="rounded-full border border-[#F3C0C2] px-5 py-4 text-[15px] font-medium text-[#F04438] opacity-60"
            >
              Archive asset
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

export default function ContentLibraryPage() {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [statusFilter, setStatusFilter] = useState("All status");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const contentQuery = useQuery<ContentLibraryQueryData>({
    queryKey: forgeQueryKeys.content.list({
      page,
      pageSize,
      search: search || undefined,
      status: statusFilter === "All status" ? undefined : statusFilter,
      type: typeFilter === "All types" ? undefined : typeFilter,
    }),
    queryFn: async () => {
      const listResponse = await listAssets({
        page,
        pageSize,
        search: search || undefined,
        status: statusFilter === "All status" ? undefined : statusFilter,
        type: typeFilter === "All types" ? undefined : typeFilter,
      });

      const items = getList(listResponse).map(mapAsset).filter((asset): asset is ContentLibraryAsset => Boolean(asset));
      return {
        assets: items,
        total: getTotal(listResponse, items.length),
        mediaSummary: null,
        catalogSummary: null,
      };
    },
    placeholderData: (previousData) => previousData,
  });

  const selectedAsset = useMemo(
    () => contentQuery.data?.assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [contentQuery.data?.assets, selectedAssetId],
  );

  const summaryCards = useMemo(() => buildSummaryCards(contentQuery.data), [contentQuery.data]);
  const assets = useMemo(() => contentQuery.data?.assets ?? [], [contentQuery.data?.assets]);
  const totalAssets = contentQuery.data?.total ?? assets.length;
  const totalPages = Math.max(1, Math.ceil(totalAssets / pageSize));
  const showErrorBanner = assets.some((asset) => asset.status === "Error");
  const queryError = contentQuery.error ? parseError(contentQuery.error) : null;

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    if (selectedAssetId && !assets.some((asset) => asset.id === selectedAssetId)) {
      setSelectedAssetId(null);
    }
  }, [assets, selectedAssetId]);

  return (
    <DashboardShell title="Content library" description="Browse, search and manage all platform assets">
      <div className="px-4 py-5 md:px-6 xl:px-8">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((item) => (
            <SummaryCard key={item.label} {...item} />
          ))}
        </div>

        {queryError?.status === 401 ? (
          <div className="mt-6 rounded-[16px] border border-[#F2D172] bg-[#FFF9E7] px-4 py-4 text-[14px] font-medium text-[#A55917]">
            The content library is now wired to the real media service, but it needs a valid `forge_access_token` in localStorage or a completed dashboard auth flow before assets can load.
          </div>
        ) : null}

        {showErrorBanner ? (
          <div className="mt-6 rounded-[16px] border border-[#F2D172] bg-[#FFF9E7] px-4 py-4 text-[14px] font-medium text-[#A55917]">
            Some assets are reporting backend processing errors and may need operator action.
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <ToolbarSearchField placeholder="Search by title, genre, cast..." value={search} onChange={setSearch} />
          <ToolbarSelect value={typeFilter} onChange={setTypeFilter} options={["All types", "Movie", "Series", "Episode", "Album", "DJ Mix", "Trailer"]} />
          <ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={["All status", "Ready", "Processing", "Queued", "Error", "Published", "Private", "Draft"]} />
          <button
            type="button"
            onClick={() => contentQuery.refetch()}
            className="inline-flex h-[46px] items-center gap-2 rounded-[14px] border border-[#E6E7EC] bg-white px-4 text-[14px] font-medium text-[#16181D]"
          >
            <RefreshCw className={`h-4 w-4 ${contentQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <SurfaceCard className="mt-7 overflow-hidden">
          <div className="hidden grid-cols-[1.9fr_1fr_1fr_1fr_1fr_0.7fr] border-b border-[#ECEEF2] px-[18px] py-4 text-[14px] font-medium uppercase tracking-[0.02em] text-[#8E929B] lg:grid">
            <div className="pl-[94px]">Title</div>
            <div>Type</div>
            <div>Genre</div>
            <div>Status</div>
            <div>Date added</div>
            <div className="text-right">Views</div>
          </div>

          {contentQuery.isLoading ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-14 text-center text-[#6F7480]">
              <LoaderCircle className="h-8 w-8 animate-spin text-[#3150FF]" />
              <p className="text-[15px] font-medium text-[#16181D]">Loading content from the media service…</p>
            </div>
          ) : null}

          {!contentQuery.isLoading && queryError && queryError.status !== 401 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 px-6 py-14 text-center">
              <p className="text-[16px] font-semibold text-[#16181D]">The content library request failed.</p>
              <p className="max-w-[520px] text-[14px] text-[#6F7480]">{queryError.message}</p>
            </div>
          ) : null}

          {!contentQuery.isLoading && !queryError && assets.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-14 text-center">
              <p className="text-[16px] font-semibold text-[#16181D]">No assets matched this filter set.</p>
              <p className="text-[14px] text-[#6F7480]">Try a broader search or clear one of the active filters.</p>
            </div>
          ) : null}

          {!contentQuery.isLoading && !queryError
            ? assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedAssetId(asset.id)}
                  className="grid w-full items-center gap-4 border-b border-[#ECEEF2] px-[18px] py-[15px] text-left transition hover:bg-[#FAFBFF] lg:grid-cols-[1.9fr_1fr_1fr_1fr_1fr_0.7fr]"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-[40px] w-[64px] items-center justify-center rounded-[8px]"
                      style={{ backgroundColor: asset.swatch }}
                    >
                      <span className="ml-1 text-[22px] text-[#8FA0A8]">▶</span>
                    </div>
                    <div>
                      <p className="text-[16px] font-semibold tracking-[-0.03em] text-[#16181D]">{asset.title}</p>
                      <p className="mt-1 text-[13px] text-[#7D828B]">{asset.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:block">
                    <span className="text-[12px] font-medium uppercase tracking-[0.02em] text-[#8E929B] lg:hidden">Type</span>
                    <StatusBadge tone={asset.typeTone}>{asset.type}</StatusBadge>
                  </div>
                  <div className="flex items-center justify-between lg:block">
                    <span className="text-[12px] font-medium uppercase tracking-[0.02em] text-[#8E929B] lg:hidden">Genre</span>
                    <span className="text-[15px] text-[#16181D]">{asset.genre}</span>
                  </div>
                  <div className="flex items-center justify-between lg:block">
                    <span className="text-[12px] font-medium uppercase tracking-[0.02em] text-[#8E929B] lg:hidden">Status</span>
                    <StatusBadge tone={resolveStatusTone(asset.status)}>{asset.status}</StatusBadge>
                  </div>
                  <div className="flex items-center justify-between lg:block">
                    <span className="text-[12px] font-medium uppercase tracking-[0.02em] text-[#8E929B] lg:hidden">Date added</span>
                    <span className="text-[15px] text-[#16181D]">{asset.dateAdded}</span>
                  </div>
                  <div className="flex items-center justify-between lg:text-right">
                    <span className="text-[12px] font-medium uppercase tracking-[0.02em] text-[#8E929B] lg:hidden">Views</span>
                    <span className="text-[15px] font-medium text-[#16181D]">{asset.views}</span>
                  </div>
                </button>
              ))
            : null}

          <div className="flex flex-col gap-4 px-[18px] py-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-[15px] text-[#16181D]">
              Showing {assets.length === 0 ? 0 : (page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, totalAssets)} of {formatCount(totalAssets)} assets
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-[#E6E7EC] bg-white text-[#16181D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
              <button className="flex h-9 min-w-9 items-center justify-center rounded-[12px] border border-[#3150FF] bg-[#3150FF] px-3 text-[14px] font-medium text-white">
                {page}
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-[#E6E7EC] bg-white text-[#16181D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <AnimatePresence>{selectedAsset ? <ContentDrawer asset={selectedAsset} onClose={() => setSelectedAssetId(null)} /> : null}</AnimatePresence>
    </DashboardShell>
  );
}
