import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  soilmoisture: { type: Number, required: true },
  light: { type: Number, required: true }
}, {
  collection: 'sensor_data'
});

export const SensorData = mongoose.model('SensorData', sensorDataSchema);