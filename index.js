const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.get('/', (req, res) => {
    res.send('Server is running successfully!');
});

// دالة ذكية لإعادة المحاولة تلقائياً عند وجود ضغط
async function fetchWithRetry(url, options, retries = 3, delay = 1500) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
        } catch (err) {
            // المحاولة مرة أخرى في حال وجود خطأ في الشبكة
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    return fetch(url, options);
}

app.post('/api/chat', async (req, res) => {
    try {
        const { message, images } = req.body;

        const parts = [];
        // إضافة تعليمات تجعل الذكاء الاصطناعي يجيب باختصار لتفادي الضغط
        parts.push({ text: "أجب باختصار ووضوح وبطريقة مباشرة دون إطالة:" });
        
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

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetchWithRetry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: parts }] })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const replyText = data.candidates[0].content.parts[0].text;
            res.json({ reply: replyText });
        } else {
            // في حال وجود ضغط شديد جداً، يعطي السيرفر رداً لائقاً بدلاً من الخطأ
            res.json({ reply: "أنا هنا ومستعد لمساعدتك! يرجى إعادة إرسال سؤالك مرة أخرى." });
        }

    } catch (error) {
        res.json({ reply: "حدث أزمة بسيطة في الاتصال، أعد محاولتك الآن وسأجيبك فوراً." });
    }
});

module.exports = app;
