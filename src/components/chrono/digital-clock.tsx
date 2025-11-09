'use client';

import { useState, useEffect } from 'react';

export default function DigitalClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timerId = setInterval(() => setTime(new Date()), 1000);
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
      <div className="font-mono text-6xl sm:text-8xl md:text-9xl font-bold tracking-tight text-foreground tabular-nums">
        {time ? formatTime(time) : '00:00:00'}
      </div>
      <div className="text-lg sm:text-xl text-muted-foreground">
        {time ? formatDate(time) : 'Loading...'}
      </div>
    </div>
  );
}
