'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Tone from 'tone';

const formatTime = (time: number) => {
  const seconds = `0${Math.floor((time / 1000) % 60)}`.slice(-2);
  const minutes = `0${Math.floor((time / (1000 * 60)) % 60)}`.slice(-2);
  const hours = `0${Math.floor(time / (1000 * 60 * 60))}`.slice(-2);
  if (parseInt(hours) > 0) {
      return `${hours}:${minutes}:${seconds}`;
  }
  return `${minutes}:${seconds}`;
};

const DURATION = 5 * 60 * 1000; // 5 minutes

interface ChessClockProps {
    isFullScreen: boolean;
    setControls?: (controls: { startStop: () => void; reset: () => void; }) => void;
}

export default function ChessClock({ isFullScreen, setControls }: ChessClockProps) {
  const [player1Time, setPlayer1Time] = useState(DURATION);
  const [player2Time, setPlayer2Time] = useState(DURATION);
  const [activePlayer, setActivePlayer] = useState<'player1' | 'player2' | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef(0);
  const synthRef = useRef<Tone.Synth | null>(null);

  const playSound = async () => {
    await Tone.start();
    if (!synthRef.current) {
        synthRef.current = new Tone.Synth().toDestination();
    }
    synthRef.current.triggerAttackRelease("C4", "8n");
  };

  const stopClock = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
  }, []);

  const tick = useCallback(() => {
    const now = Date.now();
    const delta = now - lastTickRef.current;
    lastTickRef.current = now;

    if (activePlayer === 'player1') {
      setPlayer1Time(prev => {
        const newTime = prev - delta;
        if (newTime <= 0) {
          stopClock();
          setWinner('Player 2');
          return 0;
        }
        return newTime;
      });
    } else if (activePlayer === 'player2') {
      setPlayer2Time(prev => {
        const newTime = prev - delta;
        if (newTime <= 0) {
          stopClock();
          setWinner('Player 1');
          return 0;
        }
        return newTime;
      });
    }
  }, [activePlayer, stopClock]);
  
  const startClock = useCallback(() => {
      if (winner || isRunning) return;
      setIsRunning(true);
      if (!activePlayer) {
          setActivePlayer('player1');
      }
    lastTickRef.current = Date.now();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, 100);
  }, [winner, isRunning, activePlayer, tick]);
  
  const pauseClock = () => {
      stopClock();
  }

  const handleStartStop = useCallback(() => {
    if (isRunning) {
        pauseClock();
    } else {
        startClock();
    }
  }, [isRunning, startClock]);

  const switchPlayer = (player: 'player1' | 'player2') => {
    if (!isRunning || winner || activePlayer !== player) return;
    playSound();
    setActivePlayer(player === 'player1' ? 'player2' : 'player1');
    lastTickRef.current = Date.now();
  };

  const resetClock = () => {
    stopClock();
    setActivePlayer(null);
    setPlayer1Time(DURATION);
    setPlayer2Time(DURATION);
    setWinner(null);
  };
  
  useEffect(() => {
    if (setControls) {
      setControls({ startStop: handleStartStop, reset: resetClock });
    }
  }, [setControls, handleStartStop, resetClock]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 w-full h-full")}>
        {winner && <div className="text-2xl font-bold text-green-500 mb-4 absolute top-1/4">{winner} wins!</div>}
      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 w-full flex-1", isFullScreen ? "h-full" : "")}>
        <button
          onClick={() => switchPlayer('player1')}
          disabled={!isRunning || activePlayer !== 'player1'}
          className={cn(
            'flex flex-col items-center justify-center p-8 rounded-lg transition-all duration-300 w-full h-full',
            activePlayer === 'player1' ? 'bg-white/40 dark:bg-white/20' : 'bg-card/50 backdrop-blur-sm',
            'disabled:opacity-50 disabled:cursor-not-allowed border-2 shadow-md hover:scale-[1.02]'
          )}
        >
          <div className={cn(
              "font-mono font-bold tracking-tight text-foreground/90 tabular-nums",
              isFullScreen ? "text-8xl md:text-[12rem]" : "text-5xl sm:text-7xl"
              )}>
            {formatTime(player1Time)}
          </div>
          <div className="text-lg text-muted-foreground mt-2">Player 1</div>
        </button>

        <button
          onClick={() => switchPlayer('player2')}
          disabled={!isRunning || activePlayer !== 'player2'}
          className={cn(
            'flex flex-col items-center justify-center p-8 rounded-lg transition-all duration-300 w-full h-full',
            activePlayer === 'player2' ? 'bg-white/40 dark:bg-white/20' : 'bg-card/50 backdrop-blur-sm',
            'disabled:opacity-50 disabled:cursor-not-allowed border-2 shadow-md hover:scale-[1.02]'
          )}
        >
          <div className={cn(
              "font-mono font-bold tracking-tight text-foreground/90 tabular-nums",
              isFullScreen ? "text-8xl md:text-[12rem]" : "text-5xl sm:text-7xl"
            )}>
            {formatTime(player2Time)}
          </div>
          <div className="text-lg text-muted-foreground mt-2">Player 2</div>
        </button>
      </div>

      <div className={cn("flex items-center gap-4 mt-4", isFullScreen ? "hidden" : "flex")}>
        <Button size="lg" onClick={handleStartStop} className={cn("w-32 text-white btn-press", isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600")} disabled={!!winner}>
            {isRunning ? <><Pause className="mr-2 h-5 w-5" /> Pause</> : <><Play className="mr-2 h-5 w-5" /> Start</>}
        </Button>
        <Button size="lg" variant="outline" onClick={resetClock} className="w-32 btn-press">
          <RotateCcw className="mr-2 h-5 w-5" /> Reset
        </Button>
      </div>
    </div>
  );
}
