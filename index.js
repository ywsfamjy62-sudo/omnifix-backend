const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();

app.use(express.json());

// تهيئة API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/chat', async (req, res) => {
  const { message, plan } = req.body;

  // اختيار النموذج بناءً على الباقة المختارة
  let modelName = 'gemini-1.5-flash';
  if (plan === 'pro' || plan === 'ultra') {
    modelName = 'gemini-1.5-pro';
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();
    
    return res.json({ reply: text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    
    // إرجاع رسالة عربية راقية عند حدوث ضغط أو خطأ
    return res.status(500).json({ 
      reply: "الخدمة تشهد إقبالاً كبيراً حالياً. يرجى إعادة المحاولة بعد لحظات قليلة." 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
