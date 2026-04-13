import { BaseAgent, Auction } from '../baseAgent.js';

export class BudgetAwareStrategy extends BaseAgent {
  private readonly MIN_BUDGET_RATIO = 0.6;

  decideBid(auction: Auction): number | null {
    if (!auction.endsAt || new Date() >= auction.endsAt) {
      return null;
    }

    if (this.budgetUtilization >= this.MIN_BUDGET_RATIO) {
      return null;
    }

    const minNextBid = auction.currentBid + auction.minIncrement;
    const budgetBid = Math.min(
      this.remainingBudget * 0.8,
      minNextBid * 1.1
    );

    if (this.canAfford(budgetBid)) {
      return budgetBid;
    }

    if (this.canAfford(minNextBid)) {
      return minNextBid;
    }

    return null;
  }
}