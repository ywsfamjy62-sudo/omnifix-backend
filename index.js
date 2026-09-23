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

    // إرسال الطلب مباشرة لأسرع وأقوى نموذج مجاني ومستقر
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
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
      return res.json({ reply: data.choices[0].message.content });
    } else {
      console.error('OpenRouter Error:', data);
      const errDetail = data.error?.message || 'خطأ غير معروف من المصدر';
      return res.status(500).json({ reply: '⚠️ خطأ في الاستجابة: ' + errDetail });
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
