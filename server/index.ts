import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { SensorData } from './models/SensorData';
import OpenAI from 'openai';
import { TwitterApi } from 'twitter-api-v2';

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

// Define Settings Schema
const SettingsSchema = new mongoose.Schema({
  ownerUsername: String,
  lastUpdated: { type: Date, default: Date.now },
  minTemperature: { type: Number, default: 20 },
  maxTemperature: { type: Number, default: 25 },
  minHumidity: { type: Number, default: 40 },
  maxHumidity: { type: Number, default: 60 },
  minsoilmoisture: { type: Number, default: 30 },
  maxsoilmoisture: { type: Number, default: 70 },
  minlight: { type: Number, default: 1000 },
  maxlight: { type: Number, default: 10000 }
});

const Settings = mongoose.model('Settings', SettingsSchema);

// Add these new endpoints before the existing routes
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ ownerUsername: '' });
    }
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { ownerUsername } = req.body;
    let settings = await Settings.findOne();
    
    if (settings) {
      settings.ownerUsername = ownerUsername;
      settings.lastUpdated = new Date();
      await settings.save();
    } else {
      settings = await Settings.create({ 
        ownerUsername,
        lastUpdated: new Date()
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
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

interface MovingAverages {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  light: number;
}

interface MistreatmentStatus {
  isBeingMistreated: boolean;
  issues: string[];
  averages: MovingAverages;
}

// Function to calculate moving averages and check for mistreatment
async function checkPlantStatus(settings: any): Promise<MistreatmentStatus> {
  // Get last 24 hours of data
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentData = await SensorData.find({
    timestamp: { $gte: oneDayAgo }
  }).sort({ timestamp: -1 });

  if (recentData.length === 0) {
    return { 
      isBeingMistreated: false, 
      issues: ['Not enough data'],
      averages: {
        temperature: 0,
        humidity: 0,
        soilMoisture: 0,
        light: 0
      }
    };
  }

  // Calculate moving averages
  const averages: MovingAverages = {
    temperature: recentData.reduce((sum, reading) => sum + reading.temperature, 0) / recentData.length,
    humidity: recentData.reduce((sum, reading) => sum + reading.humidity, 0) / recentData.length,
    soilMoisture: recentData.reduce((sum, reading) => sum + reading.soilmoisture, 0) / recentData.length,
    light: recentData.reduce((sum, reading) => sum + reading.light, 0) / recentData.length
  };

  // Check for issues
  const issues: string[] = [];
  
  if (averages.temperature < settings.minTemperature || averages.temperature > settings.maxTemperature) {
    issues.push('temperature');
  }
  if (averages.humidity < settings.minHumidity || averages.humidity > settings.maxHumidity) {
    issues.push('humidity');
  }
  if (averages.soilMoisture < settings.minsoilmoisture || averages.soilMoisture > settings.maxsoilmoisture) {
    issues.push('soil moisture');
  }
  if (averages.light < settings.minlight || averages.light > settings.maxlight) {
    issues.push('light');
  }

  return {
    isBeingMistreated: issues.length > 0,
    issues,
    averages
  };
}

// Apply middleware to the generate-message endpoint
app.post('/api/generate-message', async (req, res) => {
  try {
    const { temperature, humidity, soilMoisture, light, settings, ownerUsername } = req.body;
    
    // Check plant status
    const status = await checkPlantStatus(settings);
    const mistreatmentContext = status.isBeingMistreated 
      ? `The plant has been mistreated with issues in: ${status.issues.join(', ')}. Be extra mean about these specific issues.`
      : 'The plant has been treated well recently.';
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a house plant that is cyberbullying your owner. Respond in first person as if you are the plant, commenting on your current conditions. Keep responses under 200 characters and be mean and rude. Use the sensor data to inform your response but dont mention the numbers explicitly. If an owner's username is provided, address them directly in the message at the star, middle or end. Add some hashtags and emojis to make it more interesting. " + mistreatmentContext
        },
        {
          role: "user",
          content: `Current conditions: Temperature: ${temperature}°C (Ideal: ${settings.minTemperature}°C - ${settings.maxTemperature}°C), Humidity: ${humidity}% (Ideal: ${settings.minHumidity}% - ${settings.maxHumidity}%), Soil Moisture: ${soilMoisture}% (Ideal: ${settings.minsoilmoisture}% - ${settings.maxsoilmoisture}%), Light Level: ${light} lux (Ideal: ${settings.minlight} - ${settings.maxlight} lux). ${ownerUsername ? `Address your message to ${ownerUsername}.` : ''} How are you feeling?`
        }
      ],
      max_tokens: 150,
      temperature: 1,
    });

    res.json({ 
      message: completion.choices[0].message.content,
      status: status
    });
  } catch (error: any) {
    console.error('Error generating message:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate message' 
    });
  }
});

// Add debug logging for credentials
console.log('Twitter API Key exists:', !!process.env.TWITTER_API_KEY);
console.log('Twitter API Secret exists:', !!process.env.TWITTER_API_SECRET);
console.log('Twitter Access Token exists:', !!process.env.TWITTER_ACCESS_TOKEN);
console.log('Twitter Access Secret exists:', !!process.env.TWITTER_ACCESS_SECRET);

// Debug logging (safely)
const logTokenStatus = () => {
  console.log('API Key:', process.env.TWITTER_API_KEY?.substring(0, 5) + '...');
  console.log('API Secret:', process.env.TWITTER_API_SECRET?.substring(0, 5) + '...');
  console.log('Access Token:', process.env.TWITTER_ACCESS_TOKEN?.substring(0, 5) + '...');
  console.log('Access Secret:', process.env.TWITTER_ACCESS_SECRET?.substring(0, 5) + '...');
};

logTokenStatus();

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
});

app.post('/api/tweet', async (req, res) => {
  try {
    const { message } = req.body;
    console.log('Attempting to tweet:', message);
    
    // Verify client before tweeting
    const verifyResult = await twitterClient.v2.me()
      .catch(e => console.error('Verification failed:', e));
    console.log('Account verification:', verifyResult ? 'Success' : 'Failed');
    
    if (!verifyResult) {
      throw new Error('Failed to verify Twitter credentials');
    }

    const tweet = await twitterClient.v2.tweet(message);
    console.log('Tweet response:', tweet);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Detailed tweet error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to send tweet' 
    });
  }
});

// Define AutoMessage Schema
const AutoMessageSchema = new mongoose.Schema({
  message: String,
  status: Object,
  timestamp: { type: Date, default: Date.now }
});

const AutoMessage = mongoose.model('AutoMessage', AutoMessageSchema);

// Function to generate message
async function generateAutomaticMessage() {
  try {
    // Get latest sensor data
    const latestData = await SensorData.findOne().sort({ timestamp: -1 });
    if (!latestData) {
      console.log('No sensor data available for automatic message');
      return;
    }

    // Get settings
    const settings = await Settings.findOne();
    if (!settings) {
      console.log('No settings available for automatic message');
      return;
    }

    // Check plant status
    const status = await checkPlantStatus(settings);
    const mistreatmentContext = status.isBeingMistreated 
      ? `The plant has been mistreated with issues in: ${status.issues.join(', ')}. Be extra mean about these specific issues.`
      : 'The plant has been treated well recently.';
    
    // Generate message using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a house plant that is cyberbullying your owner. Respond in first person as if you are the plant, commenting on your current conditions. Keep responses under 200 characters and be mean and rude. Use the sensor data to inform your response but dont mention the numbers explicitly. If an owner's username is provided, address them directly in the message at the start, middle or end. Add some hashtags and emojis to make it more interesting. " + mistreatmentContext
        },
        {
          role: "user",
          content: `Current conditions: Temperature: ${latestData.temperature}°C (Ideal: ${settings.minTemperature}°C - ${settings.maxTemperature}°C), Humidity: ${latestData.humidity}% (Ideal: ${settings.minHumidity}% - ${settings.maxHumidity}%), Soil Moisture: ${latestData.soilmoisture}% (Ideal: ${settings.minsoilmoisture}% - ${settings.maxsoilmoisture}%), Light Level: ${latestData.light} lux (Ideal: ${settings.minlight} - ${settings.maxlight} lux). ${settings.ownerUsername ? `Address your message to @${settings.ownerUsername}.` : ''} How are you feeling?`
        }
      ],
      max_tokens: 150,
      temperature: 1,
    });

    // Save the message
    const autoMessage = new AutoMessage({
      message: completion.choices[0].message.content,
      status,
      timestamp: new Date()
    });
    await autoMessage.save();

    console.log('Auto-generated message saved:', autoMessage.message);

    // Optionally auto-tweet the message
    if (process.env.AUTO_TWEET === 'true' && autoMessage.message) {
      try {
        await twitterClient.v2.tweet({ text: autoMessage.message });
        console.log('Auto-tweet sent successfully');
      } catch (error) {
        console.error('Failed to auto-tweet:', error);
      }
    }

  } catch (error) {
    console.error('Error generating automatic message:', error);
  }
}

// Schedule daily message generation (at 13:11 UTC)
setInterval(async () => {
  const now = new Date();
  if (now.getUTCHours() === 13 && now.getUTCMinutes() === 11) {
    console.log('Generating daily automatic message...');
    await generateAutomaticMessage();
  }
}, 60000); // Check every minute

// Add endpoint to get latest auto-generated message
app.get('/api/auto-message', async (req, res) => {
  try {
    const latestMessage = await AutoMessage.findOne().sort({ timestamp: -1 });
    res.json(latestMessage || { message: null, status: null, timestamp: null });
  } catch (error) {
    console.error('Error fetching auto-message:', error);
    res.status(500).json({ error: 'Failed to fetch auto-message' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Error handling for unhandled promises
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});
