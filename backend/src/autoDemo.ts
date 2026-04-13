import { auctionEngine } from './auctionEngine.js';
import { wsServer } from './wsServer.js';

const BIDDERS = [
  { publicKey: 'GCNOVA111111111111111111111', name: 'NovaBid' },
  { publicKey: 'GCGRID11111111111111111111', name: 'GridMind' },
  { publicKey: 'GCPULSE1111111111111111111', name: 'PulseBot' },
  { publicKey: 'GCFLUX111111111111111111111', name: 'FluxAgent' },
  { publicKey: 'GCCALM111111111111111111111', name: 'CalmNode' },
];

const RESOURCE_TYPES = ['GPU', 'DATA', 'QUOTA'];
const RESOURCE_DESCRIPTIONS: Record<string, string[]> = {
  GPU: ['NVIDIA H100 GPU Compute', 'A100 GPU Cluster', 'RTX 4090 Rendering'],
  DATA: ['Market Data Feed', 'Crypto Price Oracle', 'Weather API'],
  QUOTA: ['API Quota - 1000 reqs', 'Webhook Credits', 'Search Tier'],
};

class AutoDemo {
  private running = false;
  private intervalId: NodeJS.Timeout | null = null;

  async start(auctionCount = 3, durationSec = 30) {
    if (this.running) {
      console.log('[AutoDemo] Already running');
      return;
    }

    this.running = true;
    console.log(`
╔═══════════════════════════════════════════════════╗
║           BidWire Auto-Demo Mode              ║
╚═══════════════════════════════════════════════════╝
    `);

    console.log(`[AutoDemo] Creating ${auctionCount} auctions...`);
    const auctionIds: string[] = [];

    for (let i = 0; i < auctionCount; i++) {
      const type = RESOURCE_TYPES[i % RESOURCE_TYPES.length] as 'GPU' | 'DATA' | 'QUOTA';
      const descriptions = RESOURCE_DESCRIPTIONS[type] || RESOURCE_DESCRIPTIONS.GPU;
      const desc = descriptions[Math.floor(Math.random() * descriptions.length)];
      
      const auction = auctionEngine.createAuction({
        id: `auto_${Date.now()}_${i}`,
        resourceType: type,
        resourceDescription: desc,
        startingBid: 0.10 + Math.random() * 0.15,
        minIncrement: 0.05,
        reservePrice: 0.50 + Math.random() * 0.50,
        duration: durationSec,
        mode: 0,
        providerPublicKey: 'GCPROVIDER1111111111111',
        escrowAddress: 'GAUTODEMO11111111111111111',
      });

      auctionEngine.startAuction(auction.id);
      auctionIds.push(auction.id);
      wsServer.emitAuctionCreated(auction);

      console.log(`[AutoDemo] Created: ${auction.id} (${type})`);
    }

    console.log(`[AutoDemo] Simulating bids for ${durationSec}s...\n`);

    const endTime = Date.now() + durationSec * 1000;
    
    this.intervalId = setInterval(async () => {
      if (Date.now() >= endTime) {
        this.stop();
        return;
      }

      for (const auctionId of auctionIds) {
        if (Math.random() > 0.25) {
          await this.placeRandomBid(auctionId);
        }
      }
    }, 800 + Math.random() * 1200);
  }

  private async placeRandomBid(auctionId: string) {
    const auction = auctionEngine.getAuction(auctionId);
    if (!auction || auction.status !== 1) return;

    const bidder = BIDDERS[Math.floor(Math.random() * BIDDERS.length)];
    const minNextBid = auction.currentBid + auction.minIncrement;
    const amount = minNextBid + Math.random() * minNextBid;

    try {
      const result = auctionEngine.placeBid({
        auctionId,
        bidderPublicKey: bidder.publicKey,
        amount,
        txHash: `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      });

      wsServer.emitBidPlaced({
        auctionId,
        agentId: bidder.name,
        amount: result.bid.amount,
        txHash: result.bid.txHash,
        rank: result.bid.rank,
      });

      console.log(`[AutoDemo] ${bidder.name} bid $${amount.toFixed(2)} on ${auctionId.slice(0, 12)}...`);
    } catch {}
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
    console.log('[AutoDemo] Stopped');
  }

  isRunning() {
    return this.running;
  }
}

export const autoDemo = new AutoDemo();