"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { DataCardRow, ToolbarButton, ToolbarSearchField, ToolbarSelect } from "@/components/dashboard-widgets";
import { StatusBadge, SurfaceCard } from "@/components/page-primitives";
import { processingRows } from "@/features/dashboard-data";

function processingTone(status: string) {
  if (status === "Ready") return "ready";
  if (status === "Error") return "error";
  return "gray";
}

export default function ProcessingPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Filter by status");
  const rows = useMemo(
    () =>
      processingRows.filter((row) => {
        const matchesSearch = !search || `${row.title} ${row.subtitle} ${row.type}`.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "Filter by status" || row.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [search, statusFilter],
  );

  return (
    <DashboardShell title="Processing queue" description="Track and manage all media asset processing jobs">
      <div className="px-4 py-5 md:px-6 xl:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <ToolbarSearchField placeholder="Search by title, artist, genre..." value={search} onChange={setSearch} />
          <ToolbarButton>
            <RotateCcw className="h-4 w-4" />
            Retry all errors
          </ToolbarButton>
          <ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={["Filter by status", "Ready", "Queued", "Processing", "Error"]} />
        </div>

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
              key={`${row.title}-${row.date}`}
              className="grid items-center gap-4 border-b border-[#ECEEF2] px-[18px] py-[18px] lg:grid-cols-[2fr_1fr_1fr_1fr_0.5fr]"
            >
              <DataCardRow title={row.title} subtitle={row.subtitle} swatch={row.swatch} />
              <div className="flex items-center justify-between lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Type</span>
                <StatusBadge tone={row.typeTone as "purple" | "cyan"}>{row.type}</StatusBadge>
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
                  <StatusBadge tone={processingTone(row.status) as "ready" | "error"}>{row.status}</StatusBadge>
                )}
              </div>
              <div className="flex items-center justify-between text-[15px] text-[#16181D] lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Date added</span>
                {row.date}
              </div>
              <div className="flex justify-end">
                {row.status === "Error" ? (
                  <button
                    type="button"
                    className="rounded-full border border-[#F16F73] px-4 py-2 text-[13px] font-medium text-[#F04438]"
                  >
                    Retry
                  </button>
                ) : null}
              </div>
            </div>
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
    </DashboardShell>
  );
}
