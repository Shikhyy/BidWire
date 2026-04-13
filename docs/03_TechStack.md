# BidWire — Tech Stack

---

## Overview

BidWire is a monorepo containing three packages: a Soroban smart contract (Rust), a backend auction engine (Node.js), and a frontend dashboard (Next.js). Everything runs locally for the hackathon demo.

```
bidwire/
├── contracts/          ← Soroban smart contract (Rust)
├── backend/            ← Auction engine + x402 server (Node.js)
├── frontend/           ← Live dashboard (Next.js)
└── agents/             ← Simulated bidder agents (Node.js)
```

---

## Blockchain & Payments

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Settlement network | **Stellar Testnet / Mainnet** | Fast (5s) finality, $0.00001 fees, native USDC |
| Smart contract | **Soroban (Rust)** | Escrow logic, atomic settlement, refund management |
| Payment protocol | **x402 V2** | HTTP-native pay-per-request, Soroban auth entries |
| x402 facilitator | **OpenZeppelin Stellar Relayer** | Verifies + settles x402 payments, covers network fees |
| Stablecoin | **USDC (Stellar SAC)** | All bids denominated in USDC |
| Wallet SDK | **Stellar SDK (stellar-sdk)** | Agent wallet management, transaction signing |

### Why Stellar?
- **5-second finality** — auction cycles need synchronous settlement within the HTTP request window
- **$0.00001 fees** — makes $0.05 bids economically viable (fees are < 0.02% of bid)
- **Native USDC** — no bridging, no wrapping, stablecoin is first-class
- **Soroban** — fully featured smart contract platform for the escrow logic
- **OpenZeppelin facilitator** — abstracts blockchain complexity, agents need zero chain knowledge

---

## Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 20 LTS | Runtime |
| **Express** | 4.x | HTTP server |
| **@x402/express** | latest | x402 middleware (auction-mode custom handler) |
| **stellar-sdk** | 12.x | Stellar network interaction, contract calls |
| **ws** (WebSocket) | 8.x | Real-time event broadcast to dashboard |
| **Redis** | 7.x (or in-memory) | Auction state, bid ledger, agent sessions |
| **zod** | 3.x | Request validation |
| **typescript** | 5.x | Type safety |

### Key Backend Modules
```
backend/src/
├── server.ts           ← Express app + x402 middleware setup
├── auctionEngine.ts    ← Auction lifecycle state machine
├── sorobanClient.ts    ← Contract interaction (submit_bid, close_auction)
├── x402handler.ts      ← Custom 402 response with auction metadata
├── wsServer.ts         ← WebSocket event broadcasting
├── routes/
│   ├── auctions.ts     ← CRUD auction endpoints
│   ├── resource.ts     ← x402-protected resource endpoints
│   └── agents.ts       ← Agent registration + balance endpoints
└── jobs/
    └── auctionTimer.ts ← Watches countdown, triggers settlement
```

---

## Smart Contract

| Technology | Purpose |
|-----------|---------|
| **Rust** | Smart contract language |
| **Soroban SDK** | Stellar smart contract framework |
| **Stellar CLI** | Deploy + invoke contracts |
| **soroban-sdk** crate | Contract primitives, storage, auth |

### Contract Interface
```rust
// Core functions
fn submit_bid(env: Env, auction_id: Symbol, bidder: Address, amount: i128) -> Result<BidReceipt, Error>
fn close_auction(env: Env, auction_id: Symbol) -> Result<Settlement, Error>
fn get_auction(env: Env, auction_id: Symbol) -> AuctionState
fn get_bids(env: Env, auction_id: Symbol) -> Vec<Bid>
```

---

## Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 14 (App Router) | Framework |
| **React** | 18 | UI |
| **Three.js** | r128 | 3D background animations |
| **@react-three/fiber** | 8.x | React bindings for Three.js |
| **@react-three/drei** | 9.x | Three.js helpers (OrbitControls, etc.) |
| **Framer Motion** | 11.x | Page transitions, bid card animations |
| **Tailwind CSS** | 3.x | Utility styling |
| **socket.io-client** | 4.x | WebSocket connection to backend |
| **stellar-sdk** | 12.x | Read wallet balances, txHash links |
| **Google Fonts** | — | Syne (headings) + DM Sans (body) |

### Color Palette
```css
--color-slate:    #8e9aaf;   /* neutral mid-tone, borders */
--color-lavender: #cbc0d3;   /* soft purple, secondary elements */
--color-blush:    #efd3d7;   /* warm pink, accents, alerts */
--color-mist:     #feeafa;   /* near-white purple, backgrounds */
--color-periwinkle: #dee2ff; /* cool lavender, highlights */

/* Derived */
--color-dark:     #1a1625;   /* deep purple-black for dark UI areas */
--color-surface:  #f8f4ff;   /* light page background */
```

---

## Agents

| Technology | Purpose |
|-----------|---------|
| **Node.js** | Runtime for all 5 agents |
| **stellar-sdk** | Wallet signing, balance checks |
| **node-fetch** | HTTP requests with x402 payment headers |
| **typescript** | Type safety |

### Agent Profiles
| Agent | Strategy | Budget Cap | Bid Style |
|-------|----------|-----------|-----------|
| **NovaBid** | Aggressive — always tries to win | $5.00 | Outbids by 50% increment |
| **GridMind** | Conservative — stops at fair value | $2.00 | Bids minimum increment only |
| **PulseBot** | Sniper — bids only in last 5 seconds | $3.50 | One decisive final bid |
| **FluxAgent** | Random — unpredictable behaviour | $1.50 | Random increment 10–100% |
| **CalmNode** | Budget-aware — tracks spend rate | $4.00 | Bids if remaining budget > 60% |

---

## Development Tools

| Tool | Purpose |
|------|---------|
| **pnpm workspaces** | Monorepo package management |
| **turbo** | Parallel dev/build scripts |
| **vitest** | Unit tests (backend + contract) |
| **Stellar CLI** | Contract deploy, invoke, inspect |
| **Stellar Laboratory** | Manual testing, tx inspection |
| **Horizon Testnet** | REST API for chain state |

---

## Infrastructure (Demo / Local)

```
localhost:3001  ← Backend auction engine (Express)
localhost:3000  ← Frontend dashboard (Next.js)
localhost:6379  ← Redis (optional, can use in-memory Map)
Stellar Testnet ← On-chain settlement
```

No cloud infra needed for hackathon demo. Everything runs locally.
