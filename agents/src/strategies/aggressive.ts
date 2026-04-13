import { BaseAgent, Auction } from '../baseAgent.js';

export class AggressiveStrategy extends BaseAgent {
  decideBid(auction: Auction): number | null {
    if (!auction.endsAt || new Date() >= auction.endsAt) {
      return null;
    }

    const minNextBid = auction.currentBid + auction.minIncrement;
    const aggressiveBid = minNextBid * 1.5;

    if (this.canAfford(aggressiveBid)) {
      return aggressiveBid;
    }

    if (this.canAfford(minNextBid)) {
      return minNextBid;
    }

    return null;
  }
}