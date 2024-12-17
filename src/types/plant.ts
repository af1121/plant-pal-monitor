export interface SensorData {
  timestamp: string;
  temperature: number;
  humidity: number;
  soilmoisture: number;
  light: number;
}

export interface PlantSettings {
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
  minsoilmoisture: number;
  maxsoilmoisture: number;
  minlight: number;
  maxlight: number;
}