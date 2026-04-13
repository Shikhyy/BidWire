import { z } from 'zod';

export const AuctionStatus = {
  PENDING: 0,
  OPEN: 1,
  CLOSING: 2,
  SETTLED: 3,
  ARCHIVED: 4,
} as const;

export const AuctionMode = {
  STANDARD: 0,
  REVERSE: 1,
} as const;

export const ResourceType = {
  GPU: 'GPU',
  DATA: 'DATA',
  QUOTA: 'QUOTA',
} as const;

export const CreateAuctionSchema = z.object({
  resourceType: z.enum(['GPU', 'DATA', 'QUOTA']),
  resourceDescription: z.string().min(1).max(200),
  startingBid: z.number().positive(),
  minIncrement: z.number().positive().default(0.01),
  reservePrice: z.number().nonnegative().default(0),
  duration: z.number().min(10).max(300).default(60),
  mode: z.number().default(0),
});

export const PlaceBidSchema = z.object({
  auctionId: z.string(),
  amount: z.number().positive(),
  bidderPublicKey: z.string(),
});

export const AgentSchema = z.object({
  agentId: z.string(),
  name: z.string(),
  strategy: z.enum(['aggressive', 'conservative', 'sniper', 'random', 'budgetAware']),
  publicKey: z.string(),
  secretKey: z.string(),
  budgetCap: z.number().positive(),
  currentSpend: z.number().default(0),
  status: z.enum(['idle', 'active', 'idle_refunded']).default('idle'),
});

export type Auction = {
  id: string;
  resourceType: string;
  resourceDescription: string;
  startingBid: number;
  minIncrement: number;
  reservePrice: number;
  currentLeader: string | null;
  currentBid: number;
  bidCount: number;
  endsAt: Date | null;
  status: number;
  mode: number;
  providerPublicKey: string;
  escrowAddress: string;
  createdAt: Date;
  settledAt: Date | null;
  settlementTxHash: string | null;
};

export type Bid = {
  id: string;
  auctionId: string;
  bidderPublicKey: string;
  amount: number;
  timestamp: Date;
  txHash: string;
  rank: number;
};

export type Agent = z.infer<typeof AgentSchema>;