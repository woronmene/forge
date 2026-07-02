export type NavItem = {
  label: string;
  href: string;
  icon: string;
  activeIcon?: string;
  badge?: string;
  disabled?: boolean;
  disabledLabel?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export type UploadType = "movie" | "series" | "album" | "mix" | "trailer";

export type ContentAsset = {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  typeTone: "purple" | "cyan" | "blue" | "gray";
  genre: string;
  status: "Ready" | "Error" | "Processing" | "Queued" | "Draft" | "Published" | "Private";
  dateAdded: string;
  views: string;
  swatch: string;
  description: string;
  releaseDate: string;
  cast: string;
  subtitleFile: string;
};
