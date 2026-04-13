const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

const RESOURCE_TYPES = ['GPU', 'DATA', 'QUOTA'] as const;
const RESOURCE_DESCRIPTIONS: Record<string, string[]> = {
  GPU: ['NVIDIA H100 GPU Compute', 'A100 GPU Cluster', 'RTX 4090 Rendering'],
  DATA: ['Market Data Feed', 'Crypto Price Oracle', 'Weather API'],
  QUOTA: ['API Quota - 1000 reqs', 'Webhook Credits', 'Search Tier'],
};

const BIDDERS = [
  'GCNOVA111111111111111111111',
  'GCGRID11111111111111111111',
  'GCPULSE1111111111111111111',
  'GCFLUX111111111111111111111',
  'GCCALM111111111111111111111',
];

async function createAuction() {
  const type = RESOURCE_TYPES[Math.floor(Math.random() * RESOURCE_TYPES.length)];
  const descArr = RESOURCE_DESCRIPTIONS[type] || RESOURCE_DESCRIPTIONS.GPU;
  const desc = descArr[Math.floor(Math.random() * descArr.length)];
  
  const auction = {
    resourceType: type,
    resourceDescription: desc,
    startingBid: (Math.random() * 0.2 + 0.1).toFixed(2),
    minIncrement: 0.05,
    reservePrice: (Math.random() * 1 + 0.5).toFixed(2),
    duration: Math.floor(Math.random() * 30 + 20),
  };
  
  const res = await fetch(`${BACKEND_URL}/api/auctions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(auction),
  });
  
  if (!res.ok) return null;
  
  const created = (await res.json()) as { id: string };
  await fetch(`${BACKEND_URL}/api/auctions/${created.id}/start`, {
    method: 'POST',
  });
  
  return created.id;
}

async function placeBid(auctionId: string) {
  const bidder = BIDDERS[Math.floor(Math.random() * BIDDERS.length)];
  const amount = (Math.random() * 0.5 + 0.15).toFixed(2);
  
  try {
    await fetch(`${BACKEND_URL}/api/auctions/${auctionId}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount), bidderPublicKey: bidder }),
    });
  } catch {}
}

async function runDemo(durationMs: number = 60000, auctionCount: number = 3) {
  console.log(`
╔══════════════════════════════════════════════════╗
║           BidWire Demo Mode                  ║
╚══════════════════════════════════════════════════╝
  `);
  
  console.log(`[Demo] Creating ${auctionCount} auctions...`);
  const auctionIds: string[] = [];
  
  for (let i = 0; i < auctionCount; i++) {
    const id = await createAuction();
    if (id) auctionIds.push(id);
  }
  
  console.log(`[Demo] Created ${auctionIds.length} auctions`);
  console.log(`[Demo] Simulating bids for ${durationMs / 1000}s...`);
  
  const endTime = Date.now() + durationMs;
  
  while (Date.now() < endTime) {
    for (const auctionId of auctionIds) {
      if (Math.random() > 0.3) {
        await placeBid(auctionId);
      }
    }
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
  }
  
  console.log('[Demo] Complete!');
  console.log('[Demo] Check http://localhost:3000 for dashboard');
}

const args = process.argv.slice(2);
if (args[0] === 'demo') {
  runDemo(parseInt(args[1]) || 60000, parseInt(args[2]) || 3);
} else {
  (async () => {
    await runDemo(30000, 2);
    process.exit(0);
  })();
}