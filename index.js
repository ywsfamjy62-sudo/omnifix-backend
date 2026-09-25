const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '150mb' }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const COHERE_API_KEY = process.env.COHERE_API_KEY;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 1. Gemini
async function fetchFromGemini(userPrompt, mediaList) {
  if (!GEMINI_API_KEY) throw new Error('مفتاح GEMINI_API_KEY غير مضاف في Vercel');

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

  const systemPrompt = "[تعليمات النظام: أنت مساعد الذكاء الاصطناعي OmniFix AI. أجب باللغة العربية.]\n\nسؤال المستخدم: ";
  parts.push({ text: systemPrompt + userPrompt });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY.trim()}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] })
  });

  const data = await response.json();
  if (response.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }
  
  throw new Error(`Gemini Error: ${data.error?.message || response.statusText}`);
}

// 2. Cohere
async function fetchFromCohere(userPrompt) {
  if (!COHERE_API_KEY) throw new Error('مفتاح COHERE_API_KEY غير مضاف في Vercel');

  const response = await fetch('https://api.cohere.com/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${COHERE_API_KEY.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'command-r-plus',
      message: userPrompt,
      preamble: 'أنت مساعد الذكاء الاصطناعي OmniFix AI. أجب باللغة العربية.'
    })
  });

  const data = await response.json();
  if (response.ok && data.text) {
    return data.text;
  }
  
  throw new Error(`Cohere Error: ${data.message || response.statusText}`);
}

app.post('/api/chat', async (req, res) => {
  const { message, mediaList } = req.body;
  const userText = message || '';

  let errors = [];

  try {
    const geminiReply = await fetchFromGemini(userText, mediaList);
    return res.json({ reply: geminiReply });
  } catch (geminiError) {
    errors.push(geminiError.message);
  }

  try {
    const cohereReply = await fetchFromCohere(userText);
    return res.json({ reply: cohereReply });
  } catch (cohereError) {
    errors.push(cohereError.message);
  }

  return res.status(500).json({ 
    reply: `⚠️ فشل الاتصال بالخدمات:\n1- ${errors[0] || 'خطأ غير معروف'}\n2- ${errors[1] || 'خطأ غير معروف'}` 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
