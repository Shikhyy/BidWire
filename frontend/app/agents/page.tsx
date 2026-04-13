'use client';

import { useEffect, useState } from 'react';
import { useWs } from '@/components/Provider';
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

const STRATEGY_COLORS: Record<string, string> = {
  aggressive: 'bg-red-100 text-red-700',
  conservative: 'bg-blue-100 text-blue-700',
  sniper: 'bg-purple-100 text-purple-700',
  random: 'bg-yellow-100 text-yellow-700',
  budgetAware: 'bg-green-100 text-green-700',
};

export default function AgentsPage() {
  const { socket } = useWs();
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    fetchAgents();

    if (!socket) return;

    socket.on('bid:placed', fetchAgents);
    socket.on('auction:settled', fetchAgents);
  }, [socket]);

  const fetchAgents = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/agents');
      const data = await res.json();
      setAgents(data);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-syne text-4xl font-bold text-dark mb-8">
          Agent Overview
        </h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, index) => {
            const budgetUsed = (agent.currentSpend / agent.budgetCap) * 100;
            const isActive = agent.status === 'active';
            const strategyColor = STRATEGY_COLORS[agent.strategy] || 'bg-slate/10 text-slate';
            
            return (
              <motion.div
                key={agent.agentId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 bg-white rounded-2xl border border-periwinkle shadow-lg shadow-periwinkle/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-periwinkle to-lavender flex items-center justify-center">
                    <span className="text-xl">{agent.name[0]}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-mono ${
                    isActive ? 'bg-green-100 text-green-700' : 'bg-slate/10 text-slate'
                  }`}>
                    {agent.status}
                  </span>
                </div>

                <h3 className="font-syne text-xl font-semibold text-dark mb-1">
                  {agent.name}
                </h3>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${strategyColor}`}>
                  {agent.strategy}
                </span>

                <div className="mt-6 space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate">Budget</span>
                      <span className="font-mono text-dark">
                        ${agent.currentSpend.toFixed(2)} / ${agent.budgetCap.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 bg-periwinkle/30 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-dark rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${budgetUsed}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-sm pt-3 border-t border-slate/20">
                    <div>
                      <p className="text-slate">Wins</p>
                      <p className="font-syne text-xl font-bold text-dark">{agent.wins}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate">Win Rate</p>
                      <p className="font-mono text-lg text-dark">
                        {agent.wins > 0 ? '100%' : '0%'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}