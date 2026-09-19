const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ضع مفتاح الـ API الخاص بك هنا بين التنصيص
const API_KEY = process.env.GEMINI_API_KEY || "ضع_مفتاحك_هنا";
const genAI = new GoogleGenerativeAI(API_KEY);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, mediaList } = req.body;

    // استخدام موديل gemini-1.5-flash المتوافق
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    let contents = [];

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

    const promptText = message || "مرحباً";
    contents.push(promptText);

    const result = await model.generateContent(contents);
    const response = await result.response;
    const responseText = response.text();

    if (!responseText || responseText.trim() === '') {
      return res.json({ reply: "أهلاً بك! كيف يمكنني مساعدتك؟" });
    }

    return res.json({ reply: responseText });

  } catch (error) {
    console.error('API Error:', error);
    // إرسال تفاصيل الخطأ مباشرة للفرونت إند لمعرفته
    return res.status(500).json({ 
      reply: '⚠️ حدث خطأ في السيرفر: ' + (error.message || 'خطأ غير معروف')
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
