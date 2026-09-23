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

// دالة مساعدة لإعادة المحاولة عند الضغط 503
async function generateWithRetry(model, parts, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await model.generateContent(parts);
    } catch (err) {
      const is503 = err.message && err.message.includes('503');
      if (is503 && i < retries) {
        // الانتظار ثانية واحدة قبل إعادة المحاولة تلقائياً
        await new Promise(res => setTimeout(res, 1000));
        continue;
      }
      throw err;
    }
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, mediaList } = req.body;

    if (!API_KEY) {
      return res.status(500).json({ 
        reply: '⚠️ لم يتم ضبط GEMINI_API_KEY في Vercel!' 
      });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

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

    // استدعاء الدالة الذكية التي تعيد المحاولة في حال وجود ضغط على سيرفرات جوجل
    const result = await generateWithRetry(model, parts);
    const responseText = result.response.text() || "لم يتم استلام نص في الرد.";

    return res.json({ reply: responseText });

  } catch (error) {
    console.error('API Error:', error);
    
    // تخصيص رسالة عربية واضحة للمستخدم في حال استمرار الضغط
    if (error.message && error.message.includes('503')) {
      return res.status(503).json({
        reply: '⚠️ السيرفر يشهد ضغطاً عالياً حالياً من جوجل، يرجى إعادة إرسال الرسالة بعد لحظات.'
      });
    }

    return res.status(500).json({ 
      reply: '⚠️ حدث خطأ في السيرفر أثناء معالجة الطلب: ' + (error.message || 'خطأ غير معروف')
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
