import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export interface WsEvent {
  type: string;
  payload: any;
  timestamp: number;
}

export class BidWireWsServer {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[WS] Client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('[WS] Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('[WS] Client error:', error);
        this.clients.delete(ws);
      });
    });

    console.log('[WS] WebSocket server initialized on /ws');
  }

  broadcast(event: WsEvent) {
    const message = JSON.stringify(event);
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  emitAuctionCreated(auction: any) {
    this.broadcast({
      type: 'auction:created',
      payload: auction,
      timestamp: Date.now(),
    });
  }

  emitBidPlaced(data: {
    auctionId: string;
    agentId: string;
    amount: number;
    txHash: string;
    rank: number;
  }) {
    this.broadcast({
      type: 'bid:placed',
      payload: data,
      timestamp: Date.now(),
    });
  }

  emitBidOutbid(data: {
    auctionId: string;
    agentId: string;
    refundTxHash: string;
  }) {
    this.broadcast({
      type: 'bid:outbid',
      payload: data,
      timestamp: Date.now(),
    });
  }

  emitAuctionClosing(data: { auctionId: string; winner: string; finalBid: number }) {
    this.broadcast({
      type: 'auction:closing',
      payload: data,
      timestamp: Date.now(),
    });
  }

  emitAuctionSettled(data: {
    auctionId: string;
    settlementTxHash: string;
    refundTxHashes: string[];
  }) {
    this.broadcast({
      type: 'auction:settled',
      payload: data,
      timestamp: Date.now(),
    });
  }

  emitResourceDelivered(data: {
    auctionId: string;
    agentId: string;
    resourceType: string;
  }) {
    this.broadcast({
      type: 'resource:delivered',
      payload: data,
      timestamp: Date.now(),
    });
  }

  emitAgentBalance(data: { agentId: string; newBalance: number }) {
    this.broadcast({
      type: 'agent:balance',
      payload: data,
      timestamp: Date.now(),
    });
  }

  close() {
    this.clients.forEach((client) => {
      client.close();
    });
    this.wss?.close();
  }
}

export const wsServer = new BidWireWsServer();