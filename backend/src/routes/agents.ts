import { Router, Request, Response } from 'express';

const router = Router();

const agents = new Map<string, any>();

const DEFAULT_AGENTS = [
  {
    agentId: 'nova',
    name: 'NovaBid',
    strategy: 'aggressive',
    publicKey: 'GCNOVA111111111111111111111',
    secretKey: 'SCNOVA111111111111111111111',
    budgetCap: 5.00,
    currentSpend: 0,
    status: 'idle',
    wins: 0,
    bidHistory: [],
    totalBids: 0,
  },
  {
    agentId: 'grid',
    name: 'GridMind',
    strategy: 'conservative',
    publicKey: 'GCGRID11111111111111111111',
    secretKey: 'SCGRID11111111111111111111',
    budgetCap: 2.00,
    currentSpend: 0,
    status: 'idle',
    wins: 0,
    bidHistory: [],
    totalBids: 0,
  },
  {
    agentId: 'pulse',
    name: 'PulseBot',
    strategy: 'sniper',
    publicKey: 'GCPULSE1111111111111111111',
    secretKey: 'SCPULSE1111111111111111111',
    budgetCap: 3.50,
    currentSpend: 0,
    status: 'idle',
    wins: 0,
    bidHistory: [],
    totalBids: 0,
  },
  {
    agentId: 'flux',
    name: 'FluxAgent',
    strategy: 'random',
    publicKey: 'GCFLUX111111111111111111111',
    secretKey: 'SCFLUX111111111111111111111',
    budgetCap: 1.50,
    currentSpend: 0,
    status: 'idle',
    wins: 0,
    bidHistory: [],
    totalBids: 0,
  },
  {
    agentId: 'calm',
    name: 'CalmNode',
    strategy: 'budgetAware',
    publicKey: 'GCCALM111111111111111111111',
    secretKey: 'SCCALM111111111111111111111',
    budgetCap: 4.00,
    currentSpend: 0,
    status: 'idle',
    wins: 0,
  },
];

DEFAULT_AGENTS.forEach(agent => agents.set(agent.agentId, agent));

router.get('/', async (req: Request, res: Response) => {
  res.json(Array.from(agents.values()));
});

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const agent = agents.get(id);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  res.json(agent);
});

router.post('/:id/bid', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;
  
  const agent = agents.get(id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  if (agent.currentSpend + amount > agent.budgetCap) {
    return res.status(400).json({ error: 'Over budget' });
  }
  
  agent.currentSpend += amount;
  agents.set(id, agent);
  
  res.json({ success: true, currentSpend: agent.currentSpend });
});

router.post('/:id/refund', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;
  
  const agent = agents.get(id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  agent.currentSpend = Math.max(0, agent.currentSpend - amount);
  agents.set(id, agent);
  
  res.json({ success: true, currentSpend: agent.currentSpend });
});

router.post('/:id/win', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const agent = agents.get(id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  agent.wins += 1;
  agents.set(id, agent);
  
  res.json({ success: true, wins: agent.wins });
});

router.post('/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const agent = agents.get(id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  agent.status = status;
  agents.set(id, agent);
  
  res.json(agent);
});

router.get('/:id/balance', async (req: Request, res: Response) => {
  const { id } = req.params;
  const agent = agents.get(id);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  const mockBalance = 100 - agent.currentSpend;
  res.json({ 
    agentId: id, 
    balance: mockBalance,
    budgetCap: agent.budgetCap,
    currentSpend: agent.currentSpend,
  });
});

router.get('/:id/history', async (req: Request, res: Response) => {
  const { id } = req.params;
  const agent = agents.get(id);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  const stats = {
    totalBids: agent.totalBids || agent.bidHistory?.length || 0,
    wins: agent.wins,
    currentSpend: agent.currentSpend,
    budgetCap: agent.budgetCap,
    budgetUsed: (agent.currentSpend / agent.budgetCap * 100).toFixed(1),
    bidHistory: agent.bidHistory || [],
  };
  
  res.json(stats);
});

export default router;