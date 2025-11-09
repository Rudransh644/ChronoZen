'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/utils';

interface MetronomeProps {
    isFullScreen: boolean;
}

export default function Metronome({ isFullScreen }: MetronomeProps) {
  const [bpm, setBpm] = useState(120);
  const [isRunning, setIsRunning] = useState(false);
  
  const loopRef = useRef<Tone.Loop | null>(null);
  const synthRef = useRef<Tone.MembraneSynth | null>(null);

  const start = useCallback(async () => {
    await Tone.start();
    if (!synthRef.current) {
      synthRef.current = new Tone.MembraneSynth().toDestination();
    }
    if (Tone.Transport.state !== 'started') {
        await Tone.Transport.start();
    }
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    Tone.Transport.pause();
    setIsRunning(false);
  }, []);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
    
    if (!loopRef.current) {
      loopRef.current = new Tone.Loop(time => {
        synthRef.current?.triggerAttackRelease("C2", "8n", time);
      }, "4n").start(0);
    }
    
    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      loopRef.current?.dispose();
      synthRef.current?.dispose();
      loopRef.current = null;
      synthRef.current = null;
    };
  }, []);
  
  useEffect(() => {
    Tone.Transport.bpm.rampTo(bpm, 0.1);
  }, [bpm]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full max-w-sm mx-auto">
      <Card className="w-full">
        <CardHeader>
            <CardTitle className="text-center text-muted-foreground text-sm uppercase tracking-widest">BPM</CardTitle>
        </CardHeader>
        <CardContent>
            <div className={cn(
                "font-mono font-bold tracking-tight text-center text-foreground tabular-nums",
                isFullScreen ? "text-9xl" : "text-8xl"
                )}>
                {bpm}
            </div>
        </CardContent>
      </Card>
      
      <div className="w-full">
        <Slider
          value={[bpm]}
          onValueChange={(value) => setBpm(value[0])}
          min={40}
          max={240}
          step={1}
        />
      </div>
      
      <div className="flex items-center gap-4">
        {!isRunning ? (
          <Button size="lg" onClick={start} className="w-40 bg-green-500 hover:bg-green-600 text-white">
            <Play className="mr-2 h-5 w-5" /> Start
          </Button>
        ) : (
          <Button size="lg" onClick={stop} className="w-40 bg-red-500 hover:bg-red-600 text-white">
            <Pause className="mr-2 h-5 w-5" /> Stop
          </Button>
        )}
      </div>
    </div>
  );
}
