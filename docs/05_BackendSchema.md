# BidWire — Backend & Schema

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js)                     │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Express    │  │  Auction     │  │   WebSocket    │  │
│  │  HTTP API   │  │  Engine      │  │   Server       │  │
│  │  + x402     │  │  (State SM)  │  │   (ws)         │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                │                   │           │
│         └────────────────┼───────────────────┘           │
│                          │                               │
│                 ┌────────▼────────┐                      │
│                 │  In-Memory Store│                      │
│                 │  (Map + Redis   │                      │
│                 │   optional)     │                      │
│                 └────────┬────────┘                      │
│                          │                               │
│                 ┌────────▼────────┐                      │
│                 │  Soroban Client │                      │
│                 │  (stellar-sdk)  │                      │
│                 └────────┬────────┘                      │
└──────────────────────────┼───────────────────────────────┘
                           │
                  ┌────────▼────────┐
                  │ Stellar Testnet │
                  │ (Soroban + USDC)│
                  └─────────────────┘
```

---

## Data Schemas

### Auction

```typescript
interface Auction {
  id: string                    // uuid
  resourceType: ResourceType    // 'GPU_COMPUTE' | 'DATA_FEED' | 'API_QUOTA' | 'TASK'
  resourceId: string            // references the actual resource
  description: string
  provider: {
    address: string             // Stellar wallet address
    name: string
  }
  mode: 'STANDARD' | 'REVERSE' // standard = highest wins, reverse = lowest wins
  status: AuctionStatus         // PENDING | OPEN | CLOSING | SETTLED | CANCELLED
  bids: Bid[]
  winner?: Bid
  escrowAddress: string         // Soroban contract address for this auction
  contractId: string            // Soroban contract ID
  startingBid: number           // in USDC
  currentBid: number            // in USDC, updates as bids arrive
  minIncrement: number          // minimum bid increment
  reservePrice?: number         // optional minimum acceptable price
  openedAt: Date
  closesAt: Date
  settledAt?: Date
  settlementTxHash?: string
  accessToken?: string          // given to winner post-settlement
  createdAt: Date
}

type AuctionStatus = 'PENDING' | 'OPEN' | 'CLOSING' | 'SETTLED' | 'CANCELLED'

type ResourceType = 'GPU_COMPUTE' | 'DATA_FEED' | 'API_QUOTA' | 'TASK_ASSIGNMENT'
```

### Bid

```typescript
interface Bid {
  id: string
  auctionId: string
  agentId: string
  agentAddress: string          // Stellar wallet address
  amount: number                // USDC
  txHash: string                // Stellar transaction hash
  sorobanAuthEntry: string      // serialised x402 auth entry
  status: BidStatus
  placedAt: Date
  refundedAt?: Date
  refundTxHash?: string
  rank: number                  // 1 = current leader
}

type BidStatus = 'PENDING' | 'ACCEPTED' | 'OUTBID' | 'REFUNDED' | 'WON' | 'LOST'
```

### Agent

```typescript
interface Agent {
  id: string
  name: string                  // 'NovaBid', 'GridMind', etc.
  stellarAddress: string
  strategy: AgentStrategy
  budgetCap: number             // max USDC to spend per session
  currentBalance: number        // live USDC balance
  totalBidsPlaced: number
  totalWins: number
  totalSpent: number
  isActive: boolean
  color: string                 // hex, for UI display
}

type AgentStrategy = 'AGGRESSIVE' | 'CONSERVATIVE' | 'SNIPER' | 'RANDOM' | 'BUDGET_AWARE'
```

### Resource

```typescript
interface Resource {
  id: string
  type: ResourceType
  name: string
  description: string
  providerAddress: string
  endpoint: string              // x402-protected URL
  currentAuctionId?: string
  deliveryType: 'COMPUTE' | 'DATA' | 'TOKEN'
  specs: Record<string, unknown> // GPU VRAM, data type, quota amount, etc.
}
```

### WebSocket Event

```typescript
interface WSEvent {
  type: WSEventType
  timestamp: Date
  payload: Record<string, unknown>
}

type WSEventType =
  | 'auction:created'
  | 'auction:closing'
  | 'auction:settled'
  | 'bid:placed'
  | 'bid:outbid'
  | 'resource:delivered'
  | 'agent:balance'
  | 'system:ping'
```

---

## REST API Endpoints

### Auctions

```
POST   /api/auctions                  Create new auction
GET    /api/auctions                  List auctions (filter by status, type)
GET    /api/auctions/:id              Get auction detail with all bids
POST   /api/auctions/:id/start        Manually open a PENDING auction
POST   /api/auctions/:id/cancel       Cancel before any bids

GET    /api/resource/:auctionId       x402-protected — returns 402 or resource
```

### Agents

```
GET    /api/agents                    List all agents + live balances
GET    /api/agents/:id                Agent profile + bid history
POST   /api/agents/:id/fund           Add testnet USDC to agent wallet
POST   /api/agents/start              Start all bidder agents
POST   /api/agents/stop               Stop all bidder agents
```

### History

```
GET    /api/history                   Past settled auctions
GET    /api/history/:id               Settled auction detail + receipt
GET    /api/stats                     Platform totals (volume, auctions, agents)
```

---

## Soroban Contract Interface

### Contract: `bidwire_escrow`

```rust
// Storage keys
const AUCTION: Symbol = symbol_short!("AUCTION");
const BIDS: Symbol = symbol_short!("BIDS");
const ADMIN: Symbol = symbol_short!("ADMIN");

// Structs
#[contracttype]
pub struct AuctionState {
    pub auction_id: Symbol,
    pub provider: Address,
    pub mode: AuctionMode,          // Standard or Reverse
    pub current_leader: Option<Address>,
    pub current_bid: i128,          // in stroops (1 USDC = 10^7 stroops)
    pub min_increment: i128,
    pub status: AuctionStatus,
    pub bid_count: u32,
}

#[contracttype]
pub struct Bid {
    pub bidder: Address,
    pub amount: i128,
    pub timestamp: u64,
}

// Functions
pub fn init(env: Env, admin: Address, provider: Address, starting_bid: i128, min_increment: i128) -> Symbol

pub fn submit_bid(env: Env, auction_id: Symbol, bidder: Address, amount: i128) -> Result<BidReceipt, AuctionError>
// - Validates amount >= current_bid + min_increment
// - Holds new bid in escrow
// - Refunds previous leader atomically
// - Emits bid_placed event

pub fn close_auction(env: Env, auction_id: Symbol) -> Result<Settlement, AuctionError>
// - Can only be called by admin (auction engine)
// - Transfers winner's bid to provider
// - Refunds all other bids
// - Emits auction_settled event
// - Returns Settlement { winner, amount, tx_hash }

pub fn get_state(env: Env, auction_id: Symbol) -> AuctionState

pub fn get_bids(env: Env, auction_id: Symbol) -> Vec<Bid>
```

### Contract Errors

```rust
#[contracterror]
pub enum AuctionError {
    AuctionNotOpen = 1,
    BidTooLow = 2,
    BidderIsLeader = 3,
    AuctionAlreadyClosed = 4,
    Unauthorised = 5,
    InsufficientFunds = 6,
}
```

---

## x402 Auction-Mode Handler

Custom handler that replaces the standard fixed-price x402 middleware:

```typescript
// backend/src/x402handler.ts
export function auctionX402Handler(req: Request, res: Response, next: NextFunction) {
  const { auctionId } = req.params
  const auction = auctionEngine.get(auctionId)

  if (!auction || auction.status !== 'OPEN') {
    return res.status(404).json({ error: 'Auction not found or not open' })
  }

  // Check if request has a valid x402 payment header
  const paymentHeader = req.headers['x-payment']

  if (!paymentHeader) {
    // Return 402 with auction metadata (not standard x402 fixed price)
    return res.status(402).json({
      x402Version: 1,
      error: 'Payment required — auction bid',
      auction: {
        id: auction.id,
        resourceType: auction.resourceType,
        currentBid: auction.currentBid,
        minNextBid: auction.currentBid + auction.minIncrement,
        currentLeader: auction.winner?.agentId ?? null,
        endsAt: auction.closesAt.toISOString(),
        escrowAddress: auction.escrowAddress,
      },
      accepts: [{
        scheme: 'exact',
        network: 'stellar:testnet',
        asset: 'USDC',
        payTo: auction.escrowAddress,        // ← pays ESCROW, not provider
        minAmount: String(auction.currentBid + auction.minIncrement),
      }]
    })
  }

  // Validate payment, submit to Soroban, return bid confirmation
  return validateAndSubmitBid(req, res, auction, paymentHeader)
}
```

---

## Environment Variables

```bash
# Stellar
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
ADMIN_SECRET_KEY=S...                   # auction engine's Stellar keypair
CONTRACT_WASM_PATH=./contracts/bidwire_escrow.wasm

# x402
X402_FACILITATOR_URL=https://channels.openzeppelin.com/x402/testnet
X402_FACILITATOR_API_KEY=...

# App
PORT=3001
REDIS_URL=redis://localhost:6379        # optional
NODE_ENV=development
```
