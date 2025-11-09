'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CloudSun, Moon, Sun, Wind, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ToolName, toolConfig } from '@/app/page';
import { useUser } from '@/firebase';
import { getWeatherAction } from '@/app/actions';

interface DashboardProps {
  setActiveTool: (tool: ToolName) => void;
}

interface WeatherData {
  temperature: number;
  main: string;
  description: string;
  windSpeed: number;
  locationName: string;
}

const Greeting = () => {
  const { user } = useUser();
  const [greeting, setGreeting] = useState('');
  const [emoji, setEmoji] = useState('');
  const [isClient, setIsClient] = useState(false);
  
  const displayName = user && !user.isAnonymous ? user.email?.split('@')[0] : 'User';

  useEffect(() => {
    setIsClient(true);
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

  if (!isClient) {
    return <h1 className="text-3xl md:text-4xl font-bold text-foreground h-11"></h1>;
  }

  return (
    <h1 className="text-3xl md:text-4xl font-bold text-foreground capitalize">
      {greeting}, {displayName} {emoji}
    </h1>
  );
};

const CurrentTime = () => {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setTime(new Date());
    update(); // Set initial time on client
    const timerId = setInterval(update, 1000);
    return () => clearInterval(timerId);
  }, []);

  if (!time) {
    return (
        <div className="flex flex-col items-center">
            <div className="font-mono text-4xl md:text-6xl font-bold tracking-tight text-foreground/90 h-16 w-48 bg-muted/50 animate-pulse rounded-md"></div>
            <div className="text-muted-foreground h-6 w-64 bg-muted/50 animate-pulse rounded-md mt-2"></div>
        </div>
    );
  }

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
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const data = await getWeatherAction({ latitude: lat, longitude: lon });
        if ('error' in data) {
          throw new Error(data.error);
        }
        setWeather(data as WeatherData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      }
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        // Fallback to a default location if permission denied
        console.warn("Geolocation permission denied, falling back to default location.");
        fetchWeather(51.5072, -0.1276); // London
      }
    );
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
        {getWeatherIcon(weather.main)}
      </div>
      <div className="flex-1">
        <p className="font-bold text-lg">{Math.round(weather.temperature)}°C in {weather.locationName}</p>
        <p className="text-sm text-muted-foreground capitalize">{weather.description}</p>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Wind size={20} />
        <span className="text-sm">{weather.windSpeed.toFixed(1)} km/h</span>
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {dashboardTools.map((tool) => (
          <ToolLink key={tool.name} tool={tool} onClick={() => setActiveTool(tool.name)} />
        ))}
      </div>
    </div>
  );
}
