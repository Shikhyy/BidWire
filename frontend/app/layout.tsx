import type { Metadata } from 'next';
import './globals.css';
import { WsProvider } from '@/components/Provider';

export const metadata: Metadata = {
  title: 'BidWire — Real-Time AI Agent Auctions',
  description: 'The first real-time auction engine where AI agents compete, bid, and settle on Stellar',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-dm antialiased">
        <WsProvider>
          <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-white/50 backdrop-blur-md border-b border-periwinkle/30">
            <a href="/" className="font-syne text-xl font-bold text-dark">
              BidWire
            </a>
            <div className="flex gap-6 text-sm font-medium">
              <a href="/auctions" className="text-slate hover:text-dark transition-colors">
                Auctions
              </a>
              <a href="/agents" className="text-slate hover:text-dark transition-colors">
                Agents
              </a>
              <a href="/history" className="text-slate hover:text-dark transition-colors">
                History
              </a>
            </div>
          </nav>
          <main className="relative z-10 pt-20 min-h-screen">
            {children}
          </main>
        </WsProvider>
      </body>
    </html>
  );
}