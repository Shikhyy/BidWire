import { BaseAgent, Auction } from '../baseAgent.js';

export class ConservativeStrategy extends BaseAgent {
  private readonly FAIR_VALUE = 1.5;

  decideBid(auction: Auction): number | null {
    if (!auction.endsAt || new Date() >= auction.endsAt) {
      return null;
    }

    if (auction.currentBid >= this.FAIR_VALUE) {
      return null;
    }

    const minNextBid = auction.currentBid + auction.minIncrement;

    if (this.canAfford(minNextBid)) {
      return minNextBid;
    }

    return null;
  }
}