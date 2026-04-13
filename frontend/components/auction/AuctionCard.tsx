'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface Auction {
  id: string;
  resourceType: string;
  resourceDescription: string;
  currentBid: number;
  bidCount: number;
  endsAt: string | null;
  status: number;
}

interface AuctionCardProps {
  auction: Auction;
  index?: number;
}

const RESOURCE_EMOJI: Record<string, string> = {
  GPU: '⚡',
  DATA: '📊',
  QUOTA: '🎫',
};

const STATUS_COLORS: Record<number, string> = {
  0: 'bg-slate/10 text-slate',
  1: 'bg-green-100 text-green-700',
  2: 'bg-yellow-100 text-yellow-700',
  3: 'bg-blue-100 text-blue-700',
  4: 'bg-slate/10 text-slate',
};

const STATUS_LABELS: Record<number, string> = {
  0: 'PENDING',
  1: 'OPEN',
  2: 'CLOSING',
  3: 'SETTLED',
  4: 'ARCHIVED',
};

export default function AuctionCard({ auction, index = 0 }: AuctionCardProps) {
  const isActive = auction.status === 1;
  const emoji = RESOURCE_EMOJI[auction.resourceType] || '❓';
  
  const timeLeft = auction.endsAt 
    ? Math.max(0, new Date(auction.endsAt).getTime() - Date.now())
    : 0;
  
  const progress = timeLeft > 0 ? Math.min(100, (timeLeft / 60000) * 100) : 0;

  return (
    <Link href={`/auctions/${auction.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -4 }}
        className={`p-6 rounded-2xl border transition-all cursor-pointer ${
          isActive
            ? 'bg-white border-periwinkle shadow-lg shadow-periwinkle/20 hover:shadow-xl'
            : 'bg-white/50 border-slate/20'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl">{emoji}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-mono ${STATUS_COLORS[auction.status]}`}>
            {STATUS_LABELS[auction.status]}
          </span>
        </div>

        <h3 className="font-syne text-lg font-semibold text-dark mb-1">
          {auction.resourceType}
        </h3>
        <p className="text-sm text-slate mb-4 line-clamp-2">
          {auction.resourceDescription}
        </p>

        {isActive && (
          <div className="mb-4">
            <div className="h-1.5 bg-periwinkle/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-dark rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-slate mt-1 font-mono">
              {Math.ceil(timeLeft / 1000)}s left
            </p>
          </div>
        )}

        <div className="flex justify-between items-end pt-4 border-t border-slate/20">
          <div>
            <p className="text-xs text-slate">Current Bid</p>
            <p className="font-syne text-2xl font-bold text-dark">
              ${auction.currentBid.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate">Bids</p>
            <p className="font-mono text-xl text-dark">{auction.bidCount}</p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}