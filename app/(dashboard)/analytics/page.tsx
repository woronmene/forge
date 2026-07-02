"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Download, LoaderCircle, Plus, RefreshCw, X } from "lucide-react";
import { useMemo, useState } from "react";
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
import { forgeQueryKeys } from "@/services/api/query-keys";
import { getAssetDrilldown, getMediaOverview, getMediaOverviewCsv } from "@/services/analytics";

type OverviewCard = {
  label: string;
  value: string;
  helper?: string;
  helperTone?: "positive" | "negative" | "neutral";
};

type GeographyRow = {
  country: string;
  subtitle: string;
  share: number;
  viewsLabel: string;
  flag: string;
};

type AssetRow = {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  tone: "purple" | "cyan";
  views: string;
  likes: string;
  completion: number;
  swatch: string;
};

type AnalyticsData = {
  summaryCards: OverviewCard[];
  chartValues: number[];
  geography: GeographyRow[];
  topAssets: AssetRow[];
  raw: unknown;
};

type DrawerProps = {
  asset: AssetRow;
  onClose: () => void;
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

function toSentenceCase(input: string) {
  return input
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
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

  return "We could not load analytics from the backend.";
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

function hashColor(seed: string) {
  const colors = ["#7F419C", "#2677AF", "#2A826B", "#214A7C", "#6C2151", "#4A2320", "#315B5F"];
  const hash = Array.from(seed).reduce((total, character) => total + character.charCodeAt(0), 0);
  return colors[hash % colors.length];
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
    southafrica: "🇿🇦",
    "south africa": "🇿🇦",
  };

  return map[normalized] ?? "🌍";
}

function pickChartValues(input: unknown) {
  const values = flattenMetrics(input)
    .map(({ value }) => value)
    .filter((value) => value > 0)
    .slice(0, 12);

  if (values.length >= 6) {
    const max = Math.max(...values);
    return values.map((value) => Math.max(18, Math.round((value / max) * 100)));
  }

  return [48, 62, 44, 58, 88, 61, 77, 75, 74, 88, 56, 54];
}

function buildSummaryCards(input: unknown): OverviewCard[] {
  const totalViews = findMetricValue(input, ["view"]) ?? findMetricValue(input, ["play"]);
  const uniqueViewers = findMetricValue(input, ["unique", "viewer"]) ?? findMetricValue(input, ["viewer"]);
  const likes = findMetricValue(input, ["like"]);
  const saves = findMetricValue(input, ["save"]);
  const completion = findMetricValue(input, ["completion"]);
  const countries = findMetricValue(input, ["countr"]);

  return [
    {
      label: "Total views",
      value: formatCompact(totalViews),
      helper: totalViews !== undefined ? "Live overview" : "Waiting on backend data",
      helperTone: totalViews !== undefined ? "positive" : "neutral",
    },
    {
      label: "Unique viewers",
      value: formatCompact(uniqueViewers),
      helper: uniqueViewers !== undefined ? "Audience reach" : "Not exposed yet",
      helperTone: uniqueViewers !== undefined ? "positive" : "neutral",
    },
    {
      label: "Likes",
      value: formatCompact(likes),
      helper: likes !== undefined ? "Engagement actions" : "Not exposed yet",
      helperTone: likes !== undefined ? "positive" : "neutral",
    },
    {
      label: "Saves",
      value: formatCompact(saves),
      helper: saves !== undefined ? "Saved content" : "Not exposed yet",
      helperTone: saves !== undefined ? "positive" : "neutral",
    },
    {
      label: "Completion",
      value: completion !== undefined ? `${Math.round(completion)}%` : "—",
      helper: completion !== undefined ? "Average completion" : "Not exposed yet",
      helperTone: completion !== undefined ? "positive" : "neutral",
    },
    {
      label: "Countries",
      value: formatCount(countries),
      helper: countries !== undefined ? "Tracked territories" : "Derived from geography",
      helperTone: countries !== undefined ? "positive" : "neutral",
    },
  ];
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

      const views =
        getNumber(record.views) ??
        getNumber(record.view_count) ??
        getNumber(record.total_views) ??
        getNumber(record.watch_count);

      const share =
        getNumber(record.share) ??
        getNumber(record.percentage) ??
        getNumber(record.percent) ??
        getNumber(record.view_share);

      return {
        country,
        subtitle: views !== undefined ? `${formatCount(views)} views` : "Views unavailable",
        viewsLabel: formatCompact(views),
        share: share !== undefined ? Math.max(1, Math.min(100, Math.round(share))) : 0,
        flag: getFlagEmoji(country),
      };
    })
    .filter((row) => row.country !== "Unknown")
    .sort((left, right) => right.share - left.share);

  if (rows.length > 0) {
    return rows.slice(0, 5);
  }

  return [
    { country: "No geography data yet", subtitle: "Connect auth to load country metrics", share: 0, viewsLabel: "—", flag: "🌍" },
  ];
}

function buildTopAssets(input: unknown): AssetRow[] {
  const rows = collectObjects(input)
    .filter((record) => {
      const title =
        getString(record.title) ??
        getString(record.asset_title) ??
        getString(record.name) ??
        getString(record.asset_name);

      return Boolean(title);
    })
    .map((record, index) => {
      const title =
        getString(record.title) ??
        getString(record.asset_title) ??
        getString(record.name) ??
        getString(record.asset_name) ??
        `Asset ${index + 1}`;

      const subtitle =
        getString(record.artist_name) ??
        getString(record.subtitle) ??
        getString(record.creator_name) ??
        getString(record.category) ??
        "Backend asset";

      const type =
        getString(record.asset_type) ??
        getString(record.content_type) ??
        getString(record.media_type) ??
        getString(record.type) ??
        "Asset";

      const views =
        getNumber(record.views) ??
        getNumber(record.view_count) ??
        getNumber(record.total_views) ??
        getNumber(record.plays);

      const likes = getNumber(record.likes) ?? getNumber(record.like_count) ?? getNumber(record.total_likes);
      const completion =
        getNumber(record.completion) ??
        getNumber(record.completion_rate) ??
        getNumber(record.average_completion) ??
        getNumber(record.finish_rate);

      const rawId =
        getString(record.asset_id) ??
        getString(record.assetId) ??
        getString(record.id) ??
        getString(record.media_id) ??
        `${title}-${index}`;

      const normalizedType = toSentenceCase(type);

      return {
        id: rawId,
        title,
        subtitle,
        type: normalizedType,
        tone: (normalizedType.toLowerCase().includes("album") || normalizedType.toLowerCase().includes("audio")
          ? "purple"
          : "cyan") as "purple" | "cyan",
        views: formatCompact(views),
        likes: formatCompact(likes),
        completion: completion !== undefined ? Math.max(1, Math.min(100, Math.round(completion))) : 0,
        swatch: hashColor(title),
      };
    })
    .filter((row, index, array) => array.findIndex((candidate) => candidate.id === row.id) === index)
    .slice(0, 6);

  if (rows.length > 0) {
    return rows;
  }

  return [
    {
      id: "placeholder",
      title: "No top content returned yet",
      subtitle: "This will fill in once analytics data is authenticated",
      type: "Asset",
      tone: "cyan",
      views: "—",
      likes: "—",
      completion: 0,
      swatch: "#3150FF",
    },
  ];
}

function mapOverview(input: unknown): AnalyticsData {
  return {
    summaryCards: buildSummaryCards(input),
    chartValues: pickChartValues(input),
    geography: buildGeography(input),
    topAssets: buildTopAssets(input),
    raw: input,
  };
}

function AnalyticsDrawer({ asset, onClose }: DrawerProps) {
  const [tab, setTab] = useState<"Overview" | "Geography" | "Details">("Overview");

  const detailQuery = useQuery({
    queryKey: forgeQueryKeys.analytics.assetDrilldown(asset.id),
    queryFn: () => getAssetDrilldown(asset.id),
    enabled: asset.id !== "placeholder",
  });

  const detailData = detailQuery.data;
  const geography = useMemo(() => buildGeography(detailData), [detailData]);

  const metrics = useMemo(() => {
    return [
      ["Total views", formatCompact(findMetricValue(detailData, ["view"]))],
      ["Unique viewers", formatCompact(findMetricValue(detailData, ["viewer"]))],
      ["Likes", formatCompact(findMetricValue(detailData, ["like"]))],
      ["Completion", (() => {
        const value = findMetricValue(detailData, ["completion"]);
        return value !== undefined ? `${Math.round(value)}%` : "—";
      })()],
    ];
  }, [detailData]);

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
          <DrawerAssetHeader swatch={asset.swatch} title={asset.title} subtitle={asset.subtitle} tag={asset.type} />
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E6E7EC] bg-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-8 border-b border-[#ECEEF2] px-6">
          {(["Overview", "Geography", "Details"] as const).map((item) => (
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
          {detailQuery.isLoading ? (
            <SurfaceCard className="p-5">
              <div className="flex items-center gap-3 text-[14px] text-[#666D77]">
                <LoaderCircle className="h-4 w-4 animate-spin text-[#3150FF]" />
                Loading asset drilldown
              </div>
            </SurfaceCard>
          ) : null}

          {detailQuery.isError ? (
            <SurfaceCard className="border-[#F0D4D8] bg-[#FFF7F8] p-5">
              <p className="text-[14px] font-semibold text-[#B4233A]">Asset drilldown is unavailable</p>
              <p className="mt-2 text-[14px] leading-7 text-[#8C3646]">{parseError(detailQuery.error)}</p>
            </SurfaceCard>
          ) : null}

          {!detailQuery.isLoading && !detailQuery.isError ? (
            <>
              {tab === "Overview" ? (
                <div className="space-y-6">
                  <div className="grid gap-3 md:grid-cols-2">
                    {metrics.map(([label, value]) => (
                      <MetricCard key={label} label={label} value={value} helper="Live drilldown" />
                    ))}
                  </div>

                  <SurfaceCard>
                    <div className="p-4">
                      <p className="text-[13px] font-semibold uppercase text-[#16181D]">Top countries</p>
                      <div className="mt-4 space-y-5">
                        {geography.slice(0, 4).map((item) => (
                          <div key={item.country} className="flex items-center justify-between gap-4">
                            <p className="text-[15px] text-[#666D77]">{item.country}</p>
                            <div className="flex items-center gap-4">
                              <span className="text-[15px] font-semibold text-[#16181D]">{item.viewsLabel}</span>
                              <SparkLine value={item.share} />
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
                      {geography.map((item) => (
                        <div key={item.country} className="grid grid-cols-[minmax(0,1fr)_100px_90px] items-center gap-4">
                          <p className="text-[15px] text-[#666D77]">{item.country}</p>
                          <p className="text-right text-[15px] font-semibold text-[#16181D]">{item.viewsLabel}</p>
                          <div className="flex justify-end">
                            <SparkLine value={item.share} />
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
                        ["Asset ID", asset.id],
                        ["Content type", asset.type],
                        ["Views", asset.views],
                        ["Likes", asset.likes],
                        ["Completion", `${asset.completion}%`],
                        ["Backend status", detailData ? "Connected" : "No data"],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-4">
                          <p className="text-[15px] text-[#666D77]">{label}</p>
                          {label === "Backend status" ? (
                            <StatusBadge tone={detailData ? "ready" : "gray"}>{value}</StatusBadge>
                          ) : (
                            <p className="text-[15px] font-semibold text-[#16181D]">{value}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </SurfaceCard>
              ) : null}
            </>
          ) : null}
        </div>
      </motion.aside>
    </>
  );
}

export default function AnalyticsPage() {
  const [drawerAsset, setDrawerAsset] = useState<AssetRow | null>(null);
  const [range, setRange] = useState("30 days");
  const [metric, setMetric] = useState("Views");

  const overviewQuery = useQuery({
    queryKey: forgeQueryKeys.analytics.mediaOverview(),
    queryFn: () => getMediaOverview(),
    select: mapOverview,
  });

  const exportMutation = useMutation({
    mutationFn: () => getMediaOverviewCsv(),
    onSuccess: (blob) => {
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = "forge-media-overview.csv";
      anchor.click();
      URL.revokeObjectURL(href);
    },
  });

  const isUnauthorized = overviewQuery.error instanceof AxiosError && overviewQuery.error.response?.status === 401;
  const analytics = overviewQuery.data;

  return (
    <DashboardShell title="Analytics" description="Track viewing metrics and engagement across all content">
      <div className="space-y-5 px-4 py-5 md:px-6 xl:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SegmentTabs items={["7 days", "30 days", "90 days", "All time"]} active={range} onChange={setRange} />
          <div className="flex flex-wrap items-center gap-3">
            <ToolbarButton subtle>
              <Plus className="h-4 w-4" />
              Add filter
            </ToolbarButton>
            <ToolbarButton onClick={() => exportMutation.mutate()}>
              {exportMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export CSV
            </ToolbarButton>
          </div>
        </div>

        {isUnauthorized ? (
          <SurfaceCard className="border-[#F2DFB2] bg-[#FFF9EC] p-5">
            <p className="text-[14px] font-semibold text-[#8A5B00]">Analytics is connected but protected</p>
            <p className="mt-2 text-[14px] leading-7 text-[#946200]">
              The live analytics endpoints are wired. Sign in with a valid admin token to load overview, geography,
              drilldowns, and CSV export from the backend.
            </p>
          </SurfaceCard>
        ) : null}

        {overviewQuery.isError && !isUnauthorized ? (
          <SurfaceCard className="border-[#F0D4D8] bg-[#FFF7F8] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[14px] font-semibold text-[#B4233A]">Analytics failed to load</p>
                <p className="mt-2 text-[14px] leading-7 text-[#8C3646]">{parseError(overviewQuery.error)}</p>
              </div>
              <ToolbarButton onClick={() => overviewQuery.refetch()}>
                <RefreshCw className="h-4 w-4" />
                Retry
              </ToolbarButton>
            </div>
          </SurfaceCard>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {(analytics?.summaryCards ?? Array.from({ length: 6 }, (_, index) => ({
            label: `Metric ${index + 1}`,
            value: overviewQuery.isLoading ? "Loading..." : "—",
            helper: overviewQuery.isLoading ? "Fetching live analytics" : "Awaiting data",
            helperTone: "neutral" as const,
          }))).map((item) => (
            <MetricCard
              key={item.label}
              label={item.label}
              value={item.value}
              helper={item.helper}
              helperTone={item.helperTone}
            />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <SurfaceCard>
            <div className="border-b border-[#ECEEF2] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold uppercase text-[#757B85]">Views over time</p>
                  <p className="mt-2 text-[19px] font-semibold text-[#16181D]">
                    {analytics?.summaryCards[0]?.value ?? (overviewQuery.isLoading ? "Loading..." : "—")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ToolbarButton subtle>
                    <Plus className="h-4 w-4" />
                    Custom Date
                  </ToolbarButton>
                  <ToolbarButton withChevron subtle>
                    1Y
                  </ToolbarButton>
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
              <FauxBars values={analytics?.chartValues ?? [48, 62, 44, 58, 88, 61, 77, 75, 74, 88, 56, 54]} highlightIndex={4} />
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
                {(analytics?.geography ?? []).map((country) => (
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
            {(analytics?.topAssets ?? []).map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setDrawerAsset(row)}
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
                  <StatusBadge tone={row.tone}>{row.type}</StatusBadge>
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
                {(analytics?.geography ?? []).map((item) => (
                  <div key={item.country} className="grid grid-cols-[minmax(0,1fr)_90px_90px] items-center gap-3 border-b border-[#ECEEF2] pb-4 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[18px]">{item.flag}</span>
                      <p className="text-[14px] font-semibold text-[#16181D]">{item.country}</p>
                    </div>
                    <p className="text-[14px] text-[#16181D]">{item.viewsLabel}</p>
                    <div className="flex justify-end">
                      <SparkLine value={item.share} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>

      <AnimatePresence>{drawerAsset ? <AnalyticsDrawer asset={drawerAsset} onClose={() => setDrawerAsset(null)} /> : null}</AnimatePresence>
    </DashboardShell>
  );
}
