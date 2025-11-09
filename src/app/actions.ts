
'use server';

import { recommendTool as recommendToolFlow } from '@/ai/flows/activity-based-tool-recommendation';
import { z } from 'zod';

const recommendToolSchema = z.object({
  activityDescription: z.string().min(10, "Please describe your activity in more detail (at least 10 characters)."),
});

export type FormState = {
    message: string;
    data?: {
        recommendedTool: string;
        reasoning: string;
    } | null;
    fieldErrors?: {
        activityDescription?: string[];
    }
};

export async function recommendToolAction(prevState: FormState, formData: FormData): Promise<FormState> {
    const validatedFields = recommendToolSchema.safeParse({
        activityDescription: formData.get('activityDescription'),
    });

    if (!validatedFields.success) {
        return {
            message: "Invalid input.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const result = await recommendToolFlow({ activityDescription: validatedFields.data.activityDescription });
        return {
            message: "Success",
            data: result
        };
    } catch (error) {
        console.error(error);
        return {
            message: "An error occurred while getting recommendations. Please try again."
        };
    }
}
