'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CloudSun, Moon, Sun, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ToolName, toolConfig } from '@/app/page';

interface DashboardProps {
  setActiveTool: (tool: ToolName) => void;
}

interface WeatherData {
  main: {
    temp: number;
  };
  weather: {
    main: string;
    description: string;
  }[];
  wind: {
    speed: number;
  };
  name: string;
}

const Greeting = () => {
  const [greeting, setGreeting] = useState('');
  const [emoji, setEmoji] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
      setEmoji('☀️');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
      setEmoji('👋');
    } else {
      setGreeting('Good Evening');
      setEmoji('🌙');
    }
  }, []);

  return (
    <h1 className="text-3xl md:text-4xl font-bold text-foreground">
      {greeting}, User {emoji}
    </h1>
  );
};

const CurrentTime = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="flex flex-col items-center">
        <div className="font-mono text-4xl md:text-6xl font-bold tracking-tight text-foreground/90">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-muted-foreground">
            {time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
    </div>
  );
};

const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This is a placeholder. For a real app, you would get the user's location.
    const lat = 51.5072;
    const lon = -0.1276; 
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

    if (!apiKey) {
      setError("Weather API key not configured.");
      return;
    }

    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
        if (!res.ok) {
          throw new Error('Failed to fetch weather data');
        }
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      }
    };

    fetchWeather();
  }, []);

  const getWeatherIcon = (main: string) => {
    switch(main.toLowerCase()) {
        case 'clouds': return <CloudSun size={24} />;
        case 'rain':
        case 'drizzle':
        case 'thunderstorm': return <CloudSun size={24} />; // Placeholder, needs more icons
        case 'clear': return <Sun size={24} />;
        default: return <Sun size={24} />;
    }
  }

  if (error) {
    return <div className="text-sm p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200">{error}</div>;
  }

  if (!weather) {
    return <div className="text-sm p-4 text-muted-foreground">Loading weather...</div>;
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-card/50 backdrop-blur-sm border shadow-sm">
      <div className="text-blue-400">
        {getWeatherIcon(weather.weather[0].main)}
      </div>
      <div className="flex-1">
        <p className="font-bold text-lg">{Math.round(weather.main.temp)}°C in {weather.name}</p>
        <p className="text-sm text-muted-foreground capitalize">{weather.weather[0].description}</p>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Wind size={20} />
        <span className="text-sm">{weather.wind.speed.toFixed(1)} km/h</span>
      </div>
    </div>
  );
};


const ToolLink = ({ tool, onClick }: { tool: { name: ToolName; icon: React.ReactNode; gradient: string }, onClick: () => void }) => {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn("p-6 rounded-xl flex flex-col items-center justify-center gap-4 text-center text-foreground w-full h-full shadow-lg border", `bg-gradient-to-br ${tool.gradient}`)}
        >
            <div className="text-3xl">{tool.icon}</div>
            <p className="font-semibold">{tool.name}</p>
            <div className="mt-auto opacity-60 group-hover:opacity-100 transition-opacity">
                <ArrowRight />
            </div>
        </motion.button>
    );
};


export default function Dashboard({ setActiveTool }: DashboardProps) {
  const dashboardTools = Object.values(toolConfig).filter(t => t.name !== 'Dashboard');

  return (
    <div className="w-full h-full">
      <header className="mb-8">
        <Greeting />
        <p className="text-muted-foreground">What will you accomplish today?</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 p-6 rounded-xl bg-card/30 backdrop-blur-sm border shadow-md flex items-center justify-center">
            <CurrentTime />
        </div>
        <div className="flex items-center justify-center">
            <WeatherWidget />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {dashboardTools.map((tool) => (
          <ToolLink key={tool.name} tool={tool} onClick={() => setActiveTool(tool.name)} />
        ))}
      </div>
    </div>
  );
}
