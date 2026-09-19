const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ضع مفتاح الـ API الجديد الخاص بك بين التنصيص هنا
const API_KEY = process.env.GEMINI_API_KEY || "ضع_مفتاحك_الجديد_هنا";
const genAI = new GoogleGenerativeAI(API_KEY);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, mediaList } = req.body;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    let contents = [];

    if (mediaList && Array.isArray(mediaList)) {
      mediaList.forEach(media => {
        if (media.data) {
          const matches = media.data.match(/^data:(.+);base64,(.+)$/);
          if (matches) {
            contents.push({
              inlineData: { mimeType: matches[1], data: matches[2] }
            });
          }
        }
      });
    }

    const promptText = message || "مرحباً";
    contents.push(promptText);

    const result = await model.generateContent(contents);
    const response = await result.response;
    const responseText = response.text();

    return res.json({ reply: responseText });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      reply: '⚠️ حدث خطأ في السيرفر:\n' + error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
