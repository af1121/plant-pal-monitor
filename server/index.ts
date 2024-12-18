import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { SensorData } from './models/SensorData';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Near the top of your file
console.log('API Key length:', process.env.OPENAI_API_KEY?.length);
console.log('API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 5));

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

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware to check if OpenAI API key exists
const checkOpenAIKey = (req: any, res: any, next: any) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ 
      error: 'OpenAI API key is not configured' 
    });
  }
  next();
};

// Apply middleware to the generate-message endpoint
app.post('/api/generate-message', checkOpenAIKey, async (req, res) => {
  try {
    const { 
      temperature, 
      humidity, 
      soilMoisture, 
      light,
      settings  // Add settings to the request body
    } = req.body;
    
    console.log('Received request with data:', { 
      temperature, 
      humidity, 
      soilMoisture, 
      light, 
      settings 
    });
    
    console.log('Making request to OpenAI...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a house plant. Respond in first person as if you are the plant, commenting on your current conditions compared to your ideal conditions. Keep responses brief, casual, and sometimes humorous. Mention if any conditions are outside the ideal range."
        },
        {
          role: "user",
          content: `
Current conditions:
- Temperature: ${temperature}°C (Ideal: ${settings.minTemperature}°C - ${settings.maxTemperature}°C)
- Humidity: ${humidity}% (Ideal: ${settings.minHumidity}% - ${settings.maxHumidity}%)
- Soil Moisture: ${soilMoisture}% (Ideal: ${settings.minsoilmoisture}% - ${settings.maxsoilmoisture}%)
- Light Level: ${light} lux (Ideal: ${settings.minlight} - ${settings.maxlight} lux)

How are you feeling based on these conditions compared to your ideal ranges?`
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    console.log('OpenAI response:', completion.choices[0].message);
    res.json({ message: completion.choices[0].message.content });
  } catch (error: any) {
    console.error('Server error generating message:', error);
    res.status(error.status || 500).json({ 
      error: error.message || 'Failed to generate message' 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Error handling for unhandled promises
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});
