const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) {
      res.send('<h1 style="color:white;text-align:center;">OmniFix AI Server is Running</h1>');
    }
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ reply: '⚠️ مفتاح API غير موجود في إعدادات Vercel' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // اجبار استخدام الاصدار المستقر v1
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }, { apiVersion: 'v1' });

    const { message, image } = req.body;
    let parts = [message || ''];

    if (image) {
      const base64Data = image.split(',')[1] || image;
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      });
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (error) {
    res.status(500).json({ reply: '⚠️ خطأ بالسيرفر: ' + error.message });
  }
});

module.exports = app;
