# BidWire — Skills & Competencies Required

---

## Overview

This document maps the skills needed to build BidWire, matched to specific tasks. Use this to divide work across a team or to identify which skills to prioritise if building solo.

---

## Skill Map by Component

### 1. Soroban Smart Contract
**Difficulty: High | Time: Day 1**

| Skill | Level Required | Used For |
|-------|---------------|----------|
| Rust programming | Intermediate | Writing the contract |
| Soroban SDK | Beginner–Intermediate | Storage, auth, token transfers |
| Smart contract security | Basic | Ensuring escrow can't be drained |
| Stellar CLI | Basic | Deploy, invoke, inspect |
| Unit testing (Rust) | Basic | `soroban_sdk::testutils` |

**Key concepts to know:**
- `soroban_sdk::token::Client` — for USDC SAC transfers
- `env.invoker()` — who's calling the contract
- `storage().instance()` vs `storage().persistent()` — data lifetime
- `env.events().publish()` — emitting events for the backend to consume
- `Address::require_auth()` — ensures the bidder authorises the payment

**Resources:**
- [Soroban Docs](https://developers.stellar.org/docs/build/smart-contracts)
- [Soroban by Example](https://soroban.stellar.org/docs/learn/examples)
- [Token interface reference](https://developers.stellar.org/docs/tokens/stellar-asset-contract)

---

### 2. x402 Integration
**Difficulty: Medium | Time: Day 1 (backend), Day 2 (agents)**

| Skill | Level Required | Used For |
|-------|---------------|----------|
| HTTP protocol knowledge | Intermediate | Understanding 402 response semantics |
| Express.js middleware | Intermediate | Custom x402 handler |
| x402 SDK (`@x402/express`) | Basic | Standard integration |
| Soroban authorization entries | Intermediate | Custom auth for escrow payments |

**Key concepts to know:**
- Standard x402 flow: `GET → 402 → GET with X-PAYMENT → 200`
- BidWire modification: `payTo` is the **escrow contract**, not the provider
- `x402Version: 1` — required in all 402 responses
- Soroban auth entries: `SorobanAuthorizationEntry` serialised to base64 for the `X-PAYMENT` header

**Resources:**
- [x402 Spec](https://github.com/coinbase/x402)
- [x402 on Stellar docs](https://developers.stellar.org/docs/build/agentic-payments/x402)
- [OpenZeppelin Facilitator](https://docs.openzeppelin.com/relayer/guides/stellar-x402-facilitator-guide)

---

### 3. Backend (Node.js + Stellar SDK)
**Difficulty: Medium | Time: Days 1–2**

| Skill | Level Required | Used For |
|-------|---------------|----------|
| Node.js / TypeScript | Intermediate | All backend logic |
| Express.js | Intermediate | HTTP server + routes |
| stellar-sdk (JS) | Intermediate | Invoking contracts, reading chain state |
| WebSocket (ws library) | Basic | Broadcasting real-time events |
| State machine design | Basic | Auction lifecycle management |
| Async/await patterns | Intermediate | Non-blocking auction logic |

**Key `stellar-sdk` operations needed:**
```typescript
// Build and submit a contract invocation
const contract = new Contract(contractId)
const operation = contract.call('submit_bid', ...)
const tx = new TransactionBuilder(account, { fee: '100' })
  .addOperation(operation)
  .setTimeout(30)
  .build()
```

---

### 4. Bidder Agents
**Difficulty: Medium | Time: Day 2**

| Skill | Level Required | Used For |
|-------|---------------|----------|
| TypeScript OOP | Intermediate | Agent class hierarchy |
| Stellar SDK keypair management | Basic | Agent wallets |
| x402 client-side flow | Intermediate | Submitting bids with payment proof |
| Async polling patterns | Basic | Agents checking auctions every 2s |
| Strategy pattern (design pattern) | Basic | Pluggable bidding strategies |

**The hardest part:** Building the x402 payment header on the client side. The agent must:
1. Simulate a Soroban auth entry authorising payment to the escrow contract
2. Serialise it correctly for the `X-PAYMENT` header
3. Handle `bid_accepted`, `outbid`, and `auction_closed` responses correctly

---

### 5. Frontend (Next.js + Three.js)
**Difficulty: Medium–High | Time: Day 3**

| Skill | Level Required | Used For |
|-------|---------------|----------|
| React + Next.js 14 (App Router) | Intermediate | Page structure, routing |
| TypeScript | Intermediate | Type safety across components |
| Tailwind CSS | Basic–Intermediate | Layout and utility styling |
| Three.js | Intermediate | 3D background scenes |
| `@react-three/fiber` | Basic | React bindings for Three.js |
| Framer Motion | Basic | Page transitions, bid animations |
| WebSocket client (socket.io) | Basic | Live data consumption |
| CSS variables + theming | Basic | Consistent color system |

**The hardest part:** The Three.js scenes. Specifically:
- Keeping the canvas performant while React re-renders (use `useRef` not `useState` for Three.js objects)
- The countdown vortex — particle system speed tied to auction timer requires `useFrame` + external ref to countdown value
- Ensuring 3D canvas doesn't block pointer events on UI elements above it (`pointer-events: none` on canvas)

**Three.js pattern to know:**
```tsx
function BidOrbs() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  useFrame((state, delta) => {
    // Animate on every frame — keep this cheap
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05
    }
  })
  return <instancedMesh ref={meshRef} args={[undefined, undefined, 200]} />
}
```

---

## Solo Builder Prioritisation

If building alone, this is the order of operations:

```
Priority 1 (non-negotiable): Soroban contract + x402 handler
  → Without this, nothing else matters

Priority 2 (needed for demo): 3 agents + auction engine
  → Need at least 3 bidding agents for a compelling demo

Priority 3 (wins the hackathon): Frontend dashboard
  → The visual is what judges remember

Priority 4 (polish): Reverse auction + all 5 agents
  → Nice to have, adds depth
```

---

## Team Split (2–3 people)

### 2-person team
| Person | Owns |
|--------|------|
| A | Soroban contract + x402 backend + agents |
| B | Frontend dashboard (all 5 pages + 3D scenes) |

### 3-person team
| Person | Owns |
|--------|------|
| A | Soroban contract + x402 handler |
| B | Auction engine + agents + WebSocket |
| C | Frontend (all pages + 3D + animations) |

---

## Learning Resources

| Topic | Resource |
|-------|---------|
| Soroban (general) | https://developers.stellar.org/docs/build/smart-contracts |
| x402 protocol | https://github.com/coinbase/x402 |
| x402 on Stellar | https://developers.stellar.org/docs/build/agentic-payments/x402 |
| MPP on Stellar | https://developers.stellar.org/docs/build/agentic-payments/mpp |
| OpenZeppelin Facilitator | https://docs.openzeppelin.com/relayer/guides/stellar-x402-facilitator-guide |
| Three.js fundamentals | https://threejs-journey.com |
| `@react-three/fiber` | https://docs.pmnd.rs/react-three-fiber |
| Framer Motion | https://www.framer.com/motion |
| Stellar testnet faucet | https://laboratory.stellar.org/#account-creator?network=test |
| Stellar Lab (tx inspector) | https://laboratory.stellar.org |

---

## Hackathon-Specific Tips

1. **Use the OpenZeppelin facilitator** — don't try to run your own. It covers network fees and handles x402 verification. Free for testnet.

2. **Deploy the Soroban contract early** — testnet can be slow. Get your contract ID on Day 1 and hard-code it. Don't redeploy unless you have to.

3. **Mock the resource delivery** — the GPU compute, data feed, and API quota don't need to be real. Return plausible JSON responses. Judges don't care what the resource is; they care about the payment flow.

4. **The demo video is the submission** — a clean 90-second video showing live bids, live Stellar txHashes, and a clean settlement beats a technically perfect repo with a bad demo every time.

5. **Prioritise the bid feed UI** — the live bid feed with txHashes is the single most compelling visual element. Build it well before anything else on the frontend.
