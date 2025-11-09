'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw, Settings, Forward } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type Phase = 'work' | 'rest';

const formatTime = (time: number) => {
  const seconds = `0${Math.floor((time / 1000) % 60)}`.slice(-2);
  const minutes = `0${Math.floor((time / (1000 * 60)) % 60)}`.slice(-2);
  return `${minutes}:${seconds}`;
};

interface IntervalTimerProps {
  isFullScreen: boolean;
  setControls?: (controls: { startStop: () => void; reset: () => void; }) => void;
}

export default function IntervalTimer({ isFullScreen, setControls }: IntervalTimerProps) {
  const [workDuration, setWorkDuration] = useState(25 * 60 * 1000);
  const [restDuration, setRestDuration] = useState(5 * 60 * 1000);
  const [totalIntervals, setTotalIntervals] = useState(4);

  const [currentInterval, setCurrentInterval] = useState(1);
  const [currentPhase, setCurrentPhase] = useState<Phase>('work');
  const [time, setTime] = useState(workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef(0);
  const synthRef = useRef<Tone.Synth | null>(null);

  const playSound = async (note: string) => {
    await Tone.start();
    if (!synthRef.current) synthRef.current = new Tone.Synth().toDestination();
    synthRef.current.triggerAttackRelease(note, "0.5s");
  };

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setCurrentInterval(1);
    setCurrentPhase('work');
    setTime(workDuration);
  }, [stop, workDuration]);
  
  const start = useCallback(() => {
    setIsRunning(true);
    endTimeRef.current = Date.now() + time;
    intervalRef.current = setInterval(() => {
      const newTime = endTimeRef.current - Date.now();
      if (newTime <= 0) {
        nextPhase();
      } else {
        setTime(newTime);
      }
    }, 50);
  }, [time]);
  
  const nextPhase = useCallback(() => {
    stop();
    if (currentPhase === 'work' && currentInterval <= totalIntervals) {
      setCurrentPhase('rest');
      setTime(restDuration);
      if (isRunning) start();
      playSound("E5");
    } else if (currentPhase === 'rest' && currentInterval < totalIntervals) {
      setCurrentPhase('work');
      setTime(workDuration);
      setCurrentInterval(prev => prev + 1);
       if (isRunning) start();
      playSound("C5");
    } else {
      reset();
      playSound("G5");
    }
  }, [currentPhase, currentInterval, totalIntervals, workDuration, restDuration, isRunning, reset, start, stop]);

  const handleStartStop = useCallback(() => {
    if (isRunning) {
        stop();
    } else {
        start();
    }
  }, [isRunning, start, stop]);

  const skip = useCallback(() => {
    nextPhase();
  }, [nextPhase]);

  const handleSetIntervals = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const workMins = parseInt(formData.get('work-minutes') as string) || 0;
    const workSecs = parseInt(formData.get('work-seconds') as string) || 0;
    const restMins = parseInt(formData.get('rest-minutes') as string) || 0;
    const restSecs = parseInt(formData.get('rest-seconds') as string) || 0;
    const intervals = parseInt(formData.get('intervals') as string) || 1;
    
    const newWorkDuration = (workMins * 60 + workSecs) * 1000;
    setWorkDuration(newWorkDuration);
    setRestDuration((restMins * 60 + restSecs) * 1000);
    setTotalIntervals(intervals);
    
    stop();
    setCurrentInterval(1);
    setCurrentPhase('work');
    setTime(newWorkDuration);

    setIsDialogOpen(false);
  };
  
  useEffect(() => {
    if (setControls) {
      setControls({ startStop: handleStartStop, reset });
    }
  }, [setControls, handleStartStop, reset]);

  // Add nextPhase to start's dependency array
  useEffect(() => {
    if (isRunning) {
      const id = setInterval(() => {
        const newTime = endTimeRef.current - Date.now();
        if (newTime <= 0) {
          nextPhase();
        } else {
          setTime(newTime);
        }
      }, 50);
      intervalRef.current = id;
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, nextPhase]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);
  
  const currentDuration = currentPhase === 'work' ? workDuration : restDuration;
  const progress = currentDuration > 0 ? (time / currentDuration) * 100 : 0;
  
  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full text-center">
      <div className={cn(
          'font-semibold uppercase tracking-widest rounded-full px-4 py-1', 
          currentPhase === 'work' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800',
          isFullScreen ? 'text-4xl px-6 py-2' : 'text-2xl'
        )}>
        {currentPhase}
      </div>

      <div className={cn(
          "font-mono font-bold tracking-tight text-foreground tabular-nums",
          isFullScreen ? "text-8xl sm:text-9xl md:text-[12rem]" : "text-6xl sm:text-8xl"
        )}>
        {formatTime(time)}
      </div>

      <div className={cn("w-full max-w-sm", isFullScreen ? "hidden" : "block")}>
        <Progress value={progress} className={`h-3 ${currentPhase === 'work' ? '[&>div]:bg-green-500' : '[&>div]:bg-blue-500'}`} />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>Interval</span>
            <span>{currentInterval} / {totalIntervals}</span>
        </div>
      </div>
      
      <div className={cn("flex items-center gap-4", isFullScreen ? "hidden" : "flex")}>
        <Button size="lg" onClick={handleStartStop} className={cn("w-28 text-white", isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600")}>
          {isRunning ? <><Pause className="mr-2 h-5 w-5" /> Stop</> : <><Play className="mr-2 h-5 w-5" /> Start</>}
        </Button>
        <Button size="lg" variant="outline" onClick={reset}><RotateCcw className="h-5 w-5" /></Button>
        <Button size="lg" variant="outline" onClick={skip}><Forward className="h-5 w-5" /></Button>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" variant="ghost"><Settings className="h-6 w-6" /></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Interval Settings</DialogTitle>
              <DialogDescription>Set your work, rest, and interval counts.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSetIntervals}>
              <div className="grid gap-4 py-4">
                <div>
                  <Label>Work Duration</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input name="work-minutes" type="number" placeholder="Mins" defaultValue={Math.floor(workDuration/60000)} />
                    <Input name="work-seconds" type="number" placeholder="Secs" defaultValue={(workDuration/1000)%60} />
                  </div>
                </div>
                <div>
                  <Label>Rest Duration</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input name="rest-minutes" type="number" placeholder="Mins" defaultValue={Math.floor(restDuration/60000)} />
                    <Input name="rest-seconds" type="number" placeholder="Secs" defaultValue={(restDuration/1000)%60} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="intervals">Intervals</Label>
                  <Input id="intervals" name="intervals" type="number" defaultValue={totalIntervals} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
