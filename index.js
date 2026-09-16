const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// مفتاح Gemini API الخاص بك
const GEMINI_API_KEY = "AQ.Ab8RN6Llpxufv_l3rkFL0n_INposnID-ISQNGKsIs6VsDZrGCQ";

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ reply: "خطأ: لم يتم وضع مفتاح API داخل السيرفر." });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            res.json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            console.error('Gemini Error Response:', data);
            res.status(500).json({ reply: "تعذر الحصول على رد من الذكاء الاصطناعي." });
        }

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ reply: "حدث خطأ في الاتصال بالسيرفر." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
