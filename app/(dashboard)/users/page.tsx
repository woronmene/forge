"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Download, LoaderCircle, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { MetricCard, ToolbarButton, ToolbarSearchField } from "@/components/dashboard-widgets";
import { StatusBadge, SurfaceCard } from "@/components/page-primitives";
import { forgeQueryKeys } from "@/services/api/query-keys";
import { exportUsers, getUserAudit, getUserDetail, listUsers, revokeAllSessions, triggerPasswordReset } from "@/services/users";

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
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
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

  return "We could not load the user record.";
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

function getList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [
    payload.items,
    payload.audit,
    payload.events,
    payload.results,
    isRecord(payload.data) ? payload.data.items : undefined,
    isRecord(payload.data) ? payload.data.audit : undefined,
    isRecord(payload.data) ? payload.data.events : undefined,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
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

function mapUserSummary(detail: unknown) {
  const objects = collectObjects(detail);
  const root = objects[0] ?? {};
  const profile = objects.find((item) => getString(item.email) || getString(item.username)) ?? root;

  return {
    id: getString(root.id) ?? getString(root.user_id) ?? getString(profile.id) ?? "Unknown",
    name:
      getString(profile.full_name) ??
      getString(profile.fullName) ??
      getString(profile.name) ??
      getString(profile.username) ??
      "Unknown user",
    email: getString(profile.email) ?? "Email unavailable",
    country:
      getString(profile.country) ??
      getString(profile.country_name) ??
      getString(profile.location) ??
      "Unknown location",
    device:
      getString(profile.device) ??
      getString(profile.device_name) ??
      getString(profile.last_device) ??
      "Device unavailable",
    appVersion:
      getString(profile.app_version) ??
      getString(profile.appVersion) ??
      "App version unavailable",
    status:
      getString(profile.status) ??
      getString(profile.account_status) ??
      "Unknown",
    tier:
      getString(profile.tier) ??
      getString(profile.subscription_tier) ??
      getString(profile.plan) ??
      "Unknown",
    registeredAt: formatDate(profile.created_at ?? profile.createdAt ?? root.created_at),
    lastActiveAt: formatDate(profile.last_active_at ?? profile.lastActiveAt ?? profile.updated_at),
    metrics: [
      {
        label: "Sessions",
        value: formatCount(findMetricValue(detail, ["session"])),
        helper: "Detail payload",
      },
      {
        label: "Watch time",
        value: formatCount(findMetricValue(detail, ["watch"])),
        helper: "Detail payload",
      },
      {
        label: "Likes",
        value: formatCount(findMetricValue(detail, ["like"])),
        helper: "Detail payload",
      },
      {
        label: "Payments",
        value: formatCount(findMetricValue(detail, ["payment"])),
        helper: "Detail payload",
      },
    ],
  };
}

function mapAuditRows(payload: unknown) {
  return getList(payload)
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((record, index) => ({
      id: getString(record.id) ?? `${index + 1}`,
      title:
        getString(record.action) ??
        getString(record.event) ??
        getString(record.title) ??
        "Audit event",
      subtitle:
        getString(record.actor) ??
        getString(record.performed_by) ??
        getString(record.description) ??
        "No actor information",
      date: formatDate(record.created_at ?? record.createdAt ?? record.timestamp),
    }));
}

function getDirectoryItems(payload: unknown): Record<string, unknown>[] {
  if (!isRecord(payload)) {
    return [];
  }

  const items = payload.items;
  return Array.isArray(items) ? items.filter((item): item is Record<string, unknown> => isRecord(item)) : [];
}

function mapDirectoryRows(payload: unknown) {
  return getDirectoryItems(payload).map((record, index) => {
    const firstName = getString(record.first_name) ?? getString(record.firstName) ?? "";
    const lastName = getString(record.last_name) ?? getString(record.lastName) ?? "";
    const displayName = getString(record.display_name) ?? getString(record.displayName);
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    const name = displayName ?? fullName ?? getString(record.email) ?? `User ${index + 1}`;
    const accountStatus = getString(record.account_status) ?? getString(record.status) ?? "unknown";
    const tier =
      getString(record.subscription_tier) ??
      getString(record.subscription_status) ??
      getString(record.tier) ??
      "Unknown";

    return {
      id: getString(record.user_id) ?? getString(record.id) ?? `user-${index + 1}`,
      name,
      email: getString(record.email) ?? "Email unavailable",
      country: getString(record.country) ?? getString(record.country_name) ?? "Unknown",
      tier,
      status: accountStatus,
      role: getString(record.type) ?? getString(record.role) ?? "user",
      flagged: Boolean(record.flagged),
      registeredAt: formatDate(record.created_at ?? record.createdAt),
      lastActiveAt: formatDate(record.last_active_at ?? record.lastActiveAt ?? record.updated_at),
    };
  });
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [userId, setUserId] = useState("");

  const directoryQuery = useQuery({
    queryKey: forgeQueryKeys.users.list({ q: searchTerm || undefined, limit: 50 }),
    queryFn: () =>
      listUsers({
        q: searchTerm || undefined,
        limit: 50,
      }),
  });

  const detailQuery = useQuery({
    queryKey: forgeQueryKeys.users.detail(userId),
    queryFn: () => getUserDetail(userId),
    enabled: userId.length > 0,
  });

  const auditQuery = useQuery({
    queryKey: forgeQueryKeys.users.audit(userId),
    queryFn: () => getUserAudit(userId),
    enabled: userId.length > 0,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => triggerPasswordReset(userId),
  });

  const revokeSessionsMutation = useMutation({
    mutationFn: () => revokeAllSessions(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: forgeQueryKeys.users.audit(userId) });
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => exportUsers({ q: searchTerm || undefined }),
    onSuccess: (blob) => {
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = "forge-users.csv";
      anchor.click();
      URL.revokeObjectURL(href);
    },
  });

  const directoryError = directoryQuery.error ? parseError(directoryQuery.error) : null;
  const detailError = detailQuery.error ? parseError(detailQuery.error) : null;
  const auditError = auditQuery.error ? parseError(auditQuery.error) : null;
  const actionError = resetPasswordMutation.error
    ? parseError(resetPasswordMutation.error)
    : revokeSessionsMutation.error
      ? parseError(revokeSessionsMutation.error)
      : null;
  const unauthorized =
    directoryError?.toLowerCase().includes("401") ||
    detailError?.toLowerCase().includes("401") ||
    auditError?.toLowerCase().includes("401") ||
    directoryError?.toLowerCase().includes("unauthorized") ||
    detailError?.toLowerCase().includes("unauthorized") ||
    auditError?.toLowerCase().includes("unauthorized");

  const directoryRows = useMemo(() => (directoryQuery.data ? mapDirectoryRows(directoryQuery.data) : []), [directoryQuery.data]);
  const user = useMemo(() => (detailQuery.data ? mapUserSummary(detailQuery.data) : null), [detailQuery.data]);
  const auditRows = useMemo(() => (auditQuery.data ? mapAuditRows(auditQuery.data) : []), [auditQuery.data]);
  const summaryCards = useMemo(() => {
    const total = directoryRows.length;
    const active = directoryRows.filter((row) => row.status.toLowerCase().includes("active")).length;
    const suspended = directoryRows.filter((row) => row.status.toLowerCase().includes("suspend")).length;
    const flagged = directoryRows.filter((row) => row.flagged).length;

    return [
      { label: "Directory users", value: formatCount(total), helper: "Live admin directory", helperTone: "positive" as const },
      { label: "Active", value: formatCount(active), helper: "Visible rows", helperTone: "positive" as const },
      { label: "Suspended", value: formatCount(suspended), helper: "Visible rows", helperTone: suspended > 0 ? "negative" as const : "neutral" as const },
      { label: "Flagged", value: formatCount(flagged), helper: "Visible rows", helperTone: flagged > 0 ? "negative" as const : "neutral" as const },
    ];
  }, [directoryRows]);

  useEffect(() => {
    if (!userId && directoryRows.length > 0) {
      setUserId(directoryRows[0].id);
    }
  }, [directoryRows, userId]);

  return (
    <DashboardShell title="User directory" description="Search, inspect, and manage platform users from the live admin directory">
      <div className="space-y-5 px-4 py-5 md:px-6 xl:px-8">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <MetricCard key={item.label} label={item.label} value={item.value} helper={item.helper} helperTone={item.helperTone} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <ToolbarSearchField placeholder="Search by email, name, or user hint..." value={searchInput} onChange={setSearchInput} />
          <ToolbarButton
            onClick={() => {
              setSearchTerm(searchInput.trim());
            }}
          >
            <Search className="h-4 w-4" />
            Search
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              void directoryQuery.refetch();
              if (userId) {
                void detailQuery.refetch();
                void auditQuery.refetch();
              }
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </ToolbarButton>
          <ToolbarButton onClick={() => exportMutation.mutate()}>
            {exportMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </ToolbarButton>
        </div>

        {directoryError || detailError || auditError ? (
          <SurfaceCard className="border-[#F7C9D1] bg-[#FFF7F8]">
            <div className="p-4 text-[14px] text-[#7A2230]">
              <p className="font-semibold">{unauthorized ? "Login required for user admin endpoints" : "User data is unavailable right now"}</p>
              <p className="mt-1">{directoryError ?? detailError ?? auditError}</p>
            </div>
          </SurfaceCard>
        ) : null}

        {actionError ? (
          <SurfaceCard className="border-[#F7C9D1] bg-[#FFF7F8]">
            <div className="p-4 text-[14px] text-[#7A2230]">
              <p className="font-semibold">The last admin action failed</p>
              <p className="mt-1">{actionError}</p>
            </div>
          </SurfaceCard>
        ) : null}

        <SurfaceCard className="overflow-hidden">
          <div className="hidden grid-cols-[1.5fr_1.4fr_0.9fr_0.9fr_0.9fr_1fr_1fr] border-b border-[#ECEEF2] px-[18px] py-4 text-[13px] font-medium uppercase tracking-[0.02em] text-[#8E929B] lg:grid">
            <div>Name</div>
            <div>Email</div>
            <div>Country</div>
            <div>Tier</div>
            <div>Status</div>
            <div>Registered</div>
            <div>Last active</div>
          </div>

          {directoryQuery.isLoading ? (
            <div className="flex min-h-[220px] items-center justify-center gap-3 p-6 text-[14px] text-[#6F7480]">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading live user directory…
            </div>
          ) : null}

          {!directoryQuery.isLoading && !directoryError && directoryRows.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[16px] font-semibold text-[#16181D]">No users matched this search</p>
              <p className="mt-2 text-[14px] text-[#6F7480]">Try a broader search term or clear the current filter.</p>
            </div>
          ) : null}

          {!directoryQuery.isLoading && !directoryError
            ? directoryRows.map((row) => {
                const active = row.id === userId;
                const statusTone = row.status.toLowerCase().includes("active")
                  ? "ready"
                  : row.status.toLowerCase().includes("suspend")
                    ? "error"
                    : "gray";

                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setUserId(row.id)}
                    className={`grid w-full items-center gap-4 border-b border-[#ECEEF2] px-[18px] py-[18px] text-left transition hover:bg-[#FAFBFF] lg:grid-cols-[1.5fr_1.4fr_0.9fr_0.9fr_0.9fr_1fr_1fr] ${
                      active ? "bg-[#FAFBFF]" : ""
                    }`}
                  >
                    <div>
                      <p className="text-[16px] font-semibold text-[#16181D]">{row.name}</p>
                      <p className="mt-1 text-[13px] text-[#7D828B]">{row.id}</p>
                    </div>
                    <p className="text-[15px] text-[#16181D]">{row.email}</p>
                    <p className="text-[15px] text-[#16181D]">{row.country}</p>
                    <div>
                      <StatusBadge tone="purple">{row.tier}</StatusBadge>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={statusTone}>{row.status}</StatusBadge>
                      {row.flagged ? <StatusBadge tone="error">Flagged</StatusBadge> : null}
                    </div>
                    <p className="text-[14px] text-[#6F7480]">{row.registeredAt}</p>
                    <p className="text-[14px] text-[#6F7480]">{row.lastActiveAt}</p>
                  </button>
                );
              })
            : null}
        </SurfaceCard>

        {userId && (detailQuery.isLoading || auditQuery.isLoading) ? (
          <SurfaceCard>
            <div className="flex items-center gap-3 p-5 text-[14px] text-[#6F7480]">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading user detail and audit data…
            </div>
          </SurfaceCard>
        ) : null}

        {user ? (
          <>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <SurfaceCard>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[22px] font-semibold tracking-[-0.04em] text-[#16181D]">{user.name}</p>
                      <p className="mt-1 text-[14px] text-[#6F7480]">{user.email}</p>
                      <p className="mt-2 text-[13px] text-[#8A909A]">User ID: {user.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <StatusBadge tone={user.status.toLowerCase().includes("active") ? "ready" : "gray"}>{user.status}</StatusBadge>
                      <StatusBadge tone="purple">{user.tier}</StatusBadge>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {[
                      ["Country / City", user.country],
                      ["Device", user.device],
                      ["App version", user.appVersion],
                      ["Registered", user.registeredAt],
                      ["Last active", user.lastActiveAt],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[16px] border border-[#ECEEF2] p-4">
                        <p className="text-[12px] font-semibold uppercase text-[#7B8088]">{label}</p>
                        <p className="mt-2 text-[15px] font-semibold text-[#16181D]">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => resetPasswordMutation.mutate()}
                      className="rounded-full bg-[#3150FF] px-5 py-3 text-[14px] font-medium text-white"
                    >
                      {resetPasswordMutation.isPending ? "Resetting password…" : "Trigger password reset"}
                    </button>
                    <button
                      type="button"
                      onClick={() => revokeSessionsMutation.mutate()}
                      className="rounded-full border border-[#E6E7EC] px-5 py-3 text-[14px] font-medium text-[#16181D]"
                    >
                      {revokeSessionsMutation.isPending ? "Revoking sessions…" : "Revoke all sessions"}
                    </button>
                  </div>
                </div>
              </SurfaceCard>

              <div className="grid gap-4">
                {user.metrics.map((metric) => (
                  <MetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} helperTone="neutral" />
                ))}
              </div>
            </div>

            <SurfaceCard>
              <div className="p-5">
                <p className="text-[16px] font-semibold text-[#16181D]">Audit log</p>
                <p className="mt-1 text-[14px] text-[#6F7480]">Live admin audit events for the selected user</p>
                <div className="mt-6 space-y-5">
                  {auditRows.length > 0 ? (
                    auditRows.map((row) => (
                      <div key={row.id} className="grid grid-cols-[14px_minmax(0,1fr)_160px] gap-4 border-b border-[#ECEEF2] pb-5 last:border-b-0">
                        <span className="mt-1.5 h-[11px] w-[11px] rounded-full bg-[#3150FF]" />
                        <div>
                          <p className="text-[15px] font-semibold text-[#16181D]">{row.title}</p>
                          <p className="mt-1 text-[13px] text-[#767C86]">{row.subtitle}</p>
                        </div>
                        <p className="text-right text-[13px] text-[#767C86]">{row.date}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[14px] text-[#6F7480]">No audit events were returned for this user.</p>
                  )}
                </div>
              </div>
            </SurfaceCard>
          </>
        ) : (
          <SurfaceCard>
            <div className="p-8 text-center">
              <p className="text-[16px] font-semibold text-[#16181D]">Select a user to inspect details</p>
              <p className="mt-2 text-[14px] text-[#6F7480]">
                The directory above is live. Click any row to load backend detail, audit history, and supported admin actions for that user.
              </p>
            </div>
          </SurfaceCard>
        )}
      </div>
    </DashboardShell>
  );
}
