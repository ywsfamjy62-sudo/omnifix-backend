const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();

app.use(cors());
// زيادة سعة استقبال البيانات لـ 150MB لاستيعاب الصور والفيديوهات
app.use(express.json({ limit: '150mb' }));

// قراءة المفتاح من متغيرات البيئة في Vercel أو المفتاح الاحتياطي
const API_KEY = process.env.GEMINI_API_KEY || "AQ.Ab8RN6LPC-RALzoXhwb-DAWmkgyrHLZUKu_tTY5Twng0ReFDFg";

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, mediaList } = req.body;

    let parts = [];

    // معالجة الوسائط (صور / فيديوهات Base64)
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

    // تعليمات النظام
    const systemInstruction = "[تعليمات النظام: أنت مساعد الذكاء الاصطناعي OmniFix AI. أجب حصراً باللغة العربية فقط وممنوع الرد بأي لغة أخرى إلا إذا طلب المستخدم كوداً برمجياً. قدم الإجابة بدقة ووضوح.]\n\nسؤال المستخدم: ";
    parts.push({ text: systemInstruction + (message || '') });

    // رابط API الرسمي مع مفتاح الاستعلام
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    // إرسال الطلب باستخدام الهيدر المخصص لـ Google API Keys (x-goog-api-key)
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
