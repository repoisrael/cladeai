---
name: markCommonAncestors
description: Add a "common ancestor" flag and lineage support to music tracks.
argument-hint: Track list to flag + desired UI surfaces (feed/search/track page)
---

You are working inside a React + Vite + TypeScript app backed by Supabase (Postgres + RLS). Implement a feature that designates certain tracks as Common Ancestors (foundational roots of a musical lineage graph), and exposes them in the UI and data model.

## Goal

Turn a user-provided list of tracks into Common Ancestors, store that status in the database, and enable:
- Ancestor badges and filtering
- "Descendants of X" exploration
- Future-proof lineage edges between tracks

## Requirements

### 1) Database schema

Create migrations that add:

**A boolean flag on tracks:**
- `tracks.is_common_ancestor boolean not null default false`

**Optional metadata fields (keep minimal but extensible):**
- `tracks.ancestor_type text null` (e.g. `harmony_form | rhythmic_break | bassline_template | modal_loop | song_structure | production_technique`)
- `tracks.ancestor_notes text null` (1–2 sentences, user-facing)

**A lineage edge table for future connections:**
```sql
track_lineage
  ancestor_track_id uuid references tracks(id) on delete cascade
  descendant_track_id uuid references tracks(id) on delete cascade
  lineage_type text not null (e.g. harmony | rhythm | structure | sample)
  confidence_score numeric(3,2) not null default 0.70
  created_at timestamptz not null default now()
  primary key (ancestor_track_id, descendant_track_id)
  indexes on both ids
```

### 2) RLS / security

- Keep tracks readable to everyone (existing behavior)
- `track_lineage`:
  - Read allowed to everyone (or at least authenticated users)
  - Write restricted (admin-only) unless you already have a moderation system
- Ensure no sensitive user data is exposed; this feature is about track metadata only

### 3) Data seeding / upsert

Given a list of tracks with:
- title
- artist (or semi-colon list)
- Optionally: `ancestor_type`, `ancestor_notes`

Implement a robust seeding path that:
- Matches existing tracks by a stable identifier if available (ISRC/provider IDs)
- Otherwise matches conservatively by normalized (title, primary_artist)
- Sets `is_common_ancestor = true` and saves optional metadata
- Does not create duplicates

Output either:
- A SQL seed script (idempotent) OR
- A TS seed routine using Supabase (admin/service role only) OR
- An RPC that accepts a JSON payload and performs the upserts server-side

### 4) API layer (no Supabase calls in JSX)

Add API helpers under `src/api/*`:
- `getCommonAncestors({ limit, query })`
- `getAncestorStatus(trackId)`
- `getDescendants(ancestorTrackId, { limit, cursor })`
- `getAncestorsForTrack(trackId)` (optional, if lineage edges exist)
- `setTrackAsAncestor(trackId, payload)` (admin-only path)

All helpers must be strongly typed.

### 5) UI changes (mobile-first)

Implement minimal, reusable components:
- `CommonAncestorBadge` (small pill, unobtrusive)
- `CommonAncestorSection` (a list module showing ancestors)
- `TrackLineagePanel` (on Track page: "Roots" and "Descendants" sections)

Integrate into:
- **Feed cards**: show badge if `is_common_ancestor`
- **Track detail**: show "Common Ancestor" section with notes and a CTA "Explore descendants"
- **Search**: add a filter toggle "Ancestors only"

### 6) Performance expectations

- Avoid N+1 queries: use batched fetches where possible
- Cache ancestor status and counts client-side (React Query/SWR if already used; otherwise simple memoization + batching)
- Index the DB columns you query frequently (`is_common_ancestor`, lineage foreign keys)

### 7) Deliverables

Provide:
- SQL migration(s)
- API helper file(s)
- UI component file(s)
- Minimal diffs to the affected pages/components (feed/search/track page)
- A short seed mechanism that marks the provided list as ancestors

## Input placeholders

- **Track list**: ${TRACK_LIST}
- **Where to surface UI**: ${SURFACES} (e.g. feed, track page, search)
- **Matching strategy preference**: ${MATCH_STRATEGY} (e.g. isrc-first | provider-id-first | title+artist)

## Implementation constraints

- Production-quality code, minimal dependencies
- Do not hardcode UI strings in many places; keep copy centralized if the app already has a pattern
- Keep the feature extensible for later "WhoSampled-style" connections and harmonic lineage without redesigning the schema

Now implement it end-to-end for the current repo using the project's conventions.
