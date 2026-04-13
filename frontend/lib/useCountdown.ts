'use client';

import { useState, useEffect } from 'react';

interface CountdownResult {
  timeLeft: number;
  formatted: string;
  isUrgent: boolean;
  isComplete: boolean;
}

export function useCountdown(endsAt: Date | string | null, durationMs = 60000): CountdownResult {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!endsAt) return;

    const endTime = new Date(endsAt).getTime();
    
    const update = () => {
      const left = Math.max(0, endTime - Date.now());
      setTimeLeft(left);
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [endsAt]);

  const formatted = formatTime(timeLeft);
  const isUrgent = timeLeft > 0 && timeLeft < 10000;
  const isComplete = timeLeft === 0;

  return { timeLeft, formatted, isUrgent, isComplete };
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function useTimer(intervalMs = 1000) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return tick;
}