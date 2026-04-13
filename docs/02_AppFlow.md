# BidWire — App Flow

---

## 1. High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BIDWIRE PLATFORM                          │
│                                                                   │
│  ┌──────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │   Provider   │───▶│  Auction Engine  │◀───│ Bidder Agents │  │
│  │  (Resource   │    │  (Node.js API)   │    │ (5 x AI bots) │  │
│  │   Owner)     │    │                  │    │               │  │
│  └──────────────┘    └────────┬─────────┘    └───────┬───────┘  │
│                               │                       │          │
│                      ┌────────▼─────────┐             │          │
│                      │ Soroban Contract │◀────────────┘          │
│                      │  (Escrow + Settle│                        │
│                      │   on Stellar)    │                        │
│                      └────────┬─────────┘                        │
│                               │                                  │
│                      ┌────────▼─────────┐                        │
│                      │  Live Dashboard  │                        │
│                      │  (Next.js + WS)  │                        │
│                      └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Core User Flows

### Flow A — Provider Creates an Auction

```
Provider
   │
   ├─ POST /auctions
   │    body: { resourceType, startingBid, increment, duration, description }
   │
   ├─ Auction Engine creates auction record (status: PENDING)
   │
   ├─ Soroban contract deployed for this auction (escrow address returned)
   │
   ├─ Auction status → OPEN, countdown begins
   │
   └─ Resource endpoint becomes live: GET /resource/:auctionId
        └─ Returns HTTP 402 with auction metadata (not fixed price)
```

---

### Flow B — Bidder Agent Discovers and Bids

```
Bidder Agent
   │
   ├─ GET /resource/:auctionId          (no payment header)
   │    └─ Server returns HTTP 402:
   │         { auctionId, currentBid: $0.15, minNextBid: $0.20,
   │           endsAt: timestamp, escrowAddress: G...XYZ }
   │
   ├─ Agent evaluates: is this resource worth ≥ $0.20 to me?
   │    └─ YES → proceed to bid
   │    └─ NO  → skip (stay idle, re-check next cycle)
   │
   ├─ Agent signs USDC authorization for bid amount
   │    └─ x402 Soroban auth entry → escrow contract address
   │
   ├─ GET /resource/:auctionId  (with X-PAYMENT header)
   │    └─ Server validates x402 payment
   │    └─ Forwards USDC to Soroban escrow via submit_bid()
   │    └─ Contract: holds new bid, refunds previous leader instantly
   │
   └─ Server returns: { status: "bid_accepted", rank: 1, txHash: "..." }
```

---

### Flow C — Auction Settlement

```
Auction Timer Expires
   │
   ├─ Auction Engine calls Soroban: close_auction(auctionId)
   │
   ├─ Soroban contract executes atomically:
   │    ├─ Transfer winner's bid USDC → provider wallet
   │    ├─ Refund Agent 2's bid → Agent 2 wallet
   │    ├─ Refund Agent 3's bid → Agent 3 wallet
   │    └─ Emit AuctionSettled event (txHash recorded)
   │
   ├─ Auction Engine receives settlement confirmation
   │    └─ Generates signed access token for winner
   │    └─ Updates auction status → SETTLED
   │
   ├─ Winner agent receives access token via WebSocket notification
   │
   └─ Winner calls protected resource endpoint with token
        └─ Resource delivered (compute result / data / API response)
```

---

### Flow D — Human Observer on Dashboard

```
Observer opens dashboard at localhost:3000
   │
   ├─ Page: Landing        → Project intro, animated stats, "Enter" CTA
   ├─ Page: Auction Board  → Live grid of active auctions, countdown timers
   ├─ Page: Auction Detail → Selected auction, live bid feed, agent cards
   ├─ Page: Agents         → 5 agent profiles, strategy, wallet balance
   └─ Page: History        → Past auctions, winners, Stellar txHashes
```

---

## 3. State Machine — Auction Lifecycle

```
  PENDING ──── start() ────▶ OPEN
                               │
              new bid ─────────┤ (bids accepted, escrow updated)
                               │
              timer = 0 ───────▼
                            CLOSING
                               │
              settlement tx ───▼
                            SETTLED
                               │
              refunds done ────▼
                            ARCHIVED
```

---

## 4. WebSocket Event Stream

All connected dashboard clients receive real-time events:

| Event | Payload | Trigger |
|-------|---------|---------|
| `auction:created` | `{ id, resource, startingBid, endsAt }` | New auction opens |
| `bid:placed` | `{ auctionId, agentId, amount, txHash, rank }` | Any bid lands |
| `bid:outbid` | `{ auctionId, agentId, refundTxHash }` | Agent is outbid + refunded |
| `auction:closing` | `{ auctionId, winner, finalBid }` | Timer hits zero |
| `auction:settled` | `{ auctionId, settlementTxHash, refundTxHashes[] }` | Contract settles |
| `resource:delivered` | `{ auctionId, agentId, resourceType }` | Winner gets resource |
| `agent:balance` | `{ agentId, newBalance }` | Any wallet change |

---

## 5. x402 Payment Flow Detail

```
Standard x402 (existing):
  Agent → GET /resource → 402 {price: "$0.01"} → Agent pays → 200 OK

BidWire x402 (auction mode):
  Agent → GET /resource/:id → 402 {
    auctionId: "abc123",
    currentLeader: "AgentD",
    currentBid: "0.25",
    minNextBid: "0.30",          ← must beat this
    escrowAddress: "GABC...XYZ", ← pay HERE, not provider
    endsAt: 1744567890,
    scheme: "exact",
    network: "stellar:testnet",
    asset: "USDC"
  }
  → Agent decides bid amount ≥ minNextBid
  → Agent signs x402 auth for bid amount TO escrowAddress
  → Agent → GET /resource/:id (with X-PAYMENT) → 200 {
      status: "bid_accepted",
      rank: 1,
      currentBid: "0.30",
      txHash: "abc..."
    }
```

---

## 6. Page Navigation Map

```
/ (Landing)
├── /auctions (Auction Board)
│   └── /auctions/:id (Auction Detail)
├── /agents (Agent Overview)
│   └── /agents/:id (Agent Profile)
└── /history (Past Auctions)
```
