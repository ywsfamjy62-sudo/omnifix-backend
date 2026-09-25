const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// تهيئة Google Gemini API
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

// 2. مسار المحادثة والرد على الأسئلة وتحليل الصور المرفقة
app.post('/api/chat', async (req, res) => {
  try {
    const { message, image } = req.body;
    
    // استخدام اسم النموذج المقبول من جوجل: gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let promptParts = [message || ''];

    // في حال أرفق المستخدم صورة مع السؤال
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

// 3. مسار توليد الصور المجاني بالذكاء الاصطناعي
app.post('/api/generate-image', (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ reply: 'يرجى كتابة وصف للصورة المطلوب رسمها' });
    }

    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 100000)}`;

    res.json({ imageUrl: imageUrl });
  } catch (error) {
    res.status(500).json({ reply: '⚠️ فشل في توليد الصورة: ' + error.message });
  }
});

module.exports = app;
