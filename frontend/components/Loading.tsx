'use client';

import { motion } from 'framer-motion';

interface LoadingProps {
  text?: string;
}

export default function Loading({ text = 'Loading...' }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-2 border-periwinkle border-t-dark rounded-full mb-4"
      />
      <p className="text-slate text-sm">{text}</p>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-periwinkle/30 rounded ${className}`} />
  );
}