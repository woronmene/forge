# AGENTS.md

This file is the canonical build guide for Forge.

Any engineer or agent working in this repository should follow it before making architecture, UI, or implementation decisions.

---

# Mission

Build a production-quality media operations dashboard frontend in Next.js that matches the provided dashboard designs in `forge_screens/` as closely as possible.

The backend already exists.

This project is frontend-only.

Do not invent backend logic inside the app.

The product should feel:

- premium
- operational
- fast
- clean
- highly structured
- desktop-first but still responsive

---

# Product Understanding

Forge is an admin and operator dashboard for media operations.

The platform supports:

- uploading movies
- uploading series episodes
- uploading albums
- uploading DJ mixes
- uploading trailers
- uploading subtitles
- managing content metadata
- managing content availability and access tier
- reviewing processing states
- monitoring analytics
- managing users
- reviewing engagement metrics
- reviewing wallet and transaction activity

The designs show a real product system, not isolated pages.

There is one shared dashboard shell and several modules built on top of repeated UI patterns:

- left navigation
- page headers
- metric cards
- filter toolbars
- dense operational tables
- right-side drawers
- upload surfaces
- status badges
- charts
- pagination

Do not implement these patterns separately for each page if they can be shared cleanly.

---

# Source Of Truth

When building features, use these sources in this order:

1. `forge_screens/` for layout, spacing, hierarchy, and workflow behavior
2. this `AGENTS.md` for architecture and implementation standards
3. the existing theme tokens in `theme/` and global styles in `app/`

If the implementation and the screenshots diverge, the screenshots win unless the user says otherwise.

Do not simplify a screen because it feels repetitive.

---

# Tech Stack

Use this stack:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- TanStack Query
- Axios
- React Hook Form
- Zod
- Framer Motion
- Lucide React
- next-themes

Optional libraries when needed:

- react-dropzone
- dnd-kit
- recharts

Do not add major libraries unless there is a clear need.

---

# Design System Baseline

The repository already contains early design tokens in:

- `theme/colors.css`
- `theme/typography.css`
- `theme/fonts.css`
- `theme/tokens.ts`
- `app/globals.css`
- `app/utilities.css`

Preserve and extend this foundation rather than bypassing it.

Use tokens and shared primitives instead of hardcoding one-off values repeatedly.

Important visual characteristics from the screens:

- white page backgrounds
- soft gray borders
- subtle panel separation
- compact operational spacing
- restrained shadows
- rounded cards and inputs
- blue primary accents
- colored semantic badges for statuses and tiers
- quiet typography with strong alignment

---

# Dashboard Modules

The dashboard contains these primary modules.

## Content

- Upload content
- Content library
- Series and seasons
- Albums and mixes

## Operations

- Processing queue
- Analytics

## Users

- User directory
- Engagement overview

## Finance

- Wallet activity

## Disabled / deferred section

- Social

The `Social` item appears visually disabled in the screenshots.

Do not build it as an active module unless the user asks.

---

# Route Map

Use App Router and structure routes around the visible modules.

Recommended route structure:

```txt
app/
  (dashboard)/
    layout.tsx
    upload/page.tsx
    content-library/page.tsx
    series/page.tsx
    albums/page.tsx
    processing/page.tsx
    analytics/page.tsx
    users/page.tsx
    engagement/page.tsx
    wallet/page.tsx
```

The shared dashboard shell belongs in the `(dashboard)` layout.

Do not duplicate navigation, spacing, or shell chrome inside page implementations.

---

# Repository Structure

Use this structure unless there is a strong reason not to:

```txt
app/
components/
features/
hooks/
lib/
services/
store/
types/
constants/
assets/
```

Feature-first organization is required for domain logic.

Recommended feature structure:

```txt
features/
  uploads/
    components/
    hooks/
    services/
    state/
    types/
    validation/
  content-library/
    components/
    hooks/
    types/
  series/
    components/
    hooks/
    state/
    types/
  albums/
    components/
    hooks/
    state/
    types/
  processing/
    components/
    hooks/
    types/
  analytics/
    components/
    hooks/
    types/
  users/
    components/
    hooks/
    types/
  engagement/
    components/
    hooks/
    types/
  wallet/
    components/
    hooks/
    types/
```

Use `components/` at the root for shared cross-feature primitives only.

Examples of shared root components:

- dashboard shell pieces
- table primitives
- drawer primitives
- generic cards
- generic chart wrappers
- badges
- shared form controls

Keep domain-specific UI inside its feature folder.

---

# Shared UI Inventory

These shared components should exist early because most pages depend on them:

## Shell

- `DashboardShell`
- `SidebarNav`
- `SidebarSection`
- `SidebarUserCard`
- `DashboardTopbar`
- `PageHeader`
- `PageSection`

## Surfaces

- `MetricCard`
- `SectionCard`
- `EmptyState`
- `LoadingSkeleton`
- `StatusBadge`
- `TypeBadge`
- `TierBadge`

## Table System

- `DataTable`
- `DataTableToolbar`
- `DataTableSearch`
- `DataTableFilters`
- `DataTablePagination`
- `TableRowAction`

## Drawer System

- `RightDrawer`
- `DrawerHeader`
- `DrawerTabs`
- `DrawerFooterActions`

## Form System

- `FormField`
- `FormSection`
- `SelectField`
- `DateField`
- `TextareaField`
- `InlineValidationMessage`

## Upload System

- `UploadDropzone`
- `UploadedFileCard`
- `FileProgressRow`
- `FileReplaceAction`
- `ImageUploadCard`
- `SubtitleUploadList`

## Chart System

- `ChartCard`
- `BarChartPanel`
- `DistributionList`
- `LegendStat`

Build these primitives with composability in mind.

Do not make them so abstract that they become hard to read.

---

# Page-By-Page Implementation Roadmap

This is the concrete implementation roadmap for the current design set.

## Phase 1: Foundation

Build these first:

- dashboard layout
- sidebar navigation
- page container
- shared cards
- shared badge styles
- table system
- right drawer
- form field primitives
- query provider
- API client
- Zustand UI stores

Without this foundation, the module pages will become inconsistent.

## Page 1: Upload Content

This is the highest-priority feature because it defines the upload UI system and several reusable form patterns.

Route:

- `/upload`

Primary screen responsibilities:

- content type selector
- empty upload state
- uploaded file state
- progress state
- validation state
- save draft action
- start processing action

The designs show five upload variants:

- movie
- series
- album
- DJ mix
- trailer

### Upload page shared components

- `UploadTypeTabs`
- `UploadDropzone`
- `UploadedFileCard`
- `UploadSidebarMediaCard`
- `AccessVisibilityCard`
- `RequiredFieldsNotice`
- `UploadActionBar`

### Movie form sections

- uploaded file
- movie details
- thumbnail
- trailer URL
- access and visibility
- subtitles

### Series form sections

- uploaded file
- series details
- season selector
- episode number
- episode title
- description
- metadata
- thumbnail
- trailer URL
- access and visibility
- subtitles

### Album form sections

- album details
- cover art
- access and visibility
- track list editor

### DJ mix form sections

- uploaded file
- mix details
- cover art
- track listing / cue points
- access and visibility

### Trailer form sections

- uploaded file
- trailer details
- related content selector
- thumbnail
- access and visibility
- subtitles

### Upload architecture rules

- one upload route with type switching
- separate Zod schema per content type
- separate default form values per content type
- shared upload state store for local in-progress files and progress
- API upload logic inside `services/uploads/`
- type-specific adapters to shape payloads before submission

## Page 2: Content Library

Route:

- `/content-library`

Core UI:

- summary cards by asset type
- toolbar with search and filters
- content table
- pagination
- warning banner for processing errors
- right drawer asset editor

### Required components

- `LibrarySummaryCards`
- `LibraryToolbar`
- `ContentLibraryTable`
- `ContentAssetDrawer`
- `VersionHistoryList`
- `ProcessingStatusPanel`

### Drawer responsibilities

- editable metadata
- subtitle replacement
- subscription tier
- visibility
- processing status
- version history
- archive action

Use the shared drawer system.

Do not create a custom modal for this screen.

## Page 3: Series And Seasons

Route:

- `/series`

Core UI:

- searchable/filterable series table
- season and episode counts
- right drawer series editor
- expandable season blocks inside the drawer
- add season
- add episode
- bulk upload
- subtitle upload per episode

### Required components

- `SeriesTable`
- `SeriesDrawer`
- `SeasonAccordion`
- `EpisodeRow`
- `AddEpisodeInlineForm`
- `EpisodeSubtitleUpload`

### Series drawer responsibilities

- series metadata editing
- list of seasons
- list of episodes within seasons
- add season flow
- add episode flow
- bulk upload entry point
- archive series action

The drawer is a major workflow surface, not a simple detail viewer.

## Page 4: Albums And Mixes

Route:

- `/albums`

Core UI:

- searchable/filterable album and mix table
- track counts
- right drawer editing

### Required components

- `AlbumsTable`
- `AlbumDrawer`
- `MixDrawer`
- `TrackListEditor`
- `CuePointEditor`
- `AlbumCoverUploader`

### Album drawer responsibilities

- album metadata
- track list management
- album cover upload
- artist fields
- access tier
- visibility
- archive action

### Mix drawer responsibilities

- cue point list
- inline cue point add/edit
- cover art
- source mix file
- artist / DJ metadata
- access tier
- visibility

Album and mix screens should share as much list infrastructure as practical while keeping editors distinct.

## Page 5: Processing Queue

Route:

- `/processing`

Core UI:

- searchable table
- status filtering
- retry failed job action
- operational status visibility

### Required components

- `ProcessingToolbar`
- `ProcessingQueueTable`
- `RetryProcessingAction`

This page should feel lightweight and operational.

Avoid decorative UI.

## Page 6: Analytics

Route:

- `/analytics`

Core UI:

- time range switcher
- KPI cards
- main performance chart
- geography panel
- top content table
- asset analytics drawer

### Required components

- `AnalyticsOverviewCards`
- `ViewsOverTimeChart`
- `ViewerGeographyCard`
- `TopContentPerformanceTable`
- `AssetAnalyticsDrawer`
- `AssetAnalyticsOverviewTab`
- `AssetAnalyticsGeographyTab`
- `AssetAnalyticsDetailsTab`

### Drawer tab responsibilities

- `Overview`: top metrics and country performance
- `Geography`: country breakdown table
- `Details`: asset metadata and readiness details

Prefer Recharts for charts if the visual complexity requires it.

## Page 7: User Directory

Route:

- `/users`

Core UI:

- KPI cards
- search
- filters
- dense user table
- right drawer with tabs

### Required components

- `UserSummaryCards`
- `UserDirectoryToolbar`
- `UserDirectoryTable`
- `UserProfileDrawer`
- `UserProfileTab`
- `UserEngagementTab`
- `UserSubscriptionTab`
- `UserAuditLogTab`

### Drawer responsibilities

- account details
- location and device info
- app version
- last activity
- engagement metrics
- watched / liked / saved content
- subscription history
- payment history
- audit events
- reset password
- change tier
- suspend account

## Page 8: Engagement Overview

Route:

- `/engagement`

Core UI:

- time range switcher
- daily active users
- monthly active users
- registrations
- retention overview
- geographic distribution

### Required components

- `EngagementSummaryCards`
- `ActiveUsersChart`
- `RegistrationStatsCard`
- `RetentionCard`
- `EngagementGeographyCard`

This page is a focused analytics page for users rather than content.

## Page 9: Wallet Activity

Route:

- `/wallet`

Core UI:

- period switcher
- finance KPI cards
- breakdown statistics
- geographic distribution
- sender vs recipient summary
- card issuance summary
- transaction table
- provider health status panel

### Required components

- `WalletSummaryCards`
- `WalletBreakdownPanel`
- `WalletGeographyPanel`
- `WalletTransactionTable`
- `ProviderStatusPanel`
- `CardIssuedStatsCard`

This page is denser than most other pages.

It should still remain visually calm and readable.

---

# Implementation Order

Follow this order unless the user explicitly changes priorities.

1. Install and configure the missing frontend stack
2. Create the shared dashboard shell
3. Build shared primitives for cards, tables, badges, drawers, and forms
4. Build the upload module
5. Build content library
6. Build series and seasons
7. Build albums and mixes
8. Build processing queue
9. Build analytics
10. Build user directory
11. Build engagement overview
12. Build wallet activity
13. Add polish, empty states, loading states, and responsive fixes

Reason:

- uploads define the form and media patterns
- content pages reuse the same table and drawer foundations
- analytics and finance depend on mature chart and dense layout primitives

---

# API Rules

Use Axios for API communication.

Centralize API logic inside `services/`.

Do not place API calls directly inside page or presentational components.

Recommended structure:

```txt
services/
  api/
    client.ts
    config.ts
  uploads/
  content/
  series/
  albums/
  analytics/
  users/
  wallet/
```

Use TanStack Query for:

- fetching
- caching
- mutations
- invalidation
- loading states
- optimistic refresh flows where appropriate

Guidelines:

- query keys must be centralized and predictable
- mutations should invalidate only the affected domains
- page tables should support server-driven pagination and filters if the backend provides them
- detail drawers should fetch item detail separately from list queries when needed

---

# State Management Rules

Use TanStack Query for server state.

Use Zustand only for frontend UI state such as:

- sidebar collapse state
- open drawer identity
- local filter panel visibility
- upload draft state
- in-progress local files
- transient success or error banners

Do not duplicate API response data in Zustand unless there is a very specific UI reason.

Recommended stores:

- `ui-store.ts`
- `drawer-store.ts`
- `upload-store.ts`
- `filter-store.ts`

---

# Forms And Validation

Use React Hook Form and Zod for all non-trivial forms.

All forms must support:

- required-field validation
- disabled states
- loading states
- server error handling
- clear non-technical validation messages
- save draft behavior where the flow shows it

Guidelines:

- create one schema per content type for uploads
- share field components, not giant shared form files
- use inline help and warning cards where the designs show them
- keep labels, placeholders, and helper copy close to the screenshots

---

# Table Rules

Tables are a core product surface.

Every major table should support the behaviors shown in design where applicable:

- search
- filters
- pagination
- status badges
- row hover states
- row click or action click into a drawer
- clean overflow handling

Tables must remain readable even when dense.

Prioritize:

- fixed alignment
- strong column rhythm
- low visual noise
- predictable badge placement

---

# Drawer Rules

Right-side drawers are a primary interaction model in this product.

Drawers should be used for:

- asset editing
- series management
- analytics detail inspection
- user profile management
- album and mix editing

Guidelines:

- use a shared drawer shell
- support sticky header and sticky footer actions when helpful
- support tabbed content when shown in designs
- animate lightly with Framer Motion
- preserve form state safely during editing

Do not replace drawers with full-screen pages unless the user asks.

---

# Styling Rules

Use Tailwind CSS and shadcn/ui.

Avoid large inline styles.

Use reusable utility patterns and shared primitives.

Keep consistency across:

- paddings
- card spacing
- typography
- border radii
- badges
- form field heights
- table row height
- drawer spacing

Do not guess at visual hierarchy.

Match the screenshots closely.

---

# Next.js Rules

Use App Router.

Prefer Server Components for route scaffolding and static layout.

Use Client Components only where interactivity is required.

Client Components are expected for:

- forms
- uploads
- search
- filters
- drawers
- interactive tables
- charts
- tabs
- animations

Do not force entire pages to be client components if only a subsection needs client behavior.

---

# Performance Rules

Optimize carefully because the product is table-heavy and dashboard-heavy.

Guidelines:

- avoid unnecessary rerenders
- split large interactive sections into focused client components
- prefer pagination for dense tables
- consider virtualization only if necessary
- lazy load heavy charts or secondary drawers if the screen becomes expensive

Do not optimize prematurely at the cost of readability.

---

# Accessibility Rules

Support accessibility as part of the default implementation.

Use:

- semantic HTML
- accessible button labels
- keyboard-friendly drawer interactions
- visible focus states
- form labels and descriptions
- table semantics where appropriate

Do not ship inaccessible custom controls if a simpler accessible structure will work.

---

# TypeScript Rules

Use strict TypeScript.

Avoid `any`.

Prefer readable, domain-oriented types.

Create shared types where they are reused across modules, but do not centralize every type too early.

Good candidates for shared types:

- asset status
- subscription tier
- visibility state
- media type
- pagination payloads
- common API response wrappers

---

# Code Simplicity Rules

Avoid overengineering.

Prefer practical abstractions that support repeated UI patterns already visible in the designs.

Do not create a giant generic system too early.

Good rule:

- share patterns that clearly repeat
- keep domain logic close to the feature that owns it

---

# Feature Delivery Checklist

Before implementing a feature:

1. Review the relevant `forge_screens/` images
2. Identify shared components that should be reused
3. Identify route, feature, API, and state touchpoints
4. Confirm whether the UI belongs in a drawer, page, or table action

Before finishing a feature:

1. Verify the screen matches the design closely
2. Verify loading, empty, and error states
3. Verify keyboard and focus behavior for core interactions
4. Run `npm run lint`
5. Run `npm run typecheck`
6. Fix issues before considering the task complete

---

# Communication Style

When reporting work, be concise and practical.

Explain:

- what changed
- which files changed
- how to test it
- any gaps or assumptions

Avoid unnecessary long explanations unless the user asks for depth.

---

# Final Reminder

This repository should evolve into a cohesive dashboard system.

Do not treat each screen as a disconnected mockup.

Build shared foundations first, then compose feature modules on top of them.

Always:

- read this file first
- review the relevant design screenshots
- follow existing patterns when they are good
- improve patterns when the current codebase is only a placeholder
- keep the UI polished
- keep the architecture maintainable
- keep the behavior faithful to the product shown in `forge_screens/`
