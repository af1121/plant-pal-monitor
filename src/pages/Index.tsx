import { useEffect, useState } from "react";
import { Droplets, Thermometer, Sprout, Sun } from "lucide-react";
import { SensorCard } from "@/components/SensorCard";
import { SensorChart } from "@/components/SensorChart";
import { SettingsDialog } from "@/components/SettingsDialog";
import { PlantVisualization } from "@/components/PlantVisualization";
import { PlantSettings, SensorData } from "@/types/plant";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const defaultSettings: PlantSettings = {
  minTemperature: 18,
  maxTemperature: 26,
  minHumidity: 40,
  maxHumidity: 60,
  minSoilMoisture: 30,
  maxSoilMoisture: 70,
  minLightLevel: 1000,
  maxLightLevel: 5000,
};

// Fetch function for the sensor data
const fetchSensorData = async (): Promise<SensorData[]> => {
  const response = await fetch('http://localhost:3000/api/sensors');
  if (!response.ok) {
    throw new Error('Failed to fetch sensor data');
  }
  return response.json();
};

const Index = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlantSettings>(defaultSettings);
  
  // Use React Query for data fetching
  const { data: sensorData = [], isError, error } = useQuery({
    queryKey: ['sensorData'],
    queryFn: fetchSensorData,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Show error toast if fetch fails
  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({
        title: "Error fetching sensor data",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const currentData = sensorData[sensorData.length - 1] || {
    temperature: 0,
    humidity: 0,
    soilMoisture: 0,
    lightLevel: 0,
  };

  const getSensorStatus = (value: number, min: number, max: number) => {
    if (value < min || value > max) return "critical";
    const buffer = (max - min) * 0.1;
    if (value < min + buffer || value > max - buffer) return "warning";
    return "optimal";
  };

  return (
    <div className="container mx-auto p-4 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Plant Monitor</h1>
        <SettingsDialog settings={settings} onSave={setSettings} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SensorCard
          title="Temperature"
          value={currentData.temperature}
          unit="°C"
          icon={<Thermometer className="h-4 w-4" />}
          status={getSensorStatus(currentData.temperature, settings.minTemperature, settings.maxTemperature)}
        />
        <SensorCard
          title="Humidity"
          value={currentData.humidity}
          unit="%"
          icon={<Droplets className="h-4 w-4" />}
          status={getSensorStatus(currentData.humidity, settings.minHumidity, settings.maxHumidity)}
        />
        <SensorCard
          title="Soil Moisture"
          value={currentData.soilMoisture}
          unit="%"
          icon={<Sprout className="h-4 w-4" />}
          status={getSensorStatus(currentData.soilMoisture, settings.minSoilMoisture, settings.maxSoilMoisture)}
        />
        <SensorCard
          title="Light Level"
          value={currentData.lightLevel}
          unit="lux"
          icon={<Sun className="h-4 w-4" />}
          status={getSensorStatus(currentData.lightLevel, settings.minLightLevel, settings.maxLightLevel)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PlantVisualization currentData={currentData} className="lg:col-span-1" />
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SensorChart
            data={sensorData}
            dataKey="temperature"
            title="Temperature History"
            unit="°C"
          />
          <SensorChart
            data={sensorData}
            dataKey="humidity"
            title="Humidity History"
            unit="%"
          />
          <SensorChart
            data={sensorData}
            dataKey="soilMoisture"
            title="Soil Moisture History"
            unit="%"
          />
          <SensorChart
            data={sensorData}
            dataKey="lightLevel"
            title="Light Level History"
            unit="lux"
          />
        </div>
      </div>
    </div>
  );
};

export default Index;