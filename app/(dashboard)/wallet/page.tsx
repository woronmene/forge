"use client";

import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { ExportButton, MetricCard, ProviderStatus, SegmentTabs, SparkLine, ToolbarSelect, ToolbarSearchField } from "@/components/dashboard-widgets";
import { StatusBadge, SurfaceCard } from "@/components/page-primitives";
import { walletSummary, walletTransactions } from "@/features/dashboard-data";

export default function WalletPage() {
  const [period, setPeriod] = useState("Monthly");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Type");
  const [statusFilter, setStatusFilter] = useState("Status");
  const filteredTransactions = useMemo(
    () =>
      walletTransactions.filter((row) => {
        const matchesSearch = !search || `${row.user} ${row.reference}`.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === "Type" || row.type === typeFilter;
        const matchesStatus = statusFilter === "Status" || row.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
      }),
    [search, statusFilter, typeFilter],
  );

  return (
    <DashboardShell title="Wallet activity" description="Embedded finance overview — bill pay, remittances & debit cards">
      <div className="space-y-5 px-4 py-5 md:px-6 xl:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SegmentTabs items={["Daily", "Monthly"]} active={period} onChange={setPeriod} />
          <ExportButton>↘ Export CSV</ExportButton>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          {walletSummary.map((item) => (
            <MetricCard key={item.label} label={item.label} value={item.value} helper={item.helper} helperTone={item.tone as "positive" | "negative" | "neutral"} />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard>
            <div className="p-4">
              <p className="text-[13px] font-semibold uppercase text-[#16181D]">Volume breakdown</p>
              <p className="mt-2 text-[13px] text-[#7A7F89]">Monthly · May 2026</p>
              <div className="mt-6 space-y-6">
                {[
                  ["Bill pay volume", "₦168,400,000"],
                  ["Remittance volume", "₦115,600,000"],
                  ["Bill pay count", "2,840"],
                  ["Remittance count", "1,378"],
                  ["Avg bill pay size", "₦59,296"],
                  ["Avg remittance size", "₦83,890"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 text-[14px]">
                    <span className="text-[#666D77]">{label}</span>
                    <span className="font-semibold text-[#16181D]">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 space-y-6">
                <div>
                  <div className="mb-3 flex items-center justify-between text-[14px]">
                    <span className="text-[#666D77]">Bill pay</span>
                    <span className="text-[#228473]">1.8%</span>
                  </div>
                  <div className="h-[4px] rounded-full bg-[#ECEEF4]">
                    <div className="h-[4px] w-[10%] rounded-full bg-[#228473]" />
                  </div>
                </div>
                <div>
                  <div className="mb-3 flex items-center justify-between text-[14px]">
                    <span className="text-[#666D77]">Remittances</span>
                    <span className="text-[#B4233A]">3.4%</span>
                  </div>
                  <div className="h-[4px] rounded-full bg-[#ECEEF4]">
                    <div className="h-[4px] w-[16%] rounded-full bg-[#B4233A]" />
                  </div>
                </div>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="p-4">
              <p className="text-[13px] font-semibold uppercase text-[#16181D]">Geographic distribution</p>
              <p className="mt-2 text-[13px] text-[#7A7F89]">Nigeria only · Phase 1</p>
              <div className="mt-6 grid grid-cols-[minmax(0,1fr)_100px_90px] border-b border-[#ECEEF2] pb-3 text-[12px] font-semibold uppercase text-[#7A7F89]">
                <div>State</div>
                <div>Volume</div>
                <div>Share</div>
              </div>
              <div className="space-y-4 pt-4">
                {[
                  ["Lagos", "₦142M", 45],
                  ["Abuja", "₦62M", 22],
                  ["Kano", "₦34M", 12],
                  ["Port Harcourt", "₦28M", 10],
                  ["Other", "₦18M", 6],
                ].map(([label, volume, share]) => (
                  <div key={label} className="grid grid-cols-[minmax(0,1fr)_100px_90px] items-center gap-4">
                    <p className="text-[14px] text-[#666D77]">{label}</p>
                    <p className="text-[14px] font-semibold text-[#16181D]">{volume}</p>
                    <div className="flex justify-end">
                      <SparkLine value={Number(share)} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-8 text-[13px] font-semibold uppercase text-[#16181D]">Sender vs recipient</p>
              <div className="mt-5 space-y-4">
                {[
                  ["Domestic (sender Nigeria)", "₦198M", "70%"],
                  ["Inbound remittances (UK)", "₦52M", "18%"],
                  ["Inbound remittances (US)", "₦34M", "12%"],
                ].map(([label, value, share]) => (
                  <div key={label} className="grid grid-cols-[minmax(0,1fr)_100px_50px] gap-4 text-[14px]">
                    <p className="text-[#666D77]">{label}</p>
                    <p className="font-semibold text-[#16181D]">{value}</p>
                    <p className="text-[#7A7F89]">{share}</p>
                  </div>
                ))}
              </div>
            </div>
          </SurfaceCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard>
            <div className="p-4">
              <p className="text-[13px] font-semibold uppercase text-[#16181D]">Card issued</p>
              <p className="mt-2 text-[13px] text-[#7A7F89]">Total and new over period</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {[
                  ["1,842", "Total cards issued", "#16181D"],
                  ["+214", "New this period", "#228473"],
                  ["1,604", "Active cards", "#D97706"],
                  ["238", "Inactive cards", "#767C86"],
                ].map(([value, label, color]) => (
                  <div key={label} className="rounded-[16px] border border-[#E6E7EC] p-4 text-center">
                    <p className="text-[33px] font-semibold" style={{ color: color as string }}>
                      {value}
                    </p>
                    <p className="mt-2 text-[12px] text-[#6F7480]">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-[#666D77]">Active rate</span>
                  <span className="font-semibold text-[#228473]">87%</span>
                </div>
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-[#666D77]">Avg spend per active card</span>
                  <span className="font-semibold text-[#16181D]">₦48,200 / mo</span>
                </div>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="p-4">
              <p className="text-[13px] font-semibold uppercase text-[#16181D]">Card transaction volume</p>
              <p className="mt-2 text-[13px] text-[#7A7F89]">Monthly · May 2026</p>
              <div className="mt-6 space-y-6">
                {[
                  ["Total card volume", "₦77,240,800"],
                  ["Transaction count", "3,614"],
                  ["Avg transaction size", "₦21,370"],
                  ["Failure rate", "1.2%"],
                  ["Top category", "Airtime & data"],
                  ["Period vs prev", "↑ 22%"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 text-[14px]">
                    <span className="text-[#666D77]">{label}</span>
                    <span className={`font-semibold ${label === "Failure rate" ? "text-[#C1122F]" : label === "Period vs prev" ? "text-[#228473]" : "text-[#16181D]"}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-4 p-4">
            <ToolbarSearchField placeholder="Search by user ID..." value={search} onChange={setSearch} />
            <ToolbarSelect value={typeFilter} onChange={setTypeFilter} options={["Type", "Bill Pay", "Remittance", "Card"]} />
            <ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={["Status", "Success", "Pending", "Failed"]} />
          </div>
          <div className="hidden grid-cols-[1fr_0.7fr_0.8fr_0.9fr_0.7fr_0.8fr] border-y border-[#ECEEF2] px-[18px] py-4 text-[12px] font-medium uppercase tracking-[0.02em] text-[#8E929B] lg:grid">
            <div>User ID</div>
            <div>Type</div>
            <div>Amount</div>
            <div>Date & time</div>
            <div>Status</div>
            <div>Reference</div>
          </div>
          {filteredTransactions.map((row) => (
            <div key={row.reference} className="grid items-center gap-4 border-b border-[#ECEEF2] px-[18px] py-[16px] lg:grid-cols-[1fr_0.7fr_0.8fr_0.9fr_0.7fr_0.8fr]">
              <div className="flex items-center justify-between text-[14px] font-semibold text-[#16181D] lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">User</span>
                {row.user}
              </div>
              <div className="flex items-center justify-between lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Type</span>
                <StatusBadge tone={row.tone as "purple" | "blue" | "cyan"}>{row.type}</StatusBadge>
              </div>
              <div className="flex items-center justify-between text-[14px] font-semibold text-[#16181D] lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Amount</span>
                {row.amount}
              </div>
              <div className="flex items-center justify-between text-[14px] text-[#16181D] lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Date</span>
                {row.date}
              </div>
              <div className="flex items-center justify-between lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Status</span>
                {row.status === "Success" ? (
                  <StatusBadge tone="ready">Success</StatusBadge>
                ) : row.status === "Pending" ? (
                  <span className="inline-flex items-center gap-1 rounded-[8px] border border-[#F0C299] bg-[#FFF3E8] px-[10px] py-[5px] text-[12px] font-medium text-[#C55D0A]">Pending</span>
                ) : (
                  <StatusBadge tone="error">Failed</StatusBadge>
                )}
              </div>
              <div className="flex items-center justify-between text-[14px] text-[#16181D] lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Reference</span>
                {row.reference}
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

        <SurfaceCard>
          <div className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold uppercase text-[#16181D]">Fetch provider status</p>
                <p className="mt-2 text-[13px] text-[#7A7F89]">Real-time webhook delivery · last updated 6 min ago</p>
              </div>
              <ExportButton>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </ExportButton>
            </div>
            <div className="mt-5">
              <ProviderStatus label="Bill Pay Provider" subtitle="Last event: 4 min ago · 1,248 events today" status="Healthy" />
              <ProviderStatus label="Remittance Provider" subtitle="Last event: 3 hrs ago · No events in last 2 hrs" status="Down" />
              <ProviderStatus label="Debit Card Provider" subtitle="Last event: 2 min ago · 614 events today" status="Healthy" />
            </div>
          </div>
        </SurfaceCard>
      </div>
    </DashboardShell>
  );
}
