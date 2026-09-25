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

// 1. عرض ملف index.html أو رسالة نجاح عند فتح رابط Vercel المباشر (لتفادي الشاشة البيضاء)
app.get('/', (req, res) => {
  // إذا كان ملف index.html موجوداً بنفس المجلد سيرسله، وإلا سيرسل رسالة حالة السيرفر
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

// 2. مسار فحص صحة السيرفر (Health Check)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'OmniFix Server is running smooth!' });
});

// 3. مسار المحادثة والذكاء الاصطناعي الرئيسي
app.post('/api/chat', async (req, res) => {
  try {
    const { message, image } = req.body;
    
    // استدعاء نموذج Gemini
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
