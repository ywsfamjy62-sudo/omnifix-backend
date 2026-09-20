const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();

app.use(cors());
// رفع سعة استقبال البيانات إلى 150MB لدعم رفع الصور والفيديوهات
app.use(express.json({ limit: '150mb' }));

// قراءة المفتاح من متغيرات البيئة في Vercel (GEMINI_API_KEY)
const API_KEY = process.env.GEMINI_API_KEY;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, mediaList } = req.body;

    if (!API_KEY) {
      return res.status(500).json({ 
        reply: '⚠️ لم يتم ضبط GEMINI_API_KEY في Vercel! يرجى إضافة المفتاح من إعدادات Vercel.' 
      });
    }

    let parts = [];

    // معالجة الوسائط المرفقة (صور / فيديوهات بصيغة Base64)
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

    // تعليمات النظام المخصصة لـ OmniFix AI
    const systemInstruction = "[تعليمات النظام: أنت مساعد الذكاء الاصطناعي OmniFix AI. أجب حصراً باللغة العربية فقط وممنوع الرد بأي لغة أخرى إلا إذا طلب المستخدم كوداً برمجياً. قدم الإجابة بدقة ووضوح.]\n\nسؤال المستخدم: ";
    parts.push({ text: systemInstruction + (message || '') });

    // رابط API الرسمي لنموذج Gemini 1.5 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    // إرسال الطلب مع إضافة الهيدر المخصص x-goog-api-key
    const response = await axios.post(
      url,
      { contents: [{ parts: parts }] },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY
        }
      }
    );

    const data = response.data;
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "لم يتم استلام نص في الرد.";

    return res.json({ reply: responseText });

  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.error?.message || error.message || 'خطأ غير معروف';
    return res.status(500).json({ 
      reply: '⚠️ حدث خطأ في السيرفر أثناء معالجة الطلب: ' + errorMessage
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
