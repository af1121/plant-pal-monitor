import { PlantSettings } from "@/types/plant";
import { Slider } from "@/components/ui/slider";

interface SettingsDialogProps {
  settings: PlantSettings;
  onSettingsChange: (settings: PlantSettings) => void;
}

export function SettingsDialog({ settings, onSettingsChange }: SettingsDialogProps) {
  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <h2 className="text-xl font-semibold text-center relative">
          <span className="bg-card/50 px-4 bg-gradient-to-r from-green-500 to-emerald-700 bg-clip-text text-transparent">
            Ideal Conditions
          </span>
        </h2>
      </div>
      
      <div className="space-y-6">
        {/* Temperature Slider */}
        <div className="group space-y-2 transition-all hover:bg-card/50 p-3 rounded-lg">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Temperature Range</span>
            <span className="text-sm text-muted-foreground">
              {settings.minTemperature}°C - {settings.maxTemperature}°C
            </span>
          </div>
          <Slider
            min={0}
            max={40}
            step={1}
            value={[settings.minTemperature, settings.maxTemperature]}
            onValueChange={([min, max]) =>
              onSettingsChange({ ...settings, minTemperature: min, maxTemperature: max })
            }
          />
        </div>

        {/* Humidity Slider */}
        <div className="group space-y-2 transition-all hover:bg-card/50 p-3 rounded-lg">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Humidity Range</span>
            <span className="text-sm text-muted-foreground">
              {settings.minHumidity}% - {settings.maxHumidity}%
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[settings.minHumidity, settings.maxHumidity]}
            onValueChange={([min, max]) =>
              onSettingsChange({ ...settings, minHumidity: min, maxHumidity: max })
            }
          />
        </div>

        {/* Soil Moisture Slider */}
        <div className="group space-y-2 transition-all hover:bg-card/50 p-3 rounded-lg">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Soil Moisture Range</span>
            <span className="text-sm text-muted-foreground">
              {settings.minsoilmoisture}% - {settings.maxsoilmoisture}%
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[settings.minsoilmoisture, settings.maxsoilmoisture]}
            onValueChange={([min, max]) =>
              onSettingsChange({ ...settings, minsoilmoisture: min, maxsoilmoisture: max })
            }
          />
        </div>

        {/* Light Level Slider */}
        <div className="group space-y-2 transition-all hover:bg-card/50 p-3 rounded-lg">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Light Level Range</span>
            <span className="text-sm text-muted-foreground">
              {settings.minlight} - {settings.maxlight} lux
            </span>
          </div>
          <Slider
            min={0}
            max={1000}
            step={10}
            value={[settings.minlight, settings.maxlight]}
            onValueChange={([min, max]) =>
              onSettingsChange({ ...settings, minlight: min, maxlight: max })
            }
          />
        </div>
      </div>
    </div>
  );
}