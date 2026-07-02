"use client";

import { useMemo, useState } from "react";
import { LoaderCircle, Upload } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { SurfaceCard, TextField } from "@/components/page-primitives";
import { uploadPageConfigs, UploadTypeTab } from "@/features/uploads/data";
import type { AssetKind } from "@/services/api/types";
import { createUploadUrl } from "@/services/uploads";
import type { UploadType } from "@/types/dashboard";

type UploadSlotKey = "primary" | "image" | "subtitle";

type UploadSlotState = {
  title: string;
  file: File | null;
  isUploading: boolean;
  error: string | null;
  result: {
    mediaId: string;
    assetType: string;
    objectKey: string;
    objectUrl: string;
    status: string;
  } | null;
};

type UploadSlotConfig = {
  key: UploadSlotKey;
  label: string;
  kind: AssetKind;
  accept: string;
  helper: string;
};

function slugifyTitle(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromFile(file: File | null) {
  if (!file) {
    return "";
  }

  const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
  return nameWithoutExtension.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "The upload request failed.";
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function extractUploadResult(payload: unknown) {
  if (!isRecord(payload)) {
    throw new Error("The upload service returned an empty response.");
  }

  const url = getString(payload.uploadUrl) ?? getString(payload.url);
  const fields = isRecord(payload.fields) ? payload.fields : null;
  const mediaId = getString(payload.media_id) ?? getString(payload.mediaId) ?? getString(payload.assetId);
  const assetType = getString(payload.asset_type) ?? getString(payload.assetType) ?? "unknown";
  const objectKey = getString(payload.object_key) ?? getString(payload.key) ?? "";
  const objectUrl = getString(payload.object_url) ?? "";
  const status = getString(payload.status) ?? "PENDING_UPLOAD";

  if (!url || !fields || !mediaId) {
    throw new Error("The upload service response is missing required S3 upload fields.");
  }

  return { url, fields, mediaId, assetType, objectKey, objectUrl, status };
}

function createEmptySlotState(): UploadSlotState {
  return {
    title: "",
    file: null,
    isUploading: false,
    error: null,
    result: null,
  };
}

function buildSlotConfig(activeType: UploadType) {
  const primary: UploadSlotConfig =
    activeType === "album" || activeType === "mix"
      ? {
          key: "primary",
          label: activeType === "album" ? "Primary audio upload" : "Mix audio upload",
          kind: "audio",
          accept: "audio/*",
          helper: "This uses the real audio upload-url endpoint and posts the selected file directly to S3.",
        }
      : {
          key: "primary",
          label: activeType === "trailer" ? "Trailer video upload" : "Primary video upload",
          kind: "video",
          accept: "video/*",
          helper: "This uses the real video upload-url endpoint and posts the selected file directly to S3.",
        };

  const slots: UploadSlotConfig[] = [primary];

  if (activeType === "movie" || activeType === "series" || activeType === "album" || activeType === "mix" || activeType === "trailer") {
    slots.push({
      key: "image",
      label: activeType === "album" || activeType === "mix" ? "Cover art upload" : "Thumbnail upload",
      kind: "image",
      accept: "image/*",
      helper: "The image upload route is live and returns a real image asset media ID.",
    });
  }

  if (activeType === "movie" || activeType === "series" || activeType === "trailer") {
    slots.push({
      key: "subtitle",
      label: "Subtitle upload",
      kind: "subtitle",
      accept: ".srt,text/plain,application/x-subrip",
      helper: "This creates a real subtitle asset and posts the file directly to S3.",
    });
  }

  return slots;
}

export default function UploadPage() {
  const [activeType, setActiveType] = useState<UploadType>("movie");
  const [uploadSlots, setUploadSlots] = useState<Record<UploadSlotKey, UploadSlotState>>({
    primary: createEmptySlotState(),
    image: createEmptySlotState(),
    subtitle: createEmptySlotState(),
  });

  const config = useMemo(() => uploadPageConfigs[activeType], [activeType]);
  const slotConfigs = useMemo(() => buildSlotConfig(activeType), [activeType]);

  async function handleUpload(slotKey: UploadSlotKey, kind: AssetKind) {
    const slot = uploadSlots[slotKey];

    if (!slot.file) {
      setUploadSlots((current) => ({
        ...current,
        [slotKey]: {
          ...current[slotKey],
          error: "Choose a file first.",
        },
      }));
      return;
    }

    const title = slot.title.trim() || titleFromFile(slot.file);

    if (!title) {
      setUploadSlots((current) => ({
        ...current,
        [slotKey]: {
          ...current[slotKey],
          error: "Add a title before uploading.",
        },
      }));
      return;
    }

    setUploadSlots((current) => ({
      ...current,
      [slotKey]: {
        ...current[slotKey],
        isUploading: true,
        error: null,
      },
    }));

    try {
      const payload = await createUploadUrl(kind, {
        title,
        fileName: slot.file.name,
        contentType: slot.file.type || "application/octet-stream",
        size: slot.file.size,
      });
      const uploadTarget = extractUploadResult(payload);
      const formData = new FormData();
      formData.append("uploadUrl", uploadTarget.url);
      formData.append("fields", JSON.stringify(uploadTarget.fields));
      formData.append("file", slot.file);

      const s3Response = await fetch("/api/forge/upload-file", {
        method: "POST",
        body: formData,
      });

      if (!s3Response.ok) {
        throw new Error(`S3 upload failed with status ${s3Response.status}.`);
      }

      setUploadSlots((current) => ({
        ...current,
        [slotKey]: {
          ...current[slotKey],
          isUploading: false,
          error: null,
          result: {
            mediaId: uploadTarget.mediaId,
            assetType: uploadTarget.assetType,
            objectKey: uploadTarget.objectKey,
            objectUrl: uploadTarget.objectUrl,
            status: uploadTarget.status,
          },
        },
      }));
    } catch (error) {
      setUploadSlots((current) => ({
        ...current,
        [slotKey]: {
          ...current[slotKey],
          isUploading: false,
          error: parseError(error),
        },
      }));
    }
  }

  return (
    <DashboardShell title="Upload Content" description="Add new media assets to the platform">
      <div className="px-4 py-5 md:px-6 xl:px-8 xl:py-6">
        <SurfaceCard className="mb-5 border-[#E5E7EB] bg-[#F9FAFB]">
          <div className="p-4 text-[14px] text-[#5A6170]">
            <p className="font-semibold text-[#16181D]">Live backend upload coverage</p>
            <p className="mt-1">
              Direct upload-url generation is live for video, audio, image, and subtitle assets, and the browser now posts files straight to the returned S3 targets. The backend&apos;s `complete-upload`, season, and episode routes still return `404` on this environment, so the entity flows below only enable the parts we can verify safely.
            </p>
          </div>
        </SurfaceCard>

        <div className="flex flex-wrap items-center gap-3">
          {(["movie", "series", "album", "mix", "trailer"] as UploadType[]).map((type) => (
            <UploadTypeTab
              key={type}
              type={type}
              active={type === activeType}
              onClick={() => setActiveType(type)}
            />
          ))}
        </div>

        <div className="mt-5 grid gap-5">
          <SurfaceCard>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 max-md:flex-col">
                <div>
                  <p className="text-[18px] font-semibold tracking-[-0.04em] text-[#16181D]">Live upload actions</p>
                  <p className="mt-1 max-w-[760px] text-[14px] text-[#667085]">
                    These actions use the real presigned upload-url endpoints. After a successful upload, you&apos;ll get the backend `media_id` you can use in the album, mix, and content-management flows.
                  </p>
                </div>
                <p className="rounded-full border border-[#E6E7EC] bg-[#FAFAFA] px-4 py-2 text-[12px] font-medium text-[#6B7280]">
                  Titles become storage slugs like <span className="text-[#16181D]">{slugifyTitle("Sample Upload Title") || "sample-upload-title"}</span>
                </p>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-3">
                {slotConfigs.map((slotConfig) => {
                  const slot = uploadSlots[slotConfig.key];

                  return (
                    <div key={slotConfig.key} className="rounded-[18px] border border-[#E7E8ED] bg-[#FCFCFD] p-4">
                      <p className="text-[15px] font-semibold text-[#16181D]">{slotConfig.label}</p>
                      <p className="mt-1 text-[13px] leading-6 text-[#6B7280]">{slotConfig.helper}</p>

                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="mb-2 block text-[13px] font-medium text-[#4D5058]">Asset title</label>
                          <TextField
                            value={slot.title}
                            onChange={(value) =>
                              setUploadSlots((current) => ({
                                ...current,
                                [slotConfig.key]: {
                                  ...current[slotConfig.key],
                                  title: value,
                                },
                              }))
                            }
                            placeholder="Enter a backend asset title"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-[13px] font-medium text-[#4D5058]">File</label>
                          <input
                            type="file"
                            accept={slotConfig.accept}
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;

                              setUploadSlots((current) => ({
                                ...current,
                                [slotConfig.key]: {
                                  ...current[slotConfig.key],
                                  file,
                                  title: current[slotConfig.key].title || titleFromFile(file),
                                  error: null,
                                },
                              }));
                            }}
                            className="block w-full rounded-[14px] border border-[#E6E7EC] bg-white px-4 py-3 text-[14px] text-[#16181D] file:mr-4 file:rounded-full file:border-0 file:bg-[#EEF2FF] file:px-4 file:py-2 file:text-[13px] file:font-medium file:text-[#3150FF]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleUpload(slotConfig.key, slotConfig.kind)}
                          disabled={slot.isUploading}
                          className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#3150FF] px-5 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {slot.isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          {slot.isUploading ? "Uploading…" : "Upload to backend"}
                        </button>

                        {slot.error ? <p className="text-[13px] text-[#C1122F]">{slot.error}</p> : null}

                        {slot.result ? (
                          <div className="rounded-[16px] border border-[#DDE3F4] bg-white p-4 text-[13px] text-[#475467]">
                            <p className="font-semibold text-[#16181D]">Upload created successfully</p>
                            <div className="mt-3 space-y-1.5">
                              <p>
                                <span className="font-medium text-[#16181D]">Media ID:</span> {slot.result.mediaId}
                              </p>
                              <p>
                                <span className="font-medium text-[#16181D]">Asset type:</span> {slot.result.assetType}
                              </p>
                              <p>
                                <span className="font-medium text-[#16181D]">Status:</span> {slot.result.status}
                              </p>
                              <p className="break-all">
                                <span className="font-medium text-[#16181D]">Object key:</span> {slot.result.objectKey}
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </SurfaceCard>

          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_500px]">
            <div className="min-w-0 space-y-5">
              {config.topSections.map((section) => (
                <div key={section.title}>{section.body}</div>
              ))}
            </div>

            <div className="min-w-0 space-y-5">{config.rightRail}</div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-[#E7E8ED] bg-white/95 px-4 py-4 backdrop-blur md:px-6 xl:px-8">
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch">
          <div className="max-w-[860px] text-[13px] leading-6 text-[#6B7280]">
            The visual upload forms still mirror the design, but the live backend actions now sit above them. Entity creation for movies and trailers, plus upload completion/final processing confirmation, remain blocked by missing routes in the shared staging environment.
          </div>
          <button type="button" className="text-[14px] font-medium text-[#7C818B] max-md:self-end">
            {config.footerNotice}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
