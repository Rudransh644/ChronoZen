'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { BrainCircuit, Wand2 } from 'lucide-react';
import type { ToolName } from '@/app/page';
import type { FormState } from '@/app/actions';
import { recommendToolAction } from '@/app/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '../ui/label';

const initialState: FormState = {
  message: '',
  data: null,
  fieldErrors: {},
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full mt-4">
      <Wand2 className="mr-2 h-4 w-4" />
      {pending ? 'Thinking...' : 'Get Recommendation'}
    </Button>
  );
}

function mapAiToolToAppTool(aiTool: string): ToolName | null {
    const toolMap: { [key: string]: ToolName } = {
        'stopwatch': 'Stopwatch',
        'countdown timer': 'Countdown',
        'split/lap timer': 'Split/Lap Timer',
        'interval timer': 'Interval Timer',
        'digital clock': 'Digital Clock',
        'alarm clock': 'Alarm Clock',
        'metronome': 'Metronome',
        'chess clock': 'Chess Clock'
    };
    return toolMap[aiTool.toLowerCase()] || null;
}


interface AIRecommenderProps {
  setActiveTool: (tool: ToolName) => void;
  setRecommendedTool: (tool: ToolName | null) => void;
}

export function AIRecommender({ setActiveTool, setRecommendedTool }: AIRecommenderProps) {
  const [state, formAction] = useFormState(recommendToolAction, initialState);

  useEffect(() => {
    if (state.data?.recommendedTool) {
      const toolName = mapAiToolToAppTool(state.data.recommendedTool);
      if (toolName) {
        setActiveTool(toolName);
        setRecommendedTool(toolName);
      }
    }
  }, [state.data, setActiveTool, setRecommendedTool]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
             <BrainCircuit className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <CardTitle>AI Tool Finder</CardTitle>
            <CardDescription>Get a little help from our AI.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <Label htmlFor="activityDescription">Describe your activity:</Label>
          <Textarea
            id="activityDescription"
            name="activityDescription"
            placeholder="e.g., 'I'm running a 5k and want to track my pace.'"
            className="mt-2 min-h-[100px]"
            aria-invalid={!!state.fieldErrors?.activityDescription}
            aria-describedby="activity-error"
          />
          {state.fieldErrors?.activityDescription && (
            <p id="activity-error" className="text-sm font-medium text-destructive mt-1">
              {state.fieldErrors.activityDescription[0]}
            </p>
          )}
          {state.message && state.message !== 'Success' && !state.fieldErrors && (
            <p className="text-sm font-medium text-destructive mt-1">{state.message}</p>
          )}
          <SubmitButton />
        </form>
      </CardContent>
      {state.data && (
        <CardFooter className="flex flex-col items-start gap-2 text-sm bg-primary/20 p-4 rounded-b-lg">
            <h4 className="font-semibold">Recommendation:</h4>
            <p><strong className="text-accent-foreground">{state.data.recommendedTool}</strong></p>
            <p className="text-muted-foreground">{state.data.reasoning}</p>
        </CardFooter>
      )}
    </Card>
  );
}
