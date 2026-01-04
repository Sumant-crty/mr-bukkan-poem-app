const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint to generate poems using Google Gemini
app.post('/api/generate-poem', async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Check if Google API key is configured
    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'Google API key not configured on server' });
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `You are Mr Bukkan, a talented poet. Write a beautiful, creative, and engaging poem about "${topic}". Make it emotional, vivid, and memorable. The poem should be 8-16 lines long. Use beautiful imagery and metaphors. Only respond with the poem itself, no additional commentary.`
          }]
        }]
      }
    );

    const poem = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!poem) {
      return res.status(500).json({ error: 'Failed to generate poem' });
    }
    
    res.json({ poem });
  } catch (error) {
    console.error('Error generating poem:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      return res.status(400).json({ 
        error: 'Invalid API key or API not enabled',
        details: error.response?.data?.error?.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate poem',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    apiConfigured: !!process.env.GOOGLE_API_KEY 
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Google API Key configured: ${!!process.env.GOOGLE_API_KEY}`);
});
