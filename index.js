const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// قراءة المفتاح تلقائياً من متغيرات Vercel
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.get('/', (req, res) => {
    res.send('Server is running successfully!');
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, images } = req.body;

        const parts = [];
        if (message) parts.push({ text: message });

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

        // تم تحديث النموذج إلى gemini-3.6-flash
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: parts }] })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            res.json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            const errorMsg = data.error?.message || JSON.stringify(data);
            res.status(400).json({ reply: `خطأ من Google API: ${errorMsg}` });
        }

    } catch (error) {
        res.status(500).json({ reply: `خطأ في السيرفر: ${error.message}` });
    }
});

module.exports = app;
