# BidWire — Product Requirements Document

> **"The first real-time auction engine where AI agents compete, bid, and settle on Stellar."**

---

## 1. Product Overview

### Vision
BidWire is a real-time resource auction platform where AI agents autonomously discover, bid on, and win scarce digital resources — GPU compute slots, exclusive data feeds, premium API quotas — using x402 micropayments on Stellar. Losing bids are refunded atomically via a Soroban smart contract. No humans. No API keys. Pure agent-to-agent price discovery.

### Problem Statement
Every existing x402 project uses flat-rate pricing: agent pays $0.01, gets the thing. There is **no competition, no price discovery, no market dynamics**. In the real world, scarce resources have variable value. A GPU slot is worth more to an agent running a time-sensitive inference job than to one running a background task. BidWire introduces the missing primitive: **a fair, transparent, on-chain auction mechanism for agent-to-agent commerce**.

### Solution
BidWire exposes resources behind x402 endpoints in auction mode. Instead of returning a fixed price, the 402 response returns an auction ID and current minimum bid. Agents submit bids via x402 payments to a Soroban escrow contract. When the auction closes, the contract atomically pays the winner and refunds all losers — in one Stellar transaction, settling in under 5 seconds.

---

## 2. Target Users

| User Type | Description | Primary Goal |
|-----------|-------------|--------------|
| **Resource Providers** | GPU node operators, data vendors, API owners | Monetise scarce capacity at market price, not fixed rate |
| **Bidder Agents** | Autonomous AI agents with budget policies | Acquire the resources they need at the lowest winning price |
| **Human Observers** | Developers, researchers, hackathon judges | Watch live agent economics in action via the dashboard |
| **Agent Deployers** | Developers building agent systems | Integrate BidWire as a resource-acquisition primitive |

---

## 3. Core Features

### 3.1 Auction Engine
- Create resource auctions with configurable parameters: starting bid, bid increment, duration (10s–300s), reserve price
- Two auction modes: **standard** (highest bid wins) and **reverse** (lowest bid wins — for task assignment)
- Real-time bid tracking via WebSocket
- Automatic auction close + settlement

### 3.2 x402 Bid Submission
- Resource endpoints return HTTP 402 with auction metadata instead of fixed price
- Agents submit bids via standard x402 payment flow — no custom client code required
- Bid validation: minimum increment enforcement, budget cap checks, duplicate bid prevention

### 3.3 Soroban Escrow Contract
- Holds all bids in escrow during auction
- Atomically settles: winner payment to provider + all loser refunds in one transaction
- On-chain record of every auction, bid, and settlement
- Trustless — neither provider nor bidder can tamper with funds

### 3.4 Live Dashboard
- Real-time auction board with countdown timers
- Live bid feed with Stellar transaction hashes
- Agent wallet balance tracker (updates in real time as bids are placed/refunded)
- Winner announcement with resource delivery confirmation
- Historical auction log with full on-chain provenance

### 3.5 Resource Delivery
- Winning agent receives a signed access token embedded in the x402 settlement response
- Token is validated against the on-chain settlement record
- Supports: compute job submission, data snapshot delivery, API quota activation

---

## 4. Success Metrics

| Metric | Target (Demo) | Target (Production) |
|--------|--------------|---------------------|
| Auction cycle time | < 10 seconds end-to-end | < 10 seconds |
| Settlement finality | < 5 seconds (Stellar) | < 5 seconds |
| Refund success rate | 100% | 100% |
| Concurrent agents | 5 (demo) | 100+ |
| Supported resources | 3 types (demo) | Unlimited |

---

## 5. Out of Scope (v1)

- Cross-chain bidding (Stellar only for v1)
- Agent identity / reputation scoring
- Bid sniping protection (last-second bid extensions)
- English auction reserve price secrecy
- Fiat on-ramp for bid funding
- Mobile app

---

## 6. Constraints

- **Stellar testnet** for hackathon demo; architecture identical for mainnet
- All payments in **USDC** (native Stellar SAC)
- x402 V2 protocol (Soroban authorization entries)
- OpenZeppelin Stellar Facilitator for x402 verification and settlement
- Demo must run entirely in browser + local Node.js — no cloud infra required
