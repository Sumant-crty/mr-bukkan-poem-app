const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// IMPORTANT: Render assigns a dynamic port
// Use process.env.PORT (Render provides this automatically)
const PORT = process.env.PORT || 5000;

// CORS Configuration for Render
app.use(cors({
  origin: '*', // Allow all origins (or specify your frontend URL)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Test endpoint
app.get('/api/test-google-api', async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      return res.json({ 
        error: 'No API key configured',
        solution: 'Add GOOGLE_API_KEY to Render Environment Variables',
        environment: process.env.NODE_ENV || 'development'
      });
    }

    console.log('Testing API key...');
    console.log('API Key prefix:', apiKey.substring(0, 10));
    console.log('Environment:', process.env.NODE_ENV || 'development');

    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    return res.json({
      success: true,
      apiKeyValid: true,
      environment: process.env.NODE_ENV || 'development',
      availableModels: response.data.models?.map(m => m.name) || []
    });
  } catch (error) {
    console.error('API Test Error:', error.response?.data);
    return res.json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      statusCode: error.response?.status,
      environment: process.env.NODE_ENV || 'development',
      solution: 'Check if API is enabled at: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com'
    });
  }
});

// Generate poem endpoint
app.post('/api/generate-poem', async (req, res) => {
  try {
    const { topic } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Google API key not configured on server',
        solution: 'Add GOOGLE_API_KEY in Render Environment Variables'
      });
    }

    console.log('\n=== Generating Poem ===');
    console.log('Topic:', topic);
    console.log('Using API key prefix:', apiKey.substring(0, 10));
    console.log('Environment:', process.env.NODE_ENV || 'development');

    // Use the latest Gemini model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: `You are Mr Bukkan, a talented poet. Write a beautiful, creative, and engaging poem about "${topic}". Make it emotional, vivid, and memorable. The poem should be 8-16 lines long. Use beautiful imagery and metaphors. Only respond with the poem itself, no additional commentary.`
        }]
      }]
    };

    console.log('Sending request to Gemini API...');

    const response = await axios.post(url, requestBody, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log('Response received, status:', response.status);

    const poem = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!poem) {
      console.log('ERROR: No poem in response');
      return res.status(500).json({ 
        error: 'No poem generated',
        response: response.data 
      });
    }

    console.log('SUCCESS: Poem generated');
    res.json({ poem });

  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error response:', error.response?.data);
    console.error('Status code:', error.response?.status);
    
    let errorMessage = 'Failed to generate poem';
    let solution = 'Please try again';

    if (error.response?.status === 400) {
      errorMessage = 'Invalid API key or API not enabled';
      solution = 'Visit: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com and enable the API';
    } else if (error.response?.status === 429) {
      errorMessage = 'Rate limit exceeded';
      solution = 'Wait a minute and try again';
    } else if (error.response?.status === 403) {
      errorMessage = 'API access forbidden';
      solution = 'Check if billing is enabled in Google Cloud Console';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout';
      solution = 'Check your internet connection';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.response?.data?.error?.message || error.message,
      solution: solution,
      statusCode: error.response?.status
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    apiConfigured: !!process.env.GOOGLE_API_KEY,
    apiKeyPrefix: process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.substring(0, 10) : 'NOT_SET'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Mr Bukkan Poem API',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      test: '/api/test-google-api',
      generatePoem: 'POST /api/generate-poem'
    }
  });
});

// Listen on the port Render provides (or 5000 locally)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=== Server Started ===`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Google API Key configured: ${!!process.env.GOOGLE_API_KEY}`);
  if (process.env.GOOGLE_API_KEY) {
    console.log(`API Key prefix: ${process.env.GOOGLE_API_KEY.substring(0, 10)}`);
    console.log(`API Key length: ${process.env.GOOGLE_API_KEY.length} characters`);
  }
  console.log('===================\n');
});
