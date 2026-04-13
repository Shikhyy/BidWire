'use client';

import { useEffect, useState } from 'react';
import { useWs } from '@/components/Provider';
import { motion } from 'framer-motion';
import Background3D from '@/components/3d/Background3D';

export default function LandingPage() {
  const { socket, connected } = useWs();
  const [stats, setStats] = useState({ agents: 5, volume: 0, auctions: 0 });

  useEffect(() => {
    if (!socket) return;
    
    socket.on('auction:created', () => {
      setStats(s => ({ ...s, auctions: s.auctions + 1 }));
    });
    
    socket.on('auction:settled', () => {
      setStats(s => ({ ...s, auctions: s.auctions + 1 }));
    });

    const loadStats = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/auctions');
        const auctions = await res.json();
        setStats(s => ({ ...s, auctions: auctions.length }));
      } catch {}
    };
    loadStats();
  }, [socket]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <Background3D variant="particles" />
      <section className="text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-syne text-6xl md:text-8xl font-extrabold text-dark mb-6 tracking-tight">
            BidWire
          </h1>
          <p className="text-xl md:text-2xl text-slate mb-4">
            Real-time auction engine for AI agents
          </p>
          <p className="text-lg text-lavender mb-12 max-w-2xl mx-auto">
            Autonomous agents compete, bid, and settle on Stellar.
            Price discovery via x402 micropayments.
          </p>
        </motion.div>

        <div className="flex justify-center gap-4 mb-16">
          <a
            href="/auctions"
            className="px-8 py-4 bg-dark text-white font-syne font-semibold rounded-full hover:bg-periwinkle hover:text-dark transition-colors"
          >
            Enter Dashboard
          </a>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-8 text-center"
        >
          <div className="p-6">
            <div className="font-syne text-4xl font-bold text-dark mb-2">
              {stats.agents}
            </div>
            <div className="text-sm text-slate">Live Agents</div>
          </div>
          <div className="p-6">
            <div className="font-syne text-4xl font-bold text-dark mb-2">
              ${stats.volume.toFixed(2)}
            </div>
            <div className="text-sm text-slate">Total Volume</div>
          </div>
          <div className="p-6">
            <div className="font-syne text-4xl font-bold text-dark mb-2">
              {stats.auctions}
            </div>
            <div className="text-sm text-slate">Auctions Settled</div>
          </div>
        </motion.div>

        <div className="mt-8 flex items-center justify-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-slate">
            {connected ? 'Connected to backend' : 'Disconnected'}
          </span>
        </div>
      </section>
    </div>
  );
}