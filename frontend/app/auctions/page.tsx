'use client';

import { useEffect, useState } from 'react';
import { useWs } from '@/components/Provider';
import { motion } from 'framer-motion';
import Background3D from '@/components/3d/Background3D';

interface Auction {
  id: string;
  resourceType: string;
  resourceDescription: string;
  currentBid: number;
  bidCount: number;
  endsAt: string | null;
  status: number;
}

const RESOURCE_LABELS: Record<string, { label: string; emoji: string }> = {
  GPU: { label: 'GPU Compute', emoji: '⚡' },
  DATA: { label: 'Data Feed', emoji: '📊' },
  QUOTA: { label: 'API Quota', emoji: '🎫' },
};

const STATUS_LABELS: Record<number, string> = {
  0: 'PENDING',
  1: 'OPEN',
  2: 'CLOSING',
  3: 'SETTLED',
  4: 'ARCHIVED',
};

export default function AuctionsPage() {
  const { socket } = useWs();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchAuctions();

    if (!socket) return;

    socket.on('auction:created', (auction: Auction) => {
      setAuctions(prev => [...prev, auction]);
    });

    socket.on('bid:placed', ({ auctionId }) => {
      fetchAuctions();
    });

    socket.on('auction:settled', ({ auctionId }) => {
      fetchAuctions();
    });
  }, [socket]);

  const fetchAuctions = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/auctions');
      const data = await res.json();
      setAuctions(data);
    } catch (err) {
      console.error('Failed to fetch auctions:', err);
    }
  };

  const filteredAuctions = filter === 'ALL' 
    ? auctions 
    : auctions.filter(a => a.resourceType === filter);

  const startDemoAuction = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType: ['GPU', 'DATA', 'QUOTA'][Math.floor(Math.random() * 3)],
          resourceDescription: 'Demo resource for testing',
          startingBid: 0.10,
          minIncrement: 0.05,
          reservePrice: 0.50,
          duration: 60,
        }),
      });
      const auction = await res.json();
      
      await fetch(`http://localhost:3001/api/auctions/${auction.id}/start`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Failed to start auction:', err);
    }
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <Background3D variant="neural" />
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-syne text-4xl font-bold text-dark">
            Auction Board
          </h1>
          <button
            onClick={startDemoAuction}
            className="px-6 py-3 bg-dark text-white font-syne font-medium rounded-full hover:bg-periwinkle hover:text-dark transition-colors"
          >
            + Start Auction
          </button>
        </div>

        <div className="flex gap-2 mb-8">
          {['ALL', 'GPU', 'DATA', 'QUOTA'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f 
                  ? 'bg-dark text-white' 
                  : 'bg-periwinkle/30 text-slate hover:bg-periwinkle/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map((auction, index) => {
            const resource = RESOURCE_LABELS[auction.resourceType] || { label: 'Unknown', emoji: '?' };
            const isActive = auction.status === 1;
            const timeLeft = auction.endsAt 
              ? Math.max(0, new Date(auction.endsAt).getTime() - Date.now())
              : 0;
            
            return (
              <motion.div
                key={auction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-6 rounded-2xl border transition-all ${
                  isActive 
                    ? 'bg-white border-periwinkle shadow-lg shadow-periwinkle/20' 
                    : 'bg-white/50 border-slate/20'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">{resource.emoji}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-mono ${
                    isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-slate/10 text-slate'
                  }`}>
                    {STATUS_LABELS[auction.status]}
                  </span>
                </div>

                <h3 className="font-syne text-lg font-semibold text-dark mb-2">
                  {resource.label}
                </h3>
                <p className="text-sm text-slate mb-4 line-clamp-2">
                  {auction.resourceDescription}
                </p>

                {isActive && (
                  <div className="mb-4">
                    <div className="h-2 bg-periwinkle/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-dark rounded-full transition-all"
                        style={{ width: `${Math.min(100, (timeLeft / 60000) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate mt-1 font-mono">
                      {Math.ceil(timeLeft / 1000)}s remaining
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate/20">
                  <div>
                    <p className="text-xs text-slate">Current Bid</p>
                    <p className="font-syne text-xl font-bold text-dark">
                      ${auction.currentBid.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate">Bids</p>
                    <p className="font-mono text-lg text-dark">
                      {auction.bidCount}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredAuctions.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate">No auctions found</p>
            <button
              onClick={startDemoAuction}
              className="mt-4 text-periwinkle hover:underline"
            >
              Start one now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}