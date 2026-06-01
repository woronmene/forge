"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Plus, X } from "lucide-react";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  DrawerAssetHeader,
  FauxBars,
  FlagMetric,
  MetricCard,
  SegmentTabs,
  SparkLine,
  ToolbarButton,
} from "@/components/dashboard-widgets";
import { SurfaceCard, StatusBadge } from "@/components/page-primitives";
import { analyticsCountries, analyticsDrawerDetails, analyticsSummary, analyticsTable } from "@/features/dashboard-data";

function AnalyticsDrawer({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"Overview" | "Geography" | "Details">("Overview");

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
        className="fixed right-0 top-0 z-30 flex h-screen w-[488px] max-w-full flex-col border-l border-[#E6E7EC] bg-white shadow-[0_10px_30px_rgba(17,24,39,0.08)]"
      >
        <div className="flex items-start justify-between border-b border-[#ECEEF2] px-6 py-5">
          <DrawerAssetHeader swatch="#7F419C" title="Motherland" subtitle="Burna Boy" tag="Album" />
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E6E7EC] bg-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-8 border-b border-[#ECEEF2] px-6">
          {analyticsDrawerDetails.tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item as typeof tab)}
              className={`border-b-2 px-2 py-4 text-[14px] font-medium ${
                tab === item ? "border-[#3150FF] text-[#16181D]" : "border-transparent text-[#6E7380]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {tab === "Overview" ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-[14px] text-[#666D77]">Viewing window</p>
                <SegmentTabs items={["7 days", "30 days", "90 days", "All"]} active="30 days" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <MetricCard label="Total views" value="48hr" helper="↑ 22% vs prev" />
                <MetricCard label="Unique viewers" value="88K" helper="↑ 16% vs prev" />
                <MetricCard label="Likes" value="14.4K" helper="↑ 31% vs prev" />
                <MetricCard label="Saves" value="6.2K" helper="↑ 18% vs prev" />
              </div>
              <SurfaceCard>
                <div className="p-4">
                  <p className="text-[13px] font-semibold uppercase text-[#16181D]">Top countries</p>
                  <div className="mt-4 space-y-5">
                    {[
                      ["Nigeria", "73,100", 98],
                      ["Ghana", "22,700", 72],
                      ["United Kingdom", "19,500", 44],
                      ["United States", "16,200", 32],
                    ].map(([label, value, share]) => (
                      <div key={label} className="flex items-center justify-between gap-4">
                        <p className="text-[15px] text-[#666D77]">{label}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-[15px] font-semibold text-[#16181D]">{value}</span>
                          <SparkLine value={Number(share)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SurfaceCard>
            </div>
          ) : null}

          {tab === "Geography" ? (
            <SurfaceCard>
              <div className="p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_100px_90px] border-b border-[#ECEEF2] pb-3 text-[12px] font-semibold uppercase text-[#16181D]">
                  <div>Top countries</div>
                  <div className="text-right">Views</div>
                  <div className="text-right">Share</div>
                </div>
                <div className="space-y-5 pt-5">
                  {[
                    ["Nigeria", "73,100", 98],
                    ["Ghana", "22,700", 72],
                    ["United Kingdom", "19,500", 44],
                    ["United States", "16,200", 32],
                    ["Kenya", "11,400", 20],
                    ["Other", "19,440", 12],
                  ].map(([label, value, share]) => (
                    <div key={label} className="grid grid-cols-[minmax(0,1fr)_100px_90px] items-center gap-4">
                      <p className="text-[15px] text-[#666D77]">{label}</p>
                      <p className="text-right text-[15px] font-semibold text-[#16181D]">{value}</p>
                      <div className="flex justify-end">
                        <SparkLine value={Number(share)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SurfaceCard>
          ) : null}

          {tab === "Details" ? (
            <SurfaceCard>
              <div className="p-4">
                <p className="text-[13px] font-semibold uppercase text-[#16181D]">Asset details</p>
                <div className="mt-5 space-y-5">
                  {[
                    ["Asset ID", "MS-00162"],
                    ["Runtime", "1h 48m"],
                    ["Renditions", "6 / 6 ready"],
                    ["Status", "Live"],
                    ["Access tier", "Basic"],
                    ["Released", "15 Oct 2025"],
                    ["Subtitles", "EN"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4">
                      <p className="text-[15px] text-[#666D77]">{label}</p>
                      {label === "Status" ? (
                        <StatusBadge tone="ready">{value}</StatusBadge>
                      ) : (
                        <p className="text-[15px] font-semibold text-[#16181D]">{value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </SurfaceCard>
          ) : null}
        </div>
      </motion.aside>
    </>
  );
}

export default function AnalyticsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [range, setRange] = useState("30 days");
  const [metric, setMetric] = useState("Views");

  return (
    <DashboardShell title="Analytics" description="Track viewing metrics and engagement across all content">
      <div className="space-y-5 px-4 py-5 md:px-6 xl:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SegmentTabs items={["7 days", "30 days", "90 days", "All time"]} active={range} onChange={setRange} />
          <div className="flex flex-wrap items-center gap-3">
            <ToolbarButton>
              <Plus className="h-4 w-4" />
              Add filter
            </ToolbarButton>
            <ToolbarButton>Export CSV</ToolbarButton>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {analyticsSummary.map((item) => (
            <MetricCard
              key={item.label}
              label={item.label}
              value={item.value}
              helper={item.helper}
              helperTone={item.tone as "positive" | "negative" | "neutral"}
            />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <SurfaceCard>
            <div className="border-b border-[#ECEEF2] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold uppercase text-[#757B85]">Views over time</p>
                  <p className="mt-2 text-[19px] font-semibold text-[#16181D]">2,400,000</p>
                </div>
                <div className="flex items-center gap-2">
                  <ToolbarButton>
                    <Plus className="h-4 w-4" />
                    Custom Date
                  </ToolbarButton>
                  <ToolbarButton withChevron>1Y</ToolbarButton>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <SegmentTabs items={["Views", "Likes", "Saves"]} active={metric} onChange={setMetric} />
                <div className="flex items-center gap-2">
                  <button type="button" className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-[#E6E7EC]">
                    <BarChart3 className="h-4 w-4" />
                  </button>
                  <button type="button" className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-[#E6E7EC]">
                    <span className="text-[16px]">↗</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <FauxBars values={[48, 62, 44, 58, 88, 61, 77, 75, 74, 88, 56, 54]} highlightIndex={4} />
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <p className="text-[14px] font-semibold text-[#16181D]">Viewer Geography</p>
                <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E6E7EC] bg-white">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-5 space-y-5">
                {analyticsCountries.map((country) => (
                  <FlagMetric
                    key={country.country}
                    flag={country.flag}
                    label={country.country}
                    value={country.subtitle}
                    share={country.share}
                  />
                ))}
              </div>
              <button type="button" className="mt-6 flex h-[50px] w-full items-center justify-center rounded-[999px] border border-[#E6E7EC] text-[15px] font-medium text-[#16181D]">
                View All Countries
              </button>
            </div>
          </SurfaceCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <SurfaceCard className="overflow-hidden">
            <div className="hidden grid-cols-[2fr_1fr_0.9fr_0.9fr_1fr] border-b border-[#ECEEF2] px-[18px] py-4 text-[13px] font-medium uppercase tracking-[0.02em] text-[#8E929B] lg:grid">
              <div className="pl-[92px]">Title</div>
              <div>Type</div>
              <div>Views</div>
              <div>Likes</div>
              <div>Completion</div>
            </div>
            {analyticsTable.map((row) => (
              <button
                key={row.title}
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="grid w-full items-center gap-4 border-b border-[#ECEEF2] px-[18px] py-[18px] text-left transition hover:bg-[#FAFBFF] lg:grid-cols-[2fr_1fr_0.9fr_0.9fr_1fr]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-[40px] w-[60px] items-center justify-center rounded-[8px]" style={{ backgroundColor: row.swatch }}>
                    <span className="ml-1 text-[20px] text-white">▶</span>
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold text-[#16181D]">{row.title}</p>
                    <p className="mt-1 text-[13px] text-[#7D828B]">{row.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:block">
                  <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Type</span>
                  <StatusBadge tone={row.tone as "purple" | "cyan"}>{row.type}</StatusBadge>
                </div>
                <div className="flex items-center justify-between text-[15px] text-[#16181D] lg:block">
                  <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Views</span>
                  {row.views}
                </div>
                <div className="flex items-center justify-between text-[15px] text-[#16181D] lg:block">
                  <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Likes</span>
                  {row.likes}
                </div>
                <div className="flex items-center justify-between lg:block">
                  <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Completion</span>
                  <SparkLine value={row.completion} />
                </div>
              </button>
            ))}
          </SurfaceCard>

          <SurfaceCard>
            <div className="p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_90px_90px] border-b border-[#ECEEF2] pb-3 text-[13px] font-medium uppercase tracking-[0.02em] text-[#8E929B]">
                <div>Country</div>
                <div>Views</div>
                <div>Share</div>
              </div>
              <div className="space-y-4 pt-4">
                {[
                  ["🇳🇬", "Nigeria", "891K", 98],
                  ["🇬🇧", "United Kingdom", "504K", 72],
                  ["🇺🇸", "United States", "432K", 89],
                  ["🇬🇭", "Ghana", "168K", 91],
                  ["🇨🇦", "Canada", "100K", 62],
                ].map(([flag, label, views, share]) => (
                  <div key={label} className="grid grid-cols-[minmax(0,1fr)_90px_90px] items-center gap-3 border-b border-[#ECEEF2] pb-4 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[18px]">{flag}</span>
                      <p className="text-[14px] font-semibold text-[#16181D]">{label}</p>
                    </div>
                    <p className="text-[14px] text-[#16181D]">{views}</p>
                    <div className="flex justify-end">
                      <SparkLine value={Number(share)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>

      <AnimatePresence>{drawerOpen ? <AnalyticsDrawer onClose={() => setDrawerOpen(false)} /> : null}</AnimatePresence>
    </DashboardShell>
  );
}
