# Player Architecture

## Two Concurrent Player Systems

CladeAI currently maintains **two separate player systems** that serve different use cases:

### 1. EmbeddedPlayerDrawer (Unified Bottom Player)

**Location:** `src/player/EmbeddedPlayerDrawer.tsx`  
**Context:** `src/player/PlayerContext.tsx` (via `usePlayer()`)  
**Position:** Fixed bottom bar (slim, 48px height)  
**Use Case:** Single unified player that switches between providers

**Key Features:**
- Renders at bottom of viewport (`fixed bottom-0`)
- Slim 12:1 aspect ratio (48-52px height)
- Single player instance - switches between Spotify/YouTube
- Controlled by `PlayerProvider` and `PlayerContext`
- Shows provider badge (🎧 Spotify, ▶ YouTube)
- Displays track title
- Always on top (z-50)

**API:**
```typescript
const { open, provider, providerTrackId, autoplay, closePlayer, trackTitle } = usePlayer();
```

**State Structure:**
```typescript
{
  spotifyOpen: boolean;
  youtubeOpen: boolean;
  canonicalTrackId: string | null;
  spotifyTrackId: string | null;
  youtubeTrackId: string | null;
  autoplaySpotify: boolean;
  autoplayYoutube: boolean;
  seekToSec: number | null;
  currentSectionId: string | null;
  isPlaying: boolean;
  queue: Track[];
  queueIndex: number;
}
```

**When to Use:**
- Primary playback interface
- Section navigation (with seek)
- Queue management
- Provider switching

---

### 2. FloatingPlayer (Multi-Window System)

**Location:** `src/components/FloatingPlayer.tsx`  
**Context:** `src/contexts/FloatingPlayersContext.tsx` (via `useFloatingPlayers()`)  
**Position:** Bottom-right floating windows (stacked vertically)  
**Use Case:** Multiple simultaneous players (e.g., A/B comparison)

**Key Features:**
- Renders in bottom-right (`fixed bottom-20 right-4`)
- Larger size (320-384px width)
- Multiple player instances can coexist
- Resizable (minimize/maximize)
- Z-index management for active player
- Framer Motion animations
- Glass morphism styling

**API:**
```typescript
const {
  spotifyPlayer,
  youtubePlayer,
  activePlayer,
  playSpotify,
  playYouTube,
  seekYouTube,
  closeSpotify,
  closeYouTube,
  setActivePlayer,
} = useFloatingPlayers();
```

**State Structure:**
```typescript
{
  spotifyPlayer: { type, trackId, title, artist } | null;
  youtubePlayer: { type, trackId, title, artist } | null;
  activePlayer: 'spotify' | 'youtube' | null;
}
```

**When to Use:**
- Comparing multiple tracks side-by-side
- Legacy features requiring separate windows
- A/B testing scenarios

---

## Key Differences

| Feature | EmbeddedPlayerDrawer | FloatingPlayer |
|---------|---------------------|----------------|
| **Context** | `PlayerContext` | `FloatingPlayersContext` |
| **Position** | Bottom bar (full width) | Bottom-right (stacked) |
| **Instances** | Single (switches) | Multiple (concurrent) |
| **Size** | Slim (48px) | Large (240-352px) |
| **Animation** | None | Framer Motion |
| **Minimizable** | No | Yes |
| **Queue Support** | Yes | No |
| **Section Navigation** | Yes | Limited |
| **Z-Index** | z-50 (always on top) | z-50/z-100 (managed) |

---

## Consistency Requirements

### Shared Props (when applicable)
Both systems should accept similar track identification:
```typescript
{
  type: 'spotify' | 'youtube';
  trackId: string;
  title: string;
  artist?: string;
}
```

### Responsive Sizing
Both systems use responsive Tailwind classes:
- **Mobile:** Prioritize compact views
- **Desktop:** Full-sized embeds

```typescript
// EmbeddedPlayerDrawer: 12:1 aspect ratio
height: '48px', maxHeight: '52px'

// FloatingPlayer: Responsive heights
spotify: 'h-48 md:h-[304px]'
youtube: 'h-48 md:h-[192px]'
```

### Provider Rendering
Both use the same underlying provider components:
- `SpotifyEmbedPreview` (from `src/player/providers/`)
- `YouTubePlayer` (from `src/player/providers/`)

---

## Migration Path (Future Consideration)

If consolidation is desired:

1. **Phase 1:** Deprecate `FloatingPlayersContext`
2. **Phase 2:** Extend `PlayerContext` to support multi-instance mode
3. **Phase 3:** Add drawer/modal variants to `EmbeddedPlayerDrawer`
4. **Phase 4:** Remove legacy `FloatingPlayer` component

**Priority:** LOW (both systems currently work as intended)

---

## Non-Contradictory Rules

✅ **EmbeddedPlayerDrawer** = Primary playback, single unified player  
✅ **FloatingPlayer** = Secondary comparison, multi-window mode  
✅ Both can coexist without conflict (different z-index ranges)  
✅ Both use same provider components for consistency  
❌ Do NOT merge state between contexts  
❌ Do NOT duplicate player instances in same context  
❌ Do NOT assume only one system exists  

---

## Testing Checklist

When modifying either system:
- [ ] Verify EmbeddedPlayerDrawer still works at bottom
- [ ] Verify FloatingPlayer still works in bottom-right
- [ ] Test provider switching in both contexts
- [ ] Verify no z-index conflicts
- [ ] Ensure responsive sizing on mobile/desktop
- [ ] Confirm autoplay behavior
- [ ] Test seek functionality (where applicable)
