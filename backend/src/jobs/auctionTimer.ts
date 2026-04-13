import { auctionEngine } from '../auctionEngine.js';
import { wsServer } from '../wsServer.js';
import { AuctionStatus } from '../types.js';

export class AuctionTimer {
  private intervalId: NodeJS.Timeout | null = null;
  private pollInterval = 1000;

  start() {
    if (this.intervalId) {
      console.log('[Timer] Already running');
      return;
    }

    this.intervalId = setInterval(() => {
      this.checkAuctions();
    }, this.pollInterval);

    console.log('[Timer] Started polling every 1s');
  }

  private checkAuctions() {
    const auctions = auctionEngine.getActiveAuctions();
    const now = new Date();

    for (const auction of auctions) {
      if (auction.endsAt && now >= auction.endsAt) {
        this.closeAuction(auction.id);
      }
    }
  }

  private async closeAuction(auctionId: string) {
    try {
      console.log(`[Timer] Closing auction ${auctionId}`);
      
      const result = await auctionEngine.closeAuction(auctionId);
      
      const auction = auctionEngine.getAuction(auctionId);
      if (!auction) return;

      wsServer.emitAuctionSettled({
        auctionId,
        settlementTxHash: result.settlementTxHash,
        refundTxHashes: result.refundTxHashes,
      });

      if (auction.currentLeader) {
        wsServer.emitResourceDelivered({
          auctionId,
          agentId: auction.currentLeader,
          resourceType: auction.resourceType,
        });
      }

      console.log(`[Timer] Auction ${auctionId} settled`);
    } catch (error) {
      console.error(`[Timer] Error closing auction ${auctionId}:`, error);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Timer] Stopped');
    }
  }
}

export const auctionTimer = new AuctionTimer();