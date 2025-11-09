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

interface Alarm {
  id: number;
  time: string;
  label: string;
  enabled: boolean;
}

export default function AlarmClockTool() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [newAlarmTime, setNewAlarmTime] = useState('07:00');
  const [newAlarmLabel, setNewAlarmLabel] = useState('Wake up');

  const synthRef = useRef<Tone.Synth | null>(null);
  const triggeredAlarmsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setCurrentTime(new Date());
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const playSound = async () => {
    await Tone.start();
    if (!synthRef.current) {
      synthRef.current = new Tone.Synth().toDestination();
    }
    const now = Tone.now();
    synthRef.current.triggerAttackRelease("C5", "8n", now);
    synthRef.current.triggerAttackRelease("G5", "8n", now + 0.2);
    synthRef.current.triggerAttackRelease("C5", "8n", now + 0.4);
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
          // Auto-disable alarm after it rings
          toggleAlarm(alarm.id);
        }
      } else {
        triggeredAlarmsRef.current.delete(alarm.id);
      }
    });
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
    <div className="flex flex-col h-full w-full max-w-lg mx-auto p-4 gap-4">
      <div className="text-center">
        <div className="font-mono text-6xl font-bold tracking-tight text-foreground tabular-nums">
          {currentTime ? currentTime.toLocaleTimeString() : '...'}
        </div>
        <div className="text-lg text-muted-foreground">
          {currentTime ? currentTime.toDateString() : '...'}
        </div>
      </div>

      <Card>
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
                <Button onClick={addAlarm}><Plus className="h-5 w-5" /> Add</Button>
              </div>
          </CardContent>
      </Card>
      
      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-4">
        {alarms.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No alarms set.</p>
        ) : (
          alarms.sort((a,b) => a.time.localeCompare(b.time)).map(alarm => (
            <div key={alarm.id} className={`flex items-center justify-between p-4 rounded-lg bg-card border ${alarm.enabled ? '' : 'opacity-50'}`}>
              <div>
                <p className={`text-3xl font-mono ${alarm.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>{alarm.time}</p>
                <p className="text-sm text-muted-foreground">{alarm.label}</p>
              </div>
              <div className="flex items-center gap-4">
                  <Switch checked={alarm.enabled} onCheckedChange={() => toggleAlarm(alarm.id)} />
                  <Button variant="ghost" size="icon" onClick={() => removeAlarm(alarm.id)}>
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
