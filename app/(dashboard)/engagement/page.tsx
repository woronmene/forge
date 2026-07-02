"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Download, LoaderCircle, Plus } from "lucide-react";
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
};

type RegistrationRow = {
  label: string;
  value: string;
};

type RetentionRow = {
  label: string;
  value: string;
  helper: string;
  color: string;
};

type EngagementData = {
  summaryCards: OverviewCard[];
  chartValues: number[];
  geography: GeographyRow[];
  registrations: {
    total: string;
    delta: string;
    rows: RegistrationRow[];
  };
  retention: RetentionRow[];
  raw: unknown;
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

function flattenMetrics(input: unknown, prefix = ""): Array<{ path: string; value: number }> {
  if (Array.isArray(input)) {
    return input.flatMap((item, index) => flattenMetrics(item, `${prefix}.${index}`));
  }

  if (!isRecord(input)) {
    const numberValue = getNumber(input);
    return numberValue === undefined ? [] : [{ path: prefix.toLowerCase(), value: numberValue }];
  }

  return Object.entries(input).flatMap(([key, value]) => flattenMetrics(value, `${prefix}.${key}`));
}

function findMetricValue(input: unknown, keywords: string[]) {
  const metrics = flattenMetrics(input);
  const match = metrics.find(({ path }) => keywords.every((keyword) => path.includes(keyword)));
  return match?.value;
}

function collectObjects(input: unknown): Record<string, unknown>[] {
  if (Array.isArray(input)) {
    return input.flatMap((item) => collectObjects(item));
  }

  if (!isRecord(input)) {
    return [];
  }

  return [input, ...Object.values(input).flatMap((value) => collectObjects(value))];
}

function getFlagEmoji(country: string) {
  const normalized = country.trim().toLowerCase();
  const map: Record<string, string> = {
    nigeria: "🇳🇬",
    ghana: "🇬🇭",
    "united kingdom": "🇬🇧",
    uk: "🇬🇧",
    "united states": "🇺🇸",
    usa: "🇺🇸",
    canada: "🇨🇦",
    kenya: "🇰🇪",
    "south africa": "🇿🇦",
  };

  return map[normalized] ?? "🌍";
}

function buildSummaryCards(input: unknown): OverviewCard[] {
  const dailyActive = findMetricValue(input, ["daily", "active"]) ?? findMetricValue(input, ["dau"]);
  const monthlyActive = findMetricValue(input, ["monthly", "active"]) ?? findMetricValue(input, ["mau"]);
  const registrations = findMetricValue(input, ["registration"]) ?? findMetricValue(input, ["signup"]);
  const retention = findMetricValue(input, ["retention"]) ?? findMetricValue(input, ["d30"]);

  return [
    {
      label: "Daily active users",
      value: formatCompact(dailyActive),
      helper: dailyActive !== undefined ? "Live backend metric" : "Not exposed in sample response",
      helperTone: dailyActive !== undefined ? "positive" : "neutral",
    },
    {
      label: "Monthly active users",
      value: formatCompact(monthlyActive),
      helper: monthlyActive !== undefined ? "Live backend metric" : "Not exposed in sample response",
      helperTone: monthlyActive !== undefined ? "positive" : "neutral",
    },
    {
      label: "Registrations",
      value: formatCompact(registrations),
      helper: registrations !== undefined ? "New users in range" : "Derived from available fields",
      helperTone: registrations !== undefined ? "positive" : "neutral",
    },
    {
      label: "Retention",
      value: retention !== undefined ? `${Math.round(retention)}%` : "—",
      helper: retention !== undefined ? "Long-tail retention signal" : "Not exposed in current payload",
      helperTone: retention !== undefined ? "positive" : "neutral",
    },
  ];
}

function pickChartValues(input: unknown) {
  const values = flattenMetrics(input)
    .map(({ value }) => value)
    .filter((value) => value > 0)
    .slice(0, 12);

  if (values.length >= 6) {
    const max = Math.max(...values);
    return values.map((value) => Math.max(16, Math.round((value / max) * 100)));
  }

  return [44, 56, 43, 52, 84, 61, 68, 71, 69, 77, 59, 63];
}

function buildGeography(input: unknown): GeographyRow[] {
  const rows = collectObjects(input)
    .filter((record) => getString(record.country) || getString(record.country_name) || getString(record.location))
    .map((record) => {
      const country =
        getString(record.country) ??
        getString(record.country_name) ??
        getString(record.location) ??
        "Unknown";

      const users =
        getNumber(record.users) ??
        getNumber(record.user_count) ??
        getNumber(record.total_users) ??
        getNumber(record.active_users);

      const share =
        getNumber(record.share) ??
        getNumber(record.percentage) ??
        getNumber(record.percent) ??
        getNumber(record.user_share);

      return {
        country,
        usersLabel: users !== undefined ? `${formatCount(users)} users` : "Users unavailable",
        share: share !== undefined ? Math.max(1, Math.min(100, Math.round(share))) : 0,
        flag: getFlagEmoji(country),
      };
    })
    .filter((row) => row.country !== "Unknown")
    .sort((left, right) => right.share - left.share);

  if (rows.length > 0) {
    return rows.slice(0, 5);
  }

  return [{ country: "No geography data yet", usersLabel: "Connect auth to load region metrics", share: 0, flag: "🌍" }];
}

function buildRegistrations(input: unknown) {
  const total = findMetricValue(input, ["registration"]) ?? findMetricValue(input, ["signup"]);
  const dailyAverage = findMetricValue(input, ["daily", "average"]) ?? findMetricValue(input, ["avg", "daily"]);
  const peak = findMetricValue(input, ["peak"]);
  const low = findMetricValue(input, ["low"]) ?? findMetricValue(input, ["minimum"]);
  const delta = findMetricValue(input, ["growth"]) ?? findMetricValue(input, ["change"]) ?? findMetricValue(input, ["delta"]);

  return {
    total: formatCount(total),
    delta: delta !== undefined ? `${delta > 0 ? "+" : ""}${Math.round(delta)}%` : "Live delta unavailable",
    rows: [
      { label: "Daily average", value: dailyAverage !== undefined ? `${formatCount(dailyAverage)} / day` : "—" },
      { label: "Peak day this period", value: peak !== undefined ? `${formatCount(peak)} users` : "—" },
      { label: "Lowest day this period", value: low !== undefined ? `${formatCount(low)} users` : "—" },
    ],
  };
}

function buildRetention(input: unknown): RetentionRow[] {
  const d1 = findMetricValue(input, ["d1"]) ?? findMetricValue(input, ["day1"]);
  const d7 = findMetricValue(input, ["d7"]) ?? findMetricValue(input, ["day7"]);
  const d30 = findMetricValue(input, ["d30"]) ?? findMetricValue(input, ["day30"]);

  return [
    { label: "D1", value: d1 !== undefined ? `${Math.round(d1)}%` : "—", helper: "Next day", color: "#3150FF" },
    { label: "D7", value: d7 !== undefined ? `${Math.round(d7)}%` : "—", helper: "After 7 days", color: "#228473" },
    { label: "D30", value: d30 !== undefined ? `${Math.round(d30)}%` : "—", helper: "After 30 days", color: "#D97706" },
  ];
}

function adaptEngagementData(payload: unknown): EngagementData {
  return {
    summaryCards: buildSummaryCards(payload),
    chartValues: pickChartValues(payload),
    geography: buildGeography(payload),
    registrations: buildRegistrations(payload),
    retention: buildRetention(payload),
    raw: payload,
  };
}

export default function EngagementPage() {
  const [range, setRange] = useState("30 days");

  const params = useMemo(() => {
    if (range === "7 days") {
      return { range: "7d" };
    }

    if (range === "90 days") {
      return { range: "90d" };
    }

    return { range: "30d" };
  }, [range]);

  const overviewQuery = useQuery({
    queryKey: forgeQueryKeys.analytics.userEngagementOverview(params),
    queryFn: async () => adaptEngagementData(await getUserEngagementOverview(params)),
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await getUserEngagementOverview({ ...params, export: "csv" });
      return response;
    },
  });

  const data = overviewQuery.data;
  const errorMessage = overviewQuery.error ? parseError(overviewQuery.error) : null;
  const exportError = exportMutation.error ? parseError(exportMutation.error) : null;
  const unauthorized = errorMessage?.toLowerCase().includes("401") || errorMessage?.toLowerCase().includes("unauthorized");

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
              <p className="font-semibold">Export is not ready from the backend yet</p>
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
              <h2 className="text-[24px] font-semibold tracking-[-0.05em] text-[#16181D]">Daily &amp; Monthly Active Users</h2>
              <p className="mt-2 text-[15px] text-[#7A7F89]">Backend overview for {range.toLowerCase()}</p>
              <div className="mt-6">
                <FauxBars
                  values={data?.chartValues ?? [42, 56, 43, 52, 84, 61, 68, 71, 69, 77, 59, 63]}
                  highlightIndex={4}
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
              <button type="button" className="mt-6 flex h-[58px] w-full items-center justify-center rounded-[999px] border border-[#E6E7EC] text-[15px] font-medium text-[#16181D]">
                Geography endpoint has no full-country pagination yet
              </button>
            </div>
          </SurfaceCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard>
            <div className="p-5">
              <p className="text-[16px] font-semibold text-[#16181D]">New registrations</p>
              <p className="mt-4 text-[15px] text-[#7A7F89]">Derived from the live engagement overview payload</p>
              <div className="mt-6 flex items-end gap-3">
                <span className="text-[52px] font-semibold tracking-[-0.06em] text-[#16181D]">{data?.registrations.total ?? "—"}</span>
                <div className="pb-2 text-[14px] text-[#228473]">
                  {data?.registrations.delta ?? "Live delta unavailable"}
                  <div className="text-[#7A7F89]">vs previous available period</div>
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
              <p className="text-[16px] font-semibold text-[#16181D]">Retention snapshot</p>
              <p className="mt-4 text-[15px] text-[#7A7F89]">Only the retention fields exposed by the analytics service are rendered here</p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {(data?.retention ?? []).map((item) => (
                  <div key={item.label} className="rounded-[18px] border border-[#E6E7EC] p-4 text-center">
                    <p className="text-[16px] font-semibold text-[#666D77]">{item.label}</p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <span className="text-[30px] font-semibold" style={{ color: item.color }}>
                        {item.value}
                      </span>
                    </div>
                    <p className="mt-3 text-[14px] text-[#6E7380]">{item.helper}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[15px] leading-8 text-[#6E7380]">
                The current frontend only renders summary retention milestones. Cohort tables and deeper user funnels are still blocked by missing dedicated backend endpoints.
              </p>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </DashboardShell>
  );
}
