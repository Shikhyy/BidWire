# BidWire — Implementation Plan

---

## Timeline Overview

```
Day 1  ████████████████████  Soroban contract + x402 core (foundation)
Day 2  ████████████████████  Bidder agents + auction engine (logic)
Day 3  ████████████████████  Frontend dashboard (visual centerpiece)
Day 4  ████████████████████  Polish, reverse auction, demo rehearsal
```

**Rule:** At the end of Day 1, one complete auction must run end-to-end in a terminal. If that works, everything else is additive.

---

## Day 1 — Foundation

### Goal
One auction runs end-to-end in a terminal: auction opens → two agents bid → auction closes → winner gets resource → loser is refunded. All on Stellar testnet.

### Tasks

**1.1 — Monorepo setup (30 min)**
```bash
mkdir bidwire && cd bidwire
pnpm init
pnpm add -w turbo typescript
mkdir -p contracts backend agents frontend
# Create pnpm-workspace.yaml
# Create turbo.json with dev/build pipelines
```

**1.2 — Soroban contract (3 hrs)**
- [ ] `cargo new --lib contracts/bidwire_escrow`
- [ ] Add `soroban-sdk` dependency
- [ ] Implement `AuctionState`, `Bid` structs
- [ ] Implement `init()` — set admin, provider, starting bid
- [ ] Implement `submit_bid()` — validate, hold, refund previous leader atomically
- [ ] Implement `close_auction()` — settle winner, refund all losers
- [ ] Implement `get_state()`, `get_bids()`
- [ ] Write 3 unit tests: happy path, bid too low, double-close
- [ ] `stellar contract build`
- [ ] `stellar contract deploy --network testnet`
- [ ] Record contract ID in `.env`

**1.3 — Backend skeleton (2 hrs)**
- [ ] `pnpm create express-typescript backend`
- [ ] Install `stellar-sdk`, `ws`, `zod`
- [ ] `sorobanClient.ts` — wrap contract calls in typed functions
- [ ] `auctionEngine.ts` — in-memory Map, `createAuction()`, `openAuction()`, `closeAuction()`
- [ ] `x402handler.ts` — return 402 with auction metadata, validate payment
- [ ] `routes/resource.ts` — `GET /resource/:auctionId` using x402 handler
- [ ] Test with `curl`: hit endpoint, get 402 back ✅

**1.4 — End-to-end test (1 hr)**
```bash
# In terminal 1
pnpm --filter backend dev

# In terminal 2 (manual bid simulation)
curl http://localhost:3001/resource/test-auction-1
# → 402 with auction metadata

# Sign payment manually via Stellar Lab + submit
curl -H "X-PAYMENT: eyJ..." http://localhost:3001/resource/test-auction-1
# → 200 { status: "bid_accepted" }
```

**Day 1 Checkpoint:** ✅ 402 → bid → Soroban settlement visible on Stellar testnet explorer.

---

## Day 2 — Agents + Engine Logic

### Goal
Five agents run concurrently, bid against each other, and a full auction completes with correct settlement and refunds.

### Tasks

**2.1 — Agent framework (2 hrs)**
- [ ] `agents/src/baseAgent.ts` — abstract class with wallet, bid(), queryAuction()
- [ ] `agents/src/strategies/aggressive.ts` — NovaBid
- [ ] `agents/src/strategies/conservative.ts` — GridMind
- [ ] `agents/src/strategies/sniper.ts` — PulseBot
- [ ] `agents/src/strategies/random.ts` — FluxAgent
- [ ] `agents/src/strategies/budgetAware.ts` — CalmNode
- [ ] `agents/src/runner.ts` — spawn all 5, poll auction every 2 seconds

**2.2 — Auction lifecycle (2 hrs)**
- [ ] `auctionTimer.ts` — `setInterval` watcher, auto-closes when `closesAt < Date.now()`
- [ ] `closeAuction()` — calls Soroban `close_auction()`, records settlement txHash
- [ ] `generateAccessToken()` — signed JWT valid for 5 minutes, tied to auctionId + winner
- [ ] Winner notification via WebSocket

**2.3 — WebSocket server (1 hr)**
- [ ] `wsServer.ts` — broadcast all events to connected clients
- [ ] Emit: `bid:placed`, `bid:outbid`, `auction:settled`, `agent:balance`
- [ ] Test with `wscat`: watch live events as agents bid

**2.4 — Resource delivery endpoints (1 hr)**
- [ ] `GET /resource/compute/:auctionId` — validates access token, returns mock LLM response
- [ ] `GET /resource/data/:auctionId` — returns mock price feed snapshot
- [ ] `GET /resource/quota/:auctionId` — activates mock quota, returns credits

**2.5 — Seed data (30 min)**
- [ ] `scripts/seed.ts` — fund 5 agent wallets with testnet USDC, create 3 test auctions
- [ ] `pnpm seed` runs this before demo

**Day 2 Checkpoint:** ✅ `pnpm dev:agents` starts 5 agents, they bid, auction settles, refunds confirmed on-chain.

---

## Day 3 — Frontend Dashboard

### Goal
The live dashboard is beautiful, real-time, and tells the story of the auction visually.

### Tasks

**3.1 — Next.js setup (30 min)**
- [ ] `pnpm create next-app frontend --typescript --tailwind --app`
- [ ] Install: `three`, `@react-three/fiber`, `@react-three/drei`, `framer-motion`, `socket.io-client`
- [ ] Add Google Fonts: Syne + DM Sans + JetBrains Mono
- [ ] Set up CSS variables from color system
- [ ] Create layout with persistent 3D canvas background

**3.2 — Landing page `/` (1 hr)**
- [ ] Hero: "BidWire" in large Syne, tagline, animated stat counters
- [ ] 3D background: floating bid orbs (Three.js)
- [ ] Stats: "5 agents live", "$0.00 total volume", "0 auctions settled" — update in real time
- [ ] CTA button → `/auctions`

**3.3 — Auction Board `/auctions` (2 hrs)**
- [ ] 3D background: neural mesh
- [ ] Grid of `AuctionCard` components
- [ ] Each card: resource type, countdown bar, current bid, leader avatar
- [ ] Live updates via WebSocket — bids update cards in real time
- [ ] Filter bar: ALL | GPU | DATA | QUOTA | TASK
- [ ] "Start Demo Auction" button (calls `POST /api/auctions` + `POST /api/auctions/:id/start`)

**3.4 — Auction Detail `/auctions/:id` (2 hrs)**
- [ ] 3D background: countdown vortex (speed = urgency)
- [ ] Left: resource info, large countdown, current bid, bid history chart
- [ ] Right sidebar: live bid feed with txHashes, agent avatars
- [ ] Winner announcement overlay (Framer Motion scale + glow)
- [ ] Soroban settlement card: winner txHash + all refund txHashes

**3.5 — Agents `/agents` (1 hr)**
- [ ] 3D background: agent constellation (5 orbs)
- [ ] Grid of `AgentCard` components
- [ ] Each card: name, strategy badge, live balance, budget bar, win rate
- [ ] Click → agent detail modal: full bid history

**3.6 — History `/history` (30 min)**
- [ ] Table of past auctions
- [ ] Columns: resource, winner, final bid, duration, settlement txHash (links to explorer)
- [ ] Platform stats header: total volume, auctions run, avg bid count

**Day 3 Checkpoint:** ✅ Dashboard looks spectacular, live bids update in real time, 3D backgrounds running on all pages.

---

## Day 4 — Polish + Demo

### Goal
Everything works reliably, the demo script is rehearsed, the README is excellent.

### Tasks

**4.1 — Reverse auction mode (1 hr)**
- [ ] Add `mode: 'REVERSE'` to auction schema
- [ ] Soroban: lowest bid wins logic
- [ ] UI: "Task Assignment" auction card shows lowest bid wins
- [ ] Add one reverse auction to the seed data

**4.2 — Error handling + stability (1 hr)**
- [ ] Handle Stellar RPC failures gracefully (retry + fallback)
- [ ] Handle agent wallet insufficient funds (agent goes idle)
- [ ] WebSocket reconnection on the frontend

**4.3 — Demo mode (30 min)**
- [ ] `DEMO_MODE=true` in env → agents bid on a tight 30-second schedule
- [ ] Auto-seed 3 auctions on server start
- [ ] `pnpm demo` one-command start: seeds wallets + auctions + starts all agents

**4.4 — README (30 min)**
```markdown
# BidWire
> The first real-time auction engine for AI agents on Stellar

## Quick Start
pnpm install
pnpm seed        # funds wallets, creates auctions
pnpm demo        # starts everything

## Live at
Frontend: localhost:3000
Backend: localhost:3001
```

**4.5 — Demo video (1 hr)**
- Record 90-second demo following the exact script from the build plan
- Show: dashboard open → auction starts → agents bid (live txHashes) → countdown → settlement → winner gets resource → Stellar explorer shows atomic settlement

**4.6 — Submission checklist**
- [ ] Public GitHub repo with clear README
- [ ] Demo video uploaded
- [ ] Deployed to testnet (contracts)
- [ ] All 5 pages working
- [ ] Mobile-responsive
- [ ] DoraHacks submission form complete

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Soroban testnet congestion | Use in-memory mock settlement for demo if needed; real contract still deployed |
| x402 facilitator downtime | Mock facilitator fallback (`MOCK_X402=true` env flag) |
| Agents bid too fast / drain wallets | Budget caps + per-auction spend limits enforced in agent code |
| 3D scene kills performance | `prefers-reduced-motion` disables Three.js, static gradient fallback |
| Stellar RPC rate limits | Cache chain reads, only write to chain for actual bids |

---

## File Structure (Final)

```
bidwire/
├── contracts/
│   └── bidwire_escrow/
│       ├── src/lib.rs
│       ├── Cargo.toml
│       └── Cargo.lock
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── auctionEngine.ts
│   │   ├── sorobanClient.ts
│   │   ├── x402handler.ts
│   │   ├── wsServer.ts
│   │   ├── routes/
│   │   │   ├── auctions.ts
│   │   │   ├── resource.ts
│   │   │   └── agents.ts
│   │   └── jobs/
│   │       └── auctionTimer.ts
│   ├── scripts/seed.ts
│   └── package.json
├── agents/
│   ├── src/
│   │   ├── baseAgent.ts
│   │   ├── runner.ts
│   │   └── strategies/
│   │       ├── aggressive.ts
│   │       ├── conservative.ts
│   │       ├── sniper.ts
│   │       ├── random.ts
│   │       └── budgetAware.ts
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               ← Landing
│   │   ├── auctions/
│   │   │   ├── page.tsx           ← Auction Board
│   │   │   └── [id]/page.tsx      ← Auction Detail
│   │   ├── agents/
│   │   │   └── page.tsx           ← Agent Overview
│   │   └── history/
│   │       └── page.tsx           ← History
│   ├── components/
│   │   ├── 3d/
│   │   │   ├── Background3D.tsx
│   │   │   ├── BidOrbs.tsx
│   │   │   ├── NeuralMesh.tsx
│   │   │   ├── CountdownVortex.tsx
│   │   │   └── AgentConstellation.tsx
│   │   ├── auction/
│   │   │   ├── AuctionCard.tsx
│   │   │   ├── BidFeed.tsx
│   │   │   ├── CountdownTimer.tsx
│   │   │   └── WinnerOverlay.tsx
│   │   └── agents/
│   │       └── AgentCard.tsx
│   └── package.json
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```
