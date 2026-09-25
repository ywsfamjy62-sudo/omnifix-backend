const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) {
      res.send(`
        <div style="text-align:center; padding:50px; font-family:sans-serif; background:#0b0f19; color:#fff; height:100vh;">
          <h1 style="color:#2563eb;">🚀 OmniFix AI Server</h1>
          <p style="color:#10b981;">السيرفر يعمل بنجاح وجاهز لاستقبال الطلبات!</p>
        </div>
      `);
    }
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, image } = req.body;
    
    // تم التحديث إلى النموذج المطلوب بالضبط
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let promptParts = [message || ''];

    if (image) {
      const base64Data = image.split(',')[1] || image;
      promptParts.push({
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      });
    }

    const result = await model.generateContent(promptParts);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (error) {
    res.status(500).json({ reply: '⚠️ خطأ بالسيرفر: ' + error.message });
  }
});

module.exports = app;
