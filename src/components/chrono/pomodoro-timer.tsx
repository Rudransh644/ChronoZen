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
import { motion } from 'framer-motion';

type Phase = 'work' | 'short_break' | 'long_break';
const SETTINGS_KEY = 'chronozen_pomodoro_settings';

const formatTime = (time: number) => {
  const seconds = `0${Math.floor((time / 1000) % 60)}`.slice(-2);
  const minutes = `0${Math.floor((time / (1000 * 60)) % 60)}`.slice(-2);
  return `${minutes}:${seconds}`;
};

interface PomodoroTimerProps {
  isFullScreen: boolean;
  setControls?: (controls: { startStop: () => void; reset: () => void; }) => void;
}

export default function PomodoroTimer({ isFullScreen, setControls }: PomodoroTimerProps) {
  const [workDuration, setWorkDuration] = useState(25 * 60 * 1000);
  const [shortBreakDuration, setShortBreakDuration] = useState(5 * 60 * 1000);
  const [longBreakDuration, setLongBreakDuration] = useState(15 * 60 * 1000);
  const [intervals, setIntervals] = useState(4);

  const [currentInterval, setCurrentInterval] = useState(1);
  const [currentPhase, setCurrentPhase] = useState<Phase>('work');
  const [time, setTime] = useState(workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef(0);
  const synthRef = useRef<Tone.Synth | null>(null);
  
  const phaseDurations = {
      work: workDuration,
      short_break: shortBreakDuration,
      long_break: longBreakDuration
  }

  useEffect(() => {
    try {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            const { work, shortBreak, longBreak, intervals: savedIntervals } = JSON.parse(savedSettings);
            setWorkDuration(work);
            setShortBreakDuration(shortBreak);
            setLongBreakDuration(longBreak);
            setIntervals(savedIntervals);
            setTime(work);
        }
    } catch (e) { console.error(e) }
  }, []);
  
  useEffect(() => {
    try {
        const settings = { work: workDuration, shortBreak: shortBreakDuration, longBreak: longBreakDuration, intervals: intervals };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) { console.error(e) }
  }, [workDuration, shortBreakDuration, longBreakDuration, intervals]);

  const playSound = async (note: string) => {
    await Tone.start();
    if (!synthRef.current) synthRef.current = new Tone.Synth().toDestination();
    synthRef.current.triggerAttackRelease(note, "0.5s");
    if(navigator.vibrate) navigator.vibrate(200);
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
  
  const nextPhase = useCallback(() => {
    let wasRunning = isRunning;
    stop();

    if (currentPhase === 'work') {
      if (currentInterval < intervals) {
        setCurrentPhase('short_break');
        setTime(shortBreakDuration);
        playSound("E5");
      } else {
        setCurrentPhase('long_break');
        setTime(longBreakDuration);
        playSound("G5");
      }
    } else {
      setCurrentPhase('work');
      setTime(workDuration);
      setCurrentInterval(prev => (currentPhase === 'long_break' ? 1 : prev + 1));
      playSound("C5");
    }

    if (wasRunning) {
        setIsRunning(true);
    }

  }, [isRunning, currentPhase, currentInterval, intervals, workDuration, shortBreakDuration, longBreakDuration, stop]);

  const start = useCallback(() => {
    setIsRunning(true);
    endTimeRef.current = Date.now() + time;
  }, [time]);

  const handleStartStop = useCallback(() => {
    if (isRunning) {
        stop();
    } else {
        start();
    }
  }, [isRunning, start, stop]);
  
  useEffect(() => {
      if (isRunning) {
          endTimeRef.current = Date.now() + time;
      }
  }, [isRunning, time])

  const skip = useCallback(() => {
    nextPhase();
  }, [nextPhase]);

  const handleSetIntervals = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const workMins = parseInt(formData.get('work-minutes') as string) || 25;
    const shortBreakMins = parseInt(formData.get('short-break-minutes') as string) || 5;
    const longBreakMins = parseInt(formData.get('long-break-minutes') as string) || 15;
    const intervalsCount = parseInt(formData.get('intervals') as string) || 4;
    
    const newWorkDuration = workMins * 60 * 1000;
    setWorkDuration(newWorkDuration);
    setShortBreakDuration(shortBreakMins * 60 * 1000);
    setLongBreakDuration(longBreakMins * 60 * 1000);
    setIntervals(intervalsCount);
    
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
  
  const currentDuration = phaseDurations[currentPhase];
  const progress = currentDuration > 0 ? (time / currentDuration) * 100 : 0;
  const phaseText = currentPhase.replace('_', ' ');

  const phaseStyles = {
    work: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 [&>div]:bg-red-500',
    short_break: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 [&>div]:bg-blue-500',
    long_break: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 [&>div]:bg-green-500'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full text-center">
      <motion.div 
        key={currentPhase}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'font-semibold uppercase tracking-widest rounded-full px-4 py-1 shadow-md', 
          phaseStyles[currentPhase],
          isFullScreen ? 'text-4xl px-6 py-2' : 'text-2xl'
        )}>
        {phaseText}
      </motion.div>

      <div className={cn(
          "font-mono font-bold tracking-tight text-foreground/90 tabular-nums",
          isFullScreen ? "text-8xl sm:text-9xl md:text-[15rem]" : "text-6xl sm:text-8xl"
        )}>
        {formatTime(time)}
      </div>

      <div className={cn("w-full max-w-sm", isFullScreen ? "hidden" : "block")}>
        <Progress value={progress} className={cn('h-3 transition-all duration-300', phaseStyles[currentPhase])} />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>Session</span>
            <span>{currentInterval} / {intervals}</span>
        </div>
      </div>
      
      <div className={cn("flex items-center gap-4", isFullScreen ? "hidden" : "flex")}>
        <Button size="lg" onClick={handleStartStop} className={cn("w-28 text-white btn-press", isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600")}>
          {isRunning ? <><Pause className="mr-2 h-5 w-5" /> Stop</> : <><Play className="mr-2 h-5 w-5" /> Start</>}
        </Button>
        <Button size="lg" variant="outline" onClick={reset} className="btn-press"><RotateCcw className="h-5 w-5" /></Button>
        <Button size="lg" variant="outline" onClick={skip} className="btn-press"><Forward className="h-5 w-5" /></Button>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" variant="ghost" className="btn-press"><Settings className="h-6 w-6" /></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pomodoro Settings</DialogTitle>
              <DialogDescription>Customize your Pomodoro sessions.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSetIntervals}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="work-minutes">Work (mins)</Label>
                      <Input id="work-minutes" name="work-minutes" type="number" defaultValue={workDuration/60000} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="intervals">Sessions</Label>
                        <Input id="intervals" name="intervals" type="number" defaultValue={intervals} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="short-break-minutes">Short Break (mins)</Label>
                      <Input id="short-break-minutes" name="short-break-minutes" type="number" defaultValue={shortBreakDuration/60000} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="long-break-minutes">Long Break (mins)</Label>
                      <Input id="long-break-minutes" name="long-break-minutes" type="number" defaultValue={longBreakDuration/60000} />
                    </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="btn-press">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
