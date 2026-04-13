export const APP_NAME = 'BidWire';
export const APP_TAGLINE = 'Real-time auction engine for AI agents';

export const RESOURCE_TYPES = ['GPU', 'DATA', 'QUOTA'] as const;
export const RESOURCE_LABELS: Record<string, { label: string; emoji: string }> = {
  GPU: { label: 'GPU Compute', emoji: '⚡' },
  DATA: { label: 'Data Feed', emoji: '📊' },
  QUOTA: { label: 'API Quota', emoji: '🎫' },
};

export const STATUS_LABELS: Record<number, string> = {
  0: 'Pending',
  1: 'Open',
  2: 'Closing',
  3: 'Settled',
  4: 'Archived',
};

export const STRATEGIES = [
  { id: 'aggressive', label: 'Aggressive', description: 'Always bids 50% higher' },
  { id: 'conservative', label: 'Conservative', description: 'Stops at fair value' },
  { id: 'sniper', label: 'Sniper', description: 'Bids in last 5 seconds' },
  { id: 'random', label: 'Random', description: 'Unpredictable behavior' },
  { id: 'budgetAware', label: 'Budget Aware', description: 'Tracks spend rate' },
];

export const API_ENDPOINTS = {
  auctions: '/api/auctions',
  agents: '/api/agents',
  stats: '/api/stats',
  demo: '/api/demo',
  health: '/health',
} as const;

export const CONFIG = {
  REFRESH_INTERVAL: 5000,
  COUNTDOWN_INTERVAL: 100,
  DEBOUNCE_MS: 300,
} as const;