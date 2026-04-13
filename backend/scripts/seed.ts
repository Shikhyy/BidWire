const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

const SEED_AUCTIONS = [
  {
    resourceType: 'GPU',
    resourceDescription: 'NVIDIA H100 GPU Compute (1 hour)',
    startingBid: 0.10,
    minIncrement: 0.05,
    reservePrice: 1.00,
    duration: 30,
  },
  {
    resourceType: 'DATA',
    resourceDescription: 'Premium Market Data Feed (24 hours)',
    startingBid: 0.25,
    minIncrement: 0.10,
    reservePrice: 2.00,
    duration: 45,
  },
  {
    resourceType: 'QUOTA',
    resourceDescription: 'API Quota - 1000 requests/month',
    startingBid: 0.15,
    minIncrement: 0.05,
    reservePrice: 1.50,
    duration: 60,
  },
];

const AGENTS = [
  { agentId: 'nova', name: 'NovaBid', strategy: 'aggressive', budget: 5.00 },
  { agentId: 'grid', name: 'GridMind', strategy: 'conservative', budget: 2.00 },
  { agentId: 'pulse', name: 'PulseBot', strategy: 'sniper', budget: 3.50 },
  { agentId: 'flux', name: 'FluxAgent', strategy: 'random', budget: 1.50 },
  { agentId: 'calm', name: 'CalmNode', strategy: 'budgetAware', budget: 4.00 },
];

async function seed() {
  console.log(`
╔══════════════════════════════════════════════════╗
║           BidWire Seed Script                   ║
╚══════════════════════════════════════════════════╝
  `);

  try {
    console.log('[Seed] Creating auctions...');
    
    for (const auction of SEED_AUCTIONS) {
      const res = await fetch(`${BACKEND_URL}/api/auctions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auction),
      });
      
      if (!res.ok) {
        const err = await res.text();
        console.error(`[Seed] Failed to create auction: ${err}`);
        continue;
      }
      
      const created = await res.json();
      console.log(`[Seed] Created: ${created.id} (${auction.resourceType})`);
      
      await fetch(`${BACKEND_URL}/api/auctions/${created.id}/start`, {
        method: 'POST',
      });
      console.log(`[Seed] Started: ${created.id}`);
    }
    
    console.log('\n[Seed] Checking agents...');
    
    const agentsRes = await fetch(`${BACKEND_URL}/api/agents`);
    if (agentsRes.ok) {
      const agents = await agentsRes.json();
      console.log(`[Seed] Found ${agents.length} agents`);
    } else {
      console.log('[Seed] Agents endpoint not available');
    }
    
    console.log(`
[Seed] Complete!
[Seed] Run: npm run dev (backend) + npm run dev (frontend)
    `);
    
  } catch (error) {
    console.error('[Seed] Error:', error);
    console.log('\n[Seed] Make sure backend is running: npm run dev');
  }
}

seed();