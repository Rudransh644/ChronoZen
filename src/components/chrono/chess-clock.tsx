'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Tone from 'tone';

const formatTime = (time: number) => {
  const totalSeconds = Math.floor(time / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
  const switchSynthRef = useRef<Tone.Synth | null>(null);
  const timeoutSynthRef = useRef<Tone.Synth | null>(null);

  const playSound = async (type: 'switch' | 'timeout') => {
    await Tone.start();
    if (navigator.vibrate) {
        navigator.vibrate(type === 'switch' ? 50 : [200, 100, 200]);
    }
    if (type === 'switch') {
        if (!switchSynthRef.current) {
            switchSynthRef.current = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 } }).toDestination();
        }
        switchSynthRef.current.triggerAttackRelease("C4", "8n");
    } else {
        if (!timeoutSynthRef.current) {
            timeoutSynthRef.current = new Tone.Synth().toDestination();
        }
        timeoutSynthRef.current.triggerAttackRelease("A5", "4n");
    }
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
          playSound('timeout');
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
          playSound('timeout');
          return 0;
        }
        return newTime;
      });
    }
  }, [activePlayer, stopClock]);
  
  const startClock = useCallback(() => {
      if (winner) return;
      setIsRunning(true);
      lastTickRef.current = Date.now();
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(tick, 100);
  }, [winner, tick]);
  

  const handlePlayerTap = (player: 'player1' | 'player2') => {
    if (winner) return;

    if (!isRunning) {
        // First tap starts the clock for the other player
        setActivePlayer(player === 'player1' ? 'player2' : 'player1');
        startClock();
        playSound('switch');
    } else if (activePlayer === player) {
        // Subsequent taps switch to the other player
        setActivePlayer(player === 'player1' ? 'player2' : 'player1');
        lastTickRef.current = Date.now();
        playSound('switch');
    }
    // If it's not the active player's turn, do nothing.
  };

  const resetClock = () => {
    stopClock();
    setActivePlayer(null);
    setPlayer1Time(DURATION);
    setPlayer2Time(DURATION);
    setWinner(null);
    setIsRunning(false);
  };
  
  // The startStop function for keyboard shortcuts can now be simplified or removed.
  // For now, let's make it do nothing as per the new UX.
  const handleStartStopShortcut = () => {};

  useEffect(() => {
    if (setControls) {
      setControls({ startStop: handleStartStopShortcut, reset: resetClock });
    }
  }, [setControls, resetClock]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 w-full h-full")}>
        {winner && (
          <div className="absolute top-1/4 z-10 text-center">
            <h2 className="text-4xl font-bold text-green-500 drop-shadow-lg">
                {winner} wins!
            </h2>
          </div>
        )}
      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 w-full flex-1", isFullScreen ? "h-full" : "")}>
        <button
          onClick={() => handlePlayerTap('player2')}
          disabled={!!winner || (isRunning && activePlayer !== 'player2')}
          className={cn(
            'flex flex-col items-center justify-center p-8 rounded-lg transition-all duration-300 w-full h-full rotate-180 md:rotate-0',
            activePlayer === 'player2' ? 'bg-card/80 scale-105 shadow-2xl' : 'bg-card/50 shadow-md',
            'disabled:opacity-70 disabled:cursor-not-allowed border-2'
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

        <button
          onClick={() => handlePlayerTap('player1')}
          disabled={!!winner || (isRunning && activePlayer !== 'player1')}
          className={cn(
            'flex flex-col items-center justify-center p-8 rounded-lg transition-all duration-300 w-full h-full',
             activePlayer === 'player1' ? 'bg-card/80 scale-105 shadow-2xl' : 'bg-card/50 shadow-md',
            'disabled:opacity-70 disabled:cursor-not-allowed border-2'
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
      </div>

      <div className={cn("flex items-center gap-4 mt-4", isFullScreen ? "hidden" : "flex")}>
        <Button size="lg" variant="outline" onClick={resetClock} className="w-32 btn-press">
          <RotateCcw className="mr-2 h-5 w-5" /> Reset
        </Button>
      </div>
    </div>
  );
}
