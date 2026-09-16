const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// مسار استقبال الرسائل
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ reply: "خطأ: لم يتم ضبط مفتاح GEMINI_API_KEY في السيرفر." });
        }

        // الاتصال المباشر بـ Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: message }]
                }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const botReply = data.candidates[0].content.parts[0].text;
            res.json({ reply: botReply });
        } else {
            res.status(500).json({ reply: "تعذر معالجة الرد من الذكاء الاصطناعي." });
        }

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ reply: "حدث خطأ أثناء الاتصال بالسيرفر." });
    }
});

// تحديد البورت المتوافق مع Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
