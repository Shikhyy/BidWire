'use client';

import { useEffect, useState, use } from 'react';
import { useWs } from '@/components/Provider';
import { motion, AnimatePresence } from 'framer-motion';
import Background3D from '@/components/3d/Background3D';

interface Auction {
  id: string;
  resourceType: string;
  resourceDescription: string;
  currentBid: number;
  minIncrement: number;
  currentLeader: string | null;
  bidCount: number;
  endsAt: string | null;
  status: number;
  escrowAddress: string;
}

interface Bid {
  id: string;
  bidderPublicKey: string;
  amount: number;
  timestamp: string;
  rank: number;
}

const STATUS_LABELS: Record<number, string> = {
  0: 'PENDING', 1: 'OPEN', 2: 'CLOSING', 3: 'SETTLED', 4: 'ARCHIVED',
};

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = use(params);
  const { socket } = useWs();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    fetchAuction();
    fetchBids();

    if (!socket) return;

    socket.on('bid:placed', (data: { auctionId: string }) => {
      if (data.auctionId === resolved.id) {
        fetchAuction();
        fetchBids();
      }
    });

    socket.on('auction:settled', (data: { auctionId: string }) => {
      if (data.auctionId === resolved.id) fetchAuction();
    });
  }, [socket, resolved.id]);

  useEffect(() => {
    if (!auction?.endsAt) return;
    
    const interval = setInterval(() => {
      const left = Math.max(0, new Date(auction.endsAt!).getTime() - Date.now());
      setTimeLeft(left);
    }, 100);
    
    return () => clearInterval(interval);
  }, [auction?.endsAt]);

  const fetchAuction = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/auctions/${resolved.id}`);
      if (res.ok) setAuction(await res.json());
    } catch {}
  };

  const fetchBids = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/auctions/${resolved.id}/bids`);
      if (res.ok) setBids(await res.json());
    } catch {}
  };

  if (!auction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate">Loading...</p>
      </div>
    );
  }

  const isActive = auction.status === 1;
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <Background3D variant="vortex" speed={isActive ? 1.5 : 0.3} />
      
      <div className="max-w-6xl mx-auto">
        <a href="/auctions" className="text-sm text-slate hover:text-dark mb-4 inline-block">
          ← Back to Auctions
        </a>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-periwinkle shadow-lg shadow-periwinkle/20 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-mono ${
                  isActive ? 'bg-green-100 text-green-700' : 'bg-slate/10 text-slate'
                }`}>
                  {STATUS_LABELS[auction.status]}
                </span>
                <span className="text-2xl">⚡</span>
              </div>

              <h1 className="font-syne text-3xl font-bold text-dark mb-2">
                {auction.resourceType} Auction
              </h1>
              <p className="text-slate mb-8">{auction.resourceDescription}</p>

              {isActive && (
                <div className="mb-8">
                  <div className="text-sm text-slate mb-2">Time Remaining</div>
                  <div className="font-mono text-5xl font-bold text-dark">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="h-2 bg-periwinkle/30 rounded-full mt-4 overflow-hidden">
                    <motion.div
                      className="h-full bg-dark rounded-full"
                      initial={{ width: '100%' }}
                      animate={{ width: `${Math.min(100, (timeLeft / 60000) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-sm text-slate mb-1">Current Bid</div>
                  <div className="font-syne text-4xl font-bold text-dark">
                    ${auction.currentBid.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate mb-1">Total Bids</div>
                  <div className="font-mono text-4xl text-dark">{auction.bidCount}</div>
                </div>
              </div>

              {auction.currentLeader && (
                <div className="mt-8 pt-6 border-t border-slate/20">
                  <div className="text-sm text-slate mb-1">Current Leader</div>
                  <code className="font-mono text-sm bg-periwinkle/30 px-3 py-1 rounded">
                    {auction.currentLeader.slice(0, 8)}...{auction.currentLeader.slice(-4)}
                  </code>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate/20">
                <div className="text-sm text-slate mb-2">Escrow Contract</div>
                <code className="font-mono text-xs text-slate break-all">
                  {auction.escrowAddress}
                </code>
              </div>
            </motion.div>
          </div>

          <div>
            <h2 className="font-syne text-xl font-semibold text-dark mb-4">
              Live Bid Feed
            </h2>
            
            <div className="bg-white rounded-2xl border border-periwinkle shadow-lg shadow-periwinkle/20 p-6 max-h-[500px] overflow-y-auto">
              <AnimatePresence>
                {bids.length === 0 ? (
                  <p className="text-slate text-center py-8">No bids yet</p>
                ) : (
                  bids.map((bid, i) => (
                    <motion.div
                      key={bid.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-4 mb-3 rounded-xl ${
                        i === 0 ? 'bg-dark text-white' : 'bg-periwinkle/20'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`font-mono text-sm ${i === 0 ? 'text-white' : 'text-dark'}`}>
                          #{bid.rank} {bid.bidderPublicKey.slice(0, 6)}...
                        </span>
                        <span className={`font-syne font-bold ${i === 0 ? 'text-white' : 'text-dark'}`}>
                          ${bid.amount.toFixed(2)}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}