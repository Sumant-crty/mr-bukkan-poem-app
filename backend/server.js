const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Root route - shows API info
app.get('/', (req, res) => {
  res.json({
    message: 'Mr Bukkan Poem API - Backend is running! 🎭',
    status: 'operational',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      testAPI: 'GET /api/test-google-api',
      generatePoem: 'POST /api/generate-poem'
    },
    documentation: 'Visit /api/health to check API status'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'running',
    apiConfigured: !!process.env.GOOGLE_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Test Google API
app.get('/api/test-google-api', async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      return res.json({ 
        error: 'No API key configured',
        solution: 'Add GOOGLE_API_KEY to Render Environment Variables'
      });
    }

    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    return res.json({
      success: true,
      apiKeyValid: true,
      availableModels: response.data.models?.map(m => m.name) || []
    });
  } catch (error) {
    return res.json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// Generate poem
app.post('/api/generate-poem', async (req, res) => {
  try {
    const { topic } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!topic || !apiKey) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    console.log('Generating poem for topic:', topic);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await axios.post(url, {
      contents: [{
        parts: [{
          text: `You are Mr Bukkan, a talented poet. Write a beautiful, creative, and engaging poem about "${topic}". Make it emotional, vivid, and memorable. The poem should be 8-16 lines long. Use beautiful imagery and metaphors. Only respond with the poem itself, no additional commentary.`
        }]
      }]
    }, { timeout: 30000 });

    const poem = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!poem) {
      return res.status(500).json({ error: 'No poem generated' });
    }

    console.log('Poem generated successfully');
    res.json({ poem });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate poem',
      details: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Server running on port', PORT);
  console.log('✅ API Key configured:', !!process.env.GOOGLE_API_KEY);
  console.log('✅ Backend URL: https://your-app.onrender.com');
});
