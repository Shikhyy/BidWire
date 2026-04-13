'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface WinnerOverlayProps {
  winner: string;
  amount: number;
  visible: boolean;
  onClose: () => void;
}

export default function WinnerOverlay({ winner, amount, visible, onClose }: WinnerOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-white rounded-3xl p-12 max-w-md mx-6 text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-6xl mb-6"
            >
              🏆
            </motion.div>

            <h2 className="font-syne text-2xl font-bold text-dark mb-2">
              Auction Won!
            </h2>

            <p className="text-slate mb-6">
              by <span className="font-mono text-dark">{winner.slice(0, 8)}...{winner.slice(-4)}</span>
            </p>

            <div className="text-4xl font-syne font-bold text-dark mb-8">
              ${amount.toFixed(2)}
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 bg-dark text-white font-syne font-medium rounded-full hover:bg-periwinkle hover:text-dark transition-colors"
            >
              Collect Prize
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}