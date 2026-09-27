const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// هنا التعديل: نحدد الإصدار v1beta عند تهيئة المكتبة
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "ضع_مفتاحك_هنا_مؤقتاً", { apiVersion: 'v1beta' });

app.post('/api/chat', async (req, res) => {
  try {
    const { message, image } = req.body;

    // استخدام الموديل المطلوب
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let result;

    if (image) {
      const base64Data = image.split(',')[1];
      const mimeType = image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)[1];
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };
      
      const promptText = message ? message : "اشرح لي ما في هذه الصورة";
      result = await model.generateContent([promptText, imagePart]);
    } else {
      result = await model.generateContent(message || "مرحباً");
    }

    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error("Error from Gemini API:", error);
    res.status(500).json({ reply: "⚠️ خطأ بالسيرفر: " + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
