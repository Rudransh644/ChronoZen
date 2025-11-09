'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import {
  Timer,
  Hourglass,
  Spline,
  Repeat,
  Clock,
  AlarmClock,
  Gauge,
  Users,
  BrainCircuit,
  Expand,
  Minimize,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import DigitalClock from '@/components/chrono/digital-clock';
import Stopwatch from '@/components/chrono/stopwatch';
import Countdown from '@/components/chrono/countdown';
import SplitLapTimer from '@/components/chrono/split-lap-timer';
import IntervalTimer from '@/components/chrono/interval-timer';
import AlarmClockTool from '@/components/chrono/alarm-clock';
import Metronome from '@/components/chrono/metronome';
import ChessClock from '@/components/chrono/chess-clock';
import { AIRecommender } from '@/components/chrono/ai-recommender';

export type ToolName =
  | 'Digital Clock'
  | 'Stopwatch'
  | 'Countdown'
  | 'Split/Lap Timer'
  | 'Interval Timer'
  | 'Alarm Clock'
  | 'Metronome'
  | 'Chess Clock';

const tools: { name: ToolName; icon: React.ReactNode; color: string }[] = [
    { name: 'Digital Clock', icon: <Clock />, color: 'bg-sky-100 dark:bg-sky-900/20' },
    { name: 'Stopwatch', icon: <Timer />, color: 'bg-green-100 dark:bg-green-900/20' },
    { name: 'Countdown', icon: <Hourglass />, color: 'bg-orange-100 dark:bg-orange-900/20' },
    { name: 'Split/Lap Timer', icon: <Spline />, color: 'bg-indigo-100 dark:bg-indigo-900/20' },
    { name: 'Interval Timer', icon: <Repeat />, color: 'bg-red-100 dark:bg-red-900/20' },
    { name: 'Alarm Clock', icon: <AlarmClock />, color: 'bg-yellow-100 dark:bg-yellow-900/20' },
    { name: 'Metronome', icon: <Gauge />, color: 'bg-purple-100 dark:bg-purple-900/20' },
    { name: 'Chess Clock', icon: <Users />, color: 'bg-stone-200 dark:bg-stone-800/20' },
];

export default function Home() {
  const [activeTool, setActiveTool] = useState<ToolName>('Digital Clock');
  const [recommendedTool, setRecommendedTool] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fullScreenRef = useRef<HTMLDivElement>(null);

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
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const activeToolConfig = tools.find(t => t.name === activeTool) || tools[0];

  const renderTool = () => {
    switch (activeTool) {
      case 'Digital Clock':
        return <DigitalClock isFullScreen={isFullScreen} />;
      case 'Stopwatch':
        return <Stopwatch isFullScreen={isFullScreen} />;
      case 'Countdown':
        return <Countdown isFullScreen={isFullScreen} />;
      case 'Split/Lap Timer':
        return <SplitLapTimer isFullScreen={isFullScreen} />;
      case 'Interval Timer':
        return <IntervalTimer isFullScreen={isFullScreen} />;
      case 'Alarm Clock':
        return <AlarmClockTool isFullScreen={isFullScreen} />;
      case 'Metronome':
        return <Metronome isFullScreen={isFullScreen} />;
      case 'Chess Clock':
        return <ChessClock isFullScreen={isFullScreen} />;
      default:
        return <DigitalClock isFullScreen={isFullScreen} />;
    }
  };

  const memoizedTool = useMemo(() => renderTool(), [activeTool, isFullScreen]);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <Timer className="text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold tracking-tighter text-sidebar-foreground">
              ChronoZen
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {tools.map((tool) => (
              <SidebarMenuItem key={tool.name}>
                <SidebarMenuButton
                  onClick={() => {
                    setActiveTool(tool.name);
                    setRecommendedTool(null);
                  }}
                  isActive={activeTool === tool.name}
                  tooltip={{ children: tool.name }}
                  className={recommendedTool === tool.name ? 'ring-2 ring-ring' : ''}
                >
                  {tool.icon}
                  <span>{tool.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <main className="p-4 sm:p-6 md:p-8 h-full">
           <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">{activeTool}</h1>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={toggleFullScreen} className="hidden md:inline-flex">
                    {isFullScreen ? <Minimize /> : <Expand />}
                </Button>
                <SidebarTrigger className="md:hidden"/>
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-5 xl:grid-cols-3">
            <div className="lg:col-span-3 xl:col-span-2">
              <Card ref={fullScreenRef} className={cn("min-h-[450px] lg:min-h-[500px] shadow-lg border-2 transition-colors", isFullScreen ? 'fixed inset-0 z-50 w-screen h-screen rounded-none' : 'relative', activeToolConfig.color)}>
                <CardContent className="p-4 sm:p-6 h-full flex flex-col items-center justify-center relative">
                   {memoizedTool}
                   <Button variant="ghost" size="icon" onClick={toggleFullScreen} className={cn("absolute top-4 right-4", isFullScreen ? "inline-flex" : "hidden")}>
                        <Minimize />
                    </Button>
                </CardContent>
              </Card>
            </div>
            <div className={cn("lg:col-span-2 xl:col-span-1", isFullScreen ? "hidden" : "block")}>
              <AIRecommender setActiveTool={setActiveTool} setRecommendedTool={setRecommendedTool} />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
