"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Calendar, ChevronDown, LoaderCircle, Play, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  FieldLabel,
  InputLike,
  SectionTitle,
  SelectField,
  StatusBadge,
  SurfaceCard,
  TextAreaField,
  TextField,
} from "@/components/page-primitives";
import { UploadTypeTab } from "@/features/uploads/data";
import { createAlbum, createMix, addAlbumTrack, updateAlbum, updateMix } from "@/services/albums";
import { forgeQueryKeys } from "@/services/api/query-keys";
import type { AssetKind, SubscriptionTier, VisibilityState } from "@/services/api/types";
import { updateAsset } from "@/services/content";
import { createEpisode, createSeason, createSeries, updateEpisode, updateSeason, updateSeries } from "@/services/series";
import { createUploadUrl } from "@/services/uploads";
import type { UploadType } from "@/types/dashboard";

type UploadResult = {
  mediaId: string;
  assetType: string;
  objectKey: string;
  objectUrl: string;
  status: string;
};

type UploadStatus = "idle" | "uploading" | "uploaded" | "error";
type SaveMode = "processing" | "draft";

type UploadItem = {
  id: string;
  name: string;
  meta: string;
  status: UploadStatus;
  progress: number;
  error: string | null;
  result: UploadResult | null;
};

type EntityLink = {
  type: "series" | "album" | "mix";
  id: string;
  seasonId?: string;
  episodeId?: string;
} | null;

type CommonFields = {
  title: string;
  description: string;
  genre: string;
  releaseDate: string;
  subscriptionTier: SubscriptionTier;
  visibility: VisibilityState;
};

type MovieFormState = CommonFields & {
  runtime: string;
  country: string;
  cast: string;
  director: string;
  trailerUrl: string;
  contentRating: string;
};

type SeriesFormState = CommonFields & {
  seasonLabel: string;
  episodeNumber: string;
  episodeTitle: string;
  cast: string;
  director: string;
  trailerUrl: string;
};

type AlbumFormState = CommonFields & {
  artist: string;
  label: string;
  primaryTrackTitle: string;
  primaryTrackNumber: string;
};

type MixFormState = CommonFields & {
  artist: string;
  duration: string;
  cueNotes: string;
};

type TrailerFormState = CommonFields & {
  relatedContent: string;
};

const uploadSuccessFlashKey = "forge_upload_success_flash";
const uploadSuccessMessage = "Asset saved successfully.";

const primaryUploadConfig: Record<UploadType, { kind: AssetKind; accept: string; helper: string }> = {
  movie: {
    kind: "video",
    accept: "video/mp4,video/x-matroska,video/quicktime,video/*",
    helper: "Supports MP4, MKV, MOV",
  },
  series: {
    kind: "video",
    accept: "video/mp4,video/x-matroska,video/quicktime,video/*",
    helper: "Supports MP4, MKV, MOV",
  },
  album: {
    kind: "audio",
    accept: "audio/mpeg,audio/mp4,audio/aac,.mp3,.m4a,.aac",
    helper: "Supports MP3, M4A, AAC",
  },
  mix: {
    kind: "audio",
    accept: "audio/mpeg,audio/mp4,audio/aac,.mp3,.m4a,.aac",
    helper: "Supports MP3, M4A, AAC",
  },
  trailer: {
    kind: "video",
    accept: "video/mp4,video/x-matroska,video/quicktime,video/*",
    helper: "Supports MP4, MKV, MOV",
  },
};

const movieGenreOptions = ["Thriller", "Drama", "Comedy", "Action", "Romance", "Documentary"];
const countryOptions = ["Nigeria", "Ghana", "Kenya", "South Africa"];
const subscriptionOptions: SubscriptionTier[] = ["Free", "Basic", "Premium", "VIP"];
const visibilityOptions: VisibilityState[] = ["Published", "Private", "Scheduled", "Draft"];
const ratingOptions = ["G", "PG", "PG-13", "16", "18"];

function slugifyTitle(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromFileName(fileName: string) {
  const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
  return nameWithoutExtension
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeUploadContentType(kind: AssetKind, file: File) {
  const rawType = file.type.trim().toLowerCase();
  const extension = file.name.split(".").pop()?.trim().toLowerCase();

  if (kind === "audio") {
    if (rawType === "audio/x-m4a" || extension === "m4a") {
      return "audio/mp4";
    }
    if (rawType === "audio/x-aac" || extension === "aac") {
      return "audio/aac";
    }
    if (rawType === "audio/mp3" || extension === "mp3") {
      return "audio/mpeg";
    }
  }

  if (kind === "video") {
    if (rawType === "audio/x-m4a" || extension === "m4a") {
      return "audio/mp4";
    }
    if (rawType === "audio/x-aac" || extension === "aac") {
      return "audio/aac";
    }
  }

  if (kind === "subtitle" && extension === "srt" && !rawType) {
    return "application/x-subrip";
  }

  if (kind === "image" && (extension === "jpg" || extension === "jpeg") && !rawType) {
    return "image/jpeg";
  }

  return rawType || "application/octet-stream";
}

function parseError(error: unknown) {
  return error instanceof Error ? error.message : "The request failed.";
}

function parseDurationToSeconds(value: string) {
  const input = value.trim().toLowerCase();
  if (!input) {
    return undefined;
  }

  const directNumber = Number(input);
  if (Number.isFinite(directNumber) && directNumber >= 0) {
    return Math.round(directNumber);
  }

  const hourMatch = input.match(/(\d+(?:\.\d+)?)\s*h/);
  const minuteMatch = input.match(/(\d+(?:\.\d+)?)\s*m/);
  const secondMatch = input.match(/(\d+(?:\.\d+)?)\s*s/);

  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  const seconds = secondMatch ? Number(secondMatch[1]) : 0;
  const total = Math.round(hours * 3600 + minutes * 60 + seconds);

  return total > 0 ? total : undefined;
}

function parseSeasonNumber(value: string) {
  const match = value.match(/(\d+)/);
  if (!match) {
    return 1;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getErrorStatus(error: unknown) {
  return error instanceof AxiosError ? error.response?.status : undefined;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractUploadResult(payload: unknown) {
  if (!isRecord(payload)) {
    throw new Error("The upload service returned an empty response.");
  }

  const uploadUrl = getString(payload.uploadUrl) ?? getString(payload.url);
  const fields = isRecord(payload.fields) ? payload.fields : null;
  const mediaId = getString(payload.media_id) ?? getString(payload.mediaId) ?? getString(payload.assetId);
  const assetType = getString(payload.asset_type) ?? getString(payload.assetType) ?? "unknown";
  const objectKey = getString(payload.object_key) ?? getString(payload.key) ?? "";
  const objectUrl = getString(payload.object_url) ?? "";
  const status = getString(payload.status) ?? "PENDING_UPLOAD";

  if (!uploadUrl || !fields || !mediaId) {
    throw new Error("The upload service response is missing required upload fields.");
  }

  return { uploadUrl, fields, mediaId, assetType, objectKey, objectUrl, status };
}

function extractMediaId(payload: unknown) {
  if (!isRecord(payload)) {
    return undefined;
  }

  return getString(payload.media_id) ?? getString(payload.mediaId) ?? getString(payload.id);
}

function formatFileMeta(file: File) {
  const sizeInMb = file.size / (1024 * 1024);
  const readableSize = sizeInMb >= 1024 ? `${(sizeInMb / 1024).toFixed(1)} GB` : `${sizeInMb.toFixed(1)} MB`;
  const extension = file.name.split(".").pop()?.toUpperCase() ?? "FILE";
  return `${readableSize} · ${extension}`;
}

function createUploadItem(file: File): UploadItem {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    meta: formatFileMeta(file),
    status: "uploading",
    progress: 8,
    error: null,
    result: null,
  };
}

function createMovieDefaults(fileName?: string): MovieFormState {
  return {
    title: fileName ? titleFromFileName(fileName) : "",
    description: "",
    genre: "",
    releaseDate: "",
    runtime: "",
    country: "Nigeria",
    cast: "",
    director: "",
    trailerUrl: "",
    subscriptionTier: "Basic",
    visibility: "Published",
    contentRating: "PG-13",
  };
}

function createSeriesDefaults(fileName?: string): SeriesFormState {
  return {
    title: fileName ? titleFromFileName(fileName) : "",
    description: "",
    genre: "",
    releaseDate: "",
    subscriptionTier: "Basic",
    visibility: "Published",
    seasonLabel: "Season 1",
    episodeNumber: "1",
    episodeTitle: "",
    cast: "",
    director: "",
    trailerUrl: "",
  };
}

function createAlbumDefaults(fileName?: string): AlbumFormState {
  const title = fileName ? titleFromFileName(fileName) : "";
  return {
    title,
    description: "",
    genre: "",
    releaseDate: "",
    subscriptionTier: "Basic",
    visibility: "Published",
    artist: "",
    label: "",
    primaryTrackTitle: title,
    primaryTrackNumber: "1",
  };
}

function createMixDefaults(fileName?: string): MixFormState {
  return {
    title: fileName ? titleFromFileName(fileName) : "",
    description: "",
    genre: "",
    releaseDate: "",
    subscriptionTier: "Basic",
    visibility: "Published",
    artist: "",
    duration: "",
    cueNotes: "",
  };
}

function createTrailerDefaults(fileName?: string): TrailerFormState {
  return {
    title: fileName ? titleFromFileName(fileName) : "",
    description: "",
    genre: "",
    releaseDate: "",
    subscriptionTier: "Basic",
    visibility: "Published",
    relatedContent: "",
  };
}

function UploadDropzone({
  onBrowse,
  helper,
}: {
  onBrowse: () => void;
  helper: string;
}) {
  return (
    <button
      type="button"
      onClick={onBrowse}
      className="flex min-h-[334px] w-full flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-[#D7DEFF] bg-white px-8 text-center transition hover:border-[#B9C7FF] hover:bg-[#FCFDFF]"
    >
      <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full border border-[#DFE3EC] text-[#8B919B]">
        <Upload className="h-8 w-8 stroke-[1.8]" />
      </div>
      <h2 className="mt-7 text-[20px] font-semibold tracking-[-0.05em] text-[#16181D]">Drag and drop your files here</h2>
      <p className="mt-3 text-[15px] text-[#A1A1AA]">{helper} • Up to 50GB per file</p>
      <span className="mt-7 inline-flex h-[42px] items-center rounded-full border border-[#E5E7EB] bg-white px-5 text-[14px] font-medium text-[#16181D]">
        Browse files
      </span>
    </button>
  );
}

function UploadFileCard({
  item,
  onRemove,
}: {
  item: UploadItem;
  onRemove: () => void;
}) {
  const isProgress = item.status === "uploading";

  return (
    <div className="rounded-[16px] border border-[#E6E7EC] bg-white px-4 py-4">
      <div className="flex items-start gap-4">
        <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#EDF0FF] text-[#3150FF]">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-current">
            <div className="h-3.5 w-2 rounded-[2px] border border-current" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold tracking-[-0.03em] text-[#16181D]">{item.name}</p>
              <p className="mt-1 text-[13px] text-[#7B8088]">
                {item.meta}
                {isProgress ? " · Uploading..." : ""}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {item.status === "uploaded" ? <StatusBadge tone="ready">Uploaded</StatusBadge> : null}
              {item.status === "error" ? <StatusBadge tone="error">Failed</StatusBadge> : null}
              {isProgress ? <span className="text-[15px] font-semibold text-[#3150FF]">{Math.round(item.progress)}%</span> : null}
              <button type="button" onClick={onRemove} className="text-[#A1A5B0]" aria-label={`Remove ${item.name}`}>
                <X className="h-5 w-5 stroke-[2.2]" />
              </button>
            </div>
          </div>

          {isProgress ? (
            <div className="mt-4 h-[5px] rounded-full bg-[#E9ECF5]">
              <div className="h-[5px] rounded-full bg-[#3150FF] transition-[width]" style={{ width: `${Math.max(item.progress, 6)}%` }} />
            </div>
          ) : null}

          {item.error ? <p className="mt-3 text-[13px] text-[#C1122F]">{item.error}</p> : null}
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SurfaceCard>
      <div className="p-6 xl:p-7">
        <SectionTitle>{title}</SectionTitle>
        <div className="mt-6 space-y-4">{children}</div>
      </div>
    </SurfaceCard>
  );
}

function ThumbnailCard({
  title,
  previewUrl,
  fileName,
  status,
  onClick,
}: {
  title: string;
  previewUrl: string | null;
  fileName: string | null;
  status: UploadStatus;
  onClick: () => void;
}) {
  return (
    <SurfaceCard>
      <div className="p-6 xl:p-7">
        <SectionTitle>{title}</SectionTitle>
        <button
          type="button"
          onClick={onClick}
          className="mt-5 flex h-[238px] w-full flex-col items-center justify-center overflow-hidden rounded-[18px] bg-[#121B2D] text-[#696D78]"
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={fileName ?? `${title} preview`} className="h-full w-full object-cover" />
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#696D78]">
                <Play className="h-6 w-6 stroke-[1.7]" />
              </div>
              <p className="mt-3 text-[16px]">
                {status === "uploading" ? `Uploading ${title.toLowerCase()}...` : fileName ? fileName : "Click to upload"}
              </p>
            </>
          )}
        </button>
        <div className="mt-5 flex items-center justify-between gap-4 text-[12px] text-[#A1A1AA]">
          <span>JPG or PNG • Min 1280×720px • Max 5 MB</span>
          {status === "uploaded" ? <StatusBadge tone="ready">Uploaded</StatusBadge> : null}
        </div>
      </div>
    </SurfaceCard>
  );
}

function RequiredNotice({ text }: { text: string }) {
  return (
    <SurfaceCard className="border-[#F2D172] bg-[#FFF9E7]">
      <div className="p-6 xl:p-7">
        <div className="flex items-start gap-4">
          <div className="mt-1 h-5 w-5 rounded-full border border-[#E09116] text-center text-[11px] leading-[18px] text-[#E09116]">!</div>
          <div>
            <p className="text-[16px] font-semibold tracking-[-0.03em] text-[#A55917]">Required fields</p>
            <p className="mt-2 max-w-[320px] text-[13px] leading-6 text-[#B56B23]">{text}</p>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}

function DateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <InputLike withIcon={<Calendar className="h-4 w-4" />}>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent outline-none"
      />
    </InputLike>
  );
}

function AccessVisibilityCard({
  subscriptionTier,
  visibility,
  contentRating,
  onSubscriptionTierChange,
  onVisibilityChange,
  onContentRatingChange,
}: {
  subscriptionTier: SubscriptionTier;
  visibility: VisibilityState;
  contentRating?: string;
  onSubscriptionTierChange: (value: SubscriptionTier) => void;
  onVisibilityChange: (value: VisibilityState) => void;
  onContentRatingChange?: (value: string) => void;
}) {
  return (
    <SurfaceCard>
      <div className="p-6 xl:p-7">
        <SectionTitle>Access &amp; visibility</SectionTitle>
        <div className="mt-5 space-y-4">
          <div>
            <FieldLabel>Subscription tier</FieldLabel>
            <SelectField value={subscriptionTier} onChange={(value) => onSubscriptionTierChange(value as SubscriptionTier)} options={subscriptionOptions} />
          </div>
          <div>
            <FieldLabel>Visibility</FieldLabel>
            <SelectField value={visibility} onChange={(value) => onVisibilityChange(value as VisibilityState)} options={visibilityOptions} />
          </div>
          {onContentRatingChange ? (
            <div>
              <FieldLabel>Content rating</FieldLabel>
              <SelectField value={contentRating ?? "PG-13"} onChange={onContentRatingChange} options={ratingOptions} />
            </div>
          ) : null}
        </div>
      </div>
    </SurfaceCard>
  );
}

export default function UploadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeType, setActiveType] = useState<UploadType>("movie");
  const [primaryItem, setPrimaryItem] = useState<UploadItem | null>(null);
  const [thumbnailItem, setThumbnailItem] = useState<UploadItem | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<UploadItem[]>([]);
  const [movieForm, setMovieForm] = useState<MovieFormState>(createMovieDefaults());
  const [seriesForm, setSeriesForm] = useState<SeriesFormState>(createSeriesDefaults());
  const [albumForm, setAlbumForm] = useState<AlbumFormState>(createAlbumDefaults());
  const [mixForm, setMixForm] = useState<MixFormState>(createMixDefaults());
  const [trailerForm, setTrailerForm] = useState<TrailerFormState>(createTrailerDefaults());
  const [entityLink, setEntityLink] = useState<EntityLink>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const primaryInputRef = useRef<HTMLInputElement | null>(null);
  const subtitleInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const progressTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const activeConfig = useMemo(() => primaryUploadConfig[activeType], [activeType]);

  useEffect(() => {
    const timers = progressTimers.current;
    return () => {
      Object.values(timers).forEach(clearInterval);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (thumbnailPreviewUrl) {
        URL.revokeObjectURL(thumbnailPreviewUrl);
      }
    };
  }, [thumbnailPreviewUrl]);

  function beginProgress(key: string, onTick: (value: number) => void) {
    let value = 8;
    progressTimers.current[key] = setInterval(() => {
      value = Math.min(value + Math.random() * 14, 92);
      onTick(value);
    }, 220);
  }

  function endProgress(key: string) {
    const timer = progressTimers.current[key];
    if (timer) {
      clearInterval(timer);
      delete progressTimers.current[key];
    }
  }

  async function uploadViaBackend(kind: AssetKind, file: File, title: string, onProgress: (value: number) => void) {
    const normalizedContentType = normalizeUploadContentType(kind, file);
    const payload = await createUploadUrl(kind, {
      title,
      fileName: file.name,
      contentType: normalizedContentType,
      size: file.size,
    });
    const uploadTarget = extractUploadResult(payload);
    const formData = new FormData();
    formData.append("uploadUrl", uploadTarget.uploadUrl);
    formData.append("fields", JSON.stringify(uploadTarget.fields));
    formData.append("file", file);

    const progressKey = `${kind}-${file.name}-${file.lastModified}`;
    beginProgress(progressKey, onProgress);

    try {
      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", uploadTarget.uploadUrl);

        request.upload.onprogress = (event) => {
          if (!event.lengthComputable) {
            return;
          }

          const percent = Math.max(8, Math.min(100, Math.round((event.loaded / event.total) * 100)));
          onProgress(percent);
        };

        request.onerror = () => {
          reject(new Error("Upload failed before reaching storage."));
        };

        request.onload = () => {
          if (request.status >= 200 && request.status < 300) {
            resolve();
            return;
          }

          reject(new Error(`Upload failed with status ${request.status}.`));
        };

        request.send(formData);
      });

      onProgress(100);
      return uploadTarget;
    } finally {
      endProgress(progressKey);
    }
  }

  function resetFormsForType(type: UploadType, fileName?: string) {
    if (type === "movie") {
      setMovieForm(createMovieDefaults(fileName));
      return;
    }
    if (type === "series") {
      setSeriesForm(createSeriesDefaults(fileName));
      return;
    }
    if (type === "album") {
      setAlbumForm(createAlbumDefaults(fileName));
      return;
    }
    if (type === "mix") {
      setMixForm(createMixDefaults(fileName));
      return;
    }
    setTrailerForm(createTrailerDefaults(fileName));
  }

  async function handlePrimaryFile(file: File) {
    const item = createUploadItem(file);
    const derivedTitle = titleFromFileName(file.name);

    setPrimaryItem(item);
    resetFormsForType(activeType, file.name);
    setThumbnailItem(null);
    setSubtitles([]);
    setEntityLink(null);
    setPageError(null);

    if (thumbnailPreviewUrl) {
      URL.revokeObjectURL(thumbnailPreviewUrl);
      setThumbnailPreviewUrl(null);
    }

    try {
      const result = await uploadViaBackend(activeConfig.kind, file, slugifyTitle(derivedTitle) || "upload", (progress) => {
        setPrimaryItem((current) => (current ? { ...current, progress } : current));
      });

      setPrimaryItem((current) =>
        current
          ? {
              ...current,
              progress: 100,
              status: "uploaded",
              result,
            }
          : current,
      );
    } catch (error) {
      setPrimaryItem((current) =>
        current
          ? {
              ...current,
              status: "error",
              error: parseError(error),
            }
          : current,
      );
      setPageError(parseError(error));
    }
  }

  async function handleSubtitleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);

    for (const file of files) {
      const item = createUploadItem(file);
      setSubtitles((current) => [...current, item]);

      try {
        const result = await uploadViaBackend("subtitle", file, slugifyTitle(titleFromFileName(file.name)) || "subtitle", (progress) => {
          setSubtitles((current) => current.map((subtitle) => (subtitle.id === item.id ? { ...subtitle, progress } : subtitle)));
        });

        setSubtitles((current) =>
          current.map((subtitle) =>
            subtitle.id === item.id
              ? {
                  ...subtitle,
                  status: "uploaded",
                  progress: 100,
                  result,
                }
              : subtitle,
          ),
        );
      } catch (error) {
        setSubtitles((current) =>
          current.map((subtitle) =>
            subtitle.id === item.id
              ? {
                  ...subtitle,
                  status: "error",
                  error: parseError(error),
                }
              : subtitle,
          ),
        );
      }
    }
  }

  async function handleThumbnailFile(file: File) {
    if (thumbnailPreviewUrl) {
      URL.revokeObjectURL(thumbnailPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreviewUrl(previewUrl);
    const item = createUploadItem(file);
    setThumbnailItem(item);
    setPageError(null);

    try {
      const result = await uploadViaBackend("image", file, slugifyTitle(titleFromFileName(file.name)) || "thumbnail", (progress) => {
        setThumbnailItem((current) => (current ? { ...current, progress } : current));
      });

      setThumbnailItem((current) =>
        current
          ? {
              ...current,
              status: "uploaded",
              progress: 100,
              result,
            }
          : current,
      );
    } catch (error) {
      setThumbnailItem((current) =>
        current
          ? {
              ...current,
              status: "error",
              error: parseError(error),
            }
          : current,
      );
      setPageError(parseError(error));
    }
  }

  function resetPage(nextType?: UploadType) {
    setPrimaryItem(null);
    setThumbnailItem(null);
    setSubtitles([]);
    setEntityLink(null);
    setPageError(null);
    resetFormsForType(nextType ?? activeType);

    if (thumbnailPreviewUrl) {
      URL.revokeObjectURL(thumbnailPreviewUrl);
      setThumbnailPreviewUrl(null);
    }
  }

  const saveMutation = useMutation({
    mutationFn: async (mode: SaveMode) => {
      if (!primaryItem?.result) {
        throw new Error("Upload the main file before saving.");
      }

      const primaryMediaId = primaryItem.result.mediaId;
      const thumbnailMediaId = thumbnailItem?.result?.mediaId;

      async function optionalAssetUpdate(kind: AssetKind, payload: Record<string, unknown>) {
        try {
          await updateAsset(kind, primaryMediaId, payload);
          return true;
        } catch (error) {
          if (getErrorStatus(error) === 404) {
            return false;
          }
          throw error;
        }
      }

      if (activeType === "movie") {
        const payload = {
          title: movieForm.title.trim(),
          description: movieForm.description.trim() || null,
          runtime_seconds: parseDurationToSeconds(movieForm.runtime),
          thumbnail_asset_id: thumbnailMediaId ?? null,
        };
        const didSaveAsset = await optionalAssetUpdate("video", payload);
        if (!didSaveAsset) {
          throw new Error(
            "The movie file uploaded successfully, but this backend environment does not expose the movie metadata save route for uploaded video assets yet.",
          );
        }
        return {
          message: uploadSuccessMessage,
          link: null as EntityLink,
        };
      }

      if (activeType === "trailer") {
        const payload = {
          title: trailerForm.title.trim(),
          description: trailerForm.description.trim() || null,
          thumbnail_asset_id: thumbnailMediaId ?? null,
        };
        const didSaveAsset = await optionalAssetUpdate("video", payload);
        if (!didSaveAsset) {
          throw new Error(
            "The trailer file uploaded successfully, but this backend environment does not expose the trailer metadata save route for uploaded video assets yet.",
          );
        }
        return {
          message: uploadSuccessMessage,
          link: null as EntityLink,
        };
      }

      if (activeType === "series") {
        const savedSeriesId =
          entityLink?.type === "series"
            ? entityLink.id
            : extractMediaId(
                await createSeries({
                  title: seriesForm.title.trim(),
                }),
              );

        if (!savedSeriesId) {
          throw new Error("The backend did not return a series media_id.");
        }

        await updateSeries(savedSeriesId, {
          title: seriesForm.title.trim(),
          description: seriesForm.description.trim() || null,
          category: seriesForm.genre.trim() || null,
          release_date: seriesForm.releaseDate || null,
          cover_asset_id: thumbnailMediaId ?? null,
        });

        const seasonId =
          entityLink?.type === "series" && entityLink.seasonId
            ? entityLink.seasonId
            : (() => {
                return undefined;
              })();

        let resolvedSeasonId = seasonId;
        if (!resolvedSeasonId) {
          const seasonResponse = await createSeason(savedSeriesId, {
            season_number: parseSeasonNumber(seriesForm.seasonLabel),
            title: seriesForm.seasonLabel.trim() || "Season 1",
            description: seriesForm.description.trim() || null,
            cover_asset_id: thumbnailMediaId ?? null,
          });
          if (isRecord(seasonResponse) && Array.isArray(seasonResponse.seasons)) {
            resolvedSeasonId = extractMediaId(seasonResponse.seasons[seasonResponse.seasons.length - 1]);
          } else {
            resolvedSeasonId = undefined;
          }
        } else {
          await updateSeason(resolvedSeasonId, {
            title: seriesForm.seasonLabel.trim() || "Season 1",
            description: seriesForm.description.trim() || null,
            cover_asset_id: thumbnailMediaId ?? null,
          });
        }

        if (!resolvedSeasonId) {
          throw new Error("The backend did not return a season media_id.");
        }

        let resolvedEpisodeId = entityLink?.type === "series" ? entityLink.episodeId : undefined;
        const episodePayload = {
          title: seriesForm.episodeTitle.trim() || seriesForm.title.trim(),
          episode_number: Number(seriesForm.episodeNumber) || 1,
          asset_media_id: primaryMediaId,
          description: seriesForm.description.trim() || null,
          thumbnail_asset_id: thumbnailMediaId ?? null,
          release_date: seriesForm.releaseDate || null,
        };

        if (!resolvedEpisodeId) {
          const episodeResponse = await createEpisode(resolvedSeasonId, episodePayload);
          if (isRecord(episodeResponse) && Array.isArray(episodeResponse.seasons)) {
            const seasons = episodeResponse.seasons;
            const latestSeason = seasons[seasons.length - 1];
            resolvedEpisodeId = isRecord(latestSeason) && Array.isArray(latestSeason.episodes)
              ? extractMediaId(latestSeason.episodes[latestSeason.episodes.length - 1])
              : undefined;
          }
        } else {
          await updateEpisode(resolvedEpisodeId, episodePayload);
        }

        const didLinkAsset = await optionalAssetUpdate("video", {
          title: seriesForm.title.trim(),
          description: seriesForm.description.trim() || null,
          thumbnail_asset_id: thumbnailMediaId ?? null,
        });

        return {
          message: uploadSuccessMessage,
          link: { type: "series", id: savedSeriesId, seasonId: resolvedSeasonId, episodeId: resolvedEpisodeId } as EntityLink,
        };
      }

      if (activeType === "album") {
        const savedAlbumId =
          entityLink?.type === "album"
            ? entityLink.id
            : extractMediaId(
                await createAlbum({
                  title: albumForm.title.trim(),
                }),
              );

        if (!savedAlbumId) {
          throw new Error("The backend did not return an album media_id.");
        }

        await updateAlbum(savedAlbumId, {
          title: albumForm.title.trim(),
          artist_names: albumForm.artist
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          genre: albumForm.genre.trim() || null,
          description: albumForm.description.trim() || null,
        });

        if (entityLink?.id !== savedAlbumId) {
          await addAlbumTrack(savedAlbumId, {
            title: albumForm.primaryTrackTitle.trim() || primaryItem.name,
            track_number: Number(albumForm.primaryTrackNumber) || 1,
            asset_media_id: primaryMediaId,
          });
        }

        const didLinkAsset = await optionalAssetUpdate("audio", {
          title: albumForm.primaryTrackTitle.trim() || albumForm.title.trim(),
          description: albumForm.description.trim() || null,
          thumbnail_asset_id: thumbnailMediaId ?? null,
        });

        return {
          message: uploadSuccessMessage,
          link: { type: "album", id: savedAlbumId } as EntityLink,
        };
      }

      const savedMixId =
        entityLink?.type === "mix"
          ? entityLink.id
          : extractMediaId(
              await createMix({
                title: mixForm.title.trim(),
                artist_name: mixForm.artist.trim(),
                asset_media_id: primaryMediaId,
              }),
            );

      if (!savedMixId) {
        throw new Error("The backend did not return a mix media_id.");
      }

      await updateMix(savedMixId, {
        title: mixForm.title.trim(),
        artist_name: mixForm.artist.trim(),
        asset_media_id: primaryMediaId,
        genre: mixForm.genre.trim() || null,
        description: mixForm.description.trim() || null,
      });

      const didLinkAsset = await optionalAssetUpdate("audio", {
        title: mixForm.title.trim(),
        description: mixForm.description.trim() || null,
        runtime_seconds: parseDurationToSeconds(mixForm.duration),
        thumbnail_asset_id: thumbnailMediaId ?? null,
      });

      return {
        message: uploadSuccessMessage,
        link: { type: "mix", id: savedMixId } as EntityLink,
      };
    },
    onSuccess: async (result) => {
      setPageError(null);
      if (result.link) {
        setEntityLink(result.link);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: forgeQueryKeys.content.lists() }),
        queryClient.invalidateQueries({ queryKey: forgeQueryKeys.content.mediaSummary() }),
        queryClient.invalidateQueries({ queryKey: forgeQueryKeys.content.catalogSummary() }),
        queryClient.invalidateQueries({ queryKey: forgeQueryKeys.series.all }),
        queryClient.invalidateQueries({ queryKey: forgeQueryKeys.albums.all }),
      ]);

      sessionStorage.setItem(uploadSuccessFlashKey, result.message || "Asset saved successfully.");
      router.push("/content-library");
    },
    onError: (error) => {
      setPageError(parseError(error));
    },
  });

  const commonSummary = primaryItem?.result
    ? `Asset media_id ${primaryItem.result.mediaId} uploaded${entityLink ? ` • linked ${entityLink.type} ${entityLink.id}` : ""}`
    : null;

  const activeVisibility =
    activeType === "movie"
      ? movieForm.visibility
      : activeType === "series"
        ? seriesForm.visibility
        : activeType === "album"
          ? albumForm.visibility
          : activeType === "mix"
            ? mixForm.visibility
            : trailerForm.visibility;

  const activeSubscriptionTier =
    activeType === "movie"
      ? movieForm.subscriptionTier
      : activeType === "series"
        ? seriesForm.subscriptionTier
        : activeType === "album"
          ? albumForm.subscriptionTier
          : activeType === "mix"
            ? mixForm.subscriptionTier
            : trailerForm.subscriptionTier;

  const requiredNoticeText =
    activeType === "movie"
      ? "Movie title and genre must be filled before processing can begin."
      : activeType === "series"
        ? "Series title, season, episode number and genre are needed to structure this upload."
        : activeType === "album"
          ? "Album title, artist, and the uploaded audio track are needed before this can be filed into Albums & mixes."
          : activeType === "mix"
            ? "Mix title, artist / DJ, and the uploaded audio asset are needed before this can be filed into Albums & mixes."
            : "Trailer title and related content should be filled before processing begins.";

  const thumbnailTitle = activeType === "album" || activeType === "mix" ? "Cover art" : "Thumbnail";

  return (
    <DashboardShell title="Upload Content" description="Add new media assets to the platform">
      <div className="px-4 py-5 md:px-6 xl:px-8 xl:py-6">
        <input
          ref={primaryInputRef}
          type="file"
          accept={activeConfig.accept}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handlePrimaryFile(file);
            }
            event.currentTarget.value = "";
          }}
        />
        <input
          ref={subtitleInputRef}
          type="file"
          accept=".srt,text/plain,application/x-subrip"
          multiple
          className="hidden"
          onChange={(event) => {
            void handleSubtitleFiles(event.target.files);
            event.currentTarget.value = "";
          }}
        />
        <input
          ref={thumbnailInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleThumbnailFile(file);
            }
            event.currentTarget.value = "";
          }}
        />

        <div className="flex flex-wrap items-center gap-3">
          {(["movie", "series", "album", "mix", "trailer"] as UploadType[]).map((type) => (
            <UploadTypeTab
              key={type}
              type={type}
              active={type === activeType}
              onClick={() => {
                setActiveType(type);
                resetPage(type);
              }}
            />
          ))}
          {primaryItem ? (
            <button type="button" onClick={() => resetPage()} className="text-[15px] font-medium text-[#3150FF] underline-offset-4 hover:underline">
              Change type
            </button>
          ) : null}
        </div>

        {!primaryItem ? (
          <div className="mt-7">
            <UploadDropzone onBrowse={() => primaryInputRef.current?.click()} helper={activeConfig.helper} />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_480px]">
            <div className="min-w-0 space-y-5">
              <Panel title="Uploaded file">
                <UploadFileCard item={primaryItem} onRemove={() => resetPage()} />
                {commonSummary ? <p className="mt-4 text-[13px] text-[#667085]">{commonSummary}</p> : null}
              </Panel>

              {activeType === "movie" ? (
                <Panel title="Movie details">
                  <div>
                    <FieldLabel required>Movie title</FieldLabel>
                    <TextField value={movieForm.title} onChange={(title) => setMovieForm((current) => ({ ...current, title }))} />
                  </div>
                  <div>
                    <FieldLabel>Description</FieldLabel>
                    <TextAreaField
                      className="min-h-[164px] leading-8"
                      value={movieForm.description}
                      onChange={(description) => setMovieForm((current) => ({ ...current, description }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                    <div>
                      <FieldLabel required>Genre</FieldLabel>
                      <SelectField
                        value={movieForm.genre}
                        onChange={(genre) => setMovieForm((current) => ({ ...current, genre }))}
                        options={movieGenreOptions}
                        placeholder="Select genre"
                      />
                    </div>
                    <div>
                      <FieldLabel>Release date</FieldLabel>
                      <DateField value={movieForm.releaseDate} onChange={(releaseDate) => setMovieForm((current) => ({ ...current, releaseDate }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                    <div>
                      <FieldLabel>Runtime</FieldLabel>
                      <TextField
                        value={movieForm.runtime}
                        onChange={(runtime) => setMovieForm((current) => ({ ...current, runtime }))}
                        placeholder="e.g. 1h 52m"
                      />
                    </div>
                    <div>
                      <FieldLabel>Country of origin</FieldLabel>
                      <InputLike withIcon={<ChevronDown className="h-4 w-4 text-[#16181D]" />}>
                        <select
                          value={movieForm.country}
                          onChange={(event) => setMovieForm((current) => ({ ...current, country: event.target.value }))}
                          className="w-full appearance-none bg-transparent outline-none"
                        >
                          {countryOptions.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </InputLike>
                    </div>
                  </div>
                  <div>
                    <FieldLabel mutedSuffix="separate with commas">Cast</FieldLabel>
                    <TextField value={movieForm.cast} onChange={(cast) => setMovieForm((current) => ({ ...current, cast }))} />
                  </div>
                  <div>
                    <FieldLabel>Director</FieldLabel>
                    <TextField value={movieForm.director} onChange={(director) => setMovieForm((current) => ({ ...current, director }))} />
                  </div>
                </Panel>
              ) : null}

              {activeType === "series" ? (
                <Panel title="Series details">
                  <div>
                    <FieldLabel required>Series title</FieldLabel>
                    <TextField value={seriesForm.title} onChange={(title) => setSeriesForm((current) => ({ ...current, title }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                    <div>
                      <FieldLabel required>Season</FieldLabel>
                      <TextField value={seriesForm.seasonLabel} onChange={(seasonLabel) => setSeriesForm((current) => ({ ...current, seasonLabel }))} />
                    </div>
                    <div>
                      <FieldLabel required>Episode number</FieldLabel>
                      <TextField value={seriesForm.episodeNumber} onChange={(episodeNumber) => setSeriesForm((current) => ({ ...current, episodeNumber }))} type="number" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Episode title</FieldLabel>
                    <TextField value={seriesForm.episodeTitle} onChange={(episodeTitle) => setSeriesForm((current) => ({ ...current, episodeTitle }))} />
                  </div>
                  <div>
                    <FieldLabel>Description</FieldLabel>
                    <TextAreaField value={seriesForm.description} onChange={(description) => setSeriesForm((current) => ({ ...current, description }))} rows={5} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                    <div>
                      <FieldLabel required>Genre</FieldLabel>
                      <SelectField
                        value={seriesForm.genre}
                        onChange={(genre) => setSeriesForm((current) => ({ ...current, genre }))}
                        options={movieGenreOptions}
                        placeholder="Select genre"
                      />
                    </div>
                    <div>
                      <FieldLabel>Release date</FieldLabel>
                      <DateField value={seriesForm.releaseDate} onChange={(releaseDate) => setSeriesForm((current) => ({ ...current, releaseDate }))} />
                    </div>
                  </div>
                  <div>
                    <FieldLabel mutedSuffix="separate with commas">Cast</FieldLabel>
                    <TextField value={seriesForm.cast} onChange={(cast) => setSeriesForm((current) => ({ ...current, cast }))} />
                  </div>
                  <div>
                    <FieldLabel>Director</FieldLabel>
                    <TextField value={seriesForm.director} onChange={(director) => setSeriesForm((current) => ({ ...current, director }))} />
                  </div>
                </Panel>
              ) : null}

              {activeType === "album" ? (
                <>
                  <Panel title="Album details">
                    <div>
                      <FieldLabel required>Album title</FieldLabel>
                      <TextField value={albumForm.title} onChange={(title) => setAlbumForm((current) => ({ ...current, title }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                      <div>
                        <FieldLabel required>Artist</FieldLabel>
                        <TextField value={albumForm.artist} onChange={(artist) => setAlbumForm((current) => ({ ...current, artist }))} />
                      </div>
                      <div>
                        <FieldLabel required>Genre</FieldLabel>
                        <SelectField
                          value={albumForm.genre}
                          onChange={(genre) => setAlbumForm((current) => ({ ...current, genre }))}
                          options={movieGenreOptions}
                          placeholder="Select genre"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                      <div>
                        <FieldLabel>Release date</FieldLabel>
                        <DateField value={albumForm.releaseDate} onChange={(releaseDate) => setAlbumForm((current) => ({ ...current, releaseDate }))} />
                      </div>
                      <div>
                        <FieldLabel>Label</FieldLabel>
                        <TextField value={albumForm.label} onChange={(label) => setAlbumForm((current) => ({ ...current, label }))} placeholder="Record label" />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Description</FieldLabel>
                      <TextAreaField value={albumForm.description} onChange={(description) => setAlbumForm((current) => ({ ...current, description }))} rows={5} />
                    </div>
                  </Panel>

                  <Panel title="Track list">
                    <div>
                      <FieldLabel required>Track title</FieldLabel>
                      <TextField
                        value={albumForm.primaryTrackTitle}
                        onChange={(primaryTrackTitle) => setAlbumForm((current) => ({ ...current, primaryTrackTitle }))}
                      />
                    </div>
                    <div>
                      <FieldLabel required>Track number</FieldLabel>
                      <TextField
                        value={albumForm.primaryTrackNumber}
                        onChange={(primaryTrackNumber) => setAlbumForm((current) => ({ ...current, primaryTrackNumber }))}
                        type="number"
                      />
                    </div>
                    <div className="rounded-[16px] border border-[#E6E7EC] bg-[#FCFCFD] p-4 text-[14px] text-[#667085]">
                      This first implementation uses the uploaded audio file as the first album track. Additional track uploads can be added from the live Albums & mixes page after the album is created.
                    </div>
                  </Panel>
                </>
              ) : null}

              {activeType === "mix" ? (
                <>
                  <Panel title="Mix details">
                    <div>
                      <FieldLabel required>Mix title</FieldLabel>
                      <TextField value={mixForm.title} onChange={(title) => setMixForm((current) => ({ ...current, title }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                      <div>
                        <FieldLabel required>DJ / Artist</FieldLabel>
                        <TextField value={mixForm.artist} onChange={(artist) => setMixForm((current) => ({ ...current, artist }))} />
                      </div>
                      <div>
                        <FieldLabel required>Genre</FieldLabel>
                        <SelectField
                          value={mixForm.genre}
                          onChange={(genre) => setMixForm((current) => ({ ...current, genre }))}
                          options={movieGenreOptions}
                          placeholder="Select genre"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                      <div>
                        <FieldLabel>Duration</FieldLabel>
                        <TextField value={mixForm.duration} onChange={(duration) => setMixForm((current) => ({ ...current, duration }))} placeholder="e.g. 1h 12m" />
                      </div>
                      <div>
                        <FieldLabel>Release date</FieldLabel>
                        <DateField value={mixForm.releaseDate} onChange={(releaseDate) => setMixForm((current) => ({ ...current, releaseDate }))} />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Description</FieldLabel>
                      <TextAreaField value={mixForm.description} onChange={(description) => setMixForm((current) => ({ ...current, description }))} rows={5} />
                    </div>
                  </Panel>

                  <Panel title="Track listing">
                    <div>
                      <FieldLabel mutedSuffix="optional">Cue notes</FieldLabel>
                      <TextAreaField
                        value={mixForm.cueNotes}
                        onChange={(cueNotes) => setMixForm((current) => ({ ...current, cueNotes }))}
                        rows={5}
                        placeholder="Optional notes about timestamps or the track listing inside the mix."
                      />
                    </div>
                  </Panel>
                </>
              ) : null}

              {activeType === "trailer" ? (
                <Panel title="Trailer details">
                  <div>
                    <FieldLabel required>Trailer title</FieldLabel>
                    <TextField value={trailerForm.title} onChange={(title) => setTrailerForm((current) => ({ ...current, title }))} />
                  </div>
                  <div>
                    <FieldLabel required>Related content</FieldLabel>
                    <TextField
                      value={trailerForm.relatedContent}
                      onChange={(relatedContent) => setTrailerForm((current) => ({ ...current, relatedContent }))}
                      placeholder="e.g. Lagos After Dark"
                    />
                  </div>
                  <div>
                    <FieldLabel>Description</FieldLabel>
                    <TextAreaField value={trailerForm.description} onChange={(description) => setTrailerForm((current) => ({ ...current, description }))} rows={5} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                    <div>
                      <FieldLabel required>Genre</FieldLabel>
                      <SelectField
                        value={trailerForm.genre}
                        onChange={(genre) => setTrailerForm((current) => ({ ...current, genre }))}
                        options={movieGenreOptions}
                        placeholder="Select genre"
                      />
                    </div>
                    <div>
                      <FieldLabel>Release date</FieldLabel>
                      <DateField value={trailerForm.releaseDate} onChange={(releaseDate) => setTrailerForm((current) => ({ ...current, releaseDate }))} />
                    </div>
                  </div>
                </Panel>
              ) : null}

              {activeType === "movie" || activeType === "series" || activeType === "trailer" ? (
                <Panel
                  title={
                    <>
                      Subtitles <span className="font-normal text-[#7C8089]">(SRT files)</span>
                    </>
                  }
                >
                  {subtitles.length ? subtitles.map((subtitle) => (
                    <div key={subtitle.id} className="relative">
                      <UploadFileCard item={subtitle} onRemove={() => setSubtitles((current) => current.filter((item) => item.id !== subtitle.id))} />
                    </div>
                  )) : null}
                  <button
                    type="button"
                    onClick={() => subtitleInputRef.current?.click()}
                    className="flex h-[52px] w-full items-center justify-center rounded-[999px] border border-dashed border-[#D9DDE7] bg-white text-[15px] font-medium text-[#16181D]"
                  >
                    <span className="mr-3 text-[22px] leading-none">+</span>
                    Add subtitle file
                  </button>
                </Panel>
              ) : null}
            </div>

            <div className="min-w-0 space-y-5">
              <ThumbnailCard
                title={thumbnailTitle}
                previewUrl={thumbnailPreviewUrl}
                fileName={thumbnailItem?.name ?? null}
                status={thumbnailItem?.status ?? "idle"}
                onClick={() => thumbnailInputRef.current?.click()}
              />

              {activeType === "movie" ? (
                <Panel title="Trailer">
                  <div>
                    <FieldLabel>Trailer URL</FieldLabel>
                    <TextField value={movieForm.trailerUrl} onChange={(trailerUrl) => setMovieForm((current) => ({ ...current, trailerUrl }))} placeholder="https://..." type="url" />
                  </div>
                </Panel>
              ) : null}

              {activeType === "series" ? (
                <Panel title="Trailer">
                  <div>
                    <FieldLabel>Trailer URL</FieldLabel>
                    <TextField value={seriesForm.trailerUrl} onChange={(trailerUrl) => setSeriesForm((current) => ({ ...current, trailerUrl }))} placeholder="https://..." type="url" />
                  </div>
                </Panel>
              ) : null}

              <AccessVisibilityCard
                subscriptionTier={activeSubscriptionTier}
                visibility={activeVisibility}
                contentRating={activeType === "movie" ? movieForm.contentRating : undefined}
                onSubscriptionTierChange={(value) => {
                  if (activeType === "movie") setMovieForm((current) => ({ ...current, subscriptionTier: value }));
                  else if (activeType === "series") setSeriesForm((current) => ({ ...current, subscriptionTier: value }));
                  else if (activeType === "album") setAlbumForm((current) => ({ ...current, subscriptionTier: value }));
                  else if (activeType === "mix") setMixForm((current) => ({ ...current, subscriptionTier: value }));
                  else setTrailerForm((current) => ({ ...current, subscriptionTier: value }));
                }}
                onVisibilityChange={(value) => {
                  if (activeType === "movie") setMovieForm((current) => ({ ...current, visibility: value }));
                  else if (activeType === "series") setSeriesForm((current) => ({ ...current, visibility: value }));
                  else if (activeType === "album") setAlbumForm((current) => ({ ...current, visibility: value }));
                  else if (activeType === "mix") setMixForm((current) => ({ ...current, visibility: value }));
                  else setTrailerForm((current) => ({ ...current, visibility: value }));
                }}
                onContentRatingChange={
                  activeType === "movie" ? (value) => setMovieForm((current) => ({ ...current, contentRating: value })) : undefined
                }
              />

              <RequiredNotice text={requiredNoticeText} />

              {pageError ? (
                <SurfaceCard className="border-[#F7C9D1] bg-[#FFF7F8]">
                  <div className="p-5 text-[13px] text-[#B4233A]">{pageError}</div>
                </SurfaceCard>
              ) : null}

              {activeType === "series" ? (
                <SurfaceCard className="border-[#F1D088] bg-[#FFF9E8]">
                  <div className="p-5 text-[13px] leading-6 text-[#8B5E18]">
                    Season and episode creation routes are still blocked on this backend environment, so this save flow creates the main series entity and tags the uploaded asset for the Series & seasons page, but it cannot create nested episodes yet.
                  </div>
                </SurfaceCard>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {primaryItem ? (
        <div className="sticky bottom-0 z-10 border-t border-[#E7E8ED] bg-white/95 px-4 py-4 backdrop-blur md:px-6 xl:px-8">
          <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch">
            <div className="flex items-center gap-3 max-md:flex-wrap">
              <button
                type="button"
                onClick={() => saveMutation.mutate("processing")}
                disabled={saveMutation.isPending || primaryItem.status !== "uploaded"}
                className="inline-flex h-[44px] items-center rounded-full bg-[#3150FF] px-6 text-[15px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saveMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save &amp; start processing
              </button>
              <button
                type="button"
                onClick={() => saveMutation.mutate("draft")}
                disabled={saveMutation.isPending || primaryItem.status !== "uploaded"}
                className="inline-flex h-[44px] items-center rounded-full border border-[#E5E7EB] bg-white px-6 text-[15px] font-medium text-[#16181D] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Save as Draft
              </button>
            </div>

            <button type="button" onClick={() => resetPage()} className="text-[14px] font-medium text-[#7C818B] max-md:self-end">
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
