const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// تم استبدال المفتاح هنا مباشرة بالرمز الخاص بك
const API_KEY = "AQ.Ab8RN6IPqy-idLZEo-MDMCkmioXaEuOhipb-x1kCcsijaLI-Og";
const genAI = new GoogleGenerativeAI(API_KEY);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('OmniFix AI Backend is Running Successfully!');
    }
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, images } = req.body;

    if (!message && (!images || images.length === 0)) {
      return res.status(400).json({ error: 'الرجاء كتابة رسالة أو إرسال صورة.' });
    }

    // فحص طلب الرسم
    const imageKeywords = ['ارسم', 'انشئ صورة', 'توليد صورة', 'صورة لـ', 'اصنعلي صورة', 'draw', 'generate image', 'create image', 'image of'];
    const isImageRequest = imageKeywords.some(keyword => message && message.toLowerCase().includes(keyword));

    if (isImageRequest && (!images || images.length === 0)) {
      let cleanPrompt = message;
      imageKeywords.forEach(k => {
        cleanPrompt = cleanPrompt.replace(new RegExp(k, 'gi'), '');
      });
      cleanPrompt = cleanPrompt.trim() || message;

      const promptEncoded = encodeURIComponent(cleanPrompt);
      const imageUrl = `https://pollinations.ai/p/${promptEncoded}?width=1024&height=1024&seed=${Math.floor(Math.random() * 999999)}&nologo=true`;
      
      return res.json({ 
        reply: 'إليك الصورة التي طلبتها:',
        isImage: true,
        imageUrl: imageUrl 
      });
    }

    // الاستدعاء لنموذج Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    let contents = [];

    if (images && images.length > 0) {
      images.forEach((imgBase64) => {
        const matches = imgBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          contents.push({
            inlineData: { mimeType: matches[1], data: matches[2] }
          });
        }
      });
    }

    if (message) contents.push(message);

    const result = await model.generateContent(contents);
    const responseText = await result.response.text();

    return res.json({ reply: responseText, isImage: false });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء معالجة الطلب في السيرفر.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
