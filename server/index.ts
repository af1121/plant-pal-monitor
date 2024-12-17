import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { SensorData } from './models/SensorData';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection with explicit database selection
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    console.log('Collection:', mongoose.connection.collection('plant_monitor').collectionName);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes with debug logging
app.get('/api/sensors', async (req, res) => {
  try {
    console.log('Fetching data from collection:', 'plant_monitor');
    const data = await SensorData.find().sort({ timestamp: -1 });
    console.log('Found records:', data.length);
    res.json(data);
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});

app.post('/api/sensors', async (req, res) => {
  try {
    console.log('Received new sensor data:', req.body);
    const newData = new SensorData(req.body);
    await newData.save();
    console.log('Successfully saved to collection:', 'plant_monitor');
    res.status(201).json(newData);
  } catch (error) {
    console.error('Error saving sensor data:', error);
    res.status(500).json({ error: 'Failed to save sensor data' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Error handling for unhandled promises
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});
