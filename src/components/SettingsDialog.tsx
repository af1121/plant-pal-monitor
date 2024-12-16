import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { PlantSettings } from "@/types/plant";

interface SettingsDialogProps {
  settings: PlantSettings;
  onSave: (settings: PlantSettings) => void;
}

export function SettingsDialog({ settings, onSave }: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>Plant Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minTemp">Min Temperature (°C)</Label>
              <Input
                id="minTemp"
                type="number"
                value={localSettings.minTemperature}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  minTemperature: parseFloat(e.target.value)
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTemp">Max Temperature (°C)</Label>
              <Input
                id="maxTemp"
                type="number"
                value={localSettings.maxTemperature}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  maxTemperature: parseFloat(e.target.value)
                }))}
              />
            </div>
          </div>
          {/* Add similar input pairs for humidity, soil moisture, and light level */}
        </div>
        <Button onClick={() => onSave(localSettings)}>Save Settings</Button>
      </DialogContent>
    </Dialog>
  );
}