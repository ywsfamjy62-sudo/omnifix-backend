const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) {
      res.send('<h1 style="color:white;text-align:center;">OmniFix AI Server is Running 🚀</h1>');
    }
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ reply: '⚠️ خطأ: المفتاح GEMINI_API_KEY غير موجود في Vercel!' });
    }

    const { message, image } = req.body;
    let parts = [{ text: message || 'مرحبا' }];

    if (image) {
      const base64Data = image.split(',')[1] || image;
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64Data
        }
      });
    }

    // طلب مباشر لجوجل بأحدث نظام مفاتيح ونماذج
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ reply: '⚠️ خطأ من جوجل: ' + data.error.message });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'لم يتم استلام رد.';
    res.json({ reply: replyText });

  } catch (error) {
    res.status(500).json({ reply: '⚠️ خطأ بالسيرفر: ' + error.message });
  }
});

module.exports = app;
