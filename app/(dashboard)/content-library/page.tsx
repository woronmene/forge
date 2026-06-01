"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { ToolbarSearchField, ToolbarSelect } from "@/components/dashboard-widgets";
import { FieldLabel, SelectField, StatusBadge, SurfaceCard, TextAreaField, TextField } from "@/components/page-primitives";
import { contentAssets, contentSummary } from "@/features/content-library/data";
import type { ContentAsset } from "@/types/dashboard";

function SummaryCard({ label, value, active }: { label: string; value: string; active?: boolean }) {
  return (
    <SurfaceCard className={active ? "border-[#8EA5FF] bg-[#EEF1FF]" : ""}>
      <div className="p-4 xl:p-[15px]">
        <p className={`text-[14px] font-semibold uppercase ${active ? "text-[#3150FF]" : "text-[#696D76]"}`}>{label}</p>
        <p className="mt-2.5 text-[20px] font-semibold tracking-[-0.04em] text-[#16181D] xl:text-[21px]">{value}</p>
      </div>
    </SurfaceCard>
  );
}

function ContentDrawer({ asset, onClose }: { asset: ContentAsset; onClose: () => void }) {
  const [title, setTitle] = useState(asset.title);
  const [description, setDescription] = useState(asset.description);
  const [genre, setGenre] = useState(asset.genre);
  const [releaseDate, setReleaseDate] = useState(asset.releaseDate);
  const [cast, setCast] = useState(asset.cast);
  const [subtitleFile, setSubtitleFile] = useState(asset.subtitleFile);
  const [tier, setTier] = useState("Basic");
  const [visibility, setVisibility] = useState("Published");

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
          <h2 className="text-[22px] font-semibold tracking-[-0.05em] text-[#16181D]">{asset.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E6E7EC] bg-white text-[#16181D]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto px-7 py-7">
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
                  <SelectField value={genre} onChange={setGenre} options={["Drama", "Thriller", "Comedy", "Action", "Afropop", "Documentary"]} />
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
                <FieldLabel>SRT/ subtitle file</FieldLabel>
                <div className="flex min-h-[60px] items-center justify-between rounded-[14px] border border-[#E6E7EC] px-4">
                  <input
                    value={subtitleFile}
                    onChange={(event) => setSubtitleFile(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-[#3150FF] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSubtitleFile(`${asset.id}-updated.srt`)}
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
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#1F8A78]" />
                  <div>
                    <p className="text-[15px] font-semibold text-[#16181D]">Current version</p>
                    <p className="mt-1 text-[14px] font-medium text-[#1F8A78]">Ready</p>
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
                      <p className="mt-1 text-[14px] text-[#7B8088]">Asset URL updated · 14 Apr 2026 · by Johny Jackson</p>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
              <SurfaceCard>
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#9699A3]" />
                    <div>
                      <p className="text-[15px] font-semibold text-[#16181D]">Version 1</p>
                      <p className="mt-1 text-[14px] text-[#7B8088]">Initial upload · 10 Apr 2026 · by Johny Jackson</p>
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
                className="rounded-full bg-[#3150FF] px-6 py-4 text-[15px] font-medium text-white shadow-[0_10px_28px_rgba(49,80,255,0.22)]"
              >
                Save changes
              </button>
              <button
                type="button"
                className="rounded-full border border-[#E6E7EC] px-5 py-4 text-[15px] font-medium text-[#16181D]"
              >
                Cancel
              </button>
            </div>
            <button
              type="button"
              className="rounded-full border border-[#F16F73] px-5 py-4 text-[15px] font-medium text-[#F04438]"
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
  const [selectedAsset, setSelectedAsset] = useState<ContentAsset | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [statusFilter, setStatusFilter] = useState("All status");
  const showErrorBanner = useMemo(() => contentAssets.some((asset) => asset.status === "Error"), []);
  const filteredAssets = useMemo(
    () =>
      contentAssets.filter((asset) => {
        const matchesSearch = !search || `${asset.title} ${asset.genre} ${asset.cast}`.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === "All types" || asset.type === typeFilter;
        const matchesStatus = statusFilter === "All status" || asset.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
      }),
    [search, statusFilter, typeFilter],
  );

  return (
    <DashboardShell title="Content library" description="Browse, search and manage all platform assets">
      <div className="px-4 py-5 md:px-6 xl:px-8">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {contentSummary.map((item) => (
            <SummaryCard
              key={item.label}
              label={item.label}
              value={item.value}
              active={"active" in item ? item.active : false}
            />
          ))}
        </div>

        {showErrorBanner ? (
          <div className="mt-6 rounded-[16px] border border-[#F2D172] bg-[#FFF9E7] px-4 py-4 text-[14px] font-medium text-[#A55917]">
            2 assets have processing errors — action required
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <ToolbarSearchField placeholder="Search by title, genre, cast..." value={search} onChange={setSearch} />
          <ToolbarSelect value={typeFilter} onChange={setTypeFilter} options={["All types", "Movie", "Series", "Album", "DJ Mix", "Trailer"]} />
          <ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={["All status", "Ready", "Processing", "Queued", "Error"]} />
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

          {filteredAssets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => setSelectedAsset(asset)}
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
                <StatusBadge
                  tone={
                    asset.typeTone === "purple"
                      ? "purple"
                      : asset.typeTone === "cyan"
                        ? "cyan"
                        : asset.typeTone === "blue"
                          ? "blue"
                          : "gray"
                  }
                >
                  {asset.type}
                </StatusBadge>
              </div>
              <div className="flex items-center justify-between lg:block">
                <span className="text-[12px] font-medium uppercase tracking-[0.02em] text-[#8E929B] lg:hidden">Genre</span>
                <span className="text-[15px] text-[#16181D]">{asset.genre}</span>
              </div>
              <div className="flex items-center justify-between lg:block">
                <span className="text-[12px] font-medium uppercase tracking-[0.02em] text-[#8E929B] lg:hidden">Status</span>
                <StatusBadge tone={asset.status === "Ready" ? "ready" : "error"}>{asset.status}</StatusBadge>
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
          ))}

          <div className="flex flex-col gap-4 px-[18px] py-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-[15px] text-[#16181D]">Showing 1–10 of 1,248 assets</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <button className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-[#E6E7EC] bg-white text-[#16181D]">
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
              {["1", "2", "3", "…", "15"].map((page) => (
                <button
                  key={page}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-[12px] border px-3 text-[14px] font-medium ${
                    page === "2"
                      ? "border-[#3150FF] bg-[#3150FF] text-white"
                      : "border-[#E6E7EC] bg-white text-[#16181D]"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-[#E6E7EC] bg-white text-[#16181D]">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <AnimatePresence>{selectedAsset ? <ContentDrawer asset={selectedAsset} onClose={() => setSelectedAsset(null)} /> : null}</AnimatePresence>
    </DashboardShell>
  );
}
