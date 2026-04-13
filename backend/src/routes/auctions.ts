import { Router, Request, Response } from 'express';
import { auctionEngine } from '../auctionEngine.js';
import { CreateAuctionSchema } from '../types.js';
import { createSorobanClient } from '../sorobanClient.js';

const CONTRACT_ID = process.env.CONTRACT_ID || 'CA3D5KRY6N3X2J4L6T7P8Q9R0S1T2U3V4W5X6Y7Z8';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'SCZ3BAJ2U7Q7OWPVLJRJ2DKLTSGMQHQDO2DTT3D3LEJHP';
const sorobanClient = createSorobanClient(CONTRACT_ID, ADMIN_SECRET);

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = CreateAuctionSchema.parse(req.body);
    
    const auctionId = `auction_${Date.now()}`;
    const escrowAddress = `G${CONTRACT_ID.slice(1)}`;
    
    const auction = auctionEngine.createAuction({
      id: auctionId,
      resourceType: parsed.resourceType,
      resourceDescription: parsed.resourceDescription,
      startingBid: parsed.startingBid,
      minIncrement: parsed.minIncrement,
      reservePrice: parsed.reservePrice,
      duration: parsed.duration,
      mode: parsed.mode,
      providerPublicKey: req.body.providerPublicKey || 'GCDEFAULT',
      escrowAddress,
    });

    await sorobanClient.createAuction({
      auctionId,
      providerPublicKey: auction.providerPublicKey,
      resourceType: parsed.resourceType,
      resourceDescription: parsed.resourceDescription,
      startingBid: parsed.startingBid,
      minIncrement: parsed.minIncrement,
      reservePrice: parsed.reservePrice,
      duration: parsed.duration,
      mode: parsed.mode,
    });

    res.status(201).json(auction);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const auction = auctionEngine.startAuction(id);
    res.json(auction);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  const auctions = auctionEngine.getAuctions();
  res.json(auctions);
});

router.get('/active', async (req: Request, res: Response) => {
  const auctions = auctionEngine.getActiveAuctions();
  res.json(auctions);
});

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const auction = auctionEngine.getAuction(id);
  
  if (!auction) {
    return res.status(404).json({ error: 'Auction not found' });
  }
  
  res.json(auction);
});

router.get('/:id/bids', async (req: Request, res: Response) => {
  const { id } = req.params;
  const bids = auctionEngine.getBids(id);
  res.json(bids);
});

router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await auctionEngine.closeAuction(id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/bid', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, bidderPublicKey } = req.body;
    
    if (!amount || !bidderPublicKey) {
      return res.status(400).json({ error: 'amount and bidderPublicKey required' });
    }
    
    const result = auctionEngine.placeBid({
      auctionId: id,
      bidderPublicKey,
      amount,
      txHash: `tx_${Date.now()}`,
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/history/all', async (req: Request, res: Response) => {
  const auctions = auctionEngine.getAuctions();
  const settled = auctions.filter(a => a.status >= 2);
  res.json(settled);
});

export default router;