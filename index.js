const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// إعدادات CORS والـ Body Parser
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// تهيئة مكتبة Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. عرض الواجهة عند فتح الرابط المباشر
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) {
      res.send(`
        <div style="text-align:center; padding:50px; font-family:sans-serif; background:#0b0f19; color:#fff; height:100vh;">
          <h1 style="color:#2563eb;">🚀 OmniFix AI Server</h1>
          <p style="color:#10b981;">السيرفر يعمل بنجاح وجاهز لاستقبال الطلبات!</p>
        </div>
      `);
    }
  });
});

// 2. مسار المحادثة الرئيسي مع النموذج المحدث
app.post('/api/chat', async (req, res) => {
  try {
    const { message, image } = req.body;
    
    // تحديث اسم النموذج إلى gemini-2.5-flash لحل خطأ 404
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let promptParts = [message || ''];

    if (image) {
      const base64Data = image.split(',')[1] || image;
      promptParts.push({
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      });
    }

    const result = await model.generateContent(promptParts);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (error) {
    res.status(500).json({ reply: '⚠️ خطأ بالسيرفر: ' + error.message });
  }
});

module.exports = app;
