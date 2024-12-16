import { useEffect, useState } from "react";
import { Droplets, Thermometer, Sprout, Sun } from "lucide-react";
import { SensorCard } from "@/components/SensorCard";
import { SensorChart } from "@/components/SensorChart";
import { SettingsDialog } from "@/components/SettingsDialog";
import { PlantSettings, SensorData } from "@/types/plant";
import { useToast } from "@/hooks/use-toast";

// Dummy data generator
const generateDummyData = (count: number): SensorData[] => {
  const data: SensorData[] = [];
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 30000); // 30-second intervals
    data.push({
      timestamp: timestamp.toISOString(),
      temperature: 20 + Math.random() * 8, // 20-28°C
      humidity: 45 + Math.random() * 20, // 45-65%
      soilMoisture: 35 + Math.random() * 40, // 35-75%
      lightLevel: 2000 + Math.random() * 2000, // 2000-4000 lux
    });
  }
  return data;
};

const dummyData = generateDummyData(50); // Generate 50 data points

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

const Index = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlantSettings>(defaultSettings);
  const [sensorData, setSensorData] = useState<SensorData[]>(dummyData);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData(prev => {
        const newDataPoint = generateDummyData(1)[0];
        return [...prev.slice(1), newDataPoint];
      });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const currentData = sensorData[sensorData.length - 1];

  const getSensorStatus = (value: number, min: number, max: number) => {
    if (value < min || value > max) return "critical";
    const buffer = (max - min) * 0.1;
    if (value < min + buffer || value > max - buffer) return "warning";
    return "optimal";
  };

  useEffect(() => {
    if (currentData) {
      const checkAndNotify = (value: number, min: number, max: number, metric: string) => {
        if (value < min || value > max) {
          toast({
            title: `${metric} Alert`,
            description: `${metric} is outside optimal range!`,
            variant: "destructive",
          });
          // Here you would implement the Twitter API call
        }
      };

      checkAndNotify(currentData.temperature, settings.minTemperature, settings.maxTemperature, "Temperature");
      checkAndNotify(currentData.humidity, settings.minHumidity, settings.maxHumidity, "Humidity");
      checkAndNotify(currentData.soilMoisture, settings.minSoilMoisture, settings.maxSoilMoisture, "Soil Moisture");
      checkAndNotify(currentData.lightLevel, settings.minLightLevel, settings.maxLightLevel, "Light Level");
    }
  }, [currentData, settings, toast]);

  if (!currentData) return null;

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
  );
};

export default Index;