const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
// زيادة سعة استقبال البيانات لـ 150MB لاستيعاب الوسائط المرفقة
app.use(express.json({ limit: '150mb' }));

// تم وضع مفتاح الـ API الجديد الخاص بك هنا
const API_KEY = process.env.GEMINI_API_KEY || "AQ.Ab8RN6JZWRiJGiM-eOAo020xEqsrBBYdMqzam0VAGHfL6v7HLA";
const genAI = new GoogleGenerativeAI(API_KEY);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, mediaList } = req.body;

    // استخدام موديل gemini-1.5-flash المستقر والمتوافق
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    let contents = [];

    // معالجة المرفقات (حتى 20 صورة وفيديو)
    if (mediaList && Array.isArray(mediaList)) {
      mediaList.forEach(media => {
        if (media.data) {
          const matches = media.data.match(/^data:(.+);base64,(.+)$/);
          if (matches) {
            contents.push({
              inlineData: { mimeType: matches[1], data: matches[2] }
            });
          }
        }
      });
    }

    // تعليمات النظام لإجبار الرد باللغة العربية
    const systemInstruction = "[تعليمات النظام: أنت مساعد الذكاء الاصطناعي OmniFix AI. أجب حصراً باللغة العربية فقط وممنوع الرد بأي لغة أخرى إلا إذا طلب المستخدم كوداً برمجياً. قدم الإجابة بدقة ووضوح.]\n\nسؤال المستخدم: ";

    contents.push(systemInstruction + (message || ''));

    const result = await model.generateContent(contents);
    const response = await result.response;
    const responseText = response.text();

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
