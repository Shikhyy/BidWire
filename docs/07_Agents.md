# BidWire — Agents

---

## Overview

BidWire ships with 5 pre-built bidder agents, each with a distinct personality, bidding strategy, and risk profile. They run concurrently and compete against each other in every auction. Their diversity creates realistic market dynamics — the same resource won't always be won by the same agent, and the final price reflects genuine competition.

Agents are autonomous Node.js processes. They have Stellar wallets, hold USDC, and submit bids via the x402 protocol. They require zero human input once started.

---

## Agent Roster

### 1. NovaBid
**Strategy: Aggressive**
> "Win at all costs within budget."

| Property | Value |
|----------|-------|
| Color | `#efd3d7` (blush) |
| Budget cap | $5.00 USDC |
| Bid style | Outbids current leader by 50% of remaining auction value |
| Stop condition | Budget < $0.10 remaining |
| Response time | Bids within 1 second of seeing a new leader |

**Behaviour:**
NovaBid monitors every auction and always attempts to be the current leader. When outbid, it immediately re-bids. It calculates its next bid as `max(minNextBid, currentBid * 1.5)` — escalating aggressively. It only stops when it would exceed its budget cap. NovaBid wins the most auctions but often overpays.

**Code sketch:**
```typescript
class NovaBidAgent extends BaseAgent {
  async decideBid(auction: AuctionState): Promise<number | null> {
    const nextBid = Math.max(
      auction.minNextBid,
      auction.currentBid * 1.5
    )
    if (nextBid > this.remainingBudget) return null  // stop
    return nextBid
  }
  get responseDelayMs() { return 800 + Math.random() * 400 }
}
```

---

### 2. GridMind
**Strategy: Conservative**
> "Only bid what it's worth. Never a cent more."

| Property | Value |
|----------|-------|
| Color | `#dee2ff` (periwinkle) |
| Budget cap | $2.00 USDC |
| Bid style | Minimum increment only, stops at internal value ceiling |
| Stop condition | Auction price exceeds fair value estimate |
| Response time | 3–6 seconds (deliberate, methodical) |

**Behaviour:**
GridMind has an internal valuation model for each resource type (e.g., GPU compute is worth max $0.40 to it). It only bids the minimum increment and immediately stops if the price exceeds its valuation. It rarely wins fast auctions but wins long ones where NovaBid has drained its budget. GridMind has the best cost-efficiency ratio.

**Code sketch:**
```typescript
class GridMindAgent extends BaseAgent {
  private valuations: Record<ResourceType, number> = {
    GPU_COMPUTE: 0.40,
    DATA_FEED: 0.25,
    API_QUOTA: 0.30,
    TASK_ASSIGNMENT: 0.15,
  }

  async decideBid(auction: AuctionState): Promise<number | null> {
    const ceiling = this.valuations[auction.resourceType]
    if (auction.minNextBid > ceiling) return null  // not worth it
    return auction.minNextBid  // always minimum increment
  }
  get responseDelayMs() { return 3000 + Math.random() * 3000 }
}
```

---

### 3. PulseBot
**Strategy: Sniper**
> "Wait. Watch. Strike at the last second."

| Property | Value |
|----------|-------|
| Color | `#cbc0d3` (lavender) |
| Budget cap | $3.50 USDC |
| Bid style | Silent until final 5 seconds, then one decisive bid |
| Stop condition | Would need to exceed 80% of budget on a single auction |
| Response time | Bids only when `timeRemaining < 5000ms` |

**Behaviour:**
PulseBot observes every auction but never places a bid until the final 5 seconds. At that point, it places a single bid 10% above the current leader. This strategy is highly effective in longer auctions (30s+) because aggressive agents exhaust their budgets before PulseBot enters. In short auctions (<10s) it has less advantage. PulseBot creates the most dramatic demo moments.

**Code sketch:**
```typescript
class PulseBotAgent extends BaseAgent {
  async decideBid(auction: AuctionState): Promise<number | null> {
    const timeRemaining = auction.closesAt.getTime() - Date.now()
    if (timeRemaining > 5000) return null  // too early — wait

    const sniperBid = auction.currentBid * 1.10
    if (sniperBid > this.budgetCap * 0.8) return null
    return sniperBid
  }
  get responseDelayMs() { return 100 }  // sniper bids fast when it strikes
}
```

---

### 4. FluxAgent
**Strategy: Random**
> "Chaos is a strategy too."

| Property | Value |
|----------|-------|
| Color | `#8e9aaf` (slate) |
| Budget cap | $1.50 USDC |
| Bid style | Random increment between 5% and 120% above minimum |
| Stop condition | Balance < $0.20 |
| Response time | Random 1–8 seconds |

**Behaviour:**
FluxAgent introduces genuine unpredictability. Its bid amounts are random within a range, its response time is random, and it sometimes skips auctions entirely (30% chance). This creates realistic market noise and prevents other agents from perfectly predicting auction outcomes. In real markets, some participants are irrational — FluxAgent models that.

**Code sketch:**
```typescript
class FluxAgentAgent extends BaseAgent {
  async decideBid(auction: AuctionState): Promise<number | null> {
    if (Math.random() < 0.30) return null  // skip this auction entirely

    const multiplier = 1.05 + Math.random() * 1.15  // 5% to 120% above min
    const bid = auction.minNextBid * multiplier
    if (bid > this.currentBalance) return null
    return Math.round(bid * 100) / 100  // round to 2dp
  }
  get responseDelayMs() { return 1000 + Math.random() * 7000 }
}
```

---

### 5. CalmNode
**Strategy: Budget-Aware**
> "Spend wisely across many auctions, not everything on one."

| Property | Value |
|----------|-------|
| Color | `#feeafa` (mist) |
| Budget cap | $4.00 USDC |
| Bid style | Dynamic — increases aggression as auction nears end |
| Stop condition | Current auction spend > 25% of total remaining budget |
| Response time | 2–4 seconds |

**Behaviour:**
CalmNode tracks its total spend rate across all auctions and self-limits to preserve capital for future rounds. It won't spend more than 25% of its remaining budget on any single auction. As the auction progresses, it becomes more aggressive (FOMO effect) — but only if the per-auction spend cap hasn't been hit. CalmNode tends to win medium-value auctions that NovaBid and PulseBot aren't focused on.

**Code sketch:**
```typescript
class CalmNodeAgent extends BaseAgent {
  async decideBid(auction: AuctionState): Promise<number | null> {
    const maxSpendThisAuction = this.currentBalance * 0.25
    const alreadySpentHere = this.spentInAuction(auction.id)

    if (alreadySpentHere >= maxSpendThisAuction) return null

    // FOMO factor: bid more aggressively near the end
    const timeProgress = 1 - (auction.closesAt.getTime() - Date.now()) / auction.durationMs
    const aggressionMultiplier = 1 + timeProgress * 0.5  // 1.0 → 1.5

    const bid = auction.minNextBid * aggressionMultiplier
    if (bid + alreadySpentHere > maxSpendThisAuction) return null
    return bid
  }
  get responseDelayMs() { return 2000 + Math.random() * 2000 }
}
```

---

## Base Agent Class

All agents extend `BaseAgent`:

```typescript
// agents/src/baseAgent.ts
abstract class BaseAgent {
  id: string
  name: string
  keypair: Keypair          // Stellar keypair
  stellarAddress: string
  currentBalance: number
  budgetCap: number
  bidsPlaced: number = 0
  wins: number = 0
  auctionSpend: Map<string, number> = new Map()

  abstract decideBid(auction: AuctionState): Promise<number | null>
  abstract get responseDelayMs(): number

  async start(): Promise<void> {
    console.log(`[${this.name}] Starting. Balance: $${this.currentBalance} USDC`)
    while (true) {
      const openAuctions = await this.fetchOpenAuctions()
      for (const auction of openAuctions) {
        const bidAmount = await this.decideBid(auction)
        if (bidAmount !== null) {
          await this.placeBid(auction.id, bidAmount)
        }
      }
      await sleep(2000)  // poll every 2 seconds
    }
  }

  async placeBid(auctionId: string, amount: number): Promise<void> {
    // 1. Build Soroban auth entry for x402 payment to escrow
    // 2. Submit GET /resource/:auctionId with X-PAYMENT header
    // 3. Handle response: bid_accepted, outbid, auction_closed
    // 4. Update local balance tracking
  }

  spentInAuction(auctionId: string): number {
    return this.auctionSpend.get(auctionId) ?? 0
  }

  get remainingBudget(): number {
    return this.budgetCap - Array.from(this.auctionSpend.values()).reduce((a, b) => a + b, 0)
  }
}
```

---

## Agent Simulation Dynamics

### How they interact in a 30-second auction:

```
0s   — Auction opens. All agents see 402 response.
2s   — FluxAgent (random) bids $0.12. NovaBid bids $0.18 immediately.
4s   — GridMind bids $0.20 (minimum increment). CalmNode watches.
6s   — NovaBid bids $0.27 (aggressive). GridMind: price > valuation, stops.
10s  — FluxAgent bids $0.31 (random). CalmNode bids $0.33 (FOMO starting).
14s  — NovaBid bids $0.47 (aggressive). FluxAgent: balance low, stops.
18s  — CalmNode bids $0.52. Auction spend cap check: OK.
22s  — NovaBid bids $0.74. CalmNode: 25% spend cap hit, stops.
25s  — PulseBot wakes up (5 seconds remaining). Bids $0.81.
27s  — NovaBid bids $1.10 (budget running low). Final push.
30s  — Auction closes. NovaBid wins at $1.10.
      — PulseBot refunded $0.81. CalmNode refunded $0.52. FluxAgent refunded $0.31. GridMind refunded $0.20.
```

This creates a compelling live narrative that judges can follow visually in real time.

---

## Agent Startup Command

```bash
# Start all agents
pnpm --filter agents dev

# Start individual agent (for debugging)
pnpm --filter agents start:novabid
pnpm --filter agents start:gridmind

# Fund all agent wallets with testnet USDC
pnpm --filter agents fund
```
