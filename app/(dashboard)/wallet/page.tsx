"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Download, LoaderCircle, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { ExportButton, MetricCard, ProviderStatus, SegmentTabs, SparkLine, ToolbarSelect, ToolbarSearchField } from "@/components/dashboard-widgets";
import { StatusBadge, SurfaceCard } from "@/components/page-primitives";
import { forgeQueryKeys } from "@/services/api/query-keys";
import { getAdminWalletOverview, getAdminWalletProviders } from "@/services/wallet";

type SummaryCard = {
  label: string;
  value: string;
  helper: string;
  tone: "positive" | "negative" | "neutral";
};

type BreakdownRow = {
  label: string;
  value: string;
};

type GeographyRow = {
  label: string;
  volume: string;
  share: number;
};

type TransactionRow = {
  id: string;
  user: string;
  type: string;
  amount: string;
  date: string;
  status: string;
  reference: string;
  tone: "purple" | "blue" | "cyan";
};

type WalletData = {
  currency: string;
  summaryCards: SummaryCard[];
  breakdownRows: BreakdownRow[];
  geographyRows: GeographyRow[];
  senderRecipientRows: BreakdownRow[];
  providerRows: Array<{ label: string; subtitle: string; status: "Healthy" | "Down" }>;
  transactionRows: TransactionRow[];
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
    const sanitized = value.replace(/[,\s]/g, "");
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

function formatCurrency(value: unknown, currency = "NGN") {
  const numberValue = getNumber(value);
  if (numberValue === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numberValue);
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
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

  return "We could not load wallet data from the backend.";
}

function toSentenceCase(input: string) {
  return input
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function mapTypeTone(type: string): "purple" | "blue" | "cyan" {
  const normalized = type.toLowerCase();
  if (normalized.includes("bill")) {
    return "purple";
  }
  if (normalized.includes("card")) {
    return "cyan";
  }
  return "blue";
}

function buildCsv(rows: TransactionRow[]) {
  const lines = [
    ["user_id", "type", "amount", "date", "status", "reference"],
    ...rows.map((row) => [row.user, row.type, row.amount, row.date, row.status, row.reference]),
  ];

  return lines
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
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

function getMap(input: unknown) {
  if (!isRecord(input)) {
    return {};
  }

  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, getNumber(value) ?? 0]));
}

function buildSummaryCards(payment: Record<string, unknown>, currency: string): SummaryCard[] {
  const transactionCount = getNumber(payment.transaction_count) ?? 0;
  const failureRate = getNumber(payment.failure_rate) ?? 0;

  return [
    {
      label: "Total volume",
      value: formatCurrency(payment.total_transaction_volume, currency),
      helper: "Admin wallet overview",
      tone: "positive",
    },
    {
      label: "Transactions",
      value: formatCompact(transactionCount),
      helper: "Normalized payment activity",
      tone: "positive",
    },
    {
      label: "Average size",
      value: formatCurrency(payment.average_transaction_size, currency),
      helper: "Per transaction",
      tone: "neutral",
    },
    {
      label: "Failure rate",
      value: `${Math.round(failureRate * 100)}%`,
      helper: "Operational health",
      tone: failureRate > 0.05 ? "negative" : "neutral",
    },
  ];
}

function buildBreakdownRows(payment: Record<string, unknown>, currency: string) {
  const categoryCounts = getMap(payment.category_counts);
  const statusCounts = getMap(payment.status_counts);

  return [
    { label: "Wallets created", value: formatCompact(payment.wallet_created_count) },
    { label: "Wallet creation failures", value: formatCompact(payment.wallet_creation_failed_count) },
    { label: "Provider sync runs", value: formatCompact(payment.provider_sync_count) },
    { label: "Webhook events", value: formatCompact(payment.webhook_event_count) },
    { label: "Synced wallets", value: formatCompact(payment.synced_wallet_count) },
    { label: "Synced cards", value: formatCompact(payment.synced_card_count) },
    { label: "Synced transactions", value: formatCompact(payment.synced_transaction_count) },
    { label: "Top category count", value: formatCompact(Math.max(0, ...Object.values(categoryCounts))) },
    { label: "Success count", value: formatCompact(statusCounts.success ?? statusCounts.Success ?? 0) },
    { label: "Failure count", value: formatCompact(payment.failure_count) },
    { label: "Currency", value: currency },
    { label: "Transaction volume", value: formatCurrency(payment.total_transaction_volume, currency) },
  ];
}

function buildGeographyRows(payment: Record<string, unknown>, currency: string) {
  const source = Array.isArray(payment.sender_geography) && payment.sender_geography.length > 0
    ? payment.sender_geography
    : Array.isArray(payment.recipient_geography)
      ? payment.recipient_geography
      : [];

  const rows = source
    .filter((row): row is Record<string, unknown> => isRecord(row))
    .map((row) => ({
      label: getString(row.country_code) ?? "Unknown",
      rawAmount: getNumber(row.amount) ?? 0,
      volume: formatCurrency(row.amount, currency),
      share: 0,
    }))
    .filter((row) => row.label !== "Unknown")
    .sort((left, right) => right.rawAmount - left.rawAmount);

  const total = rows.reduce((sum, row) => sum + row.rawAmount, 0);
  if (rows.length === 0) {
    return [{ label: "Geography not exposed yet", volume: "—", share: 0 }];
  }

  return rows.slice(0, 5).map((row) => ({
    label: row.label,
    volume: row.volume,
    share: total > 0 ? Math.max(1, Math.round((row.rawAmount / total) * 100)) : 0,
  }));
}

function buildSenderRecipientRows(payment: Record<string, unknown>, currency: string) {
  const senderGeo = Array.isArray(payment.sender_geography) ? payment.sender_geography : [];
  const recipientGeo = Array.isArray(payment.recipient_geography) ? payment.recipient_geography : [];

  const senderAmount = senderGeo.reduce((sum, row) => sum + (isRecord(row) ? getNumber(row.amount) ?? 0 : 0), 0);
  const recipientAmount = recipientGeo.reduce((sum, row) => sum + (isRecord(row) ? getNumber(row.amount) ?? 0 : 0), 0);
  const providerCounts = getMap(payment.provider_counts);

  return [
    { label: "Sender volume", value: formatCurrency(senderAmount, currency) },
    { label: "Recipient volume", value: formatCurrency(recipientAmount, currency) },
    { label: "Providers tracked", value: formatCompact(Object.keys(providerCounts).length) },
  ];
}

function buildProviderRows(payment: Record<string, unknown>, providersPayload: unknown) {
  const providerCounts = getMap(payment.provider_counts);
  const providerNames = Array.isArray((providersPayload as Record<string, unknown> | null)?.providers)
    ? ((providersPayload as Record<string, unknown>).providers as unknown[])
        .map((item) => (typeof item === "string" ? item : isRecord(item) ? getString(item.provider) ?? getString(item.name) : undefined))
        .filter((item): item is string => Boolean(item))
    : [];

  const rows = providerNames.map((provider) => ({
    label: provider,
    subtitle: `${formatCompact(providerCounts[provider] ?? 0)} events seen in current overview`,
    status: "Healthy" as const,
  }));

  if (rows.length > 0) {
    return rows;
  }

  return [
    {
      label: "Provider list unavailable",
      subtitle: "The admin wallet providers endpoint returned no provider names.",
      status: "Down" as const,
    },
  ];
}

function buildTransactionRows(payment: Record<string, unknown>, currency: string): TransactionRow[] {
  const rows = Array.isArray(payment.recent_transactions) ? payment.recent_transactions : [];
  return rows
    .filter((row): row is Record<string, unknown> => isRecord(row))
    .map((record, index) => {
      const type = getString(record.category) ?? getString(record.type) ?? getString(record.transaction_type) ?? "Transaction";
      const user = getString(record.user_id) ?? getString(record.userId) ?? getString(record.user) ?? "Unknown user";
      const reference =
        getString(record.transaction_reference) ??
        getString(record.reference) ??
        getString(record.tx_ref) ??
        getString(record.transaction_id) ??
        `tx-${index + 1}`;
      const status = toSentenceCase(getString(record.status) ?? "Unknown");

      return {
        id: `${reference}-${index}`,
        user,
        type: toSentenceCase(type),
        amount: formatCurrency(record.amount ?? record.total_amount ?? record.value, currency),
        date: formatDate(record.created_at ?? record.createdAt ?? record.updated_at ?? record.transaction_date ?? record.captured_at),
        status,
        reference,
        tone: mapTypeTone(type),
      };
    });
}

function adaptWalletData(overview: unknown, providersPayload: unknown): WalletData | null {
  if (!isRecord(overview) || !isRecord(overview.payment)) {
    return null;
  }

  const payment = overview.payment;
  const currency = getString(payment.currency) ?? "NGN";

  return {
    currency,
    summaryCards: buildSummaryCards(payment, currency),
    breakdownRows: buildBreakdownRows(payment, currency),
    geographyRows: buildGeographyRows(payment, currency),
    senderRecipientRows: buildSenderRecipientRows(payment, currency),
    providerRows: buildProviderRows(payment, providersPayload),
    transactionRows: buildTransactionRows(payment, currency),
  };
}

function getDateWindow(period: string) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (period === "Daily" ? 1 : 30));

  const asDate = (value: Date) => value.toISOString().slice(0, 10);
  return {
    from_date: asDate(start),
    to_date: asDate(end),
    recent_limit: 50,
  };
}

export default function WalletPage() {
  const [period, setPeriod] = useState("Monthly");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Type");
  const [statusFilter, setStatusFilter] = useState("Status");

  const overviewParams = useMemo(() => getDateWindow(period), [period]);

  const overviewQuery = useQuery({
    queryKey: forgeQueryKeys.wallet.overview(overviewParams),
    queryFn: () => getAdminWalletOverview(overviewParams),
  });

  const providersQuery = useQuery({
    queryKey: forgeQueryKeys.wallet.providers(),
    queryFn: () => getAdminWalletProviders(),
  });

  const data = useMemo(() => adaptWalletData(overviewQuery.data, providersQuery.data), [overviewQuery.data, providersQuery.data]);

  const filteredTransactions = useMemo(
    () =>
      (data?.transactionRows ?? []).filter((row) => {
        const matchesSearch = !search || `${row.user} ${row.reference}`.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === "Type" || row.type === typeFilter;
        const matchesStatus = statusFilter === "Status" || row.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
      }),
    [data?.transactionRows, search, statusFilter, typeFilter],
  );

  const exportMutation = useMutation({
    mutationFn: async () => {
      const csv = buildCsv(filteredTransactions);
      downloadBlob(`forge-wallet-activity-${period.toLowerCase()}.csv`, csv, "text/csv;charset=utf-8");
      return true;
    },
  });

  const errorMessage = overviewQuery.error ? parseError(overviewQuery.error) : providersQuery.error ? parseError(providersQuery.error) : null;
  const exportError = exportMutation.error ? parseError(exportMutation.error) : null;
  const unauthorized = errorMessage?.toLowerCase().includes("401") || errorMessage?.toLowerCase().includes("unauthorized");
  const transactionTypes = Array.from(new Set((data?.transactionRows ?? []).map((row) => row.type)));
  const transactionStatuses = Array.from(new Set((data?.transactionRows ?? []).map((row) => row.status)));

  return (
    <DashboardShell title="Wallet activity" description="Embedded finance overview — bill pay, remittances & debit cards">
      <div className="space-y-5 px-4 py-5 md:px-6 xl:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SegmentTabs items={["Daily", "Monthly"]} active={period} onChange={setPeriod} />
          <ExportButton onClick={() => exportMutation.mutate()}>
            {exportMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </ExportButton>
        </div>

        {errorMessage ? (
          <SurfaceCard className="border-[#F7C9D1] bg-[#FFF7F8]">
            <div className="p-4 text-[14px] text-[#7A2230]">
              <p className="font-semibold">{unauthorized ? "Login required for wallet data" : "Wallet data is unavailable right now"}</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
          </SurfaceCard>
        ) : null}

        {exportError ? (
          <SurfaceCard className="border-[#F7C9D1] bg-[#FFF7F8]">
            <div className="p-4 text-[14px] text-[#7A2230]">
              <p className="font-semibold">Wallet export failed</p>
              <p className="mt-1">{exportError}</p>
            </div>
          </SurfaceCard>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-4">
          {(data?.summaryCards ?? Array.from({ length: 4 })).map((item, index) =>
            item ? (
              <MetricCard key={item.label} label={item.label} value={item.value} helper={item.helper} helperTone={item.tone} />
            ) : (
              <SurfaceCard key={`wallet-summary-skeleton-${index}`}>
                <div className="p-5">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-[#EEF1F6]" />
                  <div className="mt-4 h-8 w-28 animate-pulse rounded-full bg-[#EEF1F6]" />
                  <div className="mt-3 h-3 w-32 animate-pulse rounded-full bg-[#EEF1F6]" />
                </div>
              </SurfaceCard>
            ),
          )}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard>
            <div className="p-4">
              <p className="text-[13px] font-semibold uppercase text-[#16181D]">Operational breakdown</p>
              <p className="mt-2 text-[13px] text-[#7A7F89]">Mapped from the admin wallet overview response</p>
              <div className="mt-6 space-y-6">
                {(data?.breakdownRows ?? []).map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 text-[14px]">
                    <span className="text-[#666D77]">{row.label}</span>
                    <span className="font-semibold text-[#16181D]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="p-4">
              <p className="text-[13px] font-semibold uppercase text-[#16181D]">Geographic distribution</p>
              <p className="mt-2 text-[13px] text-[#7A7F89]">Using sender geography first, then recipient geography when sender data is empty</p>
              <div className="mt-6 grid grid-cols-[minmax(0,1fr)_100px_90px] border-b border-[#ECEEF2] pb-3 text-[12px] font-semibold uppercase text-[#7A7F89]">
                <div>Region</div>
                <div>Volume</div>
                <div>Share</div>
              </div>
              <div className="space-y-4 pt-4">
                {(data?.geographyRows ?? []).map((row) => (
                  <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_100px_90px] items-center gap-4">
                    <p className="text-[14px] text-[#666D77]">{row.label}</p>
                    <p className="text-[14px] font-semibold text-[#16181D]">{row.volume}</p>
                    <div className="flex justify-end">
                      <SparkLine value={row.share} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-8 text-[13px] font-semibold uppercase text-[#16181D]">Sender vs recipient</p>
              <div className="mt-5 space-y-4">
                {(data?.senderRecipientRows ?? []).map((row) => (
                  <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_120px] gap-4 text-[14px]">
                    <p className="text-[#666D77]">{row.label}</p>
                    <p className="font-semibold text-[#16181D]">{row.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </SurfaceCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard>
            <div className="p-4">
              <p className="text-[13px] font-semibold uppercase text-[#16181D]">Card and provider coverage</p>
              <p className="mt-2 text-[13px] text-[#7A7F89]">These counters are now based on the admin wallet overview and provider list endpoints</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {[
                  ["Recent transactions", filteredTransactions.length > 0 ? String(filteredTransactions.length) : "0", "#16181D"],
                  ["Providers returned", data ? String(data.providerRows.length) : "0", "#228473"],
                  ["Synced cards", data ? String((data.breakdownRows.find((row) => row.label === "Synced cards")?.value ?? "0")) : "0", "#3150FF"],
                  ["Wallet failures", data ? String((data.breakdownRows.find((row) => row.label === "Wallet creation failures")?.value ?? "0")) : "0", "#D97706"],
                ].map(([value, label, color]) => (
                  <div key={label} className="rounded-[16px] border border-[#E6E7EC] p-4 text-center">
                    <p className="text-[33px] font-semibold" style={{ color: color as string }}>
                      {value}
                    </p>
                    <p className="mt-2 text-[12px] text-[#6F7480]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="p-4">
              <p className="text-[13px] font-semibold uppercase text-[#16181D]">Recent transaction mix</p>
              <p className="mt-2 text-[13px] text-[#7A7F89]">Built from the live recent transactions bundled into the admin wallet overview</p>
              <div className="mt-6 space-y-6">
                {[
                  ["Total rows loaded", String(filteredTransactions.length)],
                  ["Success rows", String(filteredTransactions.filter((row) => row.status === "Success").length)],
                  ["Pending rows", String(filteredTransactions.filter((row) => row.status === "Pending").length)],
                  ["Failed rows", String(filteredTransactions.filter((row) => row.status === "Failed").length)],
                  ["Most common type", transactionTypes[0] ?? "—"],
                  ["Current period", period],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 text-[14px]">
                    <span className="text-[#666D77]">{label}</span>
                    <span className="font-semibold text-[#16181D]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-4 p-4">
            <ToolbarSearchField placeholder="Search by user ID or reference..." value={search} onChange={setSearch} />
            <ToolbarSelect value={typeFilter} onChange={setTypeFilter} options={["Type", ...transactionTypes]} />
            <ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={["Status", ...transactionStatuses]} />
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
            <div key={row.id} className="grid items-center gap-4 border-b border-[#ECEEF2] px-[18px] py-[16px] lg:grid-cols-[1fr_0.7fr_0.8fr_0.9fr_0.7fr_0.8fr]">
              <div className="flex items-center justify-between text-[14px] font-semibold text-[#16181D] lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">User</span>
                {row.user}
              </div>
              <div className="flex items-center justify-between lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Type</span>
                <StatusBadge tone={row.tone}>{row.type}</StatusBadge>
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
                ) : row.status === "Failed" ? (
                  <StatusBadge tone="error">Failed</StatusBadge>
                ) : (
                  <StatusBadge tone="gray">{row.status}</StatusBadge>
                )}
              </div>
              <div className="flex items-center justify-between text-[14px] text-[#16181D] lg:block">
                <span className="text-[12px] uppercase text-[#8E929B] lg:hidden">Reference</span>
                {row.reference}
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 ? (
            <div className="px-[18px] py-10 text-center text-[14px] text-[#6F7480]">
              No recent transaction rows matched the current backend response and filters.
            </div>
          ) : null}
        </SurfaceCard>

        <SurfaceCard>
          <div className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold uppercase text-[#16181D]">Provider status</p>
                <p className="mt-2 text-[13px] text-[#7A7F89]">Rendered from the admin wallet providers endpoint and provider counts in the overview</p>
              </div>
              <ExportButton
                onClick={() => {
                  void overviewQuery.refetch();
                  void providersQuery.refetch();
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </ExportButton>
            </div>
            <div className="mt-5">
              {(data?.providerRows ?? []).map((row) => (
                <ProviderStatus key={row.label} label={row.label} subtitle={row.subtitle} status={row.status} />
              ))}
            </div>
          </div>
        </SurfaceCard>
      </div>
    </DashboardShell>
  );
}
