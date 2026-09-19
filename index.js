const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// إعداد مفتاح API الخاص بـ Gemini من بيئة العمل على Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. مسار عرض الصفحة الرئيسية index.html فور فتح الموقع
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. مسار استقبال المحادثات والصور
app.post('/api/chat', async (req, res) => {
  try {
    const { message, images } = req.body;

    // استخدام موديل Gemini 3.6 Flash
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    let contents = [];

    // معالجة الصور إن وجدت (Base64)
    if (images && images.length > 0) {
      images.forEach((imgBase64) => {
        const matches = imgBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          contents.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          });
        }
      });
    }

    // إضافة نص الرسالة
    if (message) {
      contents.push(message);
    }

    const result = await model.generateContent(contents);
    const responseText = await result.response.text();

    res.json({ reply: responseText });
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: error.message || 'حدث خطأ في معالجة الطلب.' });
  }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
