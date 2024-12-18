import { useEffect, useState, useMemo } from "react";
import { Droplets, Thermometer, Sprout, Sun } from "lucide-react";
import { SensorCard } from "@/components/SensorCard";
import { SensorChart } from "@/components/SensorChart";
import { SettingsDialog } from "@/components/SettingsDialog";
import { PlantSettings, SensorData } from "@/types/plant";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Slider } from "@/components/ui/slider";
import { PlantMessage } from "@/components/PlantMessage";

const defaultSettings: PlantSettings = {
  minTemperature: 18,
  maxTemperature: 26,
  minHumidity: 40,
  maxHumidity: 60,
  minsoilmoisture: 30,
  maxsoilmoisture: 70,
  minlight: 20,
  maxlight: 50,
};

// Add TimeRange type
type TimeRange = '1h' | '6h' | '24h';

// Add this function near the top of the file, with other utility functions
const calibrateSoilMoisture = (voltage: number): number => {
  // Define voltage range
  const MAX_VOLTAGE = 4.0;  // Completely dry
  const MIN_VOLTAGE = 3.6;  // Completely wet
  const VOLTAGE_RANGE = MAX_VOLTAGE - MIN_VOLTAGE;

  // Convert to percentage (inverted because higher voltage = drier soil)
  const percentage = ((MAX_VOLTAGE - voltage) / VOLTAGE_RANGE) * 100;
  
  // Clamp the value between 0 and 100 and round to 2 decimal places
  return Number(Math.max(0, Math.min(100, percentage)).toFixed(2));
};

const calibrateLight = (rawValue: number): number => {
  // Using the reference point: 4 raw = 400 lux
  const CALIBRATION_FACTOR = 400 / 4;  // 100 lux per raw unit
  
  // Convert to lux and round to 2 decimal places
  return Number((rawValue * CALIBRATION_FACTOR).toFixed(2));
};

const Index = () => {
  const { toast } = useToast();

  // Load settings from localStorage or use defaults
  const loadSavedSettings = (): PlantSettings => {
    const saved = localStorage.getItem('plantSettings');
    if (saved) {
      return JSON.parse(saved);
    }
    return defaultSettings;
  };

  const [settings, setSettings] = useState<PlantSettings>(loadSavedSettings());

  // Save settings whenever they change
  useEffect(() => {
    localStorage.setItem('plantSettings', JSON.stringify(settings));
  }, [settings]);

  const [lastUpdateSeconds, setLastUpdateSeconds] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  
  // Fetch 24 hours of data
  const fetchSensorData = async (): Promise<SensorData[]> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sensors`);
    if (!response.ok) {
      throw new Error('Failed to fetch sensor data');
    }
    return response.json();
  };

  const { 
    data: fullSensorData = [], 
    isError, 
    error 
  } = useQuery({
    queryKey: ['sensorData'],
    queryFn: fetchSensorData,
    refetchInterval: 30000,
  });

  // Show error toast if query fails
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error",
        description: error?.message || "Failed to fetch sensor data",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  // Filter data based on selected time range
  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime());
    
    switch (timeRange) {
      case '1h':
        cutoff.setHours(now.getHours() - 1);
        break;
      case '6h':
        cutoff.setHours(now.getHours() - 6);
        break;
      case '24h':
        cutoff.setHours(now.getHours() - 24);
        break;
    }

    return fullSensorData.filter(reading => 
      new Date(reading.timestamp) >= cutoff
    );
  }, [fullSensorData, timeRange]);

  useEffect(() => {
    setLastUpdateSeconds(0);
  }, [fullSensorData[0]?.timestamp]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdateSeconds(prev => {
        const newValue = prev + 1;
        return newValue <= 30 ? newValue : 30;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentData = fullSensorData[0] || {
    timestamp: new Date().toISOString(),
    temperature: 0,
    humidity: 0,
    soilmoisture: 0,
    light: 0,
  };

  // Apply calibration to soil moisture reading
  const calibratedSoilMoisture = calibrateSoilMoisture(currentData.soilmoisture);
  const calibratedLight = calibrateLight(currentData.light);

  const getSensorStatus = (value: number, min: number, max: number) => {
    if (value < min || value > max) return "critical";
    const buffer = (max - min) * 0.1;
    if (value < min + buffer || value > max - buffer) return "warning";
    return "optimal";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 animate-fade-in">
      <div className="container mx-auto space-y-8 max-w-7xl">
        <div className="flex justify-between items-center bg-card/50 p-6 rounded-lg backdrop-blur-sm border border-border/50 shadow-lg">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
            Cyberbullying Plant Dashboard
          </h1>
        </div>

        <PlantMessage 
          currentData={fullSensorData[0] || {
            timestamp: new Date().toISOString(),
            temperature: 0,
            humidity: 0,
            soilmoisture: 0,
            light: 0,
          }} 
          settings={settings}
        />

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-foreground">
            Current Readings
          </h2>
          <span className="text-sm text-muted-foreground">
            Last updated {lastUpdateSeconds} seconds ago
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SensorCard
            title="Temperature"
            value={currentData.temperature}
            unit="°C"
            icon={<Thermometer className="h-5 w-5" />}
            status={getSensorStatus(currentData.temperature, settings.minTemperature, settings.maxTemperature)}
          />
          <SensorCard
            title="Humidity"
            value={currentData.humidity}
            unit="%"
            icon={<Droplets className="h-5 w-5" />}
            status={getSensorStatus(currentData.humidity, settings.minHumidity, settings.maxHumidity)}
          />
          <SensorCard
            title="Soil Moisture"
            value={calibrateSoilMoisture(currentData.soilmoisture)}
            unit="%"
            icon={<Sprout className="h-5 w-5" />}
            status={getSensorStatus(calibrateSoilMoisture(currentData.soilmoisture), settings.minsoilmoisture, settings.maxsoilmoisture)}
          />
          <SensorCard
            title="Light Level"
            value={calibrateLight(currentData.light)}
            unit="lux"
            icon={<Sun className="h-5 w-5" />}
            status={getSensorStatus(calibrateLight(currentData.light), settings.minlight, settings.maxlight)}
          />
        </div>

        <div className="space-y-8">
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-border/50 space-y-10">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <h2 className="text-xl font-semibold relative z-10">
                <span className="bg-card px-4 bg-gradient-to-r from-green-500 to-emerald-700 bg-clip-text text-transparent">
                  Ideal Conditions
                </span>
              </h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-green-500" />
                    <label className="text-sm font-medium">Temperature Range (°C)</label>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {settings.minTemperature}°C - {settings.maxTemperature}°C
                  </span>
                </div>
                <Slider
                  defaultValue={[settings.minTemperature, settings.maxTemperature]}
                  min={0}
                  max={40}
                  step={1}
                  onValueChange={([min, max]) => 
                    setSettings(prev => ({ ...prev, minTemperature: min, maxTemperature: max }))
                  }
                  className="mt-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <label className="text-sm font-medium">Humidity Range (%)</label>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {settings.minHumidity}% - {settings.maxHumidity}%
                  </span>
                </div>
                <Slider
                  defaultValue={[settings.minHumidity, settings.maxHumidity]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([min, max]) => 
                    setSettings(prev => ({ ...prev, minHumidity: min, maxHumidity: max }))
                  }
                  className="mt-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sprout className="h-4 w-4 text-emerald-500" />
                    <label className="text-sm font-medium">Soil Moisture Range (%)</label>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {settings.minsoilmoisture}% - {settings.maxsoilmoisture}%
                  </span>
                </div>
                <Slider
                  defaultValue={[settings.minsoilmoisture, settings.maxsoilmoisture]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([min, max]) => 
                    setSettings(prev => ({ ...prev, minsoilmoisture: min, maxsoilmoisture: max }))
                  }
                  className="mt-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    <label className="text-sm font-medium">Light Level Range (lux)</label>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {settings.minlight} - {settings.maxlight} lux
                  </span>
                </div>
                <Slider
                  defaultValue={[settings.minlight, settings.maxlight]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([min, max]) => 
                    setSettings(prev => ({ ...prev, minlight: min, maxlight: max }))
                  }
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-foreground">
              Sensor History
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange('1h')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${timeRange === '1h' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card/50 hover:bg-card/80'
                  }`}
              >
                1 Hour
              </button>
              <button
                onClick={() => setTimeRange('6h')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${timeRange === '6h' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card/50 hover:bg-card/80'
                  }`}
              >
                6 Hours
              </button>
              <button
                onClick={() => setTimeRange('24h')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${timeRange === '24h' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card/50 hover:bg-card/80'
                  }`}
              >
                24 Hours
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SensorChart
              data={filteredData.map(d => ({
                ...d,
                soilmoisture: calibrateSoilMoisture(d.soilmoisture)
              }))}
              dataKey="soilmoisture"
              title="Soil Moisture History"
              unit="%"
              settings={settings}
            />
            <SensorChart
              data={filteredData.map(d => ({
                ...d,
                light: calibrateLight(d.light)
              }))}
              dataKey="light"
              title="Light Level History"
              unit="lux"
              settings={settings}
            />
            <SensorChart
              data={filteredData}
              dataKey="temperature"
              title="Temperature History"
              unit="°C"
              settings={settings}
            />
            <SensorChart
              data={filteredData}
              dataKey="humidity"
              title="Humidity History"
              unit="%"
              settings={settings}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;