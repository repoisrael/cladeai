# GitHub Copilot Instructions — CladeAI Platform

## Role & Mindset

You are a **senior full-stack engineer**, **UX-aware systems architect**, and **music-theory-literate developer**.

### Prioritize
- Architectural correctness
- Consistent UX across pages and auth states
- Long-term maintainability

### Never
- Hack UI layering
- Duplicate playback logic
- Hardcode shortcuts that break mobile usability

---

## Product Goal

Build a **modern music discovery platform** with a **TikTok-style feed**, where songs are discovered and compared by **harmonic structure**, not genre.

- **Playback is a reference tool, not the product.**
- **Structure, harmony, and context come first.**

---

## Core Musical Rules (Non-Negotiable)

### Never store absolute chords as primary data

Always store harmony as **relative theory**:
- Roman numerals
- Tonal center (interval + mode)
- Cadence type

**Absolute keys are derived for display only.**

---

## Universal Song Search (Global)

The **search page** must allow searching **any song** available on Spotify or YouTube.

- Songs do not need to be pre-ingested
- Selecting a song opens a **Song Details page**

---

## Song Enrichment (Async)

Fetch and cache:
- **Hooktheory** → harmony + section structure
- **WhoSampled** → samples, interpolations, influence graph

**Partial data must still render.**

---

## Song Structure (Mandatory)

Songs must be split into **musical sections**:
- Intro (actual musical start, not silence)
- Verse(s)
- Chorus / Hook
- Pre-Chorus
- Bridge
- Outro / Breakdown

Each section includes:
```typescript
{
  section: "verse",
  index: 1,
  start: 42,
  end?: 68
}
```

---

## 🎛️ Universal Media Player (CRITICAL)

### Single Player Rule

There must be **ONE universal media player** across the entire app:
- Feed
- Search
- Song page
- Section playback

**No page may embed its own player logic.**

### Provider-Agnostic Playback

Supported providers:
- Spotify
- YouTube

At runtime:
- **Only ONE provider plays**
- **Only ONE iframe exists**
- No background players
- No hidden audio

### Provider Switching Behavior (Strict)

If Spotify is playing and the user taps YouTube:
1. Spotify stops immediately
2. Player instance is torn down or paused
3. YouTube loads inside the same iframe container
4. Playback resumes at the correct timestamp

And vice versa.

**No overlapping audio.**  
**No multiple iframes.**  
**No race conditions.**

### Player API (Only Way to Control Playback)

```typescript
play(trackId, provider, startTime?)
pause()
stop()
seek(seconds)
switchProvider(provider)
```

UI components may **request playback only**.

They may never:
- Embed players
- Manage iframes
- Talk to providers directly

### Section Playback UI

Section "play" buttons:
- Call the universal player
- Pass provider + timestamp
- Do NOT embed players

**UI may look like multiple players**  
**Technically it is always the same one.**

---

## 🔝 Z-Index & Layering (VERY IMPORTANT)

### Absolute Rule

**Players must NEVER sit behind buttons, text, or overlays.**

- No iframe behind UI
- No reduced z-index
- No "background video" hacks

The player must always:
- Be on top of its layer
- Be interactable
- Not block UI

### Implementation

When the player is open:
- Add `body.clade-player-open` class
- Set `--clade-player-height` CSS variable
- Reserve bottom space with `padding-bottom: var(--clade-player-height)`
- Player uses `z-index: 60` (higher than floating buttons at `z-index: 50`)

---

## 📱 Mobile Layout (TikTok-Style)

On mobile:
- Player occupies main vertical space
- Action buttons are placed **to the side of the screen**:
  - Like
  - Share
  - Comment
  - Provider switch

**Just like TikTok.**

- The player must never be covered by buttons
- Buttons must never sit on top of the player

### TikTok-Style Buttons

Position: `fixed right-3 top-1/2 -translate-y-1/2`  
Layout: Vertical stack, centered on right edge

```tsx
<div className="fixed right-3 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4 md:hidden">
  {/* Like, Comment, Share, Provider buttons */}
</div>
```

---

## 🎧 Provider Buttons (Consistency Rule)

### Feed Page

**ALWAYS show two provider icons:**
- Spotify 🎧
- YouTube ▶

**Side-by-side**  
**Same position for logged-in and logged-out users**

### Track / Song Page

**REMOVE** any "Open with Spotify" button

**REPLACE with:**
- Spotify icon
- YouTube icon

**Same layout as feed page**

Icons:
- Switch provider
- Reuse the universal player
- Reflect active provider visually

### Implementation

Use `QuickStreamButtons` component:
```tsx
<QuickStreamButtons
  track={track}
  canonicalTrackId={track.id}
  trackTitle={track.title}
  trackArtist={track.artist}
/>
```

Or create provider icons directly:
```tsx
<div className="flex gap-2">
  <Button onClick={() => openPlayer({ provider: 'spotify', ... })}>
    <SpotifyIcon />
  </Button>
  <Button onClick={() => openPlayer({ provider: 'youtube', ... })}>
    <YouTubeIcon />
  </Button>
</div>
```

---

## Auth State Consistency

### Logged-in vs logged-out users may differ in:
- Available actions (save, like, analyze)
- Personalization
- Density

### They may NOT differ in:
- Playback behavior
- Provider switching
- Player placement
- Z-index behavior
- Layout stability

**No UI jumps between states.**

---

## Feed Design Rules

- Same card proportions everywhere
- Same player placement
- Same provider buttons
- Same interaction model

### Logged-out feed:
- Editorial
- Discovery-focused

### Logged-in feed:
- Personalized
- Richer controls

**Same design system.**

---

## Design Principle (Memorize This)

**Playback is infrastructure, not a feature.**

If:
- Two components can play independently
- Or audio overlaps
- Or UI covers the player

**Then the implementation is wrong.**

---

## File Structure Reference

### Player System
- `src/player/PlayerContext.tsx` — Universal player state
- `src/player/EmbeddedPlayerDrawer.tsx` — Bottom player UI
- `src/player/providers/SpotifyEmbedPreview.tsx` — Spotify iframe
- `src/player/providers/YouTubePlayer.tsx` — YouTube iframe

### Components
- `src/components/QuickStreamButtons.tsx` — Provider icon buttons
- `src/components/TikTokStyleButtons.tsx` — Mobile side buttons
- `src/components/TrackCard.tsx` — Feed card with provider buttons

### Pages
- `src/pages/FeedPage.tsx` — Main feed with taste-based recommendations
- `src/pages/TrackDetailPage.tsx` — Song detail with sections
- `src/pages/SearchPage.tsx` — Universal search (Spotify + YouTube)

### Styles
- `src/index.css` — Global styles including `body.clade-player-open` rule

---

## Key Implementation Patterns

### Opening the Player

```tsx
import { usePlayer } from '@/player/PlayerContext';

const { openPlayer } = usePlayer();

openPlayer({
  canonicalTrackId: track.id,
  provider: 'spotify', // or 'youtube'
  providerTrackId: track.spotify_id, // or track.youtube_id
  autoplay: true,
  context: 'feed',
  startSec?: 42, // optional section start time
  title: track.title,
  artist: track.artist,
});
```

### Checking Player State

```tsx
const { 
  spotifyOpen, 
  youtubeOpen, 
  currentProvider,
  isPlaying 
} = usePlayer();
```

### Provider Switching

```tsx
const { switchProvider } = usePlayer();

switchProvider('youtube', track.youtube_id, track.id);
```

---

## Testing Checklist

Before committing, verify:

- [ ] Player never sits behind UI elements
- [ ] Only ONE iframe exists at a time
- [ ] Provider switching stops previous provider
- [ ] TikTok-style buttons are vertically centered on mobile
- [ ] Feed page shows Spotify + YouTube icons (logged in + out)
- [ ] Track page shows Spotify + YouTube icons (logged in + out)
- [ ] No "Open with Spotify" buttons remain
- [ ] Page layout reserves space when player is open
- [ ] No audio overlap when switching providers
- [ ] Section playback uses universal player
- [ ] Mobile buttons don't cover player
- [ ] Player doesn't cover mobile buttons

---

## Common Mistakes to Avoid

❌ **DON'T:**
- Create multiple player instances
- Embed Spotify/YouTube iframes directly in components
- Use `z-index` lower than 60 for the player
- Position floating buttons at `bottom: 0` (conflicts with player)
- Show different playback UI for logged-in vs logged-out
- Create page-specific player logic

✅ **DO:**
- Use `usePlayer()` hook everywhere
- Call `openPlayer()` to start playback
- Use `QuickStreamButtons` for provider icons
- Position mobile buttons at `top: 50%` with vertical centering
- Show consistent provider buttons across all pages
- Reserve layout space with `body.clade-player-open`

---

## When in Doubt

Ask yourself:
1. **Is there only ONE player instance?**
2. **Can the user see and interact with the player?**
3. **Are provider buttons visible and consistent?**
4. **Does the mobile layout work like TikTok?**
5. **Is the player on top of the z-index stack?**

If the answer to any is "no" or "unsure" — refactor.

---

## Architecture Philosophy

> **The player is a singleton service, not a component.**

Components **request playback**.  
The player **fulfills the request**.  
No shortcuts.  
No exceptions.

---

**Last Updated:** January 23, 2026  
**Maintained by:** CladeAI Engineering Team
- Make changes file by file to allow for review.
- Never use apologies in responses.
- Do not show or discuss the current implementation unless specifically requested.
- Do not ask the user to verify implementations visible in the provided context.
- Do not invent changes beyond what is explicitly requested.
- Do not consider previous x.md files in memory; treat each run independently.
- Do not summarize changes made.
- Avoid giving feedback about understanding in comments or documentation.
- Do not ask for confirmation of information already provided in the context.
- Do not suggest updates or changes to files when there are no actual modifications needed.
- Do not suggest whitespace changes.
- Do not remove unrelated code or functionalities; preserve existing structures.
- Always provide links to real files, not x.md.
- Provide all edits for a file in a single chunk, not in multiple steps.
# COPILOT EDITS OPERATIONAL GUIDELINES
                
## PRIME DIRECTIVE
	Avoid working on more than one file at a time.
	Multiple simultaneous edits to a file will cause corruption.
	Be chatting and teach about what you are doing while coding.

## LARGE FILE & COMPLEX CHANGE PROTOCOL

### MANDATORY PLANNING PHASE
	When working with large files (>300 lines) or complex changes:
		1. ALWAYS start by creating a detailed plan BEFORE making any edits
            2. Your plan MUST include:
                   - All functions/sections that need modification
                   - The order in which changes should be applied
                   - Dependencies between changes
                   - Estimated number of separate edits required
                
            3. Format your plan as:
## PROPOSED EDIT PLAN
	Working with: [filename]
	Total planned edits: [number]

### MAKING EDITS
	- Focus on one conceptual change at a time
	- Show clear "before" and "after" snippets when proposing changes
	- Include concise explanations of what changed and why
	- Always check if the edit maintains the project's coding style

### Edit sequence:
	1. [First specific change] - Purpose: [why]
	2. [Second specific change] - Purpose: [why]
	3. Do you approve this plan? I'll proceed with Edit [number] after your confirmation.
	4. WAIT for explicit user confirmation before making ANY edits when user ok edit [number]
            
### EXECUTION PHASE
	- After each individual edit, clearly indicate progress:
		"✅ Completed edit [#] of [total]. Ready for next edit?"
	- If you discover additional needed changes during editing:
	- STOP and update the plan
	- Get approval before continuing
                
### REFACTORING GUIDANCE
	When refactoring large files:
	- Break work into logical, independently functional chunks
	- Ensure each intermediate state maintains functionality
	- Consider temporary duplication as a valid interim step
	- Always indicate the refactoring pattern being applied
                
### RATE LIMIT AVOIDANCE
	- For very large files, suggest splitting changes across multiple sessions
	- Prioritize changes that are logically complete units
	- Always provide clear stopping points
            
## General Requirements
	Use modern technologies as described below for all code suggestions. Prioritize clean, maintainable code with appropriate comments.
            
### Accessibility
	- Ensure compliance with **WCAG 2.1** AA level minimum, AAA whenever feasible.
	- Always suggest:
	- Labels for form fields.
	- Proper **ARIA** roles and attributes.
	- Adequate color contrast.
	- Alternative texts (`alt`, `aria-label`) for media elements.
	- Semantic HTML for clear structure.
	- Tools like **Lighthouse** for audits.
        
## Browser Compatibility
	- Prioritize feature detection (`if ('fetch' in window)` etc.).
        - Support latest two stable releases of major browsers:
	- Firefox, Chrome, Edge, Safari (macOS/iOS)
        - Emphasize progressive enhancement with polyfills or bundlers (e.g., **Babel**, **Vite**) as needed.
            
## PHP Requirements
	- **Target Version**: PHP 8.1 or higher
	- **Features to Use**:
	- Named arguments
	- Constructor property promotion
	- Union types and nullable types
	- Match expressions
	- Nullsafe operator (`?->`)
	- Attributes instead of annotations
	- Typed properties with appropriate type declarations
	- Return type declarations
	- Enumerations (`enum`)
	- Readonly properties
	- Emphasize strict property typing in all generated code.
	- **Coding Standards**:
	- Follow PSR-12 coding standards
	- Use strict typing with `declare(strict_types=1);`
	- Prefer composition over inheritance
	- Use dependency injection
	- **Static Analysis:**
	- Include PHPDoc blocks compatible with PHPStan or Psalm for static analysis
	- **Error Handling:**
	- Use exceptions consistently for error handling and avoid suppressing errors.
	- Provide meaningful, clear exception messages and proper exception types.
            
## HTML/CSS Requirements
	- **HTML**:
	- Use HTML5 semantic elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<search>`, etc.)
	- Include appropriate ARIA attributes for accessibility
	- Ensure valid markup that passes W3C validation
	- Use responsive design practices
	- Optimize images using modern formats (`WebP`, `AVIF`)
	- Include `loading="lazy"` on images where applicable
	- Generate `srcset` and `sizes` attributes for responsive images when relevant
	- Prioritize SEO-friendly elements (`<title>`, `<meta description>`, Open Graph tags)
            
	- **CSS**:
	- Use modern CSS features including:
	- CSS Grid and Flexbox for layouts
	- CSS Custom Properties (variables)
	- CSS animations and transitions
	- Media queries for responsive design
	- Logical properties (`margin-inline`, `padding-block`, etc.)
	- Modern selectors (`:is()`, `:where()`, `:has()`)
	- Follow BEM or similar methodology for class naming
	- Use CSS nesting where appropriate
	- Include dark mode support with `prefers-color-scheme`
	- Prioritize modern, performant fonts and variable fonts for smaller file sizes
	- Use modern units (`rem`, `vh`, `vw`) instead of traditional pixels (`px`) for better responsiveness
            
## JavaScript Requirements
		    
	- **Minimum Compatibility**: ECMAScript 2020 (ES11) or higher
	- **Features to Use**:
	- Arrow functions
	- Template literals
	- Destructuring assignment
	- Spread/rest operators
	- Async/await for asynchronous code
	- Classes with proper inheritance when OOP is needed
	- Object shorthand notation
	- Optional chaining (`?.`)
	- Nullish coalescing (`??`)
	- Dynamic imports
	- BigInt for large integers
	- `Promise.allSettled()`
	- `String.prototype.matchAll()`
	- `globalThis` object
	- Private class fields and methods
	- Export * as namespace syntax
	- Array methods (`map`, `filter`, `reduce`, `flatMap`, etc.)
	- **Avoid**:
	- `var` keyword (use `const` and `let`)
	- jQuery or any external libraries
	- Callback-based asynchronous patterns when promises can be used
	- Internet Explorer compatibility
	- Legacy module formats (use ES modules)
	- Limit use of `eval()` due to security risks
	- **Performance Considerations:**
	- Recommend code splitting and dynamic imports for lazy loading
	**Error Handling**:
	- Use `try-catch` blocks **consistently** for asynchronous and API calls, and handle promise rejections explicitly.
	- Differentiate among:
	- **Network errors** (e.g., timeouts, server errors, rate-limiting)
	- **Functional/business logic errors** (logical missteps, invalid user input, validation failures)
	- **Runtime exceptions** (unexpected errors such as null references)
	- Provide **user-friendly** error messages (e.g., “Something went wrong. Please try again shortly.”) and log more technical details to dev/ops (e.g., via a logging service).
	- Consider a central error handler function or global event (e.g., `window.addEventListener('unhandledrejection')`) to consolidate reporting.
	- Carefully handle and validate JSON responses, incorrect HTTP status codes, etc.
            
## Folder Structure
	Follow this structured directory layout:

		project-root/
		├── api/                  # API handlers and routes
		├── config/               # Configuration files and environment variables
		├── data/                 # Databases, JSON files, and other storage
		├── public/               # Publicly accessible files (served by web server)
		│   ├── assets/
		│   │   ├── css/
		│   │   ├── js/
		│   │   ├── images/
		│   │   ├── fonts/
		│   └── index.html
		├── src/                  # Application source code
		│   ├── controllers/
		│   ├── models/
		│   ├── views/
		│   └── utilities/
		├── tests/                # Unit and integration tests
		├── docs/                 # Documentation (Markdown files)
		├── logs/                 # Server and application logs
		├── scripts/              # Scripts for deployment, setup, etc.
		└── temp/                 # Temporary/cache files


## Documentation Requirements
	- Include JSDoc comments for JavaScript/TypeScript.
	- Document complex functions with clear examples.
	- Maintain concise Markdown documentation.
	- Minimum docblock info: `param`, `return`, `throws`, `author`
    
## Database Requirements (SQLite 3.46+)
	- Leverage JSON columns, generated columns, strict mode, foreign keys, check constraints, and transactions.
    
## Security Considerations
	- Sanitize all user inputs thoroughly.
	- Parameterize database queries.
	- Enforce strong Content Security Policies (CSP).
	- Use CSRF protection where applicable.
	- Ensure secure cookies (`HttpOnly`, `Secure`, `SameSite=Strict`).
	- Limit privileges and enforce role-based access control.
	- Implement detailed internal logging and monitoring.

  # Extracted from README.md

# React TypeScript Next.js Node.js  prompt file

Author: Gabo Esquivel

## What you can build
Decentralized Finance Dashboard: Create a web app using Next.js 14 App Router and Wagmi v2 for aggregating and displaying DeFi related data such as token prices, liquidity pools, and yield farming opportunities. Use TypeScript interfaces for data modeling and Tailwind CSS for a responsive design.NFT Minting Platform: Develop a platform using Solidity for smart contract development, TypeScript for front-end logic, and Next.js for the server-side rendering of NFTs. Integrate Shadcn UI and Tailwind Aria for elegant UI components.Real-time Cryptocurrency Portfolio Tracker: Build a React application that uses the Viem v2 library for interacting with blockchain data in real-time. Use Next.js and functional components to render user portfolios dynamically, with responsiveness handled by Radix UI components.Decentralized Voting Application: Implement a secure voting system using Solidity for the backend logic and TypeScript with Next.js for the frontend. Use Zod for form input validation and ensure error resilience with custom error types.Smart Contract IDE Plugin: Create a Node.js-based plugin for IDEs that supports Solidity development, offering features like syntax highlighting and auto-completion. Use TypeScript for robust type checking and rely on modularization for code maintainability.Blockchain-based Supply Chain Management System: Design a fault-tolerant supply chain solution using Solidity for smart contract management, TypeScript for interfacing, and Next.js for presenting supply chain data to users in real-time, leveraging Tailwind CSS for effortless styling.Educational Platform for Web3 Developers: Build an interactive platform using Next.js and Vite to teach Web3 development, featuring courses on Solidity, smart contract development, and blockchain integration. Use React components for interactivity and a mobile-first design approach.DAO Management Interface: Develop a Decentralized Autonomous Organization (DAO) management app using Wagmi v2 and Solidity, hosted on a server-less architecture using Next.js. Employ Aria UI for accessibility and seamless user interaction.Crowdfunding Platform on Ethereum: Create a crowdfunding platform using TypeScript, with smart contract logic written in Solidity. Implement authentication and payment interfaces using React functional components and Radix UI for structure and style.Crypto Wallet Integration Library: Offer a library using Node.js and TypeScript to simplify the integration of cryptocurrency wallets into web apps. Embrace functional programming and export components for extensibility and ease of integration.

## Benefits


## Synopsis
Developers working on Next.js projects can use this prompt to build modular, type-safe applications with efficient error handling and optimized component structures.

## Overview of  prompt
The  file provides guidelines for developers specializing in technologies such as Solidity, TypeScript, Node.js, and React. It emphasizes writing concise and technical responses using accurate TypeScript examples while promoting functional and declarative programming styles. Key principles include favoring modularization over duplication, using descriptive variable names, and preferring named exports for components. The file outlines specific practices for JavaScript and TypeScript, such as using the "function" keyword for pure functions, leveraging TypeScript interfaces, and prioritizing error handling. It stipulates dependencies like Next.js 14, Wagmi v2, and Viem v2, and offers guidance on using React/Next.js with a focus on functional components, responsive design, and efficient error management. Additionally, it provides conventions for using server actions, data handling, and maintaining performance priorities like Web Vitals.

🧠 GitHub Copilot Prompt — CladeAI (Architecture-First)

You are working inside the CladeAI repository.

Your top priority is to fully implement all outstanding TODOs and partially implemented systems that already exist in the codebase.
Do NOT add new features, UI polish, or speculative ideas.

🔴 Absolute Rules (Non-Negotiable)

- Relative harmony is primary data
- Store Roman numerals, tonal center, cadence type
- Absolute chords/keys are UI-only
- Never persist absolute chords as canonical data
- Never block the UI
- All analysis must be async
- Immediate provisional results are allowed
- Confidence must be explicit
- Never fake results
- If analysis is uncertain → mark is_provisional = true
- If data is missing → return partials with low confidence
- Silence is better than guessing
- Respect existing architecture
- Extend existing files before creating new ones
- Follow the current folder structure
- Do not collapse layers (analysis ≠ UI ≠ storage)

🎯 PRIMARY OBJECTIVE

Bring all outstanding TODO / 🚧 items to production-ready state, in this exact priority order:

✅ PRIORITY 1 — Database Integration (CRITICAL)
- Implement Supabase schema and persistence.
- Create migrations for: harmonic_fingerprints, analysis_jobs
- Add indexes for: roman_progression, cadence_type, loop_length_bars, confidence_score
- Implement cache lookup logic: ISRC / audio hash deduplication, 90-day TTL reuse, 365-day reanalysis eligibility
- Wire DB reads/writes into: src/services/harmonicAnalysis.ts
- Ensure idempotency: same audio → same fingerprint
- Output should include: SQL migration files, type-safe DB access, no breaking changes to UI

✅ PRIORITY 2 — Background Analysis Pipeline (CRITICAL)
- Implement non-blocking async analysis.
- Create Supabase Edge Function for analysis jobs
- Implement: queued → processing → completed / failed
- Persist progress updates (0–1)
- Ensure UI receives: Immediate provisional data, eventual refined result
- Add model version tagging (analysis_version)
- Do NOT: Run analysis on the main thread, assume analysis completes successfully

✅ PRIORITY 3 — Audio / ML Analysis v0 (FOUNDATIONAL)
- Implement a minimal but honest ML pipeline.
- Scope (v0 only): Chroma feature extraction, tonal center detection, single dominant loop detection (e.g. chorus), Roman-numeral conversion
- Confidence scoring based on: signal clarity, harmonic stability, section consistency
- Allowed tools: Essentia.js (preferred), lightweight custom heuristics
- Do NOT: Attempt full song segmentation, guess complex jazz/prog harmony, over-engineer embeddings yet

✅ PRIORITY 4 — React Hook Completion
- Complete: src/hooks/useHarmonicAnalysis.ts
- Requirements: Subscribe to job status, reflect analyzing / provisional / high-confidence, support reanalysis trigger, handle failures gracefully, no polling abuse

✅ PRIORITY 5 — Similarity Engine TODOs
- Implement missing logic without ML embeddings yet.
- Tasks: Progression rotation matching (I–V–vi–IV ≈ V–vi–IV–I), loop normalization
- Explanation payload:
  matching_features: {
    shared_progression_shape: boolean
    cadence_match?: string
    rotation_offset?: number
  }
- Keep it deterministic and testable.

🧪 CODE QUALITY REQUIREMENTS

- Prefer pure functions
- Add unit tests for: progression rotation, confidence thresholds, cache reuse logic
- No hardcoded values — use ANALYSIS_CONFIG
- Leave clear comments only where ambiguity exists

🚫 WHAT NOT TO DO

- No UI redesign
- No new monetization logic
- No speculative ML
- No genre tagging
- No “nice to have” features

🧭 SUCCESS CRITERIA

The system is considered complete when:
- A song can be added
- Cached or provisional harmony appears immediately
- Background analysis refines it
- Confidence updates correctly
- Similar songs are explainably linked
- No part of the UI waits on ML

Build this as if the repo will be audited by both a music theorist and a systems architect.

If something is ambiguous:
- Choose correctness over completeness
- Choose honesty over confidence
- Choose architecture over speed