import { Auction, Bid, AuctionStatus, AuctionMode } from './types.js';

export class AuctionEngine {
  private auctions: Map<string, Auction> = new Map();
  private bids: Map<string, Bid[]> = new Map();
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();

  createAuction(params: {
    id: string;
    resourceType: string;
    resourceDescription: string;
    startingBid: number;
    minIncrement: number;
    reservePrice: number;
    duration: number;
    mode: number;
    providerPublicKey: string;
    escrowAddress: string;
  }): Auction {
    const auction: Auction = {
      id: params.id,
      resourceType: params.resourceType,
      resourceDescription: params.resourceDescription,
      startingBid: params.startingBid,
      minIncrement: params.minIncrement,
      reservePrice: params.reservePrice,
      currentLeader: null,
      currentBid: params.startingBid,
      bidCount: 0,
      endsAt: null,
      status: AuctionStatus.PENDING,
      mode: params.mode,
      providerPublicKey: params.providerPublicKey,
      escrowAddress: params.escrowAddress,
      createdAt: new Date(),
      settledAt: null,
      settlementTxHash: null,
    };

    this.auctions.set(params.id, auction);
    this.bids.set(params.id, []);

    return auction;
  }

  startAuction(auctionId: string, onClose?: (auction: Auction) => void): Auction {
    const auction = this.auctions.get(auctionId);
    if (!auction) throw new Error('Auction not found');
    if (auction.status !== AuctionStatus.PENDING) {
      throw new Error('Auction is not in PENDING status');
    }

    const endsAt = new Date(Date.now() + 60000);
    auction.status = AuctionStatus.OPEN;
    auction.endsAt = endsAt;

    if (onClose) {
      const timer = setTimeout(() => {
        this.closeAuction(auctionId).then(() => {
          onClose(auction);
        });
      }, 60000);
      this.activeTimers.set(auctionId, timer);
    }

    return auction;
  }

  async closeAuction(auctionId: string): Promise<{ settlementTxHash: string; refundTxHashes: string[] }> {
    const auction = this.auctions.get(auctionId);
    if (!auction) throw new Error('Auction not found');
    if (auction.status !== AuctionStatus.OPEN) {
      throw new Error('Auction is not OPEN');
    }

    const timer = this.activeTimers.get(auctionId);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(auctionId);
    }

    auction.status = AuctionStatus.CLOSING;

    const bids = this.bids.get(auctionId) || [];

    const metReserve = auction.currentBid >= auction.reservePrice;
    const hasWinner = auction.currentLeader !== null;

    if (metReserve && hasWinner) {
      auction.status = AuctionStatus.SETTLED;
    } else {
      auction.status = AuctionStatus.ARCHIVED;
    }

    auction.settledAt = new Date();
    auction.settlementTxHash = `tx_${auctionId}_${Date.now()}`;

    const refundTxHashes = bids
      .filter(b => b.bidderPublicKey !== auction.currentLeader)
      .map(b => `refund_${b.id}`);

    return {
      settlementTxHash: auction.settlementTxHash,
      refundTxHashes,
    };
  }

  placeBid(params: {
    auctionId: string;
    bidderPublicKey: string;
    amount: number;
    txHash: string;
  }): { bid: Bid; previousLeader: string | null; previousBid: number } {
    const auction = this.auctions.get(params.auctionId);
    if (!auction) throw new Error('Auction not found');
    if (auction.status !== AuctionStatus.OPEN) {
      throw new Error('Auction is not OPEN');
    }
    if (!auction.endsAt || new Date() >= auction.endsAt) {
      throw new Error('Auction has ended');
    }

    const minNextBid = auction.currentBid + auction.minIncrement;
    if (params.amount < minNextBid) {
      throw new Error(`Bid too low: minimum is ${minNextBid}`);
    }

    const previousLeader = auction.currentLeader;
    const previousBid = auction.currentBid;

    const bid: Bid = {
      id: `bid_${params.auctionId}_${Date.now()}`,
      auctionId: params.auctionId,
      bidderPublicKey: params.bidderPublicKey,
      amount: params.amount,
      timestamp: new Date(),
      txHash: params.txHash,
      rank: auction.bidCount + 1,
    };

    auction.currentLeader = params.bidderPublicKey;
    auction.currentBid = params.amount;
    auction.bidCount += 1;

    const auctionBids = this.bids.get(params.auctionId) || [];
    auctionBids.push(bid);
    this.bids.set(params.auctionId, auctionBids);

    this.auctions.set(params.auctionId, auction);

    return { bid, previousLeader, previousBid };
  }

  getAuction(id: string): Auction | undefined {
    return this.auctions.get(id);
  }

  getAuctions(): Auction[] {
    return Array.from(this.auctions.values());
  }

  getBids(auctionId: string): Bid[] {
    return this.bids.get(auctionId) || [];
  }

  getActiveAuctions(): Auction[] {
    return Array.from(this.auctions.values()).filter(
      a => a.status === AuctionStatus.OPEN
    );
  }
}

export const auctionEngine = new AuctionEngine();