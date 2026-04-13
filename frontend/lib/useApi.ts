'use client';

import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(endpoint: string, options?: { 
  refetchInterval?: number;
  initialData?: T;
}) {
  const [state, setState] = useState<UseApiState<T>>({
    data: options?.initialData || null,
    loading: true,
    error: null,
  });

  const fetch = async () => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState(s => ({ ...s, loading: false, error: (error as Error).message }));
    }
  };

  useEffect(() => {
    fetch();
    if (options?.refetchInterval) {
      const interval = setInterval(fetch, options.refetchInterval);
      return () => clearInterval(interval);
    }
  }, [endpoint, options?.refetchInterval]);

  return { ...state, refetch: fetch };
}

export function useAuctions(filters?: { status?: number; resourceType?: string }) {
  const query = new URLSearchParams();
  if (filters?.status) query.set('status', filters.status.toString());
  if (filters?.resourceType) query.set('resourceType', filters.resourceType);
  
  const endpoint = query.toString() ? `/auctions?${query}` : '/auctions';
  return useApi<any[]>(endpoint, { refetchInterval: 5000 });
}

export function useStats() {
  return useApi<any>('/stats', { refetchInterval: 3000 });
}

export function useAgents() {
  return useApi<any[]>('/agents', { refetchInterval: 5000 });
}