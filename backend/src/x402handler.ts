import { Request, Response } from 'express';
import { auctionEngine } from './auctionEngine.js';
import { createSorobanClient } from './sorobanClient.js';

const CONTRACT_ID = process.env.CONTRACT_ID || 'CA3D5KRY6N3X2J4L6T7P8Q9R0S1T2U3V4W5X6Y7Z8';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'SCZ3BAJ2U7Q7OWPVLJRJ2DKLTSGMQHQDO2DTT3D3LEJHP';

const sorobanClient = createSorobanClient(CONTRACT_ID, ADMIN_SECRET);

export interface X402Response {
  auctionId: string;
  currentBid: string;
  minNextBid: string;
  endsAt: number;
  escrowAddress: string;
  scheme: string;
  network: string;
  asset: string;
}

export function handleX402(req: Request, res: Response) {
  const { auctionId } = req.params;
  
  const auction = auctionEngine.getAuction(auctionId);
  if (!auction) {
    return res.status(404).json({ error: 'Auction not found' });
  }

  if (auction.status !== 1) {
    return res.status(410).json({ error: 'Auction is no longer active' });
  }

  const minNextBid = auction.currentBid + auction.minIncrement;
  
  const response: X402Response = {
    auctionId: auction.id,
    currentBid: auction.currentBid.toFixed(2),
    minNextBid: minNextBid.toFixed(2),
    endsAt: auction.endsAt ? Math.floor(auction.endsAt.getTime() / 1000) : 0,
    escrowAddress: auction.escrowAddress,
    scheme: 'exact',
    network: 'stellar:testnet',
    asset: 'USDC',
  };

  res.status(402).json(response);
}

export async function handleBidSubmission(
  auctionId: string,
  bidderPublicKey: string,
  amount: number,
  txHash: string
): Promise<{ status: string; rank: number; currentBid: string; txHash: string }> {
  const result = auctionEngine.placeBid({
    auctionId,
    bidderPublicKey,
    amount,
    txHash,
  });

  await sorobanClient.submitBid({
    auctionId,
    bidderPublicKey,
    amount,
  });

  return {
    status: 'bid_accepted',
    rank: result.bid.rank,
    currentBid: result.bid.amount.toFixed(2),
    txHash: result.bid.txHash,
  };
}