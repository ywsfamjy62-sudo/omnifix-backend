const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, images } = req.body;

    // فحص طلب الصور
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
        reply: `إليك الصورة التي طلبتها:`,
        isImage: true,
        imageUrl: imageUrl 
      });
    }

    // محادثة الذكاء الاصطناعي Gemini
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

    res.json({ reply: responseText, isImage: false });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة الطلب.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
