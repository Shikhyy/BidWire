import { BaseAgent, Auction } from '../baseAgent.js';

export class SniperStrategy extends BaseAgent {
  private readonly SNIPE_WINDOW_MS = 5000;

  decideBid(auction: Auction): number | null {
    if (!auction.endsAt) {
      return null;
    }

    const timeRemaining = auction.endsAt.getTime() - Date.now();
    
    if (timeRemaining > this.SNIPE_WINDOW_MS) {
      return null;
    }

    if (timeRemaining <= 0) {
      return null;
    }

    const minNextBid = auction.currentBid + auction.minIncrement;
    const snipeBid = minNextBid * 1.2;

    if (this.canAfford(snipeBid)) {
      return snipeBid;
    }

    if (this.canAfford(minNextBid)) {
      return minNextBid;
    }

    return null;
  }
}