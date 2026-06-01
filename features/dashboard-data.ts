export const seriesRows = [
  { id: "ser_1", title: "Kings of Lagos", subtitle: "3 seasons • 8 episodes", genre: "Drama", seasons: 3, episodes: 8, status: "Ready", dateAdded: "10 Apr 2026", swatch: "#2F2B68" },
  { id: "ser_2", title: "Jollof Dreams", subtitle: "2 seasons • 4 episodes", genre: "Comedy", seasons: 2, episodes: 4, status: "Ready", dateAdded: "11 Apr 2026", swatch: "#3A2058" },
  { id: "ser_3", title: "Lagos After Dark", subtitle: "1 season • 3 episodes", genre: "Thriller", seasons: 1, episodes: 3, status: "Ready", dateAdded: "16 Apr 2026", swatch: "#101827" },
  { id: "ser_4", title: "Nairobi Nights", subtitle: "1 season • 8 episodes", genre: "Romance", seasons: 1, episodes: 8, status: "Ready", dateAdded: "13 Apr 2026", swatch: "#173E74" },
  { id: "ser_5", title: "Accra Stories", subtitle: "3 seasons • 3 episodes", genre: "Action", seasons: 3, episodes: 3, status: "Ready", dateAdded: "10 Apr 2026", swatch: "#183216" },
  { id: "ser_6", title: "Street Pulse", subtitle: "1 seasons • 2 episodes", genre: "Action", seasons: 1, episodes: 2, status: "Ready", dateAdded: "17 Apr 2026", swatch: "#3B1F1E" },
] as const;

export const seriesDrawer = {
  title: "Lagos After Dark",
  seasons: [
    {
      name: "Season 1",
      episodes: 8,
      expanded: true,
      items: [
        { code: "E01", title: "Pilot", runtime: "44m 12 s", status: "Ready" },
        { code: "E02", title: "The Deal", runtime: "24m 12 s", status: "Ready" },
        { code: "E03", title: "Disappearance", runtime: "55m 20s", status: "Ready" },
      ],
    },
    {
      name: "Season 2",
      episodes: 4,
      expanded: false,
      items: [],
    },
  ],
};

export const albumRows = [
  { id: "alb_1", title: "Motherland", subtitle: "Burna Boy • 52m", type: "Album", genre: "Afropop", tracks: "14 tracks", status: "Ready", dateAdded: "10 Apr 2026", swatch: "#7F419C", tone: "purple" },
  { id: "alb_2", title: "Afrobeats Vibes Vol.3", subtitle: "DJ Spinall • 1h 12 m", type: "DJ Mix", genre: "Afrobeats", tracks: "1 file", status: "Ready", dateAdded: "11 Apr 2026", swatch: "#B91F1F", tone: "cyan" },
  { id: "alb_3", title: "A Good Time", subtitle: "Davido • 58m", type: "Album", genre: "Afrobeats", tracks: "17 tracks", status: "Ready", dateAdded: "16 Apr 2026", swatch: "#2F5ABB", tone: "purple" },
  { id: "alb_4", title: "Amapiano Sundays", subtitle: "DJ Maphorisa • 58m", type: "DJ Mix", genre: "Amapiano", tracks: "1 file", status: "Ready", dateAdded: "13 Apr 2026", swatch: "#15325F", tone: "cyan" },
  { id: "alb_5", title: "Highlife Reborn", subtitle: "Various Artists • 41m", type: "Album", genre: "Highlife", tracks: "9 tracks", status: "Ready", dateAdded: "10 Apr 2026", swatch: "#0E7311", tone: "purple" },
  { id: "alb_6", title: "Made in Lagos", subtitle: "Wizkid • 55m", type: "Album", genre: "Afropop", tracks: "14 tracks", status: "Ready", dateAdded: "17 Apr 2026", swatch: "#BDAA03", tone: "purple" },
] as const;

export const processingRows = [
  { title: "Motherland", subtitle: "Burna Boy • 52m", type: "Album", typeTone: "purple", status: "Ready", date: "10 Apr 2026", swatch: "#7F419C" },
  { title: "Afrobeats Vibes Vol.3", subtitle: "DJ Spinall • 1h 12 m", type: "DJ Mix", typeTone: "cyan", status: "Queued", date: "11 Apr 2026", swatch: "#B91F1F" },
  { title: "A Good Time", subtitle: "Davido • 58m", type: "Album", typeTone: "purple", status: "Queued", date: "16 Apr 2026", swatch: "#2F5ABB" },
  { title: "Amapiano Sundays", subtitle: "DJ Maphorisa • 58m", type: "DJ Mix", typeTone: "cyan", status: "Processing", date: "13 Apr 2026", swatch: "#15325F" },
  { title: "Highlife Reborn", subtitle: "Various Artists • 41m", type: "Album", typeTone: "purple", status: "Ready", date: "10 Apr 2026", swatch: "#0E7311" },
  { title: "Made in Lagos", subtitle: "Wizkid • 55m", type: "Album", typeTone: "purple", status: "Error", date: "17 Apr 2026", swatch: "#BDAA03" },
] as const;

export const analyticsSummary = [
  { label: "Total views", value: "2.4M", helper: "↑ 12% vs prev period", tone: "positive" },
  { label: "Unique viewers", value: "184K", helper: "↑ 8% vs prev period", tone: "positive" },
  { label: "Avg watch time", value: "38m", helper: "↑ 4% vs prev period", tone: "positive" },
  { label: "Completion rate", value: "61%", helper: "− 12% vs prev period", tone: "neutral" },
  { label: "Likes", value: "47.2K", helper: "↑ 21% vs prev period", tone: "positive" },
  { label: "Saves", value: "29.8K", helper: "↓ 3% vs prev period", tone: "negative" },
] as const;

export const analyticsCountries = [
  { flag: "🇳🇬", country: "Nigeria", subtitle: "891K views", share: 45 },
  { flag: "🇬🇧", country: "United Kingdom", subtitle: "504K views", share: 30 },
  { flag: "🇬🇭", country: "Ghana", subtitle: "216K views", share: 9 },
] as const;

export const analyticsTable = [
  { title: "Motherland", subtitle: "Burna Boy • 52m", type: "Album", views: "412K", likes: "9.2k", completion: 88, swatch: "#7F419C", tone: "purple" },
  { title: "Made in Lagos", subtitle: "Wizkid • 55m", type: "Album", views: "388k", likes: "7.8k", completion: 89, swatch: "#857C00", tone: "purple" },
  { title: "A Good Time", subtitle: "Davido • 58m", type: "Album", views: "301k", likes: "6.1k", completion: 90, swatch: "#2C4EA6", tone: "purple" },
  { title: "Highlife Reborn", subtitle: "Various Artists • 41m", type: "Album", views: "274k", likes: "5.4k", completion: 50, swatch: "#0B6D0D", tone: "purple" },
  { title: "Afrobeats Vibes Vol.3", subtitle: "DJ Spinall • 1h 12 m", type: "DJ Mix", views: "198k", likes: "4.7k", completion: 45, swatch: "#A61B1B", tone: "cyan" },
] as const;

export const analyticsDrawerDetails = {
  title: "Motherland",
  subtitle: "Burna Boy",
  tabs: ["Overview", "Geography", "Details"],
};

export const userSummary = [
  { label: "Total users", value: "12,418", helper: "↑ 8% this month", tone: "positive" },
  { label: "Active", value: "10,842", helper: "87% of total", tone: "neutral" },
  { label: "Suspended", value: "314", helper: "↑ 12 this week", tone: "negative" },
  { label: "Premium users", value: "3,204", helper: "↑ 15% this month", tone: "positive" },
] as const;

export const userRows = [
  { initials: "AO", color: "#101827", name: "Amara Okonkwo", email: "amara.o@gmail.com", registered: "12 Jan 2026", country: "Nigeria", flag: "🇳🇬", tier: "Premium", status: "Active", lastActive: "2h ago" },
  { initials: "JA", color: "#27285D", name: "James Adeyemi", email: "j.adeyemi@yahoo.com", registered: "08 Feb 2026", country: "United Kingdom", flag: "🇬🇧", tier: "Premium", status: "Active", lastActive: "1d ago" },
  { initials: "CE", color: "#215AAE", name: "Chisom Eze", email: "chisom.eze@outlook.com", registered: "22 Mar 2026", country: "Nigeria", flag: "🇳🇬", tier: "Basic", status: "Active", lastActive: "3h ago" },
  { initials: "SM", color: "#458646", name: "Sarah Mensah", email: "s.mensah@gmail.com", registered: "04 Jan 2026", country: "Ghana", flag: "🇬🇭", tier: "Basic", status: "Active", lastActive: "5h ago" },
  { initials: "KA", color: "#7540EA", name: "Kwame Asante", email: "kwame.a@hotmail.com", registered: "17 Feb 2026", country: "Ghana", flag: "🇬🇭", tier: "Premium", status: "Active", lastActive: "14d ago" },
  { initials: "TA", color: "#E78402", name: "Tolu Adebayo", email: "tolu.adebayo@gmail.com", registered: "29 Mar 2026", country: "Nigeria", flag: "🇳🇬", tier: "Premium", status: "Active", lastActive: "Just now" },
  { initials: "PN", color: "#1792BA", name: "Priya Naidoo", email: "j.adeyemi@yahoo.com", registered: "11 Dec 2025", country: "South Africa", flag: "🇿🇦", tier: "Premium", status: "Suspended", lastActive: "6h ago" },
  { initials: "AO", color: "#342A9C", name: "Ademide Odeku", email: "j.adeyemi@yahoo.com", registered: "11 Sep 2025", country: "Nigeria", flag: "🇳🇬", tier: "Basic", status: "Suspended", lastActive: "16h ago" },
] as const;

export const engagementSummary = [
  { label: "Daily Active Users (DAU)", value: "3,842", helper: "↑ 6% vs prev period", tone: "positive" },
  { label: "Monthly Active Users (MAU)", value: "10,842", helper: "↑ 8% vs prev period", tone: "positive" },
  { label: "New Registrations", value: "1,248", helper: "↑ 11% vs prev period", tone: "positive" },
] as const;

export const walletSummary = [
  { label: "Transaction volume", value: "₦284M", helper: "↑ 14% vs prev period", tone: "positive" },
  { label: "Transaction count", value: "4,218", helper: "↑ 9% vs prev period", tone: "positive" },
  { label: "Avg transaction size", value: "₦67,340", helper: "– stable vs prev period", tone: "neutral" },
  { label: "Failure / error rate", value: "2.4%", helper: "↑ 0.3% vs prev period", tone: "negative" },
] as const;

export const walletTransactions = [
  { user: "USR_001", type: "Bill Pay", amount: "₦45,000", date: "06 May 2026, 09:14", status: "Success", reference: "TXN-8821A", tone: "purple" },
  { user: "USR_002", type: "Remittance", amount: "₦120,000", date: "06 May 2026, 08:52", status: "Success", reference: "TXN-8820B", tone: "blue" },
  { user: "USR_003", type: "Card", amount: "₦8,500", date: "06 May 2026, 08:30", status: "Success", reference: "TXN-8819C", tone: "cyan" },
  { user: "USR_004", type: "Remittance", amount: "₦32,000", date: "06 May 2026, 07:44", status: "Success", reference: "TXN-8818A", tone: "blue" },
  { user: "USR_005", type: "Bill Pay", amount: "₦250,000", date: "05 May 2026, 22:18", status: "Success", reference: "TXN-8817B", tone: "purple" },
  { user: "USR_006", type: "Bill Pay", amount: "₦15,200", date: "05 May 2026, 21:55", status: "Failed", reference: "TXN-8816C", tone: "purple" },
  { user: "USR_007", type: "Card", amount: "₦60,000", date: "05 May 2026, 20:32", status: "Pending", reference: "TXN-8815A", tone: "cyan" },
  { user: "USR_008", type: "Remittance", amount: "₦180,000", date: "05 May 2026, 19:10", status: "Failed", reference: "TXN-8814B", tone: "blue" },
] as const;

