const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// مفتاح API الخاص بك
const GEMINI_API_KEY = "AQ.Ab8RN6Llpxufv_l3rkFL0n_INposnID-ISQNGKsIs6VsDZrGCQ";

app.get('/', (req, res) => {
    res.send('Server is running successfully!');
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, images } = req.body;

        const parts = [];
        if (message) {
            parts.push({ text: message });
        }

        if (images && images.length > 0) {
            images.forEach(imgBase64 => {
                const base64Data = imgBase64.replace(/^data:image\/\w+;base64,/, "");
                parts.push({
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: base64Data
                    }
                });
            });
        }

        // اسم الموديل المعتمد والمستقر لدى جوجل: gemini-1.5-flash
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: parts }] })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const botReply = data.candidates[0].content.parts[0].text;
            res.json({ reply: botReply });
        } else {
            console.error('Google API Error:', data);
            res.status(400).json({ reply: data.error?.message || "تعذر الحصول على رد من الذكاء الاصطناعي." });
        }

    } catch (error) {
        console.error('Server Internal Error:', error);
        res.status(500).json({ reply: "حدث خطأ في الاتصال بالسيرفر." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
