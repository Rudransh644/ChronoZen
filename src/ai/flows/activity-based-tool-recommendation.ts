'use server';
/**
 * @fileOverview Recommends the most suitable timer/clock tool based on the user's activity description.
 *
 * - recommendTool - A function that recommends a timer/clock tool.
 * - RecommendToolInput - The input type for the recommendTool function.
 * - RecommendToolOutput - The return type for the recommendTool function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendToolInputSchema = z.object({
  activityDescription: z
    .string()
    .describe('A description of the user\'s intended activity.'),
});
export type RecommendToolInput = z.infer<typeof RecommendToolInputSchema>;

const RecommendToolOutputSchema = z.object({
  recommendedTool: z
    .string()
    .describe(
      'The most suitable timer/clock tool for the described activity (e.g., stopwatch, countdown timer, split/lap timer, interval timer, digital clock, alarm clock, metronome).'
    ),
  reasoning: z
    .string()
    .describe('The reasoning behind the tool recommendation.'),
});
export type RecommendToolOutput = z.infer<typeof RecommendToolOutputSchema>;

export async function recommendTool(
  input: RecommendToolInput
): Promise<RecommendToolOutput> {
  return recommendToolFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendToolPrompt',
  input: {schema: RecommendToolInputSchema},
  output: {schema: RecommendToolOutputSchema},
  prompt: `You are an expert in recommending the most suitable timer or clock tool based on a user's activity description.

  Given the following activity description, recommend the most appropriate tool from the following list: stopwatch, countdown timer, split/lap timer, interval timer, digital clock, alarm clock, metronome.

  In your response, provide both the recommended tool and a brief explanation of why that tool is the best fit for the activity.

  Activity Description: {{{activityDescription}}}

  Your Recommendation (Tool and Reasoning):
  `,
});

const recommendToolFlow = ai.defineFlow(
  {
    name: 'recommendToolFlow',
    inputSchema: RecommendToolInputSchema,
    outputSchema: RecommendToolOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
