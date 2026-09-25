const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// مفتاح Gemini API من إعدادات Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. الصفحة الرئيسية لتفادي الشاشة البيضاء
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

// 2. مسار الشات المعتمد على النموذج المستقر gemini-1.5-flash
app.post('/api/chat', async (req, res) => {
  try {
    const { message, image } = req.body;
    
    // استخدام النموذج المتاح والمستقر للجميع
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let promptParts = [message || ''];

    // إذا أرفق المستخدم صورة للتحليل
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
