'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Stats {
  agents: number;
  volume: number;
  auctions: number;
}

export default function LiveStats() {
  const [stats, setStats] = useState<Stats>({ agents: 0, volume: 0, auctions: 0 });
  const [connecting, setConnecting] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [auctionsRes, agentsRes] = await Promise.all([
          fetch('http://localhost:3001/api/auctions'),
          fetch('http://localhost:3001/api/agents'),
        ]);

        const auctions = await auctionsRes.json();
        const agents = await agentsRes.json();

        const volume = auctions.reduce((sum: number, a: any) => sum + a.currentBid, 0);

        setStats({
          agents: agents.length || 5,
          volume,
          auctions: auctions.filter((a: any) => a.status >= 3).length,
        });
        setConnecting(false);
      } catch {
        setStats({ agents: 5, volume: 0, auctions: 0 });
        setConnecting(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-3 gap-8 text-center"
    >
      <div className="p-6">
        <div className="font-syne text-4xl font-bold text-dark mb-2 flex items-center justify-center gap-2">
          {stats.agents}
          <span className={`w-2 h-2 rounded-full ${connecting ? 'bg-yellow-500' : 'bg-green-500'}`} />
        </div>
        <div className="text-sm text-slate">Live Agents</div>
      </div>
      <div className="p-6">
        <div className="font-syne text-4xl font-bold text-dark mb-2 animate-pulse">
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
  );
}