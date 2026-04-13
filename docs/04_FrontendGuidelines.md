# BidWire — Frontend Guidelines

---

## Design Direction

**Aesthetic:** Soft futurist — luminous pastels over deep space darkness. Think a control room at the edge of a nebula. The UI feels alive, like something is always happening. Not aggressive or neon — *elegant tension*.

**Fonts:**
- Headings: `Syne` (geometric, slightly alien character) — weights 600, 800
- Body/UI: `DM Sans` (warm, readable, not sterile) — weights 400, 500
- Mono/data: `JetBrains Mono` — for txHashes, wallet addresses, bid amounts

**Personality:** Precise. Alive. Trustworthy. The auction is serious business but the interface makes it feel like watching a beautiful machine work.

---

## Color System

```css
:root {
  /* Brand palette */
  --c-slate:      #8e9aaf;   /* borders, muted text, subtle dividers */
  --c-lavender:   #cbc0d3;   /* secondary text, inactive states */
  --c-blush:      #efd3d7;   /* warm accents, winner highlights, alerts */
  --c-mist:       #feeafa;   /* light surface backgrounds, cards on dark */
  --c-periwinkle: #dee2ff;   /* interactive elements, active states, glows */

  /* Dark UI layer (applied over --c-dark backgrounds) */
  --c-dark:       #1a1625;   /* primary dark bg — deep aubergine-black */
  --c-dark-2:     #221d30;   /* card/panel background */
  --c-dark-3:     #2d2640;   /* elevated surfaces, hovered cards */

  /* Semantic */
  --c-win:        #a8e6c3;   /* winner green (muted, not garish) */
  --c-bid:        #dee2ff;   /* active bid indicator */
  --c-refund:     #efd3d7;   /* refund indicator */
  --c-countdown:  #feeafa;   /* timer color */

  /* Typography */
  --c-text-primary:   #f0ebf8;  /* primary text on dark */
  --c-text-secondary: #cbc0d3;  /* secondary text on dark */
  --c-text-muted:     #8e9aaf;  /* muted/hint text */
}
```

---

## 3D Background System (Three.js)

Every page has a persistent 3D background canvas. The scene is **ambient and non-distracting** — it creates depth without competing with content.

### Scene 1 — Landing Page: Floating Bid Orbs
```
- 200 small luminous spheres (radius 0.05–0.2)
- Colors: #cbc0d3, #dee2ff, #feeafa — soft glow
- Slow drift + rotation on Y axis
- Occasional "bid pulse" — sphere brightens and scales up briefly
- Camera: slow orbital movement, slight tilt
- Fog: near-black, fades out distant orbs
```

### Scene 2 — Auction Board: Neural Mesh
```
- Connected node graph — 50 nodes, 100+ edges
- Nodes represent agents, edges represent bid relationships
- Active bid: edge pulses bright white → fades to --c-slate
- Settled auction: winning node glows --c-win
- Subtle rotation, camera pans slowly
```

### Scene 3 — Auction Detail: Countdown Vortex
```
- Spiral particle system, particles orbit a central point
- Speed increases as auction countdown decreases
- Color shifts: --c-periwinkle (lots of time) → --c-blush (urgent)
- Winner moment: particles explode outward, fade
```

### Scene 4 — Agents Page: Agent Constellation
```
- 5 large glowing orbs, one per agent
- Size = wallet balance (larger = more USDC)
- Color = agent strategy (aggressive=blush, conservative=lavender, etc.)
- Orbiting each other loosely, trails behind movement
```

### Three.js Setup Pattern
```tsx
// All backgrounds use this pattern
import { Canvas } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'

export function Background3D({ scene }: { scene: 'landing' | 'board' | 'detail' | 'agents' }) {
  return (
    <Canvas
      className="fixed inset-0 -z-10"
      camera={{ position: [0, 0, 5], fov: 75 }}
      gl={{ alpha: true, antialias: true }}
    >
      <SceneComponent scene={scene} />
    </Canvas>
  )
}
```

---

## Animation System (Framer Motion)

### Page Entry
Every page uses staggered reveal:
```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0, 1] } }
}
```

### Bid Card Entry (live feed)
New bids slide in from the right, push existing bids down:
```tsx
// AnimatePresence wrapping the bid list
// Each bid: x: 60 → 0, opacity: 0 → 1, duration 0.3s
```

### Winner Moment
```tsx
// Winner card: scale 1 → 1.04 → 1, border flashes --c-win
// Confetti burst using canvas-confetti with brand colors
// Duration: 2 seconds
```

### Countdown Timer
```tsx
// Under 10 seconds: color transitions to --c-blush
// Under 5 seconds: subtle pulse animation on the number
// 0: immediate freeze + winner reveal
```

---

## Component Patterns

### Auction Card
```
┌─────────────────────────────────────┐
│  GPU Compute Slot #1          LIVE  │ ← resource type + status badge
│  ─────────────────────────────────  │
│  Current bid    Min next bid        │
│  $0.25 USDC     $0.30 USDC          │
│                                     │
│  Leader: NovaBid                    │ ← agent avatar + name
│                                     │
│  ████████████░░░░  18s remaining    │ ← animated progress bar
└─────────────────────────────────────┘
Background: --c-dark-2
Border: 0.5px --c-slate (1.5px --c-periwinkle when active)
```

### Bid Feed Item
```
┌───────────────────────────────────────────────────┐
│  ● NovaBid      $0.30 USDC    tx: ab12...ef34  ↗  │
│    just now                                        │
└───────────────────────────────────────────────────┘
Left dot color = agent color
Right ↗ = links to Stellar explorer
```

### Agent Wallet Card
```
┌──────────────────────────┐
│   ⬤ NovaBid              │ ← colored orb + name
│   AGGRESSIVE             │ ← strategy badge
│   ─────────────────────  │
│   $3.42 USDC             │ ← balance, large
│   ████████░░  68%        │ ← budget remaining bar
│   12 bids placed         │
└──────────────────────────┘
```

---

## Layout Rules

- **Max content width:** 1280px, centered
- **Sidebar (Auction Detail):** 340px fixed right — bid feed
- **Grid (Auction Board):** `repeat(auto-fill, minmax(320px, 1fr))`, gap 20px
- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96px
- **Border radius:** 8px (small), 12px (card), 20px (panel), 9999px (pill)
- **Glass effect (panels over 3D bg):** `background: rgba(26, 22, 37, 0.75); backdrop-filter: blur(16px)`

---

## Responsive Breakpoints

| Breakpoint | Width | Behaviour |
|-----------|-------|-----------|
| `sm` | 640px | Single column auction grid |
| `md` | 768px | Two column grid |
| `lg` | 1024px | Three column grid, sidebar visible |
| `xl` | 1280px | Full layout |

---

## Typography Scale

| Token | Font | Size | Weight | Use |
|-------|------|------|--------|-----|
| `display` | Syne | 56px | 800 | Hero headlines |
| `h1` | Syne | 36px | 700 | Page titles |
| `h2` | Syne | 24px | 600 | Section headings |
| `h3` | Syne | 18px | 600 | Card titles |
| `body` | DM Sans | 15px | 400 | Body text |
| `small` | DM Sans | 13px | 400 | Labels, captions |
| `mono` | JetBrains Mono | 12px | 400 | Hashes, addresses |
| `bid` | DM Sans | 28px | 500 | Live bid amounts |

---

## Accessibility

- All interactive elements have `:focus-visible` rings using `--c-periwinkle`
- Color is never the sole differentiator — status badges always include text
- Countdown timer also shows numeric value (not just bar)
- Motion: respects `prefers-reduced-motion` — disables 3D scene, uses static gradient
- Contrast: all text on dark backgrounds ≥ 4.5:1 ratio
