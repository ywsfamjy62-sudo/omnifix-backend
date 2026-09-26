const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// تهيئة تطبيق Express
const app = express();

// إعدادات الـ CORS والسماح بملفات كبيرة (ضروري جداً لاستقبال الصور Base64)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// تهيئة مكتبة جوجل باستخدام مفتاح الـ API الخاص بك
// تأكد من إضافة مفتاحك الحقيقي في إعدادات البيئة (Environment Variables) في Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "ضع_مفتاحك_هنا_مؤقتاً");

app.post('/api/chat', async (req, res) => {
  try {
    const { message, plan, image } = req.body;

    // تهيئة الموديل مع إضافة v1beta لحل مشكلة الـ 404 التي ظهرت لك
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" },
      { apiVersion: "v1beta" }
    );

    let result;

    if (image) {
      // معالجة حالة وجود صورة مرفقة من المستخدم
      const base64Data = image.split(',')[1];
      const mimeType = image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)[1];
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };
      
      // إرسال النص والصورة معاً للموديل
      const promptText = message ? message : "اشرح لي ما في هذه الصورة";
      result = await model.generateContent([promptText, imagePart]);
    } else {
      // معالجة حالة النص فقط
      result = await model.generateContent(message);
    }

    const response = await result.response;
    const text = response.text();

    // إرسال الرد النهائي لتطبيقك
    res.json({ reply: text });

  } catch (error) {
    console.error("Error from Gemini API:", error);
    res.status(500).json({ reply: "⚠️ خطأ بالسيرفر: " + error.message });
  }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
