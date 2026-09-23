const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json({ limit: '150mb' }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const COHERE_API_KEY = process.env.COHERE_API_KEY;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// دالة المزود الاحتياطي (Cohere)
async function fetchFromCohere(userPrompt) {
  if (!COHERE_API_KEY) throw new Error('مفتاح COHERE_API_KEY غير مضبوط');

  const response = await fetch('https://api.cohere.com/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${COHERE_API_KEY.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'command-r-plus',
      message: userPrompt,
      preamble: 'أنت مساعد الذكاء الاصطناعي OmniFix AI. أجب حصراً باللغة العربية فقط.'
    })
  });

  const data = await response.json();
  if (data.text) {
    return data.text;
  }
  throw new Error(data.message || 'فشل الرد من Cohere');
}

app.post('/api/chat', async (req, res) => {
  const { message, mediaList } = req.body;
  const userText = message || '';

  // 1. المحاولة الأولى: Google Gemini (الأساسي)
  try {
    if (GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.trim());
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      let parts = [];
      if (mediaList && Array.isArray(mediaList)) {
        mediaList.forEach(media => {
          if (media.data) {
            const matches = media.data.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
              parts.push({
                inlineData: { mimeType: matches[1], data: matches[2] }
              });
            }
          }
        });
      }

      const systemInstruction = "[تعليمات النظام: أنت مساعد الذكاء الاصطناعي OmniFix AI. أجب حصراً باللغة العربية فقط.]\n\nسؤال المستخدم: ";
      parts.push(systemInstruction + userText);

      const result = await model.generateContent(parts);
      const responseText = result.response.text();

      if (responseText) {
        return res.json({ reply: responseText });
      }
    }
  } catch (geminiError) {
    console.warn('⚠️ سيرفر Gemini يعاني من ضغط، جاري التحويل إلى Cohere...', geminiError.message);
  }

  // 2. المحاولة الثانية: Cohere (الاحتياطي التلقائي)
  try {
    const backupReply = await fetchFromCohere(userText);
    return res.json({ reply: backupReply });
  } catch (backupError) {
    console.error('API Error:', backupError);
    return res.status(500).json({ 
      reply: '⚠️ السيرفرات تشهد ضغطاً حالياً، يرجى المحاولة بعد قليل.' 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
