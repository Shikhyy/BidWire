'use client';

import { useEffect, useState, use } from 'react';
import Background3D from '@/components/3d/Background3D';
import { motion } from 'framer-motion';

interface Agent {
  agentId: string;
  name: string;
  strategy: string;
  budgetCap: number;
  currentSpend: number;
  wins: number;
  status: string;
}

interface BidHistory {
  auctionId: string;
  amount: number;
  timestamp: string;
  rank: number;
}

const STRATEGY_INFO: Record<string, { desc: string; color: string }> = {
  aggressive: { desc: 'Always bids higher to win', color: 'bg-red-100 text-red-700' },
  conservative: { desc: 'Bids at fair value only', color: 'bg-blue-100 text-blue-700' },
  sniper: { desc: 'Waits for last 5 seconds', color: 'bg-purple-100 text-purple-700' },
  random: { desc: 'Unpredictable bidding', color: 'bg-yellow-100 text-yellow-700' },
  budgetAware: { desc: 'Tracks spend rate', color: 'bg-green-100 text-green-700' },
};

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = use(params);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [bidHistory, setBidHistory] = useState<BidHistory[]>([]);

  useEffect(() => {
    fetch(`http://localhost:3001/api/agents/${resolved.id}`)
      .then(res => res.json())
      .then(setAgent)
      .catch(() => {});

    fetch(`http://localhost:3001/api/agents/${resolved.id}/history`)
      .then(res => res.json())
      .then(data => setBidHistory(data.bidHistory || []))
      .catch(() => {});
  }, [resolved.id]);

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate">Loading...</p>
      </div>
    );
  }

  const budgetUsed = (agent.currentSpend / agent.budgetCap) * 100;
  const info = STRATEGY_INFO[agent.strategy] || { desc: 'Unknown', color: 'bg-slate/10' };

  return (
    <div className="min-h-screen px-6 py-12">
      <Background3D variant="constellation" />
      
      <div className="max-w-4xl mx-auto">
        <a href="/agents" className="text-sm text-slate hover:text-dark mb-4 inline-block">
          ← Back to Agents
        </a>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-periwinkle shadow-lg shadow-periwinkle/20 p-8"
        >
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-periwinkle to-lavender flex items-center justify-center text-3xl">
              {agent.name[0]}
            </div>
            <div>
              <h1 className="font-syne text-3xl font-bold text-dark mb-1">
                {agent.name}
              </h1>
              <span className={`inline-block px-3 py-1 rounded-full text-sm ${info.color}`}>
                {agent.strategy}
              </span>
            </div>
          </div>

          <p className="text-slate mb-8">{info.desc}</p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-periwinkle/10 rounded-xl">
              <p className="text-sm text-slate mb-2">Budget</p>
              <p className="font-syne text-3xl font-bold text-dark">
                ${agent.currentSpend.toFixed(2)} <span className="text-lg text-slate">/ ${agent.budgetCap.toFixed(2)}</span>
              </p>
              <div className="h-2 bg-periwinkle/30 rounded-full mt-3 overflow-hidden">
                <motion.div
                  className="h-full bg-dark rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${budgetUsed}%` }}
                />
              </div>
            </div>

            <div className="p-6 bg-periwinkle/10 rounded-xl">
              <p className="text-sm text-slate mb-2">Wins</p>
              <p className="font-syne text-3xl font-bold text-dark">{agent.wins}</p>
              <p className="text-sm text-slate mt-1">
                {agent.status}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-slate mb-4">Recent Bids</p>
            {bidHistory.length === 0 ? (
              <p className="text-slate text-center py-4">No bids yet</p>
            ) : (
              <div className="space-y-2">
                {bidHistory.slice(0, 10).map((bid, i) => (
                  <div key={i} className="flex justify-between p-3 bg-periwinkle/10 rounded-lg">
                    <code className="font-mono text-sm text-slate">{bid.auctionId?.slice(0, 12)}...</code>
                    <span className="font-mono text-dark">${bid.amount?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}