'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  endsAt: Date | string | null;
  onComplete?: () => void;
}

export default function CountdownTimer({ endsAt, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!endsAt) return;

    const endTime = new Date(endsAt).getTime();

    const update = () => {
      const left = Math.max(0, endTime - Date.now());
      setTimeLeft(left);

      if (left === 0 && !isComplete) {
        setIsComplete(true);
        onComplete?.();
      }
    };

    update();
    const interval = setInterval(update, 100);

    return () => clearInterval(interval);
  }, [endsAt, isComplete, onComplete]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = endsAt 
    ? Math.min(100, ((timeLeft / 60000) * 100))
    : 100;

  const isUrgent = timeLeft < 10000;

  return (
    <div className="relative">
      <div className="font-mono text-5xl font-bold text-center mb-4">
        <motion.span
          key={timeLeft}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          className={isUrgent ? 'text-blush' : 'text-dark'}
        >
          {formatTime(timeLeft)}
        </motion.span>
      </div>

      <div className="h-2 bg-periwinkle/30 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full transition-colors ${isUrgent ? 'bg-blush' : 'bg-dark'}`}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {isUrgent && timeLeft > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-blush rounded-full"
        />
      )}
    </div>
  );
}