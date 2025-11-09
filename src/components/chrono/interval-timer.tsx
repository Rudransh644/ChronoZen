'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw, Settings, Forward, Repeat as RepeatIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

type Phase = 'work' | 'rest';

const formatTime = (time: number) => {
  const seconds = `0${Math.floor((time / 1000) % 60)}`.slice(-2);
  const minutes = `0${Math.floor((time / (1000 * 60)) % 60)}`.slice(-2);
  return `${minutes}:${seconds}`;
};

export default function IntervalTimer() {
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

  const nextPhase = useCallback(() => {
    if (currentPhase === 'work' && currentInterval <= totalIntervals) {
      setCurrentPhase('rest');
      setTime(restDuration);
      playSound("E5");
    } else if (currentPhase === 'rest' && currentInterval < totalIntervals) {
      setCurrentPhase('work');
      setTime(workDuration);
      setCurrentInterval(prev => prev + 1);
      playSound("C5");
    } else {
      // End of all intervals
      reset();
      playSound("G5");
    }
  }, [currentPhase, currentInterval, totalIntervals, workDuration, restDuration]);

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
  }, [time, nextPhase]);

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

  const skip = useCallback(() => {
    stop();
    nextPhase();
  }, [stop, nextPhase]);

  const handleSetIntervals = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const workMins = parseInt(formData.get('work-minutes') as string) || 0;
    const workSecs = parseInt(formData.get('work-seconds') as string) || 0;
    const restMins = parseInt(formData.get('rest-minutes') as string) || 0;
    const restSecs = parseInt(formData.get('rest-seconds') as string) || 0;
    const intervals = parseInt(formData.get('intervals') as string) || 1;
    
    setWorkDuration((workMins * 60 + workSecs) * 1000);
    setRestDuration((restMins * 60 + restSecs) * 1000);
    setTotalIntervals(intervals);
    
    stop();
    setCurrentInterval(1);
    setCurrentPhase('work');
    setTime((workMins * 60 + workSecs) * 1000);

    setIsDialogOpen(false);
  };
  
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);
  
  const currentDuration = currentPhase === 'work' ? workDuration : restDuration;
  const progress = currentDuration > 0 ? (time / currentDuration) * 100 : 0;
  
  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full text-center">
      <div className={`text-2xl font-semibold uppercase tracking-widest rounded-full px-4 py-1 ${currentPhase === 'work' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
        {currentPhase}
      </div>

      <div className="font-mono text-6xl sm:text-8xl font-bold tracking-tight text-foreground tabular-nums">
        {formatTime(time)}
      </div>

      <div className="w-full max-w-sm">
        <Progress value={progress} className={`h-3 ${currentPhase === 'work' ? '[&>div]:bg-green-500' : '[&>div]:bg-blue-500'}`} />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>Interval</span>
            <span>{currentInterval} / {totalIntervals}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {!isRunning ? (
          <Button size="lg" onClick={start} className="w-28 bg-green-500 hover:bg-green-600 text-white">
            <Play className="mr-2 h-5 w-5" /> Start
          </Button>
        ) : (
          <Button size="lg" onClick={stop} className="w-28 bg-red-500 hover:bg-red-600 text-white">
            <Pause className="mr-2 h-5 w-5" /> Pause
          </Button>
        )}
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
