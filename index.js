const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "ضع_مفتاحك_هنا");

// دالة الاتصال مع إعادة المحاولة التلقائية 3 مرات في حال وجود ضغط
async function askGeminiWithRetry(prompt, retries = 3) {
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.log(`محاولة فاشلة (${i + 1}/${retries}):`, error.message);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1500)); // انتظار ثانية ونصف
        }
    }
}

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ reply: "يرجى كتابة رسالة." });
        }

        const replyText = await askGeminiWithRetry(message);
        res.json({ reply: replyText });

    } catch (err) {
        console.error("خطأ نهائي في السيرفر:", err);
        res.status(500).json({ reply: "الخدمة مشغولة حالياً، يرجى إعادة إرسال الرسالة." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
