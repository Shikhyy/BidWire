'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWs } from '@/components/Provider';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function ToastContainer() {
  const { socket } = useWs();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('bid:placed', (data: { agentId: string; amount: number; rank: number }) => {
      addToast(`Agent ${data.agentId} bid $${data.amount.toFixed(2)} (rank #${data.rank})`, 'success');
    });

    socket.on('auction:settled', (data: { auctionId: string }) => {
      addToast(`Auction settled!`, 'info');
    });

    socket.on('bid:outbid', () => {
      addToast('You were outbid!', 'error');
    });
  }, [socket]);

  const addToast = (message: string, type: Toast['type']) => {
    const id = `toast_${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-periwinkle',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className={`${colors[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg font-medium text-sm`}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}