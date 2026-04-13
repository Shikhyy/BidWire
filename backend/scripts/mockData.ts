const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

interface MockAuction {
  id: string;
  resourceType: string;
  resourceDescription: string;
  currentBid: number;
  bidCount: number;
  status: number;
  currentLeader: string;
  settledAt: string;
  settlementTxHash: string;
}

const MOCK_AUCTIONS: MockAuction[] = [
  {
    id: 'historical_gpu_1',
    resourceType: 'GPU',
    resourceDescription: 'NVIDIA H100 GPU Cluster (1 hour)',
    currentBid: 2.45,
    bidCount: 12,
    status: 3,
    currentLeader: 'GCNOVA111111111111111111111',
    settledAt: '2026-04-12T18:30:00.000Z',
    settlementTxHash: 'tx_settle_gpu_001',
  },
  {
    id: 'historical_data_1',
    resourceType: 'DATA',
    resourceDescription: 'Premium Crypto Price Feed (24h)',
    currentBid: 1.85,
    bidCount: 8,
    status: 3,
    currentLeader: 'GCGRID11111111111111111111',
    settledAt: '2026-04-12T17:15:00.000Z',
    settlementTxHash: 'tx_settle_data_001',
  },
  {
    id: 'historical_quota_1',
    resourceType: 'QUOTA',
    resourceDescription: 'API Quota - 1000 requests/month',
    currentBid: 0.95,
    bidCount: 5,
    status: 3,
    currentLeader: 'GCCALM111111111111111111111',
    settledAt: '2026-04-12T16:00:00.000Z',
    settlementTxHash: 'tx_settle_quota_001',
  },
  {
    id: 'historical_gpu_2',
    resourceType: 'GPU',
    resourceDescription: 'A100 GPU Rendering (30 min)',
    currentBid: 1.50,
    bidCount: 7,
    status: 4,
    currentLeader: 'GCPULSE1111111111111111111',
    settledAt: '2026-04-12T14:45:00.000Z',
    settlementTxHash: 'tx_settle_gpu_002',
  },
  {
    id: 'historical_gpu_3',
    resourceType: 'GPU',
    resourceDescription: 'RTX 4090 Training (2 hours)',
    currentBid: 3.25,
    bidCount: 15,
    status: 3,
    currentLeader: 'GCNOVA111111111111111111111',
    settledAt: '2026-04-12T12:00:00.000Z',
    settlementTxHash: 'tx_settle_gpu_003',
  },
];

const AGENT_STATS = [
  { agentId: 'nova', name: 'NovaBid', wins: 12, strategy: 'aggressive' },
  { agentId: 'grid', name: 'GridMind', wins: 8, strategy: 'conservative' },
  { agentId: 'pulse', name: 'PulseBot', wins: 5, strategy: 'sniper' },
  { agentId: 'flux', name: 'FluxAgent', wins: 3, strategy: 'random' },
  { agentId: 'calm', name: 'CalmNode', wins: 7, strategy: 'budgetAware' },
];

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleString('en-US', { 
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
}

async function displayStats() {
  console.log(`
╔═══════════════════════════════════════════════════╗
║         BidWire Stats Display                 ║
╚═══════════════════════════════════════════════════╝
  `);
  
  const totalVolume = MOCK_AUCTIONS.reduce((sum, a) => sum + a.currentBid, 0);
  const totalBids = MOCK_AUCTIONS.reduce((sum, a) => sum + a.bidCount, 0);
  
  console.log('Total Volume: $', totalVolume.toFixed(2));
  console.log('Total Auctions:', MOCK_AUCTIONS.length);
  console.log('Total Bids:', totalBids);
  
  console.log('\n--- Top Agents ---');
  AGENT_STATS.sort((a, b) => b.wins - a.wins).forEach(a => {
    const winRate = ((a.wins / MOCK_AUCTIONS.length) * 100).toFixed(0);
    console.log(`  ${a.name.padEnd(10)} ${a.strategy.padEnd(12)} ${a.wins} wins (${winRate}%)`);
  });
  
  console.log('\n--- Recent Settled ---');
  MOCK_AUCTIONS.slice(0, 3).forEach(a => {
    const type = a.resourceType.padEnd(4);
    const bid = '$' + a.currentBid.toFixed(2);
    console.log(`  [${type}] ${bid.padEnd(8)} won by ${a.currentLeader.slice(0, 8)}... @ ${formatDate(a.settledAt)}`);
  });
  
  console.log('\n[Mock] Use these values in frontend dashboard');
}

displayStats();