import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { PlantSettings, SensorData } from "@/types/plant";
import { useToast } from "@/hooks/use-toast";

interface PlantMessageProps {
  currentData: SensorData;
  settings: PlantSettings;
}

export function PlantMessage({ currentData, settings }: PlantMessageProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateMessage = async () => {
    setIsLoading(true);
    try {
      console.log('Sending request with data:', { currentData, settings });
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/generate-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          temperature: currentData.temperature,
          humidity: currentData.humidity,
          soilMoisture: currentData.soilmoisture,
          light: currentData.light,
          settings: settings,
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate message');
      }
      
      const data = await response.json();
      console.log('Received message:', data);
      setMessage(data.message);
    } catch (error) {
      console.error('Error generating message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">Plant's Message</h2>
        <Button 
          onClick={generateMessage} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Message'
          )}
        </Button>
      </div>

      {message && (
        <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50">
          <p className="text-lg italic text-muted-foreground">"{message}"</p>
        </Card>
      )}
    </div>
  );
} 