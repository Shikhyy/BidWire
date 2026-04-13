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

router.get('/summary', async (_req: Request, res: Response) => {
  const auctions = auctionEngine.getAuctions();
  
  const active = auctions.filter(a => a.status === 1);
  const settled = auctions.filter(a => a.status === 3);
  const archived = auctions.filter(a => a.status === 4);
  
  const byType = auctions.reduce((acc, a) => {
    acc[a.resourceType] = (acc[a.resourceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  res.json({
    auctions: {
      total: auctions.length,
      active: active.length,
      settled: settled.length,
      archived: archived.length,
    },
    byType,
    activeAuctions: active.slice(0, 5).map(a => ({
      id: a.id,
      resourceType: a.resourceType,
      currentBid: a.currentBid,
      endsAt: a.endsAt,
    })),
  });
});

export default router;