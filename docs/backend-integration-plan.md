# Forge Backend Integration Plan

## Current state

The frontend currently renders dashboard screens with local mock data from:

- [features/dashboard-data.ts](/Users/woron/Documents/dev/forge/features/dashboard-data.ts)
- [features/uploads/data.tsx](/Users/woron/Documents/dev/forge/features/uploads/data.tsx)
- [features/content-library/data.ts](/Users/woron/Documents/dev/forge/features/content-library/data.ts)

The shared shell and page structure are already in place, but the repo does not yet contain:

- backend base URL configuration
- auth token wiring
- feature service modules
- query key conventions
- request hooks

## Postman findings

The Postman workspace in the `Woron` Chrome profile exposes four relevant service areas:

### 1. Forge Media Service V2

Confirmed endpoint groups:

- service root and health
- upload URL creation for video, audio, image, subtitle
- S3 upload completion endpoints
- batch upload URL creation
- asset list/detail/update/delete
- album create/get/update and track management
- mix create/get/update
- series create/get/update
- season create/update
- episode create/update
- retry processing for audio and video
- internal media summary and catalog summary
- engagement events

### 2. Forge Analytics Service V2

Confirmed endpoint groups:

- service root and health
- media overview
- media overview CSV export
- asset drilldown
- user engagement overview
- user engagement detail
- wallet overview

### 3. Forge User Service V2

Confirmed endpoint groups:

- public user auth:
  - `POST /v1/auth/login`
  - `POST /v1/auth/refresh`
  - `POST /v1/auth/verify-email`
  - `POST /v1/auth/resend-verification`
  - `POST /v1/auth/password-reset`
  - `POST /v1/auth/password-reset/verify`
  - `POST /v1/auth/password-update`
- admin auth:
  - `POST /internal/v1/admin/auth/login`
  - `POST /internal/v1/admin/auth/refresh`
- OpenID discovery:
  - `GET /v1/auth/.well-known/openid-configuration`
  - `GET /v1/auth/.well-known/jwks.json`
- admin user export
- admin user detail
- role update
- status update
- user flag update
- invite admin user
- trigger password reset
- revoke specific session
- revoke all sessions
- user audit
- playback position save/list/delete

There are additional SSO, self-service, avatar, and playback sections that were visible but not yet fully mapped request-by-request.

### 4. Forge Wallet Service V2

Confirmed endpoint groups:

- wrapper root and health
- upstream validation endpoints
- wallet balances and wallet detail lookup
- KYC upgrades and KYC request review
- beneficiaries
- bank list and KYC levels
- scheme provider and scheme setup
- partner and operational wallet setup
- wallet transfers and request-money flows
- transaction detail, validation, authorization, disbursement
- transaction history and export
- notifications
- graph and stats endpoints
- locked-fund flows
- biller catalog endpoints
- airtime, data, electricity, cable TV purchase flows
- biller beneficiaries

## Live verification status

Direct `curl` verification is now more reliable than the in-browser Postman agent for this workspace.

### Verified on June 14, 2026

Environment confirmed in Postman:

- `Forge Admin Service Staging`
- `base_url = https://szpa00qtp4.execute-api.us-east-1.amazonaws.com`

Verified responses:

1. `GET https://szpa00qtp4.execute-api.us-east-1.amazonaws.com/`

```http
HTTP/2 200
{"service":"forge-admin-service","status":"ok"}
```

2. `GET https://szpa00qtp4.execute-api.us-east-1.amazonaws.com/health`

```http
HTTP/2 200
{"status":"ok"}
```

Conclusion:

- the admin staging service is reachable
- the earlier failure was a Postman browser-agent problem, not a backend outage

### What is still unverified live

- media staging base URL
- analytics staging base URL
- user staging base URL
- wallet staging base URL
- java wrapper base URL
- authenticated request flows
- mutation payload acceptance for create/update endpoints

### Auth contract verified on June 14, 2026

Using Postman plus direct `curl` checks against the user service staging URL:

- user login route:
  - `POST https://6z8ym795gc.execute-api.us-east-1.amazonaws.com/v1/auth/login`
  - expects `application/x-www-form-urlencoded`
  - required fields:
    - `username`
    - `password`
- user refresh route:
  - `POST https://6z8ym795gc.execute-api.us-east-1.amazonaws.com/v1/auth/refresh`
  - expects JSON
  - required field:
    - `refresh_token`
- admin login route:
  - `POST https://6z8ym795gc.execute-api.us-east-1.amazonaws.com/internal/v1/admin/auth/login`
  - expects `application/x-www-form-urlencoded`
  - required fields:
    - `username`
    - `password`
- admin refresh route:
  - `POST https://6z8ym795gc.execute-api.us-east-1.amazonaws.com/internal/v1/admin/auth/refresh`
  - expects JSON
  - required field:
    - `refresh_token`
- password reset routes:
  - `POST /v1/auth/password-reset` requires `email`
  - `POST /v1/auth/password-reset/verify` requires `email` and `otp`
  - `POST /v1/auth/password-update` requires `email` and `password`
- email verification routes:
  - `POST /v1/auth/verify-email` requires `email` and `otp`
  - `POST /v1/auth/resend-verification` requires `email`
- OpenID discovery works:
  - issuer: `https://6z8ym795gc.execute-api.us-east-1.amazonaws.com/v1/auth`
  - JWKS endpoint: `https://6z8ym795gc.execute-api.us-east-1.amazonaws.com/v1/auth/.well-known/jwks.json`

## Execution blocker discovered in Postman

The collection was not runnable in the current browser session because:

- Postman had `No environment` selected
- globals existed for `forge_access_token` and `forge_refresh_token`, but both were empty
- requests using variables like `{{base_url}}` were unresolved in the active session
- request execution failed with a Cloud Agent error instead of a backend response

This means the main blocker is currently request setup, not confirmed backend failure.

Postman is still useful as endpoint documentation, but terminal `curl` checks should be treated as the source of truth for service reachability.

## Frontend coverage matrix

### `/upload`

Backend coverage: strong

Available backend surfaces:

- create upload URL for media files
- complete uploaded file registration
- create albums
- create mixes
- create series
- create seasons
- create episodes

Gaps:

- save draft behavior is not yet confirmed
- related content selectors for trailer flows are not yet confirmed
- subtitle replacement UX will need exact payload details
- no auth or session wiring exists yet in the app, so even confirmed upload endpoints cannot be used from the frontend until token handling is added

### `/content-library`

Backend coverage: strong

Available backend surfaces:

- list assets
- list by asset subtype
- get asset
- update asset
- delete asset
- internal media summary
- internal catalog summary

Gaps:

- version history is not yet confirmed
- archive semantics need confirmation against delete or update behavior
- processing details in the drawer may need data combined from asset detail plus retry/status endpoints

### `/series`

Backend coverage: good

Available backend surfaces:

- create series
- get series
- update series
- create season
- update season
- create episode
- update episode

Gaps:

- delete/archive series endpoints were not confirmed
- bulk upload workflow was not confirmed
- per-episode subtitle upload payloads need confirmation
- nested drawer editing may require several chained mutations rather than one save

### `/albums`

Backend coverage: good

Available backend surfaces:

- create album
- get album
- update album
- add track
- reorder tracks
- delete track
- create mix
- get mix
- update mix

Gaps:

- delete/archive endpoints for album and mix were not confirmed
- cue point payload structure needs confirmation
- the current UI shows richer inline editors than the confirmed endpoint inventory guarantees

### `/processing`

Backend coverage: partial

Available backend surfaces:

- retry video processing
- retry audio processing
- asset status from media list/detail endpoints

Gaps:

- no dedicated processing queue endpoint was confirmed
- queue filters and job-level operational metadata are not yet mapped
- this page is the weakest backend match in the current collection review

### `/analytics`

Backend coverage: strong

Available backend surfaces:

- media overview
- asset drilldown
- media overview export CSV

Gaps:

- exact chart breakdown fields still need live sample responses
- export works conceptually, but the frontend still needs date/filter normalization rules from real requests

### `/users`

Backend coverage: moderate

Available backend surfaces:

- user export
- user detail
- status/role/flag mutation
- password reset
- session revocation
- audit log

Gaps:

- richer end-user profile and subscription history fields need confirmation
- drawer tab payloads likely require combining user service and analytics data
- no list-users endpoint is confirmed yet from the current collection notes, only export and detail/admin actions

### `/engagement`

Backend coverage: good

Available backend surfaces:

- user engagement overview
- user engagement detail

Gaps:

- exact DAU/MAU/retention field naming still needs live response validation
- some cards may need computed values from overview payloads rather than direct one-field mappings

### `/wallet`

Backend coverage: broad

Available backend surfaces:

- analytics wallet overview
- wallet service operational and transaction endpoints
- biller and card-adjacent transaction flows
- KYC and beneficiary flows

Gaps:

- some current UI panels may need aggregation across analytics and wallet services
- provider health panel field mapping is not yet confirmed
- card issuance and provider health may not map cleanly to a single confirmed endpoint group

## Authentication impact

The app now has the core admin auth plumbing implemented:

- [app/page.tsx](/Users/woron/Documents/dev/forge/app/page.tsx) is a real admin login screen
- [app/(dashboard)/layout.tsx](/Users/woron/Documents/dev/forge/app/(dashboard)/layout.tsx) is protected by [components/auth-gate.tsx](/Users/woron/Documents/dev/forge/components/auth-gate.tsx)
- [services/auth/index.ts](/Users/woron/Documents/dev/forge/services/auth/index.ts) calls the confirmed admin login and refresh endpoints
- [services/auth/storage.ts](/Users/woron/Documents/dev/forge/services/auth/storage.ts) persists tokens
- [services/api/client.ts](/Users/woron/Documents/dev/forge/services/api/client.ts) injects bearer tokens and retries once on `401` with refresh

What this means:

- protected dashboard queries can now be wired safely from the frontend
- live testing still depends on a real staging admin username and password
- logout, current-session introspection, OTP-specific admin behavior, and any SSO UX are still pending if required by the product

### Likely frontend auth requirements

Based on the collection sections that were visible, the frontend will probably need some subset of:

- admin login endpoint
- OTP request or OTP verify endpoint
- refresh token endpoint
- forgot-password or reset-password request flow
- logout or revoke-session flow
- SSO redirect initiation and callback handling
- current-user or session introspection endpoint

### Important clarification about secrets

The frontend should not contain email-provider, OTP-provider, or backend service secret keys.

The frontend will usually only need:

- public base URLs
- bearer tokens or cookie/session behavior
- public client IDs if SSO is used
- redirect URLs if SSO is used

The backend remains responsible for:

- sending emails
- sending OTPs
- owning secret API keys
- signing tokens or handling secure session state

## Frontend implementation status

### Live backend-backed pages

- `/content-library`
  - live asset list
  - live summary attempts
  - live asset detail query
  - live asset update mutation
- `/analytics`
  - live media overview
  - live asset drilldown
  - export action wired
- `/engagement`
  - live user engagement overview
  - live summary, geography, registration, and retention mapping from backend payloads
- `/wallet`
  - live wallet overview
  - live transaction history
  - export action wired
- `/processing`
  - live media asset list used as the processing source
  - retry-processing wired for audio and video error rows

### Partial but honest backend-backed pages

- `/users`
  - real user lookup by backend user ID
  - live user detail
  - live audit log
  - password reset trigger
  - revoke-all-sessions action
  - full directory table still blocked by missing list endpoint
- `/series`
  - live catalog view of series-related assets from the media asset list
  - explicit readiness notes for series, season, and episode CRUD
  - dedicated nested editor still blocked by missing list-to-entity-detail contract
- `/albums`
  - live catalog view of album and mix assets from the media asset list
  - explicit readiness notes for album, track, and mix endpoints
  - dedicated album or mix editor still blocked by missing list-to-entity-detail contract
- `/upload`
  - backend capability surfaced in the UI
  - final authenticated upload flow intentionally not wired until payload sequencing and file-upload contract are validated

### Still blocked by backend contract gaps

- full user directory list with filters and pagination
- true processing queue telemetry beyond asset status
- nested series drawer hydration from a confirmed list endpoint
- album and mix editor hydration from a confirmed list endpoint
- upload mutation sequencing with real file transfer and post-upload entity creation
- wallet provider health, card issuance, and some finance panels that need more specific endpoints than the shared collection confirmed

## Recommended next integration steps

### Highest-value next steps

1. Obtain staging admin credentials and validate the full login flow end-to-end
2. Confirm one real user ID so `/users` can be tested live
3. Confirm the true list endpoints or entity-ID mapping strategy for series and albums
4. Walk one upload flow in Postman end-to-end with a real file and capture the exact payload sequence

### After those are confirmed

1. Replace the series readiness panel with the real drawer editor
2. Replace the album readiness panel with the real album and mix drawers
3. Turn the upload screen into a fully authenticated presigned-upload flow
4. Decide whether wallet finance panels should be driven from analytics, wallet service, or both on a panel-by-panel basis

## Repo integration shape

Recommended service layout:

```txt
services/
  api/
    client.ts
    config.ts
    query-keys.ts
    types.ts
  uploads/
    index.ts
  content/
    index.ts
  series/
    index.ts
  albums/
    index.ts
  analytics/
    index.ts
  users/
    index.ts
  wallet/
    index.ts
```

Recommended environment variables:

```txt
NEXT_PUBLIC_FORGE_API_BASE_URL=
NEXT_PUBLIC_FORGE_MEDIA_BASE_URL=
NEXT_PUBLIC_FORGE_ANALYTICS_BASE_URL=
NEXT_PUBLIC_FORGE_USER_BASE_URL=
NEXT_PUBLIC_FORGE_WALLET_BASE_URL=
NEXT_PUBLIC_FORGE_JAVA_BASE_URL=
```

If the backend expects authenticated requests from the dashboard, add a token provider before wiring page queries.

Additional likely frontend auth configuration if applicable:

```txt
NEXT_PUBLIC_FORGE_AUTH_BASE_URL=
NEXT_PUBLIC_FORGE_SSO_CLIENT_ID=
NEXT_PUBLIC_FORGE_SSO_REDIRECT_URI=
```

## Immediate next implementation steps

1. Confirm the environment variable names and real base URLs from the backend owner or exported Postman environment.
2. Confirm how auth should be supplied in the dashboard.
3. Confirm whether admin login, OTP, refresh, logout, and SSO are all in scope for this frontend.
4. Replace content library mock data with service calls first.
5. Add analytics and engagement queries next.
6. Add live user directory and user drawer detail fetches.

## What we still need from the backend side

### Required to proceed safely

- actual values for:
  - `NEXT_PUBLIC_FORGE_API_BASE_URL`
  - `NEXT_PUBLIC_FORGE_MEDIA_BASE_URL`
  - `NEXT_PUBLIC_FORGE_ANALYTICS_BASE_URL`
  - `NEXT_PUBLIC_FORGE_USER_BASE_URL`
  - `NEXT_PUBLIC_FORGE_WALLET_BASE_URL`
  - `NEXT_PUBLIC_FORGE_JAVA_BASE_URL`
- the real auth flow for the admin dashboard
- whether auth is bearer-token based, cookie based, or SSO based
- one working staging credential set or a documented login flow

### Needed to finish the richer pages

- sample response payloads for analytics overview and drilldown
- sample response payloads for user detail and engagement detail
- exact upload request and completion payload examples
- archive/delete behavior for content entities
- processing queue endpoint confirmation
- wallet provider health field mapping

## Important assumptions

- The media service powers content, series, albums, mixes, and upload registration.
- The analytics service powers analytics, engagement, and wallet summary reporting.
- The wallet service powers operational wallet actions, transaction detail, and biller flows.
- Some current UI panels will require combining multiple services rather than a one-page-to-one-endpoint mapping.
