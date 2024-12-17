import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { PlantSettings } from "@/types/plant";
import { Slider } from "@/components/ui/slider";

interface SettingsDialogProps {
  settings: PlantSettings;
  onSave: (settings: PlantSettings) => void;
}

export function SettingsDialog({ settings, onSave }: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSliderChange = (value: number[], key: keyof PlantSettings) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value[0]
    }));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Plant Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Temperature Range (°C)</Label>
              <div className="pt-2">
                <Slider
                  value={[localSettings.minTemperature]}
                  min={10}
                  max={35}
                  step={1}
                  onValueChange={(value) => handleSliderChange(value, "minTemperature")}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Min: {localSettings.minTemperature}°C</span>
                </div>
              </div>
              <div className="pt-2">
                <Slider
                  value={[localSettings.maxTemperature]}
                  min={10}
                  max={35}
                  step={1}
                  onValueChange={(value) => handleSliderChange(value, "maxTemperature")}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Max: {localSettings.maxTemperature}°C</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Humidity Range (%)</Label>
              <div className="pt-2">
                <Slider
                  value={[localSettings.minHumidity]}
                  min={20}
                  max={90}
                  step={1}
                  onValueChange={(value) => handleSliderChange(value, "minHumidity")}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Min: {localSettings.minHumidity}%</span>
                </div>
              </div>
              <div className="pt-2">
                <Slider
                  value={[localSettings.maxHumidity]}
                  min={20}
                  max={90}
                  step={1}
                  onValueChange={(value) => handleSliderChange(value, "maxHumidity")}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Max: {localSettings.maxHumidity}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Soil Moisture Range (%)</Label>
              <div className="pt-2">
                <Slider
                  value={[localSettings.minsoilmoisture]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleSliderChange(value, "minsoilmoisture")}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Min: {localSettings.minsoilmoisture}%</span>
                </div>
              </div>
              <div className="pt-2">
                <Slider
                  value={[localSettings.maxsoilmoisture]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleSliderChange(value, "maxsoilmoisture")}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Max: {localSettings.maxsoilmoisture}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Light Level Range (lux)</Label>
              <div className="pt-2">
                <Slider
                  value={[localSettings.minlight]}
                  min={0}
                  max={10000}
                  step={100}
                  onValueChange={(value) => handleSliderChange(value, "minlight")}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Min: {localSettings.minlight} lux</span>
                </div>
              </div>
              <div className="pt-2">
                <Slider
                  value={[localSettings.maxlight]}
                  min={0}
                  max={10000}
                  step={100}
                  onValueChange={(value) => handleSliderChange(value, "maxlight")}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Max: {localSettings.maxlight} lux</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Button onClick={() => onSave(localSettings)}>Save Settings</Button>
      </DialogContent>
    </Dialog>
  );
}