export type QueryValue = string | number | boolean | null | undefined;

export type QueryParams = Record<string, QueryValue>;

export type PaginationParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type ForgeMutationResponse<T> = {
  message?: string;
  data: T;
};

export type ForgeErrorPayload = {
  message?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

export type AssetKind = "video" | "audio" | "image" | "subtitle";

export type AssetStatus = "Ready" | "Error" | "Queued" | "Processing" | "Draft" | "Published" | "Private";

export type VisibilityState = "Published" | "Private" | "Scheduled" | "Draft";

export type SubscriptionTier = "Free" | "Basic" | "Premium" | "VIP";
