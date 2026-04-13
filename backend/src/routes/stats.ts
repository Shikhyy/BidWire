import { Router, Request, Response } from 'express';
import { auctionEngine } from '../auctionEngine.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const auctions = auctionEngine.getAuctions();
  
  const settled = auctions.filter(a => a.status >= 3);
  const totalVolume = settled.reduce((sum, a) => sum + a.currentBid, 0);
  const totalBids = settled.reduce((sum, a) => sum + a.bidCount, 0);
  
  const metrics = {
    totalAuctions: auctions.length,
    activeAuctions: auctions.filter(a => a.status === 1).length,
    settledAuctions: settled.length,
    totalVolume: totalVolume.toFixed(2),
    totalBids,
    averageBid: totalBids > 0 ? (totalVolume / totalBids).toFixed(2) : '0.00',
  };
  
  res.json(metrics);
});

export default router;