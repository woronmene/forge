import type { NavSection } from "@/types/dashboard";

export const navigationSections: NavSection[] = [
  {
    title: "Content",
    items: [
      {
        label: "Upload content",
        href: "/upload",
        icon: "/assets/sidemenu-assets/upload-01.svg",
        activeIcon: "/assets/sidemenu-assets/upload-01.svg",
      },
      {
        label: "Content library",
        href: "/content-library",
        icon: "/assets/sidemenu-assets/content-library.svg",
        activeIcon: "/assets/sidemenu-assets/content-library-blue.svg",
      },
      {
        label: "Series & seasons",
        href: "/series",
        icon: "/assets/sidemenu-assets/series.svg",
        activeIcon: "/assets/sidemenu-assets/series-blue.svg",
      },
      {
        label: "Albums & mixes",
        href: "/albums",
        icon: "/assets/sidemenu-assets/albums.svg",
        activeIcon: "/assets/sidemenu-assets/albums-blue.svg",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Processing queue",
        href: "/processing",
        icon: "/assets/sidemenu-assets/processing.svg",
        activeIcon: "/assets/sidemenu-assets/processing-blue.svg",
        badge: "3",
      },
      {
        label: "Analytics",
        href: "/analytics",
        icon: "/assets/sidemenu-assets/analytics.svg",
        activeIcon: "/assets/sidemenu-assets/analytics-blue.svg",
      },
    ],
  },
  {
    title: "Users",
    items: [
      {
        label: "User directory",
        href: "/users",
        icon: "/assets/sidemenu-assets/user-directory.svg",
        activeIcon: "/assets/sidemenu-assets/user-directory-blue.svg",
        badge: "12.4k",
      },
      {
        label: "Engagement overview",
        href: "/engagement",
        icon: "/assets/sidemenu-assets/engagement.svg",
        activeIcon: "/assets/sidemenu-assets/engagement-blue.svg",
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Wallet activity",
        href: "/wallet",
        icon: "/assets/sidemenu-assets/wallet-activity.svg",
        activeIcon: "/assets/sidemenu-assets/wallet-activity-blue.svg",
      },
    ],
  },
  {
    title: "Social",
    items: [
      {
        label: "Social",
        href: "#",
        icon: "/assets/sidemenu-assets/social.svg",
        disabled: true,
        disabledLabel: "Phase 2",
      },
    ],
  },
];
