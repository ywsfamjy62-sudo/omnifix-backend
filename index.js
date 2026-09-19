const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// مفتاح API الخاص بك
const API_KEY = "AQ.Ab8RN6IPqy-idLZEo-MDMCkmioXaEuOhipb-x1kCcsijaLI-Og";
const genAI = new GoogleGenerativeAI(API_KEY);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('OmniFix AI Backend Running');
    }
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, lang, media } = req.body;

    if (!message && !media) {
      return res.status(400).json({ error: 'الرجاء إرسال نص أو ملف.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    let contents = [];

    // معالجة الصور أو الفيديوهات المرفقة
    if (media) {
      const matches = media.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        contents.push({
          inlineData: { mimeType: matches[1], data: matches[2] }
        });
      }
    }

    // إجبار النموذج على الرد باللغة المحددة في الواجهة وتمنع توليد صور/فيديوهات
    let systemInstruction = "";
    if (lang === 'en') {
      systemInstruction = "System Directive: You MUST respond ONLY in English, regardless of the language written by the user. Do not attempt to generate images or videos, provide helpful text chat only.\n\nUser Question: ";
    } else {
      systemInstruction = "توجيه النظام: يجب عليك الرد باللغة العربية فقط دائماً بغض النظر عن اللغة التي كتب بها المستخدم. لا تقم بتوليد أي صور أو فيديوهات، فقط قدم إجابات دردشة نصية ممتازة.\n\nسؤال المستخدم: ";
    }

    contents.push(systemInstruction + (message || ''));

    const result = await model.generateContent(contents);
    const responseText = await result.response.text();

    return res.json({ reply: responseText });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'حدث خطأ في السيرفر أثناء معالجة الطلب.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
