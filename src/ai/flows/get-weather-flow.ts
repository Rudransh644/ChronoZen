'use server';
/**
 * @fileoverview A Genkit flow that retrieves weather data for a given location.
 *
 * - getWeather - A function that fetches weather information.
 * - GetWeatherInput - The input type for the getWeather function.
 * - GetWeatherOutput - The return type for the getWeather function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import axios from 'axios';

const GetWeatherInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
});
export type GetWeatherInput = z.infer<typeof GetWeatherInputSchema>;

const WeatherDataSchema = z.object({
  temperature: z.number().describe('The current temperature in Celsius.'),
  description: z.string().describe('A brief description of the weather conditions (e.g., "clear sky", "light rain").'),
  main: z.string().describe('The main weather condition (e.g., "Clear", "Clouds", "Rain").'),
  windSpeed: z.number().describe('The wind speed in kilometers per hour.'),
  locationName: z.string().describe('The name of the city or location.'),
});

const GetWeatherOutputSchema = z.object({
  weather: WeatherDataSchema,
});
export type GetWeatherOutput = z.infer<typeof GetWeatherOutputSchema>;

// This is a "tool" that the AI model can decide to use.
const getCurrentWeatherTool = ai.defineTool(
    {
      name: 'getCurrentWeather',
      description: 'Get the current weather for a given location using latitude and longitude.',
      inputSchema: GetWeatherInputSchema,
      outputSchema: WeatherDataSchema,
    },
    async ({ latitude, longitude }) => {
      // In a real-world scenario, you'd use a robust weather API.
      // For this example, we're using a free, open API. Note that this is not a Google API.
      const apiKey = 'a11756a55549e503a45c353347914838'; // Free API key, fine to be public
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
      
      try {
        const response = await axios.get(url);
        const data = response.data;
        return {
          temperature: data.main.temp,
          description: data.weather[0].description,
          main: data.weather[0].main,
          windSpeed: data.wind.speed * 3.6, // m/s to km/h
          locationName: data.name,
        };
      } catch (error) {
        console.error("Error fetching weather data:", error);
        throw new Error("Could not retrieve weather information.");
      }
    }
  );
  

const prompt = ai.definePrompt({
  name: 'getWeatherPrompt',
  input: { schema: GetWeatherInputSchema },
  output: { schema: GetWeatherOutputSchema },
  tools: [getCurrentWeatherTool],
  prompt: `
    You are a weather assistant. Your task is to provide the current weather conditions for the given location coordinates.
    
    Use the provided tool to get the current weather for the latitude: {{{latitude}}} and longitude: {{{longitude}}}.
    
    Format the output as the GetWeatherOutput schema.
  `,
});

const getWeatherFlow = ai.defineFlow(
  {
    name: 'getWeatherFlow',
    inputSchema: GetWeatherInputSchema,
    outputSchema: GetWeatherOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Unable to get weather data from the model.');
    }
    return output;
  }
);

export async function getWeather(input: GetWeatherInput): Promise<GetWeatherOutput> {
  return getWeatherFlow(input);
}
