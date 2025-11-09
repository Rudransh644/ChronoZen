'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Flag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const formatTime = (time: number, withMs = true) => {
  const milliseconds = withMs ? `.${`00${time % 1000}`.slice(-3, -1)}` : '';
  const seconds = `0${Math.floor(time / 1000) % 60}`.slice(-2);
  const minutes = `0${Math.floor(time / (1000 * 60)) % 60}`.slice(-2);
  const hours = `0${Math.floor(time / (1000 * 60 * 60))}`.slice(-2);
  return `${hours}:${minutes}:${seconds}${milliseconds}`;
};

interface SplitLapTimerProps {
  isFullScreen: boolean;
  setControls?: (controls: { startStop: () => void; reset: () => void; lap: () => void }) => void;
}

export default function SplitLapTimer({ isFullScreen, setControls }: SplitLapTimerProps) {
  const [time, setTime] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const lastLapTimeRef = useRef(0);

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

  const handleStartStop = useCallback(() => {
    if (isRunning) {
      stop();
    } else {
      start();
    }
  }, [isRunning, start, stop]);

  const reset = useCallback(() => {
    stop();
    setTime(0);
    setLaps([]);
    lastLapTimeRef.current = 0;
  }, [stop]);

  const lap = useCallback(() => {
    if (!isRunning) return;
    const lapTime = time - lastLapTimeRef.current;
    setLaps(prev => [lapTime, ...prev]);
    lastLapTimeRef.current = time;
  }, [time, isRunning]);

  useEffect(() => {
    if (setControls) {
      setControls({
        startStop: handleStartStop,
        reset: reset,
        lap: lap,
      });
    }
  }, [setControls, handleStartStop, reset, lap]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-between h-full w-full max-w-md mx-auto p-4 gap-6">
      <div className="w-full text-center">
        <div className={cn(
            "font-mono font-bold tracking-tight text-foreground/90 tabular-nums",
            isFullScreen ? "text-8xl sm:text-9xl md:text-[12rem] leading-none" : "text-5xl sm:text-7xl"
        )}>
          {formatTime(time)}
        </div>
        <div className={cn(
            "font-mono text-muted-foreground tabular-nums",
            isFullScreen ? "text-4xl mt-4" : "text-2xl"
            )}>
          {laps.length > 0 ? formatTime(time - lastLapTimeRef.current) : formatTime(0)}
        </div>
      </div>
      
      <div className={cn("flex items-center justify-center gap-4 w-full", isFullScreen ? "hidden" : "flex")}>
        <Button size="lg" onClick={handleStartStop} className={cn("w-32 btn-press text-white", isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600")}>
          {isRunning ? <><Pause className="mr-2 h-5 w-5" /> Stop</> : <><Play className="mr-2 h-5 w-5" /> Start</>}
        </Button>
        <Button size="lg" variant="outline" onClick={isRunning ? lap : reset} className="w-32 btn-press">
          {isRunning ? <><Flag className="mr-2 h-5 w-5" /> Lap</> : <><RotateCcw className="mr-2 h-5 w-5" /> Reset</>}
        </Button>
      </div>

      <div className={cn("w-full flex-1", isFullScreen ? 'hidden' : 'block')}>
        <Separator className="my-4" />
        <ScrollArea className="h-48 w-full mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Lap</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laps.length > 0 ? laps.map((lapTime, index) => {
                const totalTime = laps.slice(index).reduce((acc, curr) => acc + curr, 0);
                return (
                <motion.tr 
                    key={laps.length - index}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  <TableCell className="font-medium">{laps.length - index}</TableCell>
                  <TableCell>{formatTime(lapTime, false)}</TableCell>
                  <TableCell className="text-right">{formatTime(lastLapTimeRef.current - totalTime + lapTime, false)}</TableCell>
                </motion.tr>
              )}) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground h-24">No laps recorded.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
