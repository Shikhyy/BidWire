import { BaseAgent, Auction } from '../baseAgent.js';

export class RandomStrategy extends BaseAgent {
  decideBid(auction: Auction): number | null {
    if (!auction.endsAt || new Date() >= auction.endsAt) {
      return null;
    }

    const minNextBid = auction.currentBid + auction.minIncrement;
    const randomIncrement = 1 + Math.random();
    const randomBid = minNextBid * randomIncrement;

    if (this.canAfford(randomBid)) {
      return randomBid;
    }

    if (this.canAfford(minNextBid)) {
      return minNextBid;
    }

    return null;
  }
}