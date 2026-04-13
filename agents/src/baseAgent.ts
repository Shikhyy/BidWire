export interface AgentConfig {
  agentId: string;
  name: string;
  strategy: string;
  publicKey: string;
  secretKey: string;
  budgetCap: number;
}

export interface Auction {
  id: string;
  resourceType: string;
  currentBid: number;
  minIncrement: number;
  endsAt: Date | null;
  status: number;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected currentSpend = 0;
  protected wins = 0;
  protected status: 'idle' | 'active' | 'idle_refunded' = 'idle';

  constructor(config: AgentConfig) {
    this.config = config;
  }

  abstract decideBid(auction: Auction): number | null;

  async queryAuction(auctionId: string): Promise<any> {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/auctions/${auctionId}`);
    return response.json();
  }

  async placeBid(auctionId: string, amount: number): Promise<any> {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    const response = await fetch(`${backendUrl}/api/auctions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auctionId,
        amount,
        bidderPublicKey: this.config.publicKey,
      }),
    });

    return response.json();
  }

  canAfford(amount: number): boolean {
    return this.currentSpend + amount <= this.config.budgetCap;
  }

  canWin(auction: Auction): boolean {
    const bidAmount = this.decideBid(auction);
    return bidAmount !== null && this.canAfford(bidAmount);
  }

  get remainingBudget(): number {
    return this.config.budgetCap - this.currentSpend;
  }

  get budgetUtilization(): number {
    return this.currentSpend / this.config.budgetCap;
  }

  recordBid(amount: number) {
    this.currentSpend += amount;
    this.status = 'active';
  }

  recordRefund(amount: number) {
    this.currentSpend = Math.max(0, this.currentSpend - amount);
    this.status = 'idle_refunded';
  }

  recordWin() {
    this.wins++;
    this.status = 'idle';
  }

  getInfo() {
    return {
      agentId: this.config.agentId,
      name: this.config.name,
      strategy: this.config.strategy,
      publicKey: this.config.publicKey,
      budgetCap: this.config.budgetCap,
      currentSpend: this.currentSpend,
      remainingBudget: this.remainingBudget,
      wins: this.wins,
      status: this.status,
    };
  }
}