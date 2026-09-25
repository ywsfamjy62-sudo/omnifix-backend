const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// إعدادات CORS ورفع الحد الأقصى لحجم البيانات لاستقبال الصور
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// تهيئة مكتبة Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. الصفحة الرئيسية (لتفادي ظهور الشاشة البيضاء)
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

// 2. مسار المحادثة وتحليل/تعديل الصور عبر Gemini
app.post('/api/chat', async (req, res) => {
  try {
    const { message, image } = req.body;
    
    // اسم النموذج المعتمد
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let promptParts = [message || ''];

    // إذا أرفق المستخدم صورة للتحليل أو التعديل
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

// 3. مسار توليد ورسم الصور بالذكاء الاصطناعي (Pollinations API)
app.post('/api/generate-image', (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ reply: 'الرجاء كتابة وصف للصورة المطلوب رسمها' });
    }

    // تحويل النص ليتناسب مع روابط الـ URL
    const encodedPrompt = encodeURIComponent(prompt);
    
    // إنشاء رابط صورة بدقة عالية
    const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 100000)}`;

    res.json({ imageUrl: imageUrl });
  } catch (error) {
    res.status(500).json({ reply: '⚠️ فشل في توليد الصورة: ' + error.message });
  }
});

// تصدير التطبيق ليتم تشغيله على Vercel
module.exports = app;
  
