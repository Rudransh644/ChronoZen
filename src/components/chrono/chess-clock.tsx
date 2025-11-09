'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Settings, Timer } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const formatTime = (time: number) => {
  const milliseconds = `00${time % 1000}`.slice(-3, -1);
  const seconds = `0${Math.floor(time / 1000) % 60}`.slice(-2);
  const minutes = `0${Math.floor(time / (1000 * 60)) % 60}`.slice(-2);
  return `${minutes}:${seconds}.${milliseconds}`;
};

const SETTINGS_KEY = 'chronozen_chess_settings';

interface ChessClockProps {
  isFullScreen: boolean;
  setControls?: (controls: { startStop: () => void; reset: () => void; }) => void;
}

type Player = 1 | 2;

export default function ChessClock({ isFullScreen, setControls }: ChessClockProps) {
  const [initialTime, setInitialTime] = useState(5 * 60 * 1000); // 5 minutes
  const [player1Time, setPlayer1Time] = useState(initialTime);
  const [player2Time, setPlayer2Time] = useState(initialTime);
  
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputMinutes, setInputMinutes] = useState('5');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef(0);
  const clickSoundRef = useRef<Tone.Player | null>(null);
  const endSoundRef = useRef<Tone.Synth | null>(null);
  
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const { time } = JSON.parse(savedSettings);
        setInitialTime(time);
        setPlayer1Time(time);
        setPlayer2Time(time);
        setInputMinutes(String(time / 60000));
      }
    } catch (e) { console.error(e) }
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setActivePlayer(null);
    setWinner(null);
    setPlayer1Time(initialTime);
    setPlayer2Time(initialTime);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [initialTime]);
  
  const playClickSound = async () => {
    await Tone.start();
    if (!clickSoundRef.current) {
        clickSoundRef.current = await new Tone.Player("/sounds/click.mp3").toDestination();
    }
    clickSoundRef.current.start();
    if(navigator.vibrate) navigator.vibrate(50);
  }

  const playEndSound = async () => {
    await Tone.start();
    if (!endSoundRef.current) {
        endSoundRef.current = new Tone.Synth().toDestination();
    }
    endSoundRef.current.triggerAttackRelease("C5", "0.5s");
    if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
  }, []);

  const handlePlayerTap = useCallback((player: Player) => {
    if (winner) return;

    if (!isRunning) {
        setIsRunning(true);
        const opponent = player === 1 ? 2 : 1;
        setActivePlayer(opponent);
        lastTickRef.current = Date.now();
        playClickSound();
        return;
    }
    
    if (player === activePlayer) {
      const opponent = player === 1 ? 2 : 1;
      setActivePlayer(opponent);
      playClickSound();
    }
  }, [isRunning, activePlayer, winner]);

  useEffect(() => {
      if (isRunning && activePlayer && !winner) {
          lastTickRef.current = Date.now();
          intervalRef.current = setInterval(() => {
              const now = Date.now();
              const delta = now - lastTickRef.current;
              lastTickRef.current = now;

              if (activePlayer === 1) {
                  setPlayer1Time(prev => {
                      const newTime = prev - delta;
                      if (newTime <= 0) {
                          setWinner(2);
                          playEndSound();
                          stopTimer();
                          return 0;
                      }
                      return newTime;
                  });
              } else {
                  setPlayer2Time(prev => {
                      const newTime = prev - delta;
                      if (newTime <= 0) {
                          setWinner(1);
                          playEndSound();
                          stopTimer();
                          return 0;
                      }
                      return newTime;
                  });
              }
          }, 50);
      } else {
          if (intervalRef.current) clearInterval(intervalRef.current);
      }
      return () => { if (intervalRef.current) clearInterval(intervalRef.current) };
  }, [isRunning, activePlayer, winner, stopTimer]);


  const handleStartPause = () => {
    if (winner) return;
    if (isRunning) {
      stopTimer();
    } else {
      if (player1Time > 0 && player2Time > 0 && activePlayer) {
        setIsRunning(true);
      }
    }
  }

  useEffect(() => {
    if (setControls) {
      setControls({ startStop: handleStartPause, reset });
    }
  }, [setControls, handleStartPause, reset]);
  
  const handleSetTime = () => {
    const newTime = (parseInt(inputMinutes) || 5) * 60 * 1000;
    setInitialTime(newTime);
    setPlayer1Time(newTime);
    setPlayer2Time(newTime);
    setIsSettingsOpen(false);
    reset();
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ time: newTime }));
    } catch(e) { console.error(e) }
  }
  
  const PlayerClock = ({ player, time }: { player: Player, time: number }) => (
    <motion.button
      onClick={() => handlePlayerTap(player)}
      disabled={!!winner}
      className={cn(
        "w-full h-full flex flex-col items-center justify-center rounded-lg transition-all duration-300",
        activePlayer === player ? 'bg-primary/20 scale-105 shadow-2xl' : 'bg-card',
        winner && winner !== player ? 'opacity-30' : '',
        player === 1 ? "sm:rounded-r-none" : "sm:rounded-l-none",
        isFullScreen ? '' : 'border'
      )}
    >
      <div className={cn(
        "font-mono font-bold tracking-tighter tabular-nums",
        isFullScreen ? "text-8xl md:text-[10rem]" : "text-6xl md:text-8xl",
        time < 10000 && time > 0 ? "text-red-500 animate-pulse" : "text-foreground"
      )}>
        {formatTime(time)}
      </div>
    </motion.button>
  );

  return (
    <div className={cn("flex flex-col h-full w-full max-w-4xl mx-auto gap-4", isFullScreen ? "" : "p-4")}>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Player 2 Clock - on top for mobile */}
        <div className="sm:order-2">
            <PlayerClock player={2} time={player2Time} />
        </div>
        {/* Player 1 Clock */}
        <div className="sm:order-1">
            <PlayerClock player={1} time={player1Time} />
        </div>
      </div>
      
       <AnimatePresence>
        {winner && (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10"
            >
                <div className="bg-background p-8 rounded-lg shadow-2xl text-center">
                    <h2 className="text-4xl font-bold mb-4">🏆 Winner! 🏆</h2>
                    <p className="text-2xl text-muted-foreground">Player {winner} takes the game!</p>
                    <Button onClick={reset} className="mt-6 btn-press" size="lg">New Game</Button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {!isFullScreen && (
        <div className="flex justify-center items-center gap-4">
            <Button onClick={handleStartPause} className="w-28 btn-press" disabled={!activePlayer || !!winner}>
                {isRunning ? <><Pause className="mr-2"/> Pause</> : <><Play className="mr-2"/> Start</>}
            </Button>
            <Button variant="outline" onClick={reset} className="w-28 btn-press"><RotateCcw className="mr-2"/> Reset</Button>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="btn-press"><Settings/></Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Game Settings</DialogTitle>
                        <DialogDescription>Set the initial time for each player.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="minutes">Time per player (minutes)</Label>
                        <Input 
                            id="minutes" 
                            type="number" 
                            value={inputMinutes}
                            onChange={e => setInputMinutes(e.target.value)}
                            className="mt-2"
                        />
                        <div className="flex gap-2 mt-4">
                          <Button variant="secondary" size="sm" onClick={() => setInputMinutes('1')}>1 min</Button>
                          <Button variant="secondary" size="sm" onClick={() => setInputMinutes('3')}>3 min</Button>
                          <Button variant="secondary" size="sm" onClick={() => setInputMinutes('5')}>5 min</Button>
                          <Button variant="secondary" size="sm" onClick={() => setInputMinutes('10')}>10 min</Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSetTime}>Set Time</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      )}
    </div>
  );
}

// Dummy file to hold sound asset references
// /public/sounds/click.mp3
