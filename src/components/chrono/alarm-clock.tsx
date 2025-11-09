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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
type Day = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

interface Alarm {
  id: number;
  time: string; // Stored in 24-hour HH:mm format
  label: string;
  enabled: boolean;
  repeatDays: Day[];
}

interface AlarmClockProps {
    isFullScreen: boolean;
}

const LOCAL_STORAGE_KEY = 'chronozen_alarms';

// Helper to convert 12-hour format string to 24-hour HH:mm
const format12to24 = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');

    if (hours === '12') {
        hours = '00';
    }

    if (modifier === 'PM') {
        hours = String(parseInt(hours, 10) + 12);
    }

    return `${String(hours).padStart(2, '0')}:${minutes}`;
};

// Helper to convert 24-hour HH:mm string to 12-hour format string
const format24to12 = (time24h: string) => {
    if (!time24h) return '';
    const [hours24, minutes] = time24h.split(':');
    const hours = parseInt(hours24, 10) % 12 || 12;
    const modifier = parseInt(hours24, 10) >= 12 ? 'PM' : 'AM';
    return `${String(hours).padStart(2, '0')}:${minutes.padStart(2, '0')} ${modifier}`;
};


export default function AlarmClockTool({ isFullScreen }: AlarmClockProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const { toast } = useToast();
  
  const [newAlarmHour, setNewAlarmHour] = useState('7');
  const [newAlarmMinute, setNewAlarmMinute] = useState('00');
  const [newAlarmAmPm, setNewAlarmAmPm] = useState('AM');
  const [newAlarmLabel, setNewAlarmLabel] = useState('Wake up');
  const [newAlarmRepeat, setNewAlarmRepeat] = useState<Day[]>([]);

  const synthRef = useRef<Tone.Synth | null>(null);
  const triggeredAlarmsRef = useRef<Set<number>>(new Set());
  
  useEffect(() => {
    try {
        const savedAlarms = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedAlarms) {
            // Ensure repeatDays is always an array
            const parsedAlarms = JSON.parse(savedAlarms).map((alarm: Alarm) => ({
                ...alarm,
                repeatDays: alarm.repeatDays || []
            }));
            setAlarms(parsedAlarms);
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
        navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
    }
    if (!synthRef.current) {
      synthRef.current = new Tone.Synth().toDestination();
    }
    const now = Tone.now();
    const notes = ["C5", "E5", "G5", "C6"];
    notes.forEach((note, i) => {
        synthRef.current?.triggerAttackRelease(note, "8n", now + i * 0.2);
    })
  };

  useEffect(() => {
    if (!currentTime) return;
    const currentHHMM = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
    const currentDay = dayNames[currentTime.getDay()] as Day;
    
    alarms.forEach(alarm => {
      const isRepeatDay = alarm.repeatDays.length > 0 && alarm.repeatDays.includes(currentDay);
      const isOneTimeAlarm = alarm.repeatDays.length === 0;

      if (alarm.enabled && alarm.time === currentHHMM && (isRepeatDay || isOneTimeAlarm)) {
        if (!triggeredAlarmsRef.current.has(alarm.id)) {
          playSound();
          toast({
              title: "⏰ Alarm!",
              description: alarm.label,
              duration: 10000
          });
          triggeredAlarmsRef.current.add(alarm.id);
          
          // For one-time alarms, disable them after they trigger
          if (isOneTimeAlarm) {
            toggleAlarm(alarm.id, false);
          }
        }
      } else {
        if (alarm.time !== currentHHMM) {
          triggeredAlarmsRef.current.delete(alarm.id);
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, alarms]);
  
  const addAlarm = () => {
    if (newAlarmHour && newAlarmMinute && newAlarmAmPm && newAlarmLabel) {
      const time12h = `${newAlarmHour}:${newAlarmMinute.padStart(2, '0')} ${newAlarmAmPm}`;
      const time24h = format12to24(time12h);

      setAlarms([...alarms, { id: Date.now(), time: time24h, label: newAlarmLabel, enabled: true, repeatDays: newAlarmRepeat }]);
      
      setNewAlarmHour('7');
      setNewAlarmMinute('00');
      setNewAlarmAmPm('AM');
      setNewAlarmLabel('Wake up');
      setNewAlarmRepeat([]);
    }
  };
  
  const removeAlarm = (id: number) => {
    setAlarms(alarms.filter(alarm => alarm.id !== id));
  };

  const toggleAlarm = (id: number, forceState?: boolean) => {
    setAlarms(alarms.map(alarm => 
      alarm.id === id 
        ? { ...alarm, enabled: forceState !== undefined ? forceState : !alarm.enabled } 
        : alarm
    ));
  };
  
  const toggleRepeatDay = (day: Day) => {
      setNewAlarmRepeat(prev => 
          prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
      );
  }

  const getRepeatText = (repeatDays: Day[]) => {
      if (repeatDays.length === 0) return 'One-time alarm';
      if (repeatDays.length === 7) return 'Every day';
      if (repeatDays.length === 5 && repeatDays.includes('Mon') && repeatDays.includes('Tue') && repeatDays.includes('Wed') && repeatDays.includes('Thu') && repeatDays.includes('Fri')) return 'Weekdays';
      if (repeatDays.length === 2 && repeatDays.includes('Sat') && repeatDays.includes('Sun')) return 'Weekends';
      return repeatDays.sort((a,b) => dayNames.indexOf(a) - dayNames.indexOf(b)).join(', ');
  }

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto p-4 gap-4">
      <div className="text-center">
        <div className={cn(
            "font-mono font-bold tracking-tighter text-foreground/90 tabular-nums",
            isFullScreen ? "text-8xl md:text-9xl" : "text-6xl"
        )}>
          {currentTime ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '...'}
        </div>
        <div className={cn("text-muted-foreground", isFullScreen ? "text-2xl" : "text-lg")}>
          {currentTime ? currentTime.toDateString() : '...'}
        </div>
      </div>

      <Card className={cn(isFullScreen ? "hidden" : "block", "bg-card/50 backdrop-blur-sm")}>
          <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="grid w-full gap-1.5">
                    <Label htmlFor="alarm-label">Label</Label>
                    <Input id="alarm-label" value={newAlarmLabel} onChange={e => setNewAlarmLabel(e.target.value)} />
                </div>
                <div className="grid w-full gap-1.5">
                    <Label>Repeat</Label>
                    <div className="flex justify-center gap-1">
                        {dayNames.map(day => (
                            <Button
                                key={day}
                                variant={newAlarmRepeat.includes(day as Day) ? 'secondary' : 'ghost'}
                                size="icon"
                                className="h-8 w-8 rounded-full btn-press"
                                onClick={() => toggleRepeatDay(day as Day)}
                            >
                                {day.charAt(0)}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2 items-end">
                    <div className="grid w-full gap-1.5">
                        <Label>Time</Label>
                        <div className="flex gap-2">
                             <Select value={newAlarmHour} onValueChange={setNewAlarmHour}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>{Array.from({length: 12}, (_, i) => <SelectItem key={i+1} value={String(i+1)}>{i+1}</SelectItem>)}</SelectContent>
                             </Select>
                             <Select value={newAlarmMinute} onValueChange={setNewAlarmMinute}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>{Array.from({length: 60}, (_, i) => <SelectItem key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}</SelectItem>)}</SelectContent>
                             </Select>
                             <Select value={newAlarmAmPm} onValueChange={setNewAlarmAmPm}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AM">AM</SelectItem>
                                    <SelectItem value="PM">PM</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                    </div>
                    <Button onClick={addAlarm} className="btn-press"><Plus className="h-5 w-5" /> Add</Button>
                </div>
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
                <p className={cn('text-3xl font-mono', alarm.enabled ? 'text-foreground' : 'text-muted-foreground')}>{format24to12(alarm.time)}</p>
                <div className="text-sm text-muted-foreground">
                  <span>{alarm.label}</span>
                  <span className="mx-2">·</span>
                  <span>{getRepeatText(alarm.repeatDays)}</span>
                </div>
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
    
