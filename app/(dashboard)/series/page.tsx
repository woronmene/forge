"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Plus, X } from "lucide-react";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { MediaThumb, ProgressTrack, ToolbarButton, ToolbarSearchField, ToolbarSelect } from "@/components/dashboard-widgets";
import { FieldLabel, SelectField, StatusBadge, SurfaceCard, TextAreaField, TextField } from "@/components/page-primitives";
import { seriesDrawer, seriesRows } from "@/features/dashboard-data";

function genreTone(genre: string) {
  if (genre === "Drama") return "purple";
  if (genre === "Comedy" || genre === "Romance") return "gray";
  if (genre === "Thriller") return "cyan";
  return "blue";
}

function SeriesDrawer({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"overview" | "newEpisode" | "uploadSrt" | "uploading" | "uploaded">("overview");
  const [seriesTitle, setSeriesTitle] = useState("Lagos After Dark");
  const [description, setDescription] = useState("A gripping thriller set in the heart of Lagos.");
  const [genre, setGenre] = useState("Thriller");
  const [releaseDate, setReleaseDate] = useState("27/03/2026");
  const [creator, setCreator] = useState("Chisom Nwosu, Bayo Ola, Amina Diallo");
  const [tier, setTier] = useState("Basic");
  const [visibility, setVisibility] = useState("Published");
  const [newEpisodeTitle, setNewEpisodeTitle] = useState("");

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
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="fixed right-0 top-0 z-30 flex h-screen w-[602px] max-w-full flex-col border-l border-[#E6E7EC] bg-white shadow-[0_10px_30px_rgba(17,24,39,0.08)]"
      >
        <div className="flex items-center justify-between border-b border-[#ECEEF2] px-7 py-6">
          <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-[#16181D]">{seriesDrawer.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E6E7EC] bg-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-7 py-7">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.02em] text-[#8F939E]">Seasons</p>
            <div className="mt-4 space-y-3">
              {seriesDrawer.seasons.map((season, index) => (
                <SurfaceCard key={season.name}>
                  <div className="border-b border-[#ECEEF3] px-5 py-5 last:border-b-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <span className="h-[8px] w-[8px] rounded-full bg-[#2D8C7E]" />
                        <div>
                          <p className="text-[16px] font-semibold text-[#16181D]">{season.name}</p>
                          <p className="text-[13px] text-[#767B85]">{season.episodes} episodes</p>
                        </div>
                      </div>
                      <ToolbarButton subtle>Bulk upload</ToolbarButton>
                      <button
                        type="button"
                        onClick={() => setMode((current) => (current === "newEpisode" ? "overview" : "newEpisode"))}
                        className="inline-flex h-[44px] items-center gap-2 rounded-[14px] border border-[#B8C6FF] bg-white px-4 text-[14px] font-medium text-[#3150FF]"
                      >
                        <Plus className="h-4 w-4" />
                        Add episode
                      </button>
                      <ChevronDown className="h-5 w-5 text-[#727781]" />
                    </div>
                  </div>

                  {season.expanded ? (
                    <div className="divide-y divide-[#ECEEF3]">
                      {season.items.map((episode, episodeIndex) => (
                        <div key={episode.code} className="px-5 py-4">
                          <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                              <span className="text-[12px] font-semibold text-[#8A8F9A]">{episode.code}</span>
                              <div>
                                <p className="text-[16px] font-semibold text-[#16181D]">{episode.title}</p>
                                <p className="text-[13px] text-[#767B85]">{episode.runtime}</p>
                              </div>
                            </div>
                            <StatusBadge tone="ready">{episode.status}</StatusBadge>
                          </div>

                          {index === 0 && episodeIndex === 0 && mode === "uploadSrt" ? (
                            <button
                              type="button"
                              className="mt-4 flex h-[58px] w-full items-center justify-center rounded-[999px] border border-dashed border-[#D9DDE7] text-[15px] font-medium text-[#16181D]"
                              onClick={() => setMode("uploading")}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Upload .srt file
                            </button>
                          ) : null}

                          {index === 0 && episodeIndex === 0 && mode === "uploading" ? (
                            <div className="mt-4 rounded-[16px] border border-[#E6E7EC] bg-white px-4 py-4">
                              <div className="flex items-center justify-between gap-4">
                                <p className="text-[15px] font-semibold text-[#16181D]">lagos-after-dark-en.srt</p>
                                <span className="text-[12px] font-semibold text-[#3150FF]">68%</span>
                              </div>
                              <div className="mt-3">
                                <ProgressTrack value={68} />
                              </div>
                            </div>
                          ) : null}

                          {index === 0 && episodeIndex === 0 && mode === "uploaded" ? (
                            <div className="mt-4 rounded-[16px] border border-[#E6E7EC] bg-white px-4 py-4">
                              <div className="flex items-center justify-between gap-4">
                                <p className="text-[15px] font-semibold text-[#16181D]">lagos-after-dark-en.srt</p>
                                <StatusBadge tone="ready">Uploaded</StatusBadge>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}

                      {index === 0 && mode === "newEpisode" ? (
                        <div className="bg-[#F9FAFC] px-5 py-4">
                          <div className="flex items-center gap-3">
                            <TextField className="min-h-[44px]" value={newEpisodeTitle} onChange={setNewEpisodeTitle} placeholder="New episode title" />
                            <button
                              type="button"
                              className="rounded-[12px] bg-[#3150FF] px-4 py-3 text-[14px] font-medium text-white"
                              onClick={() => {
                                if (!newEpisodeTitle.trim()) return;
                                setMode("uploadSrt");
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </SurfaceCard>
              ))}

              <button
                type="button"
                className="flex h-[58px] w-full items-center justify-center rounded-[999px] border border-dashed border-[#D9DDE7] text-[15px] font-medium text-[#16181D]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add season
              </button>
            </div>
          </div>

          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.02em] text-[#8F939E]">Series details</p>
            <div className="mt-5 space-y-4">
              <div>
                <FieldLabel>Series title</FieldLabel>
                <TextField value={seriesTitle} onChange={setSeriesTitle} />
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <TextAreaField className="min-h-[152px]" value={description} onChange={setDescription} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Genre</FieldLabel>
                  <SelectField value={genre} onChange={setGenre} options={["Thriller", "Drama", "Comedy", "Action"]} />
                </div>
                <div>
                  <FieldLabel>Release date</FieldLabel>
                  <TextField value={releaseDate} onChange={setReleaseDate} />
                </div>
              </div>
              <div>
                <FieldLabel>Creator / Showrunner</FieldLabel>
                <TextField value={creator} onChange={setCreator} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
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
        </div>

        <div className="border-t border-[#ECEEF2] px-7 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button type="button" className="rounded-full bg-[#3150FF] px-6 py-3.5 text-[14px] font-medium text-white">
                Save changes
              </button>
              <button type="button" className="rounded-full border border-[#E6E7EC] px-5 py-3.5 text-[14px] font-medium text-[#16181D]">
                Cancel
              </button>
            </div>
            <button type="button" className="rounded-full border border-[#F16F73] px-5 py-3.5 text-[14px] font-medium text-[#F04438]">
              Archive series
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

export default function SeriesPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [statusFilter, setStatusFilter] = useState("All status");

  return (
    <DashboardShell title="Series & seasons" description="Browse, search and manage all series & seasons">
      <div className="px-4 py-5 md:px-6 xl:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <ToolbarSearchField placeholder="Search by title, genre, cast..." value={search} onChange={setSearch} />
          <ToolbarSelect value={typeFilter} onChange={setTypeFilter} options={["All types", "Drama", "Comedy", "Thriller", "Romance", "Action"]} />
          <ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={["All status", "Ready"]} />
        </div>

        <SurfaceCard className="mt-8 overflow-hidden">
          <div className="hidden grid-cols-[2fr_1fr_0.9fr_0.9fr_1fr_1fr] border-b border-[#ECEEF2] px-[18px] py-4 text-[13px] font-medium uppercase tracking-[0.02em] text-[#8E929B] lg:grid">
            <div className="pl-[110px]">Title</div>
            <div>Genre</div>
            <div>Seasons</div>
            <div>Episodes</div>
            <div>Status</div>
            <div>Date added</div>
          </div>

          {seriesRows
            .filter((row) => {
              const matchesSearch = !search || `${row.title} ${row.genre} ${row.subtitle}`.toLowerCase().includes(search.toLowerCase());
              const matchesType = typeFilter === "All types" || row.genre === typeFilter;
              const matchesStatus = statusFilter === "All status" || row.status === statusFilter;
              return matchesSearch && matchesType && matchesStatus;
            })
            .map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setDrawerOpen(true)}
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
                <StatusBadge tone={genreTone(row.genre) as "purple" | "cyan" | "blue" | "gray"}>{row.genre}</StatusBadge>
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
                <StatusBadge tone="ready">{row.status}</StatusBadge>
              </div>
              <div className="flex items-center justify-between text-[15px] text-[#16181D] lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Date added</span>
                {row.dateAdded}
              </div>
            </button>
          ))}

          <div className="flex flex-col gap-4 px-[18px] py-5 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-[15px] text-[#16181D]">Showing 1–10 of 1,248 assets</p>
            <div className="flex items-center gap-1.5">
              {["‹", "1", "2", "3", "…", "15", "›"].map((page) => (
                <button
                  key={page}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-[12px] border px-3 text-[14px] font-medium ${
                    page === "2" ? "border-[#3150FF] bg-[#3150FF] text-white" : "border-[#E6E7EC] bg-white text-[#16181D]"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </SurfaceCard>
      </div>

      <AnimatePresence>{drawerOpen ? <SeriesDrawer onClose={() => setDrawerOpen(false)} /> : null}</AnimatePresence>
    </DashboardShell>
  );
}
