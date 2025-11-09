'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DigitalClockProps {
    isFullScreen: boolean;
}

export default function DigitalClock({ isFullScreen }: DigitalClockProps) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setTime(new Date());
    update();
    const timerId = setInterval(update, 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <div className={cn(
          "font-mono font-bold tracking-tight text-foreground/90 tabular-nums",
           isFullScreen ? "text-8xl sm:text-9xl md:text-[15rem]" : "text-6xl sm:text-8xl md:text-9xl"
        )}>
        {time ? formatTime(time) : '00:00:00'}
      </div>
      <div className={cn(
          "text-muted-foreground",
          isFullScreen ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"
        )}>
        {time ? formatDate(time) : 'Loading...'}
      </div>
    </div>
  );
}
