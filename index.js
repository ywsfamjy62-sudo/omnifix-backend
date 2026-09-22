const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json({ limit: '150mb' }));

const API_KEY = process.env.GEMINI_API_KEY;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, mediaList } = req.body;

    if (!API_KEY) {
      return res.status(500).json({ 
        reply: '⚠️ لم يتم ضبط GEMINI_API_KEY في Vercel!' 
      });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    // تم التغيير إلى النموذج الحديث المعتمد
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let parts = [];

    // معالجة الوسائط (الصور والمستندات)
    if (mediaList && Array.isArray(mediaList)) {
      mediaList.forEach(media => {
        if (media.data) {
          const matches = media.data.match(/^data:(.+);base64,(.+)$/);
          if (matches) {
            parts.push({
              inlineData: {
                mimeType: matches[1],
                data: matches[2]
              }
            });
          }
        }
      });
    }

    const systemInstruction = "[تعليمات النظام: أنت مساعد الذكاء الاصطناعي OmniFix AI. أجب حصراً باللغة العربية فقط.]\n\nسؤال المستخدم: ";
    parts.push(systemInstruction + (message || ''));

    const result = await model.generateContent(parts);
    const responseText = result.response.text() || "لم يتم استلام نص في الرد.";

    return res.json({ reply: responseText });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      reply: '⚠️ حدث خطأ في السيرفر أثناء معالجة الطلب: ' + (error.message || 'خطأ غير معروف')
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
