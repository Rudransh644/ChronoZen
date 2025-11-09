'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

const formatTime = (time: number) => {
  const milliseconds = `00${time % 1000}`.slice(-3, -1);
  const seconds = `0${Math.floor(time / 1000) % 60}`.slice(-2);
  const minutes = `0${Math.floor(time / (1000 * 60)) % 60}`.slice(-2);
  const hours = `0${Math.floor(time / (1000 * 60 * 60))}`.slice(-2);
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

export default function Stopwatch() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const start = useCallback(() => {
    setIsRunning(true);
    startTimeRef.current = Date.now() - time;
    intervalRef.current = setInterval(() => {
      setTime(Date.now() - startTimeRef.current);
    }, 10);
  }, [time]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setTime(0);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full">
      <div className="font-mono text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-foreground tabular-nums">
        {formatTime(time)}
      </div>
      <div className="flex items-center gap-4">
        {!isRunning ? (
          <Button size="lg" onClick={start} className="w-32 bg-green-500 hover:bg-green-600 text-white">
            <Play className="mr-2 h-5 w-5" /> Start
          </Button>
        ) : (
          <Button size="lg" onClick={stop} className="w-32 bg-red-500 hover:bg-red-600 text-white">
            <Pause className="mr-2 h-5 w-5" /> Stop
          </Button>
        )}
        <Button size="lg" variant="outline" onClick={reset} className="w-32">
          <RotateCcw className="mr-2 h-5 w-5" /> Reset
        </Button>
      </div>
    </div>
  );
}
