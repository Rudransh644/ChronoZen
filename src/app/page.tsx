'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';

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

const tools: { name: ToolName; icon: React.ReactNode }[] = [
  { name: 'Digital Clock', icon: <Clock /> },
  { name: 'Stopwatch', icon: <Timer /> },
  { name: 'Countdown', icon: <Hourglass /> },
  { name: 'Split/Lap Timer', icon: <Spline /> },
  { name: 'Interval Timer', icon: <Repeat /> },
  { name: 'Alarm Clock', icon: <AlarmClock /> },
  { name: 'Metronome', icon: <Gauge /> },
  { name: 'Chess Clock', icon: <Users /> },
];

export default function Home() {
  const [activeTool, setActiveTool] = useState<ToolName>('Digital Clock');
  const [recommendedTool, setRecommendedTool] = useState<string | null>(null);

  const renderTool = () => {
    switch (activeTool) {
      case 'Digital Clock':
        return <DigitalClock />;
      case 'Stopwatch':
        return <Stopwatch />;
      case 'Countdown':
        return <Countdown />;
      case 'Split/Lap Timer':
        return <SplitLapTimer />;
      case 'Interval Timer':
        return <IntervalTimer />;
      case 'Alarm Clock':
        return <AlarmClockTool />;
      case 'Metronome':
        return <Metronome />;
      case 'Chess Clock':
        return <ChessClock />;
      default:
        return <DigitalClock />;
    }
  };

  const memoizedTool = useMemo(() => renderTool(), [activeTool]);

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
            <h1 className="text-3xl font-bold tracking-tight">{activeTool}</h1>
            <SidebarTrigger className="md:hidden"/>
          </header>

          <div className="grid gap-8 lg:grid-cols-5 xl:grid-cols-3">
            <div className="lg:col-span-3 xl:col-span-2">
              <Card className="min-h-[450px] lg:min-h-[500px] shadow-lg border-2">
                <CardContent className="p-4 sm:p-6 h-full flex flex-col items-center justify-center">
                  {memoizedTool}
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2 xl:col-span-1">
              <AIRecommender setActiveTool={setActiveTool} setRecommendedTool={setRecommendedTool} />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
