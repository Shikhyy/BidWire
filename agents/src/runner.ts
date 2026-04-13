import { BaseAgent } from './baseAgent.js';
import { AggressiveStrategy } from './strategies/aggressive.js';
import { ConservativeStrategy } from './strategies/conservative.js';
import { SniperStrategy } from './strategies/sniper.js';
import { RandomStrategy } from './strategies/random.js';
import { BudgetAwareStrategy } from './strategies/budgetAware.js';

interface AgentConfig {
  agentId: string;
  name: string;
  strategy: string;
  publicKey: string;
  secretKey: string;
  budgetCap: number;
}

const AGENT_CONFIGS: AgentConfig[] = [
  {
    agentId: 'nova',
    name: 'NovaBid',
    strategy: 'aggressive',
    publicKey: 'GCNOVA111111111111111111111',
    secretKey: 'SCNOVA111111111111111111111',
    budgetCap: 5.0,
  },
  {
    agentId: 'grid',
    name: 'GridMind',
    strategy: 'conservative',
    publicKey: 'GCGRID11111111111111111111',
    secretKey: 'SCGRID11111111111111111111',
    budgetCap: 2.0,
  },
  {
    agentId: 'pulse',
    name: 'PulseBot',
    strategy: 'sniper',
    publicKey: 'GCPULSE1111111111111111111',
    secretKey: 'SCPULSE1111111111111111111',
    budgetCap: 3.5,
  },
  {
    agentId: 'flux',
    name: 'FluxAgent',
    strategy: 'random',
    publicKey: 'GCFLUX111111111111111111111',
    secretKey: 'SCFLUX111111111111111111111',
    budgetCap: 1.5,
  },
  {
    agentId: 'calm',
    name: 'CalmNode',
    strategy: 'budgetAware',
    publicKey: 'GCCALM111111111111111111111',
    secretKey: 'SCCALM111111111111111111111',
    budgetCap: 4.0,
  },
];

function createAgent(config: AgentConfig): BaseAgent {
  switch (config.strategy) {
    case 'aggressive':
      return new AggressiveStrategy(config);
    case 'conservative':
      return new ConservativeStrategy(config);
    case 'sniper':
      return new SniperStrategy(config);
    case 'random':
      return new RandomStrategy(config);
    case 'budgetAware':
      return new BudgetAwareStrategy(config);
    default:
      throw new Error(`Unknown strategy: ${config.strategy}`);
  }
}

class AgentRunner {
  private agents: BaseAgent[] = [];
  private pollInterval: number;
  private running = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(pollInterval = 2000) {
    this.pollInterval = pollInterval;
  }

  async start() {
    this.agents = AGENT_CONFIGS.map(config => createAgent(config));
    this.running = true;

    console.log(`
╔══════════════════════════════════════════════════╗
║           BidWire Agents Started              ║
╚══════════════════════════════════════════════════╝
    `);

    this.agents.forEach(agent => {
      const info = agent.getInfo();
      console.log(`  ${info.name.padEnd(10)} [${info.strategy.padEnd(12)}] Budget: $${info.budgetCap.toFixed(2)}`);
    });

    console.log('');

    this.intervalId = setInterval(() => this.poll(), this.pollInterval);
  }

  async poll() {
    if (!this.running) return;

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    try {
      const response = await fetch(`${backendUrl}/api/auctions/active`);
      const auctions: any[] = (await response.json()) as any[];

      for (const auction of auctions) {
        for (const agent of this.agents) {
          const bidAmount = agent.decideBid(auction);

          if (bidAmount !== null && agent.canAfford(bidAmount)) {
            const result = await agent.placeBid(auction.id, bidAmount);
            agent.recordBid(bidAmount);

            console.log(
              `[${agent.getInfo().name}] Bid $${bidAmount.toFixed(2)} on ${auction.id} (rank #${result.rank || '?'})`
            );
          }
        }
      }
    } catch (error) {
      console.error('[AgentRunner] Poll error:', error);
    }
  }

  stop() {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[AgentRunner] Stopped');
  }
}

const runner = new AgentRunner();
runner.start();

process.on('SIGTERM', () => {
  runner.stop();
  process.exit(0);
});