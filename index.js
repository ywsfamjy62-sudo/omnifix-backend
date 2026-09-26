const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 1. تقديم ملفات الواجهة من نفس السيرفر
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) {
      res.send('<h1 style="color:white;text-align:center;padding:50px;">OmniFix AI Server is Running 🚀</h1>');
    }
  });
});

// 2. نقطة النهاية للمعالجة والدردشة
app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ reply: '⚠️ خطأ: المفتاح GEMINI_API_KEY غير مضاف في إعدادات Vercel!' });
    }

    const { message, image } = req.body;
    let parts = [];

    if (message) {
      parts.push({ text: message });
    }

    if (image) {
      const base64Data = image.split(',')[1] || image;
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64Data
        }
      });
    }

    if (parts.length === 0) {
      parts.push({ text: 'مرحبا' });
    }

    // إرسال الطلب المباشر باستخدام نموذج gemini-1.5-flash بمسار v1beta المتوافق مع مفاتيح AQ الجديدة
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ reply: '⚠️ خطأ من جوجل: ' + data.error.message });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'لم يرجع الذكاء الاصطناعي بنتيجة.';
    res.json({ reply: replyText });

  } catch (error) {
    res.status(500).json({ reply: '⚠️ خطأ بالسيرفر: ' + error.message });
  }
});

module.exports = app;
