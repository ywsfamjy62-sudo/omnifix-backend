const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '150mb' }));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ 
        reply: '⚠️ لم يتم ضبط OPENROUTER_API_KEY في Vercel!' 
      });
    }

    // استخدام أحدث قائمة من النماذج المجانية المتاحة 100%
    const freeModels = [
      'deepseek/deepseek-r1:free',
      'qwen/qwen-2.5-72b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
      'meta-llama/llama-3.1-8b-instruct:free'
    ];

    let replyText = null;
    let lastError = null;

    for (const modelName of freeModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { 
                role: 'system', 
                content: 'أنت مساعد الذكاء الاصطناعي OmniFix AI. أجب حصراً باللغة العربية فقط.' 
              },
              { 
                role: 'user', 
                content: message || '' 
              }
            ]
          })
        });

        const data = await response.json();

        if (data.choices && data.choices[0] && data.choices[0].message) {
          replyText = data.choices[0].message.content;
          break; // تم جلب الرد بنجاح من أحد النماذج
        } else {
          lastError = data.error?.message || 'خطأ في النموذج';
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (replyText) {
      return res.json({ reply: replyText });
    } else {
      return res.status(500).json({ reply: '⚠️ تعذر الاتصال بالنماذج المجانية: ' + lastError });
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      reply: '⚠️ حدث خطأ أثناء الاتصال بالسيرفر: ' + error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
