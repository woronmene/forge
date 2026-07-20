"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Download, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { FauxBars, MetricCard, SegmentTabs, SparkLine, ToolbarButton } from "@/components/dashboard-widgets";
import { SurfaceCard } from "@/components/page-primitives";
import { forgeQueryKeys } from "@/services/api/query-keys";
import { getUserEngagementOverview } from "@/services/analytics";

type OverviewCard = {
  label: string;
  value: string;
  helper: string;
  helperTone: "positive" | "negative" | "neutral";
};

type GeographyRow = {
  country: string;
  usersLabel: string;
  share: number;
  flag: string;
  count: number;
};

type BreakdownRow = {
  label: string;
  value: string;
};

type EngagementData = {
  summaryCards: OverviewCard[];
  chartValues: number[];
  geography: GeographyRow[];
  registrations: {
    total: string;
    helper: string;
    rows: BreakdownRow[];
  };
  accountStatuses: BreakdownRow[];
  freshness: string;
  raw: {
    windowDays: number;
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    newRegistrations: number;
    geography: GeographyRow[];
    subscriptionTierBreakdown: Record<string, number>;
    accountStatusBreakdown: Record<string, number>;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const sanitized = value.replace(/[,%\s]/g, "");
    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function formatCompact(value: unknown) {
  const numberValue = getNumber(value);
  if (numberValue === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(numberValue);
}

function formatCount(value: unknown) {
  const numberValue = getNumber(value);
  if (numberValue === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-US").format(numberValue);
}

function parseError(error: unknown) {
  if (error instanceof AxiosError) {
    const detail = error.response?.data;

    if (typeof detail === "string") {
      return detail;
    }

    if (isRecord(detail) && typeof detail.detail === "string") {
      return detail.detail;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "We could not load engagement metrics from the backend.";
}

function toSentenceCase(input: string) {
  return input
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getFlagEmoji(countryCode: string) {
  const normalized = countryCode.trim().toUpperCase();
  const map: Record<string, string> = {
    NG: "🇳🇬",
    GH: "🇬🇭",
    GB: "🇬🇧",
    UK: "🇬🇧",
    US: "🇺🇸",
    CA: "🇨🇦",
    KE: "🇰🇪",
    ZA: "🇿🇦",
  };

  return map[normalized] ?? "🌍";
}

function countryCodeToName(countryCode: string) {
  const normalized = countryCode.trim().toUpperCase();
  const map: Record<string, string> = {
    NG: "Nigeria",
    GH: "Ghana",
    GB: "United Kingdom",
    UK: "United Kingdom",
    US: "United States",
    CA: "Canada",
    KE: "Kenya",
    ZA: "South Africa",
  };

  return map[normalized] ?? normalized;
}

function formatFreshness(value: unknown) {
  if (typeof value !== "string" || !value) {
    return "Latest backend snapshot";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Latest backend snapshot";
  }

  return `Last event ${new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed)}`;
}

function buildGeography(input: unknown) {
  if (!isRecord(input) || !Array.isArray(input.active_user_geography)) {
    return [{ country: "No geography data yet", usersLabel: "No active user geography returned", share: 0, flag: "🌍", count: 0 }];
  }

  const rows = input.active_user_geography
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((record) => {
      const countryCode = getString(record.country_code) ?? "Unknown";
      const count = getNumber(record.count) ?? 0;
      return {
        country: countryCodeToName(countryCode),
        usersLabel: `${formatCount(count)} users`,
        share: 0,
        flag: getFlagEmoji(countryCode),
        count,
      };
    })
    .sort((left, right) => right.count - left.count);

  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return rows.map((row) => ({
    ...row,
    share: total > 0 ? Math.max(1, Math.round((row.count / total) * 100)) : 0,
  }));
}

function getBreakdown(input: unknown, key: "subscription_tier_breakdown" | "account_status_breakdown") {
  if (!isRecord(input) || !isRecord(input[key])) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(input[key]).map(([entryKey, value]) => [entryKey, getNumber(value) ?? 0]),
  );
}

function buildSummaryCards(input: unknown, windowDays: number): OverviewCard[] {
  const dailyActive = isRecord(input) ? getNumber(input.daily_active_users) ?? 0 : 0;
  const monthlyActive = isRecord(input) ? getNumber(input.monthly_active_users) ?? 0 : 0;
  const registrations = isRecord(input) ? getNumber(input.new_registrations) ?? 0 : 0;
  const geography = buildGeography(input).filter((item) => item.count > 0);

  return [
    {
      label: "Daily active users",
      value: formatCompact(dailyActive),
      helper: `Latest day in ${windowDays}-day window`,
      helperTone: "positive",
    },
    {
      label: "Monthly active users",
      value: formatCompact(monthlyActive),
      helper: `${windowDays}-day active audience`,
      helperTone: "positive",
    },
    {
      label: "Registrations",
      value: formatCompact(registrations),
      helper: `${windowDays}-day total`,
      helperTone: "positive",
    },
    {
      label: "Countries",
      value: formatCount(geography.length),
      helper: geography.length > 0 ? "Active user geography" : "No geography returned",
      helperTone: geography.length > 0 ? "positive" : "neutral",
    },
  ];
}

function buildChartValues(input: unknown) {
  const dailyActive = isRecord(input) ? getNumber(input.daily_active_users) ?? 0 : 0;
  const monthlyActive = isRecord(input) ? getNumber(input.monthly_active_users) ?? 0 : 0;
  const registrations = isRecord(input) ? getNumber(input.new_registrations) ?? 0 : 0;
  const subscriptionBreakdown = getBreakdown(input, "subscription_tier_breakdown");
  const breakdownValues = Object.values(subscriptionBreakdown)
    .filter((value) => value > 0)
    .sort((left, right) => right - left)
    .slice(0, 4);

  const values = [dailyActive, monthlyActive, registrations, ...breakdownValues].filter((value) => value > 0);
  if (values.length === 0) {
    return [36, 52, 44, 68, 58, 72];
  }

  const max = Math.max(...values);
  return values.map((value) => Math.max(16, Math.round((value / max) * 100)));
}

function buildRegistrationRows(input: unknown, windowDays: number): { total: string; helper: string; rows: BreakdownRow[] } {
  const total = isRecord(input) ? getNumber(input.new_registrations) ?? 0 : 0;
  const subscriptionBreakdown = getBreakdown(input, "subscription_tier_breakdown");
  const rows = Object.entries(subscriptionBreakdown)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([label, value]) => ({
      label: `${toSentenceCase(label)} users`,
      value: formatCount(value),
    }));

  return {
    total: formatCount(total),
    helper: `Registrations captured in the last ${windowDays} days`,
    rows: rows.length > 0 ? rows : [{ label: "Tier breakdown", value: "Not exposed" }],
  };
}

function buildAccountStatusRows(input: unknown) {
  const accountStatusBreakdown = getBreakdown(input, "account_status_breakdown");
  const rows = Object.entries(accountStatusBreakdown)
    .sort((left, right) => right[1] - left[1])
    .map(([label, value]) => ({
      label: toSentenceCase(label),
      value: formatCount(value),
    }));

  return rows.length > 0 ? rows : [{ label: "Account status breakdown", value: "Not exposed" }];
}

function adaptEngagementData(payload: unknown, windowDays: number): EngagementData {
  const geography = buildGeography(payload);
  return {
    summaryCards: buildSummaryCards(payload, windowDays),
    chartValues: buildChartValues(payload),
    geography,
    registrations: buildRegistrationRows(payload, windowDays),
    accountStatuses: buildAccountStatusRows(payload),
    freshness: formatFreshness(isRecord(payload) ? payload.freshness : undefined),
    raw: {
      windowDays,
      dailyActiveUsers: isRecord(payload) ? getNumber(payload.daily_active_users) ?? 0 : 0,
      monthlyActiveUsers: isRecord(payload) ? getNumber(payload.monthly_active_users) ?? 0 : 0,
      newRegistrations: isRecord(payload) ? getNumber(payload.new_registrations) ?? 0 : 0,
      geography,
      subscriptionTierBreakdown: getBreakdown(payload, "subscription_tier_breakdown"),
      accountStatusBreakdown: getBreakdown(payload, "account_status_breakdown"),
    },
  };
}

function downloadBlob(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
}

function buildCsv(data: EngagementData) {
  const lines = [
    ["metric", "value"],
    ["daily_active_users", String(data.raw.dailyActiveUsers)],
    ["monthly_active_users", String(data.raw.monthlyActiveUsers)],
    ["new_registrations", String(data.raw.newRegistrations)],
    [""],
    ["country", "active_users", "share_percent"],
    ...data.raw.geography.map((row) => [row.country, String(row.count), String(row.share)]),
    [""],
    ["subscription_tier", "count"],
    ...Object.entries(data.raw.subscriptionTierBreakdown).map(([tier, count]) => [tier, String(count)]),
    [""],
    ["account_status", "count"],
    ...Object.entries(data.raw.accountStatusBreakdown).map(([status, count]) => [status, String(count)]),
  ];

  return lines
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export default function EngagementPage() {
  const [range, setRange] = useState("30 days");

  const params = useMemo(() => {
    const windowDays = range === "7 days" ? 7 : range === "90 days" ? 90 : 30;
    return { window_days: windowDays };
  }, [range]);

  const overviewQuery = useQuery({
    queryKey: forgeQueryKeys.analytics.userEngagementOverview(params),
    queryFn: async () => adaptEngagementData(await getUserEngagementOverview(params), params.window_days),
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const liveData = overviewQuery.data ?? adaptEngagementData(await getUserEngagementOverview(params), params.window_days);
      const csv = buildCsv(liveData);
      downloadBlob(`forge-user-engagement-${params.window_days}d.csv`, csv, "text/csv;charset=utf-8");
      return true;
    },
  });

  const data = overviewQuery.data;
  const errorMessage = overviewQuery.error ? parseError(overviewQuery.error) : null;
  const exportError = exportMutation.error ? parseError(exportMutation.error) : null;
  const unauthorized = errorMessage?.toLowerCase().includes("401") || errorMessage?.toLowerCase().includes("unauthorized");

  return (
    <DashboardShell title="Engagement overview" description="Platform-level user activity, registrations, and geographic distribution">
      <div className="space-y-5 px-4 py-5 md:px-6 xl:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SegmentTabs items={["7 days", "30 days", "90 days"]} active={range} onChange={setRange} />
          <div className="flex flex-wrap items-center gap-3">
            <ToolbarButton onClick={() => exportMutation.mutate()}>
              {exportMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export snapshot
            </ToolbarButton>
          </div>
        </div>

        {errorMessage ? (
          <SurfaceCard className="border-[#F7C9D1] bg-[#FFF7F8]">
            <div className="p-4 text-[14px] text-[#7A2230]">
              <p className="font-semibold">{unauthorized ? "Login required for engagement data" : "Engagement data is unavailable right now"}</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
          </SurfaceCard>
        ) : null}

        {exportError ? (
          <SurfaceCard className="border-[#F7C9D1] bg-[#FFF7F8]">
            <div className="p-4 text-[14px] text-[#7A2230]">
              <p className="font-semibold">Export failed</p>
              <p className="mt-1">{exportError}</p>
            </div>
          </SurfaceCard>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-4">
          {(data?.summaryCards ?? Array.from({ length: 4 })).map((item, index) =>
            item ? (
              <MetricCard key={item.label} label={item.label} value={item.value} helper={item.helper} helperTone={item.helperTone} />
            ) : (
              <SurfaceCard key={`engagement-summary-skeleton-${index}`}>
                <div className="p-5">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-[#EEF1F6]" />
                  <div className="mt-4 h-8 w-20 animate-pulse rounded-full bg-[#EEF1F6]" />
                  <div className="mt-3 h-3 w-28 animate-pulse rounded-full bg-[#EEF1F6]" />
                </div>
              </SurfaceCard>
            ),
          )}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_470px]">
          <SurfaceCard>
            <div className="p-5">
              <h2 className="text-[24px] font-semibold tracking-[-0.05em] text-[#16181D]">User activity snapshot</h2>
              <p className="mt-2 text-[15px] text-[#7A7F89]">
                Using the real {params.window_days}-day engagement overview payload. {data?.freshness ?? "Latest backend snapshot"}
              </p>
              <div className="mt-6">
                <FauxBars
                  values={data?.chartValues ?? [36, 52, 44, 68, 58, 72]}
                  highlightIndex={1}
                  max={100}
                  yLabels={["0", "25%", "50%", "75%"]}
                />
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="p-5">
              <p className="text-[16px] font-semibold text-[#16181D]">Geographic distribution</p>
              <div className="mt-6 space-y-8">
                {(data?.geography ?? []).map((row) => (
                  <div key={row.country} className="flex items-center justify-between gap-4 border-b border-[#ECEEF3] pb-5 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[20px]">{row.flag}</span>
                      <div>
                        <p className="text-[16px] font-semibold text-[#16181D]">{row.country}</p>
                        <p className="text-[14px] text-[#7A7F89]">{row.usersLabel}</p>
                      </div>
                    </div>
                    <SparkLine value={row.share} />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex h-[58px] w-full items-center justify-center rounded-[999px] border border-[#E6E7EC] text-[15px] font-medium text-[#16181D]">
                Top active-user countries from the current window
              </div>
            </div>
          </SurfaceCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard>
            <div className="p-5">
              <p className="text-[16px] font-semibold text-[#16181D]">New registrations</p>
              <p className="mt-4 text-[15px] text-[#7A7F89]">{data?.registrations.helper ?? "Live engagement overview payload"}</p>
              <div className="mt-6 flex items-end gap-3">
                <span className="text-[52px] font-semibold tracking-[-0.06em] text-[#16181D]">{data?.registrations.total ?? "—"}</span>
                <div className="pb-2 text-[14px] text-[#228473]">
                  {params.window_days}-day total
                  <div className="text-[#7A7F89]">from the analytics service</div>
                </div>
              </div>
              <div className="mt-8 space-y-6">
                {(data?.registrations.rows ?? []).map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 text-[15px]">
                    <span className="text-[#666D77]">{row.label}</span>
                    <span className="font-semibold text-[#16181D]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="p-5">
              <p className="text-[16px] font-semibold text-[#16181D]">Account status breakdown</p>
              <p className="mt-4 text-[15px] text-[#7A7F89]">Rendered from the backend account status counters for the current engagement window</p>
              <div className="mt-8 space-y-4">
                {(data?.accountStatuses ?? []).map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-[18px] border border-[#E6E7EC] px-4 py-4">
                    <p className="text-[15px] text-[#666D77]">{item.label}</p>
                    <p className="text-[20px] font-semibold text-[#16181D]">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[15px] leading-8 text-[#6E7380]">
                The current backend does not expose cohort retention tables or daily user series yet, so this page now focuses on the live engagement snapshot fields that are actually available.
              </p>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </DashboardShell>
  );
}
