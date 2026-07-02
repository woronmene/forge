export const forgeQueryKeys = {
  uploads: {
    all: ["uploads"] as const,
  },
  content: {
    all: ["content"] as const,
    lists: () => ["content", "list"] as const,
    list: (params?: Record<string, unknown>) => ["content", "list", params ?? {}] as const,
    detail: (assetId: string) => ["content", "detail", assetId] as const,
    mediaSummary: () => ["content", "media-summary"] as const,
    catalogSummary: () => ["content", "catalog-summary"] as const,
  },
  series: {
    all: ["series"] as const,
    detail: (seriesId: string) => ["series", "detail", seriesId] as const,
  },
  albums: {
    all: ["albums"] as const,
    detail: (albumId: string) => ["albums", "detail", albumId] as const,
    mixDetail: (mixId: string) => ["albums", "mix-detail", mixId] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    mediaOverview: (params?: Record<string, unknown>) => ["analytics", "media-overview", params ?? {}] as const,
    assetDrilldown: (assetId: string, params?: Record<string, unknown>) =>
      ["analytics", "asset-drilldown", assetId, params ?? {}] as const,
    userEngagementOverview: (params?: Record<string, unknown>) =>
      ["analytics", "user-engagement-overview", params ?? {}] as const,
    userEngagementDetail: (userId: string, params?: Record<string, unknown>) =>
      ["analytics", "user-engagement-detail", userId, params ?? {}] as const,
    walletOverview: (params?: Record<string, unknown>) => ["analytics", "wallet-overview", params ?? {}] as const,
  },
  users: {
    all: ["users"] as const,
    list: (params?: Record<string, unknown>) => ["users", "list", params ?? {}] as const,
    detail: (userId: string) => ["users", "detail", userId] as const,
    audit: (userId: string) => ["users", "audit", userId] as const,
    playbackPositions: (userId: string) => ["users", "playback-positions", userId] as const,
  },
  wallet: {
    all: ["wallet"] as const,
    health: () => ["wallet", "health"] as const,
    banks: () => ["wallet", "banks"] as const,
    kycLevels: () => ["wallet", "kyc-levels"] as const,
    transactionHistory: (params?: Record<string, unknown>) => ["wallet", "transaction-history", params ?? {}] as const,
  },
} as const;
