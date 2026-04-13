'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="font-syne text-9xl font-bold text-dark mb-4">404</h1>
        <p className="text-xl text-slate mb-8">Page not found</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-dark text-white font-syne rounded-full hover:bg-periwinkle hover:text-dark transition-colors"
          >
            Home
          </Link>
          <Link
            href="/auctions"
            className="px-6 py-3 bg-periwinkle/30 text-dark font-syne rounded-full hover:bg-periwinkle transition-colors"
          >
            Auctions
          </Link>
        </div>
      </motion.div>
    </div>
  );
}