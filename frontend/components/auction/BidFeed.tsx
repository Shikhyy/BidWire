'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface Bid {
  id: string;
  bidderPublicKey: string;
  amount: number;
  timestamp: string;
  rank: number;
}

interface BidFeedProps {
  bids: Bid[];
  maxItems?: number;
}

export default function BidFeed({ bids, maxItems = 10 }: BidFeedProps) {
  const displayBids = bids.slice(0, maxItems).reverse();

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {displayBids.map((bid, index) => (
          <motion.div
            key={bid.id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`p-4 rounded-xl transition-all ${
              index === displayBids.length - 1
                ? 'bg-dark text-white shadow-lg shadow-dark/20'
                : 'bg-periwinkle/20'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className={`font-mono text-sm ${index === displayBids.length - 1 ? 'text-periwinkle' : 'text-slate'}`}>
                  #{bid.rank}
                </span>
                <code className={`text-sm font-mono ${index === displayBids.length - 1 ? 'text-white' : 'text-dark'}`}>
                  {bid.bidderPublicKey.slice(0, 6)}...{bid.bidderPublicKey.slice(-4)}
                </code>
              </div>
              <motion.span
                key={bid.amount}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className={`font-syne text-lg font-bold ${index === displayBids.length - 1 ? 'text-white' : 'text-dark'}`}
              >
                ${bid.amount.toFixed(2)}
              </motion.span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {bids.length === 0 && (
        <div className="text-center py-8 text-slate">
          <span className="text-4xl mb-2 block">⌐</span>
          No bids yet
        </div>
      )}
    </div>
  );
}