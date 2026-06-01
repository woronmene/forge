"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { DataCardRow, FileStatusRow, ToolbarSearchField, ToolbarSelect } from "@/components/dashboard-widgets";
import { FieldLabel, SelectField, StatusBadge, SurfaceCard, TextAreaField, TextField } from "@/components/page-primitives";
import { albumRows } from "@/features/dashboard-data";

function AlbumDrawer({
  item,
  onClose,
}: {
  item: (typeof albumRows)[number];
  onClose: () => void;
}) {
  const isMix = item.type === "DJ Mix";
  const [title, setTitle] = useState<string>(item.title);
  const [description, setDescription] = useState(
    isMix ? "Sunday morning Amapiano vibes, straight from Johannesburg." : "A 14-track exploration of African identity, roots and diaspora culture.",
  );
  const [genre, setGenre] = useState<string>(item.genre);
  const [releaseDate, setReleaseDate] = useState("27/03/2026");
  const [artist, setArtist] = useState("Burna Boy");
  const [tier, setTier] = useState("Basic");
  const [visibility, setVisibility] = useState("Published");
  const [trackTitle, setTrackTitle] = useState("");
  const [trackArtist, setTrackArtist] = useState("");
  const [cueTime, setCueTime] = useState("00:00");

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
        className="fixed right-0 top-0 z-30 flex h-screen w-[610px] max-w-full flex-col border-l border-[#E6E7EC] bg-white shadow-[0_10px_30px_rgba(17,24,39,0.08)]"
      >
        <div className="flex items-center justify-between border-b border-[#ECEEF2] px-7 py-6">
          <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-[#16181D]">{item.title}</h2>
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
            <p className="text-[13px] font-medium uppercase tracking-[0.02em] text-[#8F939E]">
              {isMix ? "Track listing (cue points)" : "Tracks"}
            </p>
            <SurfaceCard className="mt-4">
              <div className="p-4">
                {isMix ? (
                  <div className="space-y-4">
                    <div className="divide-y divide-[#ECEEF3] rounded-[14px] border border-[#ECEEF3]">
                      {[
                        ["00:00", "Izikothane", "Kabza De Small"],
                        ["06:10", "Asibe Happy", "Kabza ft. Ami Faku"],
                      ].map(([time, title, artist]) => (
                        <div key={title} className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 px-4 py-4">
                          <span className="text-[13px] text-[#767B85]">{time}</span>
                          <div>
                            <p className="text-[15px] font-semibold text-[#16181D]">{title}</p>
                            <p className="text-[12px] text-[#7E838D]">{artist}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <TextField className="min-h-[44px] w-[64px] text-center" value={cueTime} onChange={setCueTime} />
                      <TextField className="min-h-[44px]" value={trackTitle} onChange={setTrackTitle} placeholder="Track title..." />
                      <button type="button" className="rounded-[12px] bg-[#3150FF] px-4 py-3 text-[14px] font-medium text-white">
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      "B. D'OR",
                      "On The Low",
                      "Lenu",
                      "Bank On It",
                    ].map((track, index) => (
                      <div key={track} className="flex items-center justify-between gap-3 rounded-[14px] border border-[#ECEEF3] px-4 py-4">
                        <div className="flex items-center gap-4">
                          <span className="text-[12px] text-[#7F848E]">{String(index + 1).padStart(2, "0")}</span>
                          <div>
                            <p className="text-[15px] font-semibold text-[#16181D]">{track}</p>
                            <p className="text-[12px] text-[#7A7F8A]">{index === 0 ? "Burna Boy ft. Wizkid" : "Burna Boy"}</p>
                          </div>
                        </div>
                        <StatusBadge tone="ready">Ready</StatusBadge>
                      </div>
                    ))}
                    <div className="flex items-center gap-3">
                      <TextField className="min-h-[44px]" value={trackTitle} onChange={setTrackTitle} placeholder="New track title" />
                      <TextField className="min-h-[44px]" value={trackArtist} onChange={setTrackArtist} placeholder="Artist" />
                      <button type="button" className="rounded-[12px] bg-[#3150FF] px-4 py-3 text-[14px] font-medium text-white">
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </SurfaceCard>
          </div>

          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.02em] text-[#8F939E]">{isMix ? "Mix cover" : "Album cover"}</p>
            <SurfaceCard className="mt-4">
              <div className="p-5">
                <div className="rounded-[18px] bg-[#121B2D] px-8 py-20 text-center text-[#6E7380]">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#6E7380]">
                    <div className="h-4 w-4 rounded-full border border-current" />
                  </div>
                  <p className="mt-4 text-[16px]">Click to upload</p>
                </div>
              </div>
            </SurfaceCard>
          </div>

          {isMix ? (
            <div>
              <p className="text-[13px] font-medium uppercase tracking-[0.02em] text-[#8F939E]">Mix file</p>
              <div className="mt-4">
                <FileStatusRow name="afrobeats_vibes_vol.mp3" status="ready" />
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.02em] text-[#8F939E]">{isMix ? "Mix details" : "Album details"}</p>
            <div className="mt-4 space-y-4">
              <div>
                <FieldLabel>{isMix ? "Album title" : "Album title"}</FieldLabel>
                <TextField value={title} onChange={setTitle} />
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <TextAreaField className="min-h-[136px]" value={description} onChange={setDescription} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Genre</FieldLabel>
                  <SelectField value={genre} onChange={setGenre} options={["Afropop", "Afrobeats", "Amapiano", "Highlife"]} />
                </div>
                <div>
                  <FieldLabel>Release date</FieldLabel>
                  <TextField value={releaseDate} onChange={setReleaseDate} />
                </div>
              </div>
              <div>
                <FieldLabel>{isMix ? "Artist / DJ" : "Artist"}</FieldLabel>
                <TextField value={artist} onChange={setArtist} />
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
              Archive album
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

export default function AlbumsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [statusFilter, setStatusFilter] = useState("All status");
  const selected = useMemo(() => albumRows.find((row) => row.id === selectedId) ?? null, [selectedId]);
  const filteredRows = useMemo(
    () =>
      albumRows.filter((row) => {
        const matchesSearch = !search || `${row.title} ${row.subtitle} ${row.genre}`.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === "All types" || row.type === typeFilter;
        const matchesStatus = statusFilter === "All status" || row.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
      }),
    [search, statusFilter, typeFilter],
  );

  return (
    <DashboardShell title="Series & seasons" description="Browse, search and manage all albums and DJ mixes">
      <div className="px-4 py-5 md:px-6 xl:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <ToolbarSearchField placeholder="Search by title, artist, genre..." value={search} onChange={setSearch} />
          <ToolbarSelect value={typeFilter} onChange={setTypeFilter} options={["All types", "Album", "DJ Mix"]} />
          <ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={["All status", "Ready"]} />
        </div>

        <SurfaceCard className="mt-8 overflow-hidden">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] border-b border-[#ECEEF2] px-[18px] py-4 text-[13px] font-medium uppercase tracking-[0.02em] text-[#8E929B] lg:grid">
            <div className="pl-[110px]">Title</div>
            <div>Type</div>
            <div>Genre</div>
            <div>Tracks</div>
            <div>Status</div>
            <div>Date added</div>
          </div>

          {filteredRows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setSelectedId(row.id)}
              className="grid w-full items-center gap-4 border-b border-[#ECEEF2] px-[18px] py-[18px] text-left transition hover:bg-[#FAFBFF] lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr]"
            >
              <DataCardRow title={row.title} subtitle={row.subtitle} swatch={row.swatch} />
              <div className="flex items-center justify-between lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Type</span>
                <StatusBadge tone={row.tone === "purple" ? "purple" : "cyan"}>{row.type}</StatusBadge>
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

      <AnimatePresence>{selected ? <AlbumDrawer item={selected} onClose={() => setSelectedId(null)} /> : null}</AnimatePresence>
    </DashboardShell>
  );
}
