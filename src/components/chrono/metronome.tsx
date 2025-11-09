'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MetronomeProps {
    isFullScreen: boolean;
    setControls?: (controls: { startStop: () => void; reset: () => void; }) => void;
}

export default function Metronome({ isFullScreen, setControls }: MetronomeProps) {
  const [bpm, setBpm] = useState(120);
  const [isRunning, setIsRunning] = useState(false);
  const [visualBeat, setVisualBeat] = useState(false);
  
  const loopRef = useRef<Tone.Loop | null>(null);
  const synthRef = useRef<Tone.MembraneSynth | null>(null);
  const tapTimesRef = useRef<number[]>([]);

  const start = useCallback(async () => {
    await Tone.start();
    if (Tone.Transport.state !== 'started') {
        await Tone.Transport.start();
    }
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    Tone.Transport.pause();
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
      setBpm(120);
  }, [stop]);

  const handleTap = () => {
    const now = Date.now();
    tapTimesRef.current.push(now);
    if (tapTimesRef.current.length > 4) {
        tapTimesRef.current.shift();
    }

    if (tapTimesRef.current.length > 1) {
        const intervals = [];
        for (let i = 1; i < tapTimesRef.current.length; i++) {
            intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        if (avgInterval > 0) {
            const newBpm = Math.round(60000 / avgInterval);
            setBpm(Math.max(40, Math.min(240, newBpm)));
        }
    }
    
    // Give visual feedback on tap
    setVisualBeat(true);
    setTimeout(() => setVisualBeat(false), 100)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === ' ') {
            e.preventDefault();
            handleTap();
        }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (setControls) {
        setControls({ startStop: handleStartStop, reset });
    }
  }, [setControls, handleStartStop, reset]);

  useEffect(() => {
    if (!synthRef.current) {
        synthRef.current = new Tone.MembraneSynth().toDestination();
    }

    if (loopRef.current) {
      loopRef.current.dispose();
    }

    loopRef.current = new Tone.Loop(time => {
      synthRef.current?.triggerAttackRelease("C2", "8n", time);
      Tone.Draw.schedule(() => {
        setVisualBeat(true);
        setTimeout(() => setVisualBeat(false), 50)
      }, time)
    }, "4n").start(0);

    return () => {
        loopRef.current?.dispose();
    }
  }, []);
  
  useEffect(() => {
    Tone.Transport.bpm.rampTo(bpm, 0.1);
  }, [bpm]);


  useEffect(() => {
    return () => {
        if (Tone.Transport.state === 'started') {
            Tone.Transport.stop();
            Tone.Transport.cancel();
        }
        synthRef.current?.dispose();
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full max-w-sm mx-auto">
      <motion.div
         animate={{ scale: visualBeat ? 1.1 : 1 }}
         transition={{ type: "spring", stiffness: 500, damping: 20 }}
         className={cn("w-full transition-shadow duration-100", visualBeat ? "shadow-2xl shadow-red-500/50" : "")}
      >
        <Card className="w-full bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-center text-muted-foreground text-sm uppercase tracking-widest">BPM</CardTitle>
            </CardHeader>
            <CardContent>
                <div className={cn(
                    "font-mono font-bold tracking-tight text-center text-foreground/90 tabular-nums",
                    isFullScreen ? "text-9xl md:text-[12rem]" : "text-8xl"
                    )}>
                    {bpm}
                </div>
            </CardContent>
        </Card>
      </motion.div>
      
      <div className={cn("w-full", isFullScreen ? "hidden" : "block")}>
        <Slider
          value={[bpm]}
          onValueChange={(value) => setBpm(value[0])}
          min={40}
          max={240}
          step={1}
          className="[&>span:last-child]:bg-red-500"
        />
        <Button variant="outline" className="w-full mt-4 btn-press" onClick={handleTap}>Tap Tempo</Button>
        <p className="text-xs text-center text-muted-foreground mt-2">Or use spacebar</p>
      </div>
      
      <div className={cn("flex items-center gap-4", isFullScreen ? "hidden" : "flex")}>
          <Button size="lg" onClick={handleStartStop} className={cn("w-40 text-white btn-press", isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600")}>
            {isRunning ? <><Pause className="mr-2 h-5 w-5" /> Stop</> : <><Play className="mr-2 h-5 w-5" /> Start</>}
          </Button>
      </div>
    </div>
  );
}
