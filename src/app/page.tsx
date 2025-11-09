'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Timer,
  Hourglass,
  Repeat,
  Clock,
  AlarmClock,
  Gauge,
  Users,
  BrainCircuit,
  Expand,
  Minimize,
  Home as HomeIcon,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import DigitalClock from '@/components/chrono/digital-clock';
import Countdown from '@/components/chrono/countdown';
import SplitLapTimer from '@/components/chrono/split-lap-timer';
import IntervalTimer from '@/components/chrono/interval-timer';
import AlarmClockTool from '@/components/chrono/alarm-clock';
import Metronome from '@/components/chrono/metronome';
import ChessClock from '@/components/chrono/chess-clock';
import { AIRecommender } from '@/components/chrono/ai-recommender';
import Dashboard from '@/components/chrono/dashboard';
import { useTheme } from 'next-themes';

export type ToolName =
  | 'Dashboard'
  | 'Digital Clock'
  | 'Stopwatch'
  | 'Countdown'
  | 'Interval Timer'
  | 'Alarm Clock'
  | 'Metronome'
  | 'Chess Clock';

export const toolConfig = {
  'Dashboard': { name: 'Dashboard' as ToolName, icon: <HomeIcon />, gradient: 'bg-background' },
  'Digital Clock': { name: 'Digital Clock' as ToolName, icon: <Clock />, gradient: 'tool-gradient-blue' },
  'Stopwatch': { name: 'Stopwatch' as ToolName, icon: <Timer />, gradient: 'tool-gradient-green' },
  'Countdown': { name: 'Countdown' as ToolName, icon: <Hourglass />, gradient: 'tool-gradient-purple' },
  'Interval Timer': { name: 'Interval Timer' as ToolName, icon: <Repeat />, gradient: 'tool-gradient-red' },
  'Alarm Clock': { name: 'Alarm Clock' as ToolName, icon: <AlarmClock />, gradient: 'tool-gradient-yellow' },
  'Metronome': { name: 'Metronome' as ToolName, icon: <Gauge />, gradient: 'tool-gradient-red' },
  'Chess Clock': { name: 'Chess Clock' as ToolName, icon: <Users />, gradient: 'tool-gradient-gray' },
};

const tools = Object.values(toolConfig);

// Ref for tool controls to be called from keyboard shortcuts
const toolControlsRef = {
  startStop: () => {},
  reset: () => {},
  lap: () => {},
};

export default function Home() {
  const [activeTool, setActiveTool] = useState<ToolName>('Dashboard');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fullScreenRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  const handleSetToolControls = useCallback((controls: Partial<typeof toolControlsRef>) => {
    toolControlsRef.startStop = controls.startStop || (() => {});
    toolControlsRef.reset = controls.reset || (() => {});
    toolControlsRef.lap = controls.lap || (() => {});
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (!isFullScreen) {
      fullScreenRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, [isFullScreen]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            return;
        }
        e.preventDefault();
        switch(e.key.toLowerCase()){
            case 's':
                toolControlsRef.startStop();
                break;
            case 'r':
                toolControlsRef.reset();
                break;
            case 'l':
            case ' ':
                if(activeTool === 'Stopwatch') {
                    toolControlsRef.lap();
                }
                break;
            case 'f':
                toggleFullScreen();
                break;
        }
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener('fullscreenchange', handleFullScreenChange);
        window.removeEventListener('keydown', handleKeyDown);
    }
  }, [toggleFullScreen, activeTool]);


  const renderTool = () => {
    switch (activeTool) {
      case 'Dashboard':
        return <Dashboard setActiveTool={setActiveTool} />;
      case 'Digital Clock':
        return <DigitalClock isFullScreen={isFullScreen} />;
      case 'Stopwatch':
        return <SplitLapTimer isFullScreen={isFullScreen} setControls={handleSetToolControls} />;
      case 'Countdown':
        return <Countdown isFullScreen={isFullScreen} setControls={handleSetToolControls} />;
      case 'Interval Timer':
        return <IntervalTimer isFullScreen={isFullScreen} setControls={handleSetToolControls} />;
      case 'Alarm Clock':
        return <AlarmClockTool isFullScreen={isFullScreen} />;
      case 'Metronome':
        return <Metronome isFullScreen={isFullScreen} setControls={handleSetToolControls} />;
      case 'Chess Clock':
        return <ChessClock isFullScreen={isFullScreen} setControls={handleSetToolControls} />;
      default:
        return <Dashboard setActiveTool={setActiveTool} />;
    }
  };
  
  const activeToolGradient = toolConfig[activeTool]?.gradient || 'bg-background';

  return (
    <div className="flex min-h-screen bg-background">
      <nav className="w-16 flex-shrink-0 border-r border-border flex flex-col items-center py-4 gap-2">
        <div className="p-2 rounded-lg bg-primary text-primary-foreground mb-4">
            <Timer size={24} />
        </div>
        {tools.map((tool) => (
          <Button
            key={tool.name}
            variant={activeTool === tool.name ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setActiveTool(tool.name)}
            className="btn-press"
            title={tool.name}
          >
            {tool.icon}
          </Button>
        ))}
        <div className="mt-auto flex flex-col gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn-press"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </nav>

      <main ref={fullScreenRef} className={cn("flex-1 transition-colors duration-500", isFullScreen ? `bg-gradient-to-br ${activeToolGradient}` : 'bg-background')}>
         <AnimatePresence mode="wait">
            <motion.div
                key={activeTool}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "w-full h-full p-4 sm:p-6 md:p-8", 
                  !isFullScreen && `bg-gradient-to-br ${activeToolGradient}`
                )}
            >
                { !isFullScreen && activeTool !== 'Dashboard' && (
                    <header className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{activeTool}</h1>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={toggleFullScreen} className="btn-press">
                                {isFullScreen ? <Minimize /> : <Expand />}
                            </Button>
                        </div>
                    </header>
                )}

                <div className={cn("w-full h-full", isFullScreen ? "flex items-center justify-center" : "")}>
                   {renderTool()}
                </div>
                 
                {isFullScreen && (
                  <Button variant="outline" size="icon" onClick={toggleFullScreen} className="btn-press absolute top-4 right-4 z-50">
                    <Minimize />
                  </Button>
                )}
            </motion.div>
         </AnimatePresence>
      </main>

       {!isFullScreen && activeTool !== 'Dashboard' && (
        <aside className="w-80 border-l border-border p-4 hidden xl:block">
            <AIRecommender 
              setActiveTool={ (tool) => {
                if(tool) setActiveTool(tool)
              }} 
            />
        </aside>
       )}
    </div>
  );
}
