const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.post('/api/generate-poem', async (req, res) => {
  try {
    const { topic } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!topic || !apiKey) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(url, {
      contents: [{
        parts: [{
          text: `Write a poem about ${topic}. Make it 8-16 lines, emotional and vivid. Only the poem, no commentary.`
        }]
      }]
    }, { timeout: 30000 });

    const poem = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ poem: poem || 'No poem generated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'running', apiConfigured: !!process.env.GOOGLE_API_KEY });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port', PORT);
});
