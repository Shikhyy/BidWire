import { Router, Request, Response } from 'express';
import { autoDemo } from '../autoDemo.js';

const router = Router();

router.post('/start', async (req: Request, res: Response) => {
  if (autoDemo.isRunning()) {
    return res.status(400).json({ error: 'Demo already running' });
  }

  const auctionCount = parseInt(req.body.auctionCount as string) || 3;
  const duration = parseInt(req.body.duration as string) || 30;
  
  await autoDemo.start(auctionCount, duration);
  
  res.json({ 
    status: 'started', 
    auctionCount, 
    duration,
    message: 'Auto-demo mode started'
  });
});

router.post('/stop', async (_req: Request, res: Response) => {
  autoDemo.stop();
  
  res.json({ status: 'stopped' });
});

router.get('/status', async (_req: Request, res: Response) => {
  res.json({ running: autoDemo.isRunning() });
});

export default router;