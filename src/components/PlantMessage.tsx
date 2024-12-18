import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Twitter, AlertTriangle, Clock } from "lucide-react";
import { PlantSettings, SensorData } from "@/types/plant";
import { useToast } from "@/hooks/use-toast";

interface MistreatmentStatus {
  isBeingMistreated: boolean;
  issues: string[];
  averages?: {
    temperature: number;
    humidity: number;
    soilMoisture: number;
    light: number;
  };
}

interface PlantMessageProps {
  currentData: SensorData;
  settings: PlantSettings;
}

export function PlantMessage({ currentData, settings }: PlantMessageProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [ownerUsername, setOwnerUsername] = useState("");
  const [status, setStatus] = useState<MistreatmentStatus | null>(null);
  const [lastAutoMessage, setLastAutoMessage] = useState<{
    message: string;
    status: MistreatmentStatus;
    timestamp: string;
  } | null>(null);
  const [timeInfo, setTimeInfo] = useState<{
    lastGenerated: string;
    nextGeneration: string;
  }>({ lastGenerated: '', nextGeneration: '' });
  const { toast } = useToast();

  useEffect(() => {
    const updateTimes = () => {
      if (lastAutoMessage?.timestamp) {
        const lastTime = new Date(lastAutoMessage.timestamp);
        const now = new Date();
        const minutesAgo = Math.floor((now.getTime() - lastTime.getTime()) / (1000 * 60));
        const hoursAgo = Math.floor(minutesAgo / 60);
        
        const nextGen = new Date();
        nextGen.setUTCHours(13, 11, 0, 0);
        if (nextGen <= now) {
          nextGen.setDate(nextGen.getDate() + 1);
        }
        const minutesToNext = Math.floor((nextGen.getTime() - now.getTime()) / (1000 * 60));
        const hoursToNext = Math.floor(minutesToNext / 60);

        setTimeInfo({
          lastGenerated: hoursAgo > 0 
            ? `${hoursAgo}h ${minutesAgo % 60}m ago`
            : `${minutesAgo}m ago`,
          nextGeneration: hoursToNext > 0
            ? `${hoursToNext}h ${minutesToNext % 60}m`
            : `${minutesToNext}m`
        });
      }
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000);
    return () => clearInterval(interval);
  }, [lastAutoMessage]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const settingsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/settings`);
        if (!settingsResponse.ok) throw new Error('Failed to fetch settings');
        const settingsData = await settingsResponse.json();
        setOwnerUsername(settingsData.ownerUsername || '');

        const messageResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/auto-message`);
        if (!messageResponse.ok) throw new Error('Failed to fetch auto-message');
        const messageData = await messageResponse.json();
        if (messageData.message) {
          setLastAutoMessage(messageData);
          setMessage(messageData.message);
          setStatus(messageData.status);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, []);

  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value.replace('@', '');
    setOwnerUsername(newUsername);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ownerUsername: newUsername }),
      });
      
      if (!response.ok) throw new Error('Failed to save settings');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save username",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold text-foreground">Plant's Message</h2>
        <Input
          placeholder="Owner's Twitter username"
          value={ownerUsername}
          onChange={handleUsernameChange}
          className="w-48"
        />
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Next message in: {timeInfo.nextGeneration}</span>
      </div>

      {status?.averages && (
        <Card className="p-4 bg-card/50 backdrop-blur-sm border border-border/50">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">24-Hour Averages</h3>
              {status.isBeingMistreated && (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Temperature</p>
                <p className={`text-lg font-medium ${status.issues.includes('temperature') ? 'text-red-500' : ''}`}>
                  {status.averages.temperature.toFixed(1)}°C
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Humidity</p>
                <p className={`text-lg font-medium ${status.issues.includes('humidity') ? 'text-red-500' : ''}`}>
                  {status.averages.humidity.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Soil Moisture</p>
                <p className={`text-lg font-medium ${status.issues.includes('soil moisture') ? 'text-red-500' : ''}`}>
                  {status.averages.soilMoisture.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Light</p>
                <p className={`text-lg font-medium ${status.issues.includes('light') ? 'text-red-500' : ''}`}>
                  {status.averages.light.toFixed(0)} lux
                </p>
              </div>
            </div>
            {status.isBeingMistreated && (
              <p className="text-sm text-yellow-500 mt-2">
                Issues detected: {status.issues.join(', ')}
              </p>
            )}
          </div>
        </Card>
      )}

      {message && (
        <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
          <div className="flex justify-between items-start gap-4">
            <p className="text-lg italic text-muted-foreground flex-1">"{message}"</p>
            <a
              href="https://x.com/AbdullahsPlant"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                variant="outline"
              >
                <Twitter className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </Card>
      )}
    </div>
  );
} 