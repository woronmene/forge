"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AvatarCircle, MetricCard, ToolbarButton, ToolbarSearchField } from "@/components/dashboard-widgets";
import { SelectField, StatusBadge, SurfaceCard } from "@/components/page-primitives";
import { userRows, userSummary } from "@/features/dashboard-data";

function UserDrawer({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"Profile" | "Engagement" | "Subscription" | "Audit log">("Profile");

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
        className="fixed right-0 top-0 z-30 flex h-screen w-[540px] max-w-full flex-col border-l border-[#E6E7EC] bg-white shadow-[0_10px_30px_rgba(17,24,39,0.08)]"
      >
        <div className="flex items-start justify-between border-b border-[#ECEEF2] px-6 py-5">
          <div className="flex items-center gap-4">
            <AvatarCircle text="AO" color="#101827" />
            <div>
              <p className="text-[16px] font-semibold text-[#16181D]">Amara Okonkwo</p>
              <p className="text-[13px] text-[#707580]">amara.o@gmail.com</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E6E7EC] bg-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-8 border-b border-[#ECEEF2] px-6">
          {(["Profile", "Engagement", "Subscription", "Audit log"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`border-b-2 px-2 py-4 text-[14px] font-medium ${
                tab === item ? "border-[#3150FF] text-[#16181D]" : "border-transparent text-[#6E7380]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {tab === "Profile" ? (
            <SurfaceCard>
              <div className="p-4">
                <p className="text-[13px] font-semibold uppercase text-[#16181D]">Account details</p>
                <div className="mt-5 space-y-5">
                  {[
                    ["Full name", "Amara Okonkwo"],
                    ["Email", "amara.o@gmail.com"],
                    ["Country / City", "🇳🇬 Nigeria, Lagos"],
                    ["Device", "iOS iPhone 14"],
                    ["App version", "v2.4.1"],
                    ["Registered", "12 Jan 2026"],
                    ["Last active", "2h ago"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4">
                      <p className="text-[15px] text-[#666D77]">{label}</p>
                      <p className="text-[15px] font-semibold text-[#16181D]">{value}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[15px] text-[#666D77]">Status</p>
                    <StatusBadge tone="ready">Active</StatusBadge>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[15px] text-[#666D77]">Tier</p>
                    <StatusBadge tone="purple">Premium</StatusBadge>
                  </div>
                </div>
              </div>
            </SurfaceCard>
          ) : null}

          {tab === "Engagement" ? (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <MetricCard label="Total watch time" value="48hr" />
                <MetricCard label="Avg session" value="1hr 22mins" />
                <MetricCard label="Sessions / month" value="34" />
                <MetricCard label="Completion rate" value="74%" />
              </div>
              <SurfaceCard>
                <div className="p-4">
                  <p className="text-[13px] font-semibold uppercase text-[#16181D]">Recently watched</p>
                  <div className="mt-4 space-y-4">
                    {[
                      ["Motherland", "Burna Boy • 52m", "#7F419C", 98],
                      ["Afrobeats Vibes Vol.3", "DJ Spinall • 1h 12 m", "#B91F1F", 72],
                      ["A Good Time", "Davido • 58m", "#2F5ABB", 89],
                      ["Amapiano Sundays", "DJ Maphorisa • 58m", "#15325F", 91],
                      ["Highlife Reborn", "Various Artists • 41m", "#0E7311", 62],
                      ["Made in Lagos", "Wizkid • 55m", "#BDAA03", 98],
                    ].map(([title, subtitle, swatch, share]) => (
                      <div key={title} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-[42px] w-[66px] items-center justify-center rounded-[8px]" style={{ backgroundColor: swatch as string }}>
                            <span className="ml-1 text-[20px] text-white">▶</span>
                          </div>
                          <div>
                            <p className="text-[15px] font-semibold text-[#16181D]">{title}</p>
                            <p className="text-[13px] text-[#757A84]">{subtitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-[4px] w-[28px] rounded-full bg-[#3150FF]" />
                          <span className="text-[12px] font-semibold text-[#3150FF]">{share}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SurfaceCard>
              <SurfaceCard>
                <div className="p-4">
                  <p className="text-[13px] font-semibold uppercase text-[#7B8088]">Liked (5)</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Motherland", "Afrobeats Vibes Vol. 3", "Lagos After Dark", "The Lagos Way", "Amapiano Sundays"].map((item) => (
                      <span key={item} className="rounded-[10px] border border-[#E6E7EC] px-3 py-2 text-[13px] text-[#16181D]">
                        <span className="mr-1 text-[#3150FF]">●</span>
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="mt-6 text-[13px] font-semibold uppercase text-[#7B8088]">Saved (3)</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Highlife Reborn", "Made in Lagos", "Naija Stories S2"].map((item) => (
                      <span key={item} className="rounded-[10px] border border-[#E6E7EC] px-3 py-2 text-[13px] text-[#16181D]">
                        <span className="mr-1 text-[#228473]">●</span>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </SurfaceCard>
              <SurfaceCard>
                <div className="p-4">
                  <p className="text-[13px] font-semibold uppercase text-[#7B8088]">Content types</p>
                  <div className="mt-4 space-y-4">
                    {[
                      ["Movies", 42, "#3150FF"],
                      ["DJ Mixes", 34, "#F97316"],
                      ["Series", 18, "#7C3AED"],
                      ["Albums", 10, "#38B000"],
                    ].map(([label, share, color]) => (
                      <div key={label} className="grid grid-cols-[90px_minmax(0,1fr)_40px] items-center gap-4">
                        <p className="text-[15px] text-[#666D77]">{label}</p>
                        <div className="h-[4px] rounded-full bg-[#ECEEF4]">
                          <div className="h-[4px] rounded-full" style={{ width: `${share}%`, backgroundColor: color as string }} />
                        </div>
                        <p className="text-right text-[13px] font-semibold text-[#666D77]">{share}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              </SurfaceCard>
            </div>
          ) : null}

          {tab === "Subscription" ? (
            <div className="space-y-5">
              <SurfaceCard>
                <div className="p-4">
                  <p className="text-[13px] font-semibold uppercase text-[#16181D]">Current plan</p>
                  <div className="mt-5 space-y-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] text-[#666D77]">Tier</p>
                      <StatusBadge tone="purple">Premium</StatusBadge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] text-[#666D77]">Start date</p>
                      <p className="text-[15px] font-semibold text-[#16181D]">1 May 2026</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] text-[#666D77]">Next renewal</p>
                      <p className="text-[15px] font-semibold text-[#16181D]">1 June 2026</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] text-[#666D77]">Billing</p>
                      <p className="text-[15px] font-semibold text-[#16181D]">Monthly · ₦4,500</p>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
              <SurfaceCard>
                <div className="p-4">
                  <p className="text-[13px] font-semibold uppercase text-[#16181D]">Payment history</p>
                  <div className="mt-4 space-y-4">
                    {["1 Apr 2026", "1 Mar 2026", "1 Feb 2026"].map((date) => (
                      <div key={date} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#EEF1FF] text-[#3150FF]">
                            ⌁
                          </div>
                          <div>
                            <p className="text-[15px] font-semibold text-[#16181D]">Premium — Monthly</p>
                            <p className="text-[13px] text-[#767C86]">{date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[15px] font-semibold text-[#16181D]">₦4,500</p>
                          <p className="text-[13px] text-[#228473]">Paid</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SurfaceCard>
            </div>
          ) : null}

          {tab === "Audit log" ? (
            <SurfaceCard>
              <div className="p-4">
                <p className="text-[13px] font-semibold uppercase text-[#16181D]">Admin actions</p>
                <div className="mt-5 space-y-6">
                  {[
                    ["Subscription upgraded to Premium", "Johny Jackson · Content Admin", "12 Mar 2026, 14:22", "#3150FF"],
                    ["Password reset triggered", "Johny Jackson · Content Admin", "02 Mar 2026, 09:41", "#228473"],
                    ["Account flagged for review", "Sade Williams · Super Admin", "18 Feb 2026, 16:05", "#F97316"],
                    ["Flag removed · resolved", "Sade Williams · Super Admin", "20 Feb 2026, 11:30", "#228473"],
                    ["Account created", "Self-registered via iOS", "12 Jan 2026, 08:14", "#8B8B8B"],
                  ].map(([title, subtitle, date, color]) => (
                    <div key={title} className="grid grid-cols-[14px_minmax(0,1fr)_120px] gap-4">
                      <span className="mt-1.5 h-[11px] w-[11px] rounded-full" style={{ backgroundColor: color as string }} />
                      <div>
                        <p className="text-[15px] font-semibold text-[#16181D]">{title}</p>
                        <p className="mt-1 text-[13px] text-[#767C86]">{subtitle}</p>
                      </div>
                      <p className="text-right text-[13px] text-[#767C86]">{date}</p>
                    </div>
                  ))}
                </div>
              </div>
            </SurfaceCard>
          ) : null}
        </div>

        <div className="border-t border-[#ECEEF2] px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button type="button" className="rounded-full bg-[#3150FF] px-6 py-3.5 text-[14px] font-medium text-white">
                Reset password
              </button>
              <button type="button" className="rounded-full border border-[#E6E7EC] px-5 py-3.5 text-[14px] font-medium text-[#16181D]">
                Change tier
              </button>
            </div>
            <button type="button" className="rounded-full border border-[#F16F73] px-5 py-3.5 text-[14px] font-medium text-[#F04438]">
              Suspend account
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

export default function UsersPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState("All");
  const [dateRange, setDateRange] = useState("Last 90 days");
  const [geography, setGeography] = useState("All countries");
  const filteredRows = useMemo(
    () =>
      userRows.filter((row) => {
        const matchesSearch = !search || `${row.name} ${row.email}`.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "All" || row.status === statusFilter;
        const matchesTier = tierFilter === "All" || row.tier === tierFilter;
        const matchesGeography = geography === "All countries" || row.country === geography;
        return matchesSearch && matchesStatus && matchesTier && matchesGeography && !!dateRange;
      }),
    [dateRange, geography, search, statusFilter, tierFilter],
  );

  return (
    <DashboardShell title="User directory" description="Search, filter and manage the full registered user base">
      <div className="space-y-5 px-4 py-5 md:px-6 xl:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <ToolbarSearchField placeholder="Search by name or email address..." value={search} onChange={setSearch} />
          <ToolbarButton onClick={() => setFiltersVisible((current) => !current)}>
            <SlidersHorizontal className="h-4 w-4" />
            {filtersVisible ? "Hide filters" : "Add filter"}
          </ToolbarButton>
        </div>

        {filtersVisible ? <SurfaceCard>
          <div className="flex flex-col gap-4 p-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="mb-2 text-[14px] font-medium text-[#16181D]">Status</p>
                <SelectField className="min-h-[48px]" value={statusFilter} onChange={setStatusFilter} options={["All", "Active", "Suspended"]} />
              </div>
              <div>
                <p className="mb-2 text-[14px] font-medium text-[#16181D]">Subscription tier</p>
                <SelectField className="min-h-[48px]" value={tierFilter} onChange={setTierFilter} options={["All", "Basic", "Premium"]} />
              </div>
              <div>
                <p className="mb-2 text-[14px] font-medium text-[#16181D]">Date Range</p>
                <SelectField className="min-h-[48px]" value={dateRange} onChange={setDateRange} options={["Last 7 days", "Last 30 days", "Last 90 days", "This year"]} />
              </div>
              <div>
                <p className="mb-2 text-[14px] font-medium text-[#16181D]">Geography</p>
                <SelectField className="min-h-[48px]" value={geography} onChange={setGeography} options={["All countries", "Nigeria", "Ghana", "United Kingdom", "South Africa"]} />
              </div>
            </div>
          </div>
        </SurfaceCard> : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {userSummary.map((item) => (
            <MetricCard
              key={item.label}
              label={item.label}
              value={item.value}
              helper={item.helper}
              helperTone={item.tone as "positive" | "negative" | "neutral"}
            />
          ))}
        </div>

        <SurfaceCard className="overflow-hidden">
          <div className="hidden grid-cols-[44px_2fr_1fr_1fr_0.9fr_1fr_0.8fr] border-b border-[#ECEEF2] px-[18px] py-4 text-[13px] font-medium uppercase tracking-[0.02em] text-[#8E929B] lg:grid">
            <div />
            <div>User</div>
            <div>Registered</div>
            <div>Country</div>
            <div>Tier</div>
            <div>Status</div>
            <div>Last active</div>
          </div>
          {filteredRows.map((row) => (
            <button
              key={`${row.name}-${row.email}`}
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="grid w-full items-center gap-4 border-b border-[#ECEEF2] px-[18px] py-[16px] text-left transition hover:bg-[#FAFBFF] lg:grid-cols-[44px_2fr_1fr_1fr_0.9fr_1fr_0.8fr]"
            >
              <div className="h-5 w-5 rounded-[6px] border border-[#D8DBE4]" />
              <div className="flex items-center gap-3">
                <AvatarCircle text={row.initials} color={row.color} />
                <div>
                  <p className="text-[15px] font-semibold text-[#16181D]">{row.name}</p>
                  <p className="text-[13px] text-[#7D828B]">{row.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[15px] text-[#16181D] lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Registered</span>
                {row.registered}
              </div>
              <div className="flex items-center justify-between text-[15px] text-[#16181D] lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Country</span>
                {row.flag} {row.country}
              </div>
              <div className="flex items-center justify-between lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Tier</span>
                <StatusBadge tone={row.tier === "Premium" ? "purple" : "blue"}>{row.tier}</StatusBadge>
              </div>
              <div className="flex items-center justify-between lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Status</span>
                <StatusBadge tone={row.status === "Active" ? "ready" : "error"}>{row.status}</StatusBadge>
              </div>
              <div className="flex items-center justify-between text-[15px] text-[#16181D] lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Last active</span>
                {row.lastActive}
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

      <AnimatePresence>{drawerOpen ? <UserDrawer onClose={() => setDrawerOpen(false)} /> : null}</AnimatePresence>
    </DashboardShell>
  );
}
