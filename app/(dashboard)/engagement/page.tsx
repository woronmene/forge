"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { FauxBars, MetricCard, SegmentTabs, SparkLine, ToolbarButton } from "@/components/dashboard-widgets";
import { SurfaceCard } from "@/components/page-primitives";
import { engagementSummary } from "@/features/dashboard-data";

export default function EngagementPage() {
  const [range, setRange] = useState("30 days");

  return (
    <DashboardShell title="Engagement overview" description="Platform-level user activity, retention and geographic distribution">
      <div className="space-y-5 px-4 py-5 md:px-6 xl:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SegmentTabs items={["7 days", "30 days", "90 days"]} active={range} onChange={setRange} />
          <div className="flex flex-wrap items-center gap-3">
            <ToolbarButton>
              <Plus className="h-4 w-4" />
              Add filter
            </ToolbarButton>
            <ToolbarButton>Export CSV</ToolbarButton>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {engagementSummary.map((item) => (
            <MetricCard key={item.label} label={item.label} value={item.value} helper={item.helper} helperTone="positive" />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_470px]">
          <SurfaceCard>
            <div className="p-5">
              <h2 className="text-[24px] font-semibold tracking-[-0.05em] text-[#16181D]">Daily &amp; Monthly Active Users</h2>
              <p className="mt-2 text-[15px] text-[#7A7F89]">Last 30 days</p>
              <div className="mt-6">
                <FauxBars values={[40, 54, 38, 49, 77, 58, 65, 67, 66, 78, 47, 49]} highlightIndex={4} max={100} yLabels={["0", "1.4K", "2.7K", "4.1K"]} />
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="p-5">
              <p className="text-[16px] font-semibold text-[#16181D]">Geographic distribution</p>
              <div className="mt-6 space-y-8">
                {[
                  ["🇳🇬", "Nigeria", "4,812 Users", 45],
                  ["🇬🇧", "UK", "2,168 Users", 30],
                  ["🇬🇭", "Ghana", "868 Users", 9],
                ].map(([flag, country, users, share]) => (
                  <div key={country} className="flex items-center justify-between gap-4 border-b border-[#ECEEF3] pb-5 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[20px]">{flag}</span>
                      <div>
                        <p className="text-[16px] font-semibold text-[#16181D]">{country}</p>
                        <p className="text-[14px] text-[#7A7F89]">{users}</p>
                      </div>
                    </div>
                    <SparkLine value={Number(share)} />
                  </div>
                ))}
              </div>
              <button type="button" className="mt-6 flex h-[58px] w-full items-center justify-center rounded-[999px] border border-[#E6E7EC] text-[15px] font-medium text-[#16181D]">
                View All Countries
              </button>
            </div>
          </SurfaceCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard>
            <div className="p-5">
              <p className="text-[16px] font-semibold text-[#16181D]">New registrations</p>
              <p className="mt-4 text-[15px] text-[#7A7F89]">Total new users — last 30 days</p>
              <div className="mt-6 flex items-end gap-3">
                <span className="text-[52px] font-semibold tracking-[-0.06em] text-[#16181D]">1,248</span>
                <div className="pb-2 text-[14px] text-[#228473]">
                  ↗ 11%
                  <div className="text-[#7A7F89]">vs prev period</div>
                </div>
              </div>
              <div className="mt-8 space-y-6">
                {[
                  ["Daily average", "41.6 / day"],
                  ["Peak day this period", "118 users"],
                  ["Lowest day this period", "23 users"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 text-[15px]">
                    <span className="text-[#666D77]">{label}</span>
                    <span className="font-semibold text-[#16181D]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="p-5">
              <p className="text-[16px] font-semibold text-[#16181D]">New registrations</p>
              <p className="mt-4 text-[15px] text-[#7A7F89]">Total new users — last 30 days</p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  ["D1", "68%", "+62%", "#3150FF", "Next day"],
                  ["D7", "68%", "+40%", "#228473", "After 7 days"],
                  ["D30", "68%", "-8%", "#D97706", "After 30 days"],
                ].map(([label, value, delta, color, copy]) => (
                  <div key={label} className="rounded-[18px] border border-[#E6E7EC] p-4 text-center">
                    <p className="text-[16px] font-semibold text-[#666D77]">{label}</p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <span className="text-[30px] font-semibold" style={{ color: color as string }}>
                        {value}
                      </span>
                      <span className="rounded-[8px] bg-[#F2F5F8] px-2 py-1 text-[12px]" style={{ color: color as string }}>
                        {delta}
                      </span>
                    </div>
                    <p className="mt-3 text-[14px] text-[#6E7380]">{copy}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[15px] leading-8 text-[#6E7380]">
                D1 and D7 retention are improving — users are coming back in the short term. D30 is slightly down, suggesting long-term re-engagement needs attention.
              </p>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </DashboardShell>
  );
}
