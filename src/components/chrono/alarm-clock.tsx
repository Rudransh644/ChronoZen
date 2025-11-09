'use client';

import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

interface Alarm {
  id: number;
  time: string;
  label: string;
  enabled: boolean;
}

interface AlarmClockProps {
    isFullScreen: boolean;
}

const LOCAL_STORAGE_KEY = 'chronozen_alarms';

export default function AlarmClockTool({ isFullScreen }: AlarmClockProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [newAlarmTime, setNewAlarmTime] = useState('07:00');
  const [newAlarmLabel, setNewAlarmLabel] = useState('Wake up');

  const synthRef = useRef<Tone.Synth | null>(null);
  const triggeredAlarmsRef = useRef<Set<number>>(new Set());
  
  useEffect(() => {
    try {
        const savedAlarms = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedAlarms) {
            setAlarms(JSON.parse(savedAlarms));
        }
    } catch (error) {
        console.error("Failed to load alarms from localStorage", error);
    }

    const update = () => setCurrentTime(new Date());
    update();
    const timerId = setInterval(update, 1000);
    return () => clearInterval(timerId);
  }, []);
  
  useEffect(() => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(alarms));
      } catch (error) {
        console.error("Failed to save alarms to localStorage", error);
      }
  }, [alarms])

  const playSound = async () => {
    await Tone.start();
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
    }
    if (!synthRef.current) {
      synthRef.current = new Tone.Synth().toDestination();
    }
    const now = Tone.now();
    synthRef.current.triggerAttackRelease("C5", "8n", now);
    synthRef.current.triggerAttackRelease("G5", "8n", now + 0.2);
    synthRef.current.triggerAttackRelease("C5", "8n", now + 0.4);
    synthRef.current.triggerAttackRelease("G5", "8n", now + 0.6);
    synthRef.current.triggerAttackRelease("C5", "8n", now + 0.8);
  };

  useEffect(() => {
    if (!currentTime) return;
    const currentHHMM = `${`0${currentTime.getHours()}`.slice(-2)}:${`0${currentTime.getMinutes()}`.slice(-2)}`;
    
    alarms.forEach(alarm => {
      if (alarm.enabled && alarm.time === currentHHMM) {
        if (!triggeredAlarmsRef.current.has(alarm.id)) {
          playSound();
          alert(`Alarm: ${alarm.label}`);
          triggeredAlarmsRef.current.add(alarm.id);
          // Optional: auto-disable alarm after it triggers
          // toggleAlarm(alarm.id); 
        }
      } else {
        // Reset triggered status when time no longer matches
        if (alarm.time !== currentHHMM) {
          triggeredAlarmsRef.current.delete(alarm.id);
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, alarms]);
  
  const addAlarm = () => {
    if (newAlarmTime && newAlarmLabel) {
      setAlarms([...alarms, { id: Date.now(), time: newAlarmTime, label: newAlarmLabel, enabled: true }]);
      setNewAlarmTime('07:00');
      setNewAlarmLabel('Wake up');
    }
  };
  
  const removeAlarm = (id: number) => {
    setAlarms(alarms.filter(alarm => alarm.id !== id));
  };

  const toggleAlarm = (id: number) => {
    setAlarms(alarms.map(alarm => alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm));
  };
  
  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto p-4 gap-4">
      <div className="text-center">
        <div className={cn(
            "font-mono font-bold tracking-tighter text-foreground/90 tabular-nums",
            isFullScreen ? "text-8xl md:text-9xl" : "text-6xl"
        )}>
          {currentTime ? currentTime.toLocaleTimeString() : '...'}
        </div>
        <div className={cn("text-muted-foreground", isFullScreen ? "text-2xl" : "text-lg")}>
          {currentTime ? currentTime.toDateString() : '...'}
        </div>
      </div>

      <Card className={cn(isFullScreen ? "hidden" : "block", "bg-card/50 backdrop-blur-sm")}>
          <CardContent className="p-4">
              <div className="flex gap-2 items-end">
                <div className="grid w-full gap-1.5">
                    <Label htmlFor="alarm-label">Label</Label>
                    <Input id="alarm-label" value={newAlarmLabel} onChange={e => setNewAlarmLabel(e.target.value)} />
                </div>
                <div className="grid w-full gap-1.5">
                    <Label htmlFor="alarm-time">Time</Label>
                    <Input id="alarm-time" type="time" value={newAlarmTime} onChange={e => setNewAlarmTime(e.target.value)} />
                </div>
                <Button onClick={addAlarm} className="btn-press"><Plus className="h-5 w-5" /> Add</Button>
              </div>
          </CardContent>
      </Card>
      
      <ScrollArea className={cn(isFullScreen ? "hidden" : "flex-1")}>
        <div className="space-y-4 pr-4">
        {alarms.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 h-40 flex items-center justify-center rounded-lg border-2 border-dashed">
            No alarms set.
          </div>
        ) : (
          alarms.sort((a,b) => a.time.localeCompare(b.time)).map(alarm => (
            <div key={alarm.id} className={cn('flex items-center justify-between p-4 rounded-lg bg-card/50 backdrop-blur-sm border', alarm.enabled ? '' : 'opacity-50')}>
              <div>
                <p className={cn('text-3xl font-mono', alarm.enabled ? 'text-foreground' : 'text-muted-foreground')}>{alarm.time}</p>
                <p className="text-sm text-muted-foreground">{alarm.label}</p>
              </div>
              <div className="flex items-center gap-4">
                  <Switch checked={alarm.enabled} onCheckedChange={() => toggleAlarm(alarm.id)} />
                  <Button variant="ghost" size="icon" onClick={() => removeAlarm(alarm.id)} className="btn-press">
                      <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
              </div>
            </div>
          ))
        )}
        </div>
      </ScrollArea>
    </div>
  );
}
