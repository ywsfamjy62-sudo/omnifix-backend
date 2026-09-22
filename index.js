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

    let parts = [];

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

    // قائمة بالنماذج المتاحة مرتبة حسب الأفضلية لتفادي ضغط السيرفرات
    const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-3.6-flash'];
    let result = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(parts);
        if (result && result.response) {
          break; // نجاح الطلب، الخروج من الحلقة
        }
      } catch (err) {
        console.warn(`فشل النموذج ${modelName}، جاري المحاولة بنموذج آخر...`, err.message);
        lastError = err;
      }
    }

    if (!result) {
      throw lastError || new Error('تعذر الاتصال بجميع نماذج الذكاء الاصطناعي حالياً.');
    }

    const responseText = result.response.text() || "لم يتم استلام نص في الرد.";

    return res.json({ reply: responseText });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      reply: '⚠️ السيرفر يشهد ضغطاً شديداً حالياً، يرجى المحاولة بعد قليل.'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
