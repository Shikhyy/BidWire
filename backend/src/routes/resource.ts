import { Router, Request, Response } from 'express';
import { handleX402, handleBidSubmission } from '../x402handler.js';
import { auctionEngine } from '../auctionEngine.js';

const router = Router();

router.get('/:auctionId', (req: Request, res: Response) => {
  const paymentHeader = req.headers['x-payment'] as string;
  
  if (paymentHeader) {
    return handleBidSubmissionWithPayment(req, res, paymentHeader);
  }
  
  return handleX402(req, res);
});

async function handleBidSubmissionWithPayment(
  req: Request, 
  res: Response, 
  paymentHeader: string
) {
  try {
    const { auctionId } = req.params;
    
    let parsedPayment: any;
    try {
      parsedPayment = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
    } catch {
      parsedPayment = { amount: parseFloat(paymentHeader) };
    }
    
    const amount = parsedPayment.amount || parsedPayment.amountUSDC;
    const bidderPublicKey = parsedPayment.from || parsedPayment.bidderPublicKey || 'GCUNKNOWN';
    const txHash = parsedPayment.txHash || `tx_${Date.now()}`;
    
    const result = await handleBidSubmission(
      auctionId,
      bidderPublicKey,
      amount,
      txHash
    );
    
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

router.get('/compute/:auctionId', async (req: Request, res: Response) => {
  const { auctionId } = req.params;
  const token = req.headers['authorization'] as string;
  
  const auction = auctionEngine.getAuction(auctionId);
  if (!auction) {
    return res.status(404).json({ error: 'Auction not found' });
  }
  
  if (auction.status !== 3) {
    return res.status(402).json({ error: 'Auction not settled' });
  }
  
  res.json({
    type: 'compute',
    result: 'mock-llm-response',
    model: 'llama-3.1-8b',
    auctionId: auction.id,
    timestamp: new Date().toISOString(),
  });
});

router.get('/data/:auctionId', async (req: Request, res: Response) => {
  const { auctionId } = req.params;
  const auction = auctionEngine.getAuction(auctionId);
  
  if (!auction) {
    return res.status(404).json({ error: 'Auction not found' });
  }
  
  if (auction.status !== 3) {
    return res.status(402).json({ error: 'Auction not settled' });
  }
  
  res.json({
    type: 'data',
    snapshot: { price: 45000, volume: 1000000 },
    auctionId: auction.id,
    timestamp: new Date().toISOString(),
  });
});

router.get('/quota/:auctionId', async (req: Request, res: Response) => {
  const { auctionId } = req.params;
  const auction = auctionEngine.getAuction(auctionId);
  
  if (!auction) {
    return res.status(404).json({ error: 'Auction not found' });
  }
  
  if (auction.status !== 3) {
    return res.status(402).json({ error: 'Auction not settled' });
  }
  
  res.json({
    type: 'quota',
    credits: 1000,
    remaining: 1000,
    auctionId: auction.id,
    timestamp: new Date().toISOString(),
  });
});

export default router;