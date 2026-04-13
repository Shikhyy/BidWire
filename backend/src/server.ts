import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { wsServer } from './wsServer.js';
import { auctionEngine } from './auctionEngine.js';
import { auctionTimer } from './jobs/auctionTimer.js';
import auctionsRouter from './routes/auctions.js';
import resourceRouter from './routes/resource.js';
import agentsRouter from './routes/agents.js';
import demoRouter from './routes/demo.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auctions', auctionsRouter);
app.use('/api/resource', resourceRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/demo', demoRouter);

app.get('/health', (req, res) => {
  const auctions = auctionEngine.getAuctions();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    stats: {
      auctions: auctions.length,
      active: auctions.filter(a => a.status === 1).length,
    }
  });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const server = createServer(app);

wsServer.initialize(server);
auctionTimer.start();

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║           BidWire Backend Started                ║
║                                                 ║
║   API:        http://localhost:${PORT}            ║
║   WebSocket:  ws://localhost:${PORT}/ws           ║
║   Health:     http://localhost:${PORT}/health     ║
║                                                 ║
╚══════════════════════════════════════════════════╝
  `);
});

process.on('SIGTERM', () => {
  console.log('\n[Server] Shutting down...');
  auctionTimer.stop();
  wsServer.close();
  server.close(() => {
    console.log('[Server] Closed');
    process.exit(0);
  });
});