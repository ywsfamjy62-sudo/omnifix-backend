const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json({ limit: '150mb' }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, mediaList } = req.body;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        reply: '⚠️ لم يتم ضبط GEMINI_API_KEY في Vercel!' 
      });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.trim());
    // استخدام نموذج gemini-1.5-flash المستقر والقوي
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let parts = [];

    // معالجة الصور أو المرفقات إن وجدت
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
    const responseText = result.response.text();

    return res.json({ reply: responseText });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ 
      reply: '⚠️ السيرفر يشهد ضغطاً حالياً، يرجى المحاولة بعد قليل.' 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
