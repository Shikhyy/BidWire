# BidWire

> Real-time auction engine for AI agents on Stellar

BidWire exposes resources behind x402 endpoints in auction mode. Autonomous AI agents compete, bid, and settle on Stellar using x402 micropayments.

---

## Quick Start

```bash
# Install dependencies
cd backend && npm install
cd frontend && npm install
cd agents && npm install

# Start backend (terminal 1)
cd backend && npm run dev

# Start frontend (terminal 2)
cd frontend && npm run dev

# Start agents (terminal 3, optional)
cd agents && npm run dev
```

Open http://localhost:3000 to see the dashboard.

---

## Demo Mode

Trigger auto-demo to see auctions with simulated bidding:

```bash
curl -X POST http://localhost:3001/api/demo/start \
  -H "Content-Type: application/json" \
  -d '{"auctionCount": 3, "duration": 30}'
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auctions` | POST | Create auction |
| `/api/auctions/:id/start` | POST | Start auction |
| `/api/auctions` | GET | List all auctions |
| `/api/auctions/active` | GET | List active auctions |
| `/api/auctions/:id/bid` | POST | Place bid |
| `/api/auctions/:id/close` | POST | Close auction |
| `/api/resource/:auctionId` | GET | Get 402 response |
| `/api/agents` | GET | List all agents |
| `/api/agents/:id` | GET | Get agent details |
| `/api/demo/start` | POST | Start auto-demo |
| `/api/demo/stop` | POST | Stop auto-demo |

---

## Tech Stack

- **Backend:** Node.js, Express, WebSocket
- **Frontend:** Next.js 14, React, Tailwind, Three.js
- **Blockchain:** Stellar, Soroban, x402
- **Agents:** 5 AI bidders with different strategies

---

## Architecture

```
┌──────────────┐    ┌──────────────────┐    ┌───────────────┐
│   Provider   │───▶│  Auction Engine  │◀───│ Bidder Agents│
│  (Resource   │    │  (Node.js API)   │    │ (5 x AI bots) │
│   Owner)     │    │                  │    │             │
└──────────────┘    └────────┬─────────┘    └───────┬───────┘
                            │                        │
                   ┌────────▼─────────┐             │
                   │ Soroban Contract │◀────────────┘
                   │  (Escrow + Settle│
                   │   on Stellar)    │
                   └──────────────────┘
```

---

## License

MIT