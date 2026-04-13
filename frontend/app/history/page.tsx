'use client';

import { useEffect, useState } from 'react';
import Background3D from '@/components/3d/Background3D';

interface Auction {
  id: string;
  resourceType: string;
  resourceDescription: string;
  currentBid: number;
  bidCount: number;
  status: number;
  settledAt: string | null;
  settlementTxHash: string | null;
}

const STATUS_LABELS: Record<number, string> = {
  0: 'PENDING',
  1: 'OPEN',
  2: 'CLOSING',
  3: 'SETTLED',
  4: 'ARCHIVED',
};

export default function HistoryPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/auctions')
      .then(res => res.json())
      .then(data => setAuctions(data.filter((a: Auction) => a.status >= 2)))
      .catch(console.error);
  }, []);

  const settledAuctions = auctions.filter(a => a.status === 3 || a.status === 4);

  return (
    <div className="min-h-screen px-6 py-12">
      <Background3D variant="vortex" />
      <div className="max-w-6xl mx-auto">
        <h1 className="font-syne text-4xl font-bold text-dark mb-8">
          Auction History
        </h1>

        <div className="bg-white rounded-2xl border border-periwinkle shadow-lg shadow-periwinkle/20 overflow-hidden">
          <table className="w-full">
            <thead className="bg-periwinkle/20">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-syne font-semibold text-dark">
                  Resource
                </th>
                <th className="px-6 py-4 text-left text-sm font-syne font-semibold text-dark">
                  Final Bid
                </th>
                <th className="px-6 py-4 text-left text-sm font-syne font-semibold text-dark">
                  Bids
                </th>
                <th className="px-6 py-4 text-left text-sm font-syne font-semibold text-dark">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-syne font-semibold text-dark">
                  TX Hash
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-periwinkle/20">
              {settledAuctions.map(auction => (
                <tr key={auction.id} className="hover:bg-periwinkle/10">
                  <td className="px-6 py-4">
                    <p className="font-medium text-dark">{auction.resourceType}</p>
                    <p className="text-sm text-slate line-clamp-1">
                      {auction.resourceDescription}
                    </p>
                  </td>
                  <td className="px-6 py-4 font-mono text-dark">
                    ${auction.currentBid.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 font-mono text-dark">
                    {auction.bidCount}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-mono ${
                      auction.status === 3 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate/10 text-slate'
                    }`}>
                      {STATUS_LABELS[auction.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {auction.settlementTxHash ? (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${auction.settlementTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-periwinkle hover:underline"
                      >
                        {auction.settlementTxHash.slice(0, 12)}...
                      </a>
                    ) : (
                      <span className="text-sm text-slate">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {settledAuctions.length === 0 && (
            <div className="text-center py-16">
              <p className="text-slate">No completed auctions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}