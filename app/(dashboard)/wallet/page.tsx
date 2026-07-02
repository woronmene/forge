"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Download, LoaderCircle, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { ExportButton, MetricCard, ProviderStatus, SegmentTabs, SparkLine, ToolbarSelect, ToolbarSearchField } from "@/components/dashboard-widgets";
import { StatusBadge, SurfaceCard } from "@/components/page-primitives";
import { forgeQueryKeys } from "@/services/api/query-keys";
import { getWalletOverview } from "@/services/analytics";
import { exportTransactionHistory } from "@/services/wallet";

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

function formatCurrency(value: unknown) {
  const numberValue = getNumber(value);
  if (numberValue === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
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

function toSentenceCase(input: string) {
  return input
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [
    payload.items,
    payload.transactions,
    payload.results,
    payload.records,
    isRecord(payload.data) ? payload.data.items : undefined,
    isRecord(payload.data) ? payload.data.transactions : undefined,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function buildSummaryCards(input: unknown): SummaryCard[] {
  const totalVolume = findMetricValue(input, ["volume"]) ?? findMetricValue(input, ["total", "amount"]);
  const transactionCount = findMetricValue(input, ["transaction", "count"]) ?? findMetricValue(input, ["count"]);
  const activeWallets = findMetricValue(input, ["active", "wallet"]);
  const failureRate = findMetricValue(input, ["failure", "rate"]);

  return [
    {
      label: "Total volume",
      value: formatCurrency(totalVolume),
      helper: totalVolume !== undefined ? "Wallet overview endpoint" : "Waiting on live payload shape",
      tone: "positive",
    },
    {
      label: "Transactions",
      value: formatCompact(transactionCount),
      helper: transactionCount !== undefined ? "Transaction activity" : "Waiting on live payload shape",
      tone: "positive",
    },
    {
      label: "Active wallets",
      value: formatCompact(activeWallets),
      helper: activeWallets !== undefined ? "Active user wallets" : "Not exposed yet",
      tone: activeWallets !== undefined ? "positive" : "neutral",
    },
    {
      label: "Failure rate",
      value: failureRate !== undefined ? `${Math.round(failureRate)}%` : "—",
      helper: failureRate !== undefined ? "Operational health" : "Not exposed yet",
      tone: failureRate !== undefined && failureRate > 5 ? "negative" : "neutral",
    },
  ];
}

function buildBreakdownRows(input: unknown) {
  return [
    { label: "Bill pay volume", value: formatCurrency(findMetricValue(input, ["bill", "volume"])) },
    { label: "Remittance volume", value: formatCurrency(findMetricValue(input, ["remittance", "volume"])) },
    { label: "Bill pay count", value: formatCompact(findMetricValue(input, ["bill", "count"])) },
    { label: "Remittance count", value: formatCompact(findMetricValue(input, ["remittance", "count"])) },
    { label: "Average bill size", value: formatCurrency(findMetricValue(input, ["bill", "average"])) },
    { label: "Average remittance size", value: formatCurrency(findMetricValue(input, ["remittance", "average"])) },
  ];
}

function buildGeographyRows(input: unknown): GeographyRow[] {
  const rows = collectObjects(input)
    .filter((record) => getString(record.state) || getString(record.region) || getString(record.country))
    .map((record) => {
      const label =
        getString(record.state) ??
        getString(record.region) ??
        getString(record.country) ??
        "Unknown";

      const volume =
        getNumber(record.volume) ??
        getNumber(record.total_volume) ??
        getNumber(record.amount);

      const share =
        getNumber(record.share) ??
        getNumber(record.percentage) ??
        getNumber(record.percent);

      return {
        label,
        volume: formatCurrency(volume),
        share: share !== undefined ? Math.max(1, Math.min(100, Math.round(share))) : 0,
      };
    })
    .filter((row) => row.label !== "Unknown")
    .sort((left, right) => right.share - left.share);

  if (rows.length > 0) {
    return rows.slice(0, 5);
  }

  return [{ label: "Geography not exposed yet", volume: "—", share: 0 }];
}

function buildSenderRecipientRows(input: unknown) {
  return [
    { label: "Domestic sender volume", value: formatCurrency(findMetricValue(input, ["domestic"])) },
    { label: "Inbound remittance volume", value: formatCurrency(findMetricValue(input, ["inbound"])) },
    { label: "Recipient volume", value: formatCurrency(findMetricValue(input, ["recipient"])) },
  ];
}

function buildProviderRows(input: unknown) {
  const health = findMetricValue(input, ["failure", "rate"]);
  const status: "Healthy" | "Down" = health !== undefined && health > 5 ? "Down" : "Healthy";

  return [
    { label: "Wallet analytics service", subtitle: "Derived from overview metrics availability", status },
    { label: "Transaction history service", subtitle: "Backed by wallet transaction history endpoint", status: "Healthy" as const },
    { label: "Provider health detail", subtitle: "Dedicated provider health endpoint not confirmed in the collection", status: "Down" as const },
  ];
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

function buildTransactionRows(payload: unknown): TransactionRow[] {
  return getList(payload)
    .filter((row) => isRecord(row))
    .map((row, index) => {
      const record = row as Record<string, unknown>;
      const type = getString(record.type) ?? getString(record.transaction_type) ?? "Transaction";
      const user = getString(record.user_id) ?? getString(record.userId) ?? getString(record.user) ?? "Unknown user";
      const reference = getString(record.reference) ?? getString(record.tx_ref) ?? getString(record.id) ?? `tx-${index + 1}`;
      const status = getString(record.status) ?? "Unknown";

      return {
        id: `${reference}-${index}`,
        user,
        type: toSentenceCase(type),
        amount: formatCurrency(record.amount ?? record.total_amount ?? record.value),
        date: formatDate(record.created_at ?? record.createdAt ?? record.updated_at ?? record.transaction_date),
        status: toSentenceCase(status),
        reference,
        tone: mapTypeTone(type),
      };
    });
}

function adaptWalletData(overview: unknown, transactions: unknown): WalletData {
  return {
    summaryCards: buildSummaryCards(overview),
    breakdownRows: buildBreakdownRows(overview),
    geographyRows: buildGeographyRows(overview),
    senderRecipientRows: buildSenderRecipientRows(overview),
    providerRows: buildProviderRows(overview),
    transactionRows: buildTransactionRows(transactions),
  };
}

export default function WalletPage() {
  const [period, setPeriod] = useState("Monthly");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Type");
  const [statusFilter, setStatusFilter] = useState("Status");
  const transactionHistorySupported = false;

  const overviewParams = useMemo(() => ({ range: period.toLowerCase() }), [period]);
  const transactionPayload = useMemo(() => ({ period: period.toLowerCase() }), [period]);

  const overviewQuery = useQuery({
    queryKey: forgeQueryKeys.analytics.walletOverview(overviewParams),
    queryFn: () => getWalletOverview(overviewParams),
  });

  const transactionsQuery = useQuery({
    queryKey: forgeQueryKeys.wallet.transactionHistory(transactionPayload),
    queryFn: async () => null,
    enabled: transactionHistorySupported,
  });

  const exportMutation = useMutation({
    mutationFn: () => exportTransactionHistory(transactionPayload),
  });

  const data = useMemo(() => {
    if (!overviewQuery.data && !transactionsQuery.data) {
      return null;
    }

    return adaptWalletData(overviewQuery.data, transactionsQuery.data);
  }, [overviewQuery.data, transactionsQuery.data]);

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

  const errorMessage = overviewQuery.error ? parseError(overviewQuery.error) : null;

  const exportError = exportMutation.error ? parseError(exportMutation.error) : null;
  const transactionHistoryUnavailable = !transactionHistorySupported;
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
              <p className="font-semibold">Transaction export is not returning successfully yet</p>
              <p className="mt-1">{exportError}</p>
            </div>
          </SurfaceCard>
        ) : null}

        {transactionHistoryUnavailable ? (
          <SurfaceCard className="border-[#F2D172] bg-[#FFF9E7]">
            <div className="p-4 text-[14px] text-[#8A5B12]">
              <p className="font-semibold">Transaction history is not available on the current staging contract.</p>
              <p className="mt-1">
                The wallet overview endpoint is live, but the transaction-history route exposed in the earlier collection
                does not resolve on this environment yet. The rest of the page stays usable with honest empty-state
                messaging.
              </p>
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
              <p className="text-[13px] font-semibold uppercase text-[#16181D]">Volume breakdown</p>
              <p className="mt-2 text-[13px] text-[#7A7F89]">Mapped from the wallet overview endpoint</p>
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
              <p className="mt-2 text-[13px] text-[#7A7F89]">Rendered only from locations exposed by the current backend payload</p>
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
              <p className="mt-2 text-[13px] text-[#7A7F89]">The current wallet endpoints do not expose the full card issuance summary from the design</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {[
                  ["Live transaction history", filteredTransactions.length > 0 ? String(filteredTransactions.length) : "0", "#16181D"],
                  ["Overview fields mapped", data ? "Yes" : "No", "#228473"],
                  ["Card issuance summary", "Missing", "#D97706"],
                  ["Provider health detail", "Partial", "#767C86"],
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
              <p className="text-[13px] font-semibold uppercase text-[#16181D]">Card transaction volume</p>
              <p className="mt-2 text-[13px] text-[#7A7F89]">This panel is currently derived from transaction history because a dedicated card-volume endpoint was not confirmed</p>
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
            <ToolbarSearchField placeholder="Search by user ID..." value={search} onChange={setSearch} />
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
              No transaction rows matched the current backend response and filters.
            </div>
          ) : null}
        </SurfaceCard>

        <SurfaceCard>
          <div className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold uppercase text-[#16181D]">Provider status</p>
                <p className="mt-2 text-[13px] text-[#7A7F89]">Rendered from confirmed wallet coverage, with explicit gaps where provider-level health is missing</p>
              </div>
              <ExportButton onClick={() => { void overviewQuery.refetch(); void transactionsQuery.refetch(); }}>
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
