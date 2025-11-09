'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Progress } from '../ui/progress';

const formatTime = (time: number) => {
  const seconds = `0${Math.floor((time / 1000) % 60)}`.slice(-2);
  const minutes = `0${Math.floor((time / (1000 * 60)) % 60)}`.slice(-2);
  const hours = `0${Math.floor(time / (1000 * 60 * 60))}`.slice(-2);
  return `${hours}:${minutes}:${seconds}`;
};

export default function Countdown() {
  const [duration, setDuration] = useState(10 * 60 * 1000); // 10 minutes
  const [time, setTime] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [inputHours, setInputHours] = useState('00');
  const [inputMinutes, setInputMinutes] = useState('10');
  const [inputSeconds, setInputSeconds] = useState('00');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef(0);
  const synthRef = useRef<Tone.Synth | null>(null);

  const start = useCallback(() => {
    if (time <= 0) return;
    setIsRunning(true);
    endTimeRef.current = Date.now() + time;
    intervalRef.current = setInterval(() => {
      const newTime = endTimeRef.current - Date.now();
      if (newTime <= 0) {
        setTime(0);
        stop();
        playSound();
      } else {
        setTime(newTime);
      }
    }, 50);
  }, [time]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setTime(duration);
  }, [duration, stop]);

  const playSound = async () => {
    await Tone.start();
    if (!synthRef.current) {
      synthRef.current = new Tone.Synth().toDestination();
    }
    synthRef.current.triggerAttackRelease("C5", "0.5s");
  };

  const handleSetTime = () => {
    const hours = parseInt(inputHours, 10) || 0;
    const minutes = parseInt(inputMinutes, 10) || 0;
    const seconds = parseInt(inputSeconds, 10) || 0;
    const newDuration = (hours * 3600 + minutes * 60 + seconds) * 1000;
    if (newDuration > 0) {
      setDuration(newDuration);
      setTime(newDuration);
      stop();
    }
    setIsDialogOpen(false);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const progress = duration > 0 ? (time / duration) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full">
      <div className="relative w-full max-w-md">
        <div className="font-mono text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-foreground tabular-nums text-center">
            {formatTime(time)}
        </div>
        <Progress value={progress} className="mt-4 h-2" />
      </div>

      <div className="flex items-center gap-4">
        {!isRunning ? (
          <Button size="lg" onClick={start} className="w-32 bg-green-500 hover:bg-green-600 text-white" disabled={time === 0}>
            <Play className="mr-2 h-5 w-5" /> Start
          </Button>
        ) : (
          <Button size="lg" onClick={stop} className="w-32 bg-red-500 hover:bg-red-600 text-white">
            <Pause className="mr-2 h-5 w-5" /> Pause
          </Button>
        )}
        <Button size="lg" variant="outline" onClick={reset} className="w-32">
          <RotateCcw className="mr-2 h-5 w-5" /> Reset
        </Button>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" variant="ghost" className="w-12 h-12 p-0">
              <Settings className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Countdown Time</DialogTitle>
              <DialogDescription>Enter the duration for the countdown.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="hours">Hours</Label>
                <Input id="hours" type="number" value={inputHours} onChange={e => setInputHours(e.target.value)} min="0" max="99" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minutes">Minutes</Label>
                <Input id="minutes" type="number" value={inputMinutes} onChange={e => setInputMinutes(e.target.value)} min="0" max="59" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="seconds">Seconds</Label>
                <Input id="seconds" type="number" value={inputSeconds} onChange={e => setInputSeconds(e.target.value)} min="0" max="59" />
              </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSetTime}>Set Time</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
