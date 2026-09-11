const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json()); // يسمح ببرمجة واستقبال النصوص العربية بصيغة JSON

// مفتاح API الخاص بجوجل من متغيرات البيئة
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body; // استقبال النص العربي هنا

        if (!message) {
            return res.status(400).json({ success: false, error: "الرسالة فارغة" });
        }

        // استدعاء موديل Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // إرسال النص العربي كما هو كـ String بدون أي تشفير btoa
        const result = await model.generateContent(message);
        const responseText = result.response.text();

        // إرجاع الإجابة للتطبيق/المتصفح
        res.json({ success: true, reply: responseText });

    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
