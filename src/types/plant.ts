export interface SensorData {
  timestamp: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightLevel: number;
}

export interface PlantSettings {
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
  minSoilMoisture: number;
  maxSoilMoisture: number;
  minLightLevel: number;
  maxLightLevel: number;
}