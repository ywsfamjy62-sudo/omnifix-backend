const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// أدخل مفتاحك هنا مباشرة بين التنصيص
const API_KEY = process.env.GEMINI_API_KEY || "AQ.Ab8RN6KrKPmY32sbjnd_grplIm26VkaKvqmKQzeRoGfY3s2nzw"; 
const genAI = new GoogleGenerativeAI(API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ reply: "يرجى كتابة رسالة." });
        }

        // استخدام اسم الموديل المستقر
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (err) {
        console.error("تفاصيل الخطأ:", err);
        res.status(500).json({ reply: "حدث خطأ في الخادم: " + (err.message || "تعذر الاتصال") });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
