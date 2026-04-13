export const config = {
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  pollInterval: parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL || '2000'),
  demoDuration: parseInt(process.env.NEXT_PUBLIC_DEMO_DURATION || '30'),
};

export const API_ENDPOINTS = {
  auctions: `${config.backendUrl}/api/auctions`,
  auction: (id: string) => `${config.backendUrl}/api/auctions/${id}`,
  auctionStart: (id: string) => `${config.backendUrl}/api/auctions/${id}/start`,
  auctionBid: (id: string) => `${config.backendUrl}/api/auctions/${id}/bid`,
  auctionClose: (id: string) => `${config.backendUrl}/api/auctions/${id}/close`,
  auctionBids: (id: string) => `${config.backendUrl}/api/auctions/${id}/bids`,
  active: `${config.backendUrl}/api/auctions/active`,
  agents: `${config.backendUrl}/api/agents`,
  agent: (id: string) => `${config.backendUrl}/api/agents/${id}`,
  resource: (id: string) => `${config.backendUrl}/api/resource/${id}`,
  demo: `${config.backendUrl}/api/demo`,
} as const;