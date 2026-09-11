const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// ضع مفتاحك الجديد الذي يبدأ بـ AQ هنا مباشرة بين التنصيص
const apiKey = process.env.GEMINI_API_KEY || "ضع_مفتاحك_هنا";

const genAI = new GoogleGenerativeAI(apiKey);

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ success: false, error: 'الرسالة فارغة' });
        }

        // استخدام نموذج gemini-1.5-flash المتوافق مع المفتاح
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(message);
        const response = await result.response;

        res.json({ success: true, reply: response.text() });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
