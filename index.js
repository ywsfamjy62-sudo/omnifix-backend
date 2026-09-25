const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '150mb' }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
  const { message, mediaList } = req.body;
  const userText = message || '';

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ reply: '⚠️ لم يتم العثور على مفتاح GEMINI_API_KEY في Vercel' });
  }

  let parts = [];
  if (mediaList && Array.isArray(mediaList)) {
    mediaList.forEach(media => {
      if (media.data) {
        const matches = media.data.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inline_data: { mime_type: matches[1], data: matches[2] }
          });
        }
      }
    });
  }

  const systemPrompt = "أنت مساعد الذكاء الاصطناعي OmniFix AI. أجب باللغة العربية بأسلوب كامل وواضح ومفصل.\n\nسؤال المستخدم: ";
  parts.push({ text: systemPrompt + userText });

  try {
    // تم تصحيح اسم النموذج ورابط الطلب
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY.trim()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        tools: [
          { google_search: {} }
        ]
      })
    });

    const data = await response.json();

    if (response.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const replyText = data.candidates[0].content.parts[0].text;
      return res.json({ reply: replyText });
    } else {
      throw new Error(data.error?.message || 'فشل استجابة النموذج');
    }
  } catch (error) {
    return res.status(500).json({ reply: `⚠️ خطأ: ${error.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
