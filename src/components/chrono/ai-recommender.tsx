'use client';

import { useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
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
    <Button type="submit" disabled={pending} className="w-full mt-4 btn-press">
      <Wand2 className="mr-2 h-4 w-4" />
      {pending ? 'Thinking...' : 'Get Recommendation'}
    </Button>
  );
}

function mapAiToolToAppTool(aiTool: string): ToolName | null {
    const toolMap: { [key: string]: ToolName } = {
        'stopwatch': 'Stopwatch',
        'countdown timer': 'Countdown',
        'split/lap timer': 'Stopwatch',
        'interval timer': 'Interval Timer',
        'digital clock': 'Digital Clock',
        'alarm clock': 'Alarm Clock',
        'metronome': 'Metronome',
        'chess clock': 'Chess Clock',
    };
    return toolMap[aiTool.toLowerCase()] || null;
}


interface AIRecommenderProps {
  setActiveTool: (tool: ToolName | null) => void;
}

export function AIRecommender({ setActiveTool }: AIRecommenderProps) {
  const [state, formAction] = useActionState(recommendToolAction, initialState);

  useEffect(() => {
    if (state.data?.recommendedTool) {
      const toolName = mapAiToolToAppTool(state.data.recommendedTool);
      if (toolName) {
        setActiveTool(toolName);
      }
    }
  }, [state.data, setActiveTool]);

  return (
    <Card className="shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2 rounded-lg">
             <BrainCircuit className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <CardTitle>AI Tool Finder</CardTitle>
            <CardDescription>Describe an activity to get a tool recommendation.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <Label htmlFor="activityDescription">Your Activity:</Label>
          <Textarea
            id="activityDescription"
            name="activityDescription"
            placeholder="e.g., 'Running a 5k and tracking my pace.'"
            className="mt-2 min-h-[100px] bg-background/70"
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
        <CardFooter className="flex flex-col items-start gap-2 text-sm bg-muted/50 p-4 rounded-b-lg">
            <h4 className="font-semibold">Recommendation: <strong className="font-bold">{state.data.recommendedTool}</strong></h4>
            <p className="text-muted-foreground">{state.data.reasoning}</p>
        </CardFooter>
      )}
    </Card>
  );
}
