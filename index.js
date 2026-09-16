const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// قبول الصور والنصوص بحجم مناسب
app.use(express.json({ limit: '10mb' }));

// مفتاحك الجديد الخاص بشركة جوجل
const GEMINI_API_KEY = "AQ.Ab8RN6Llpxufv_l3rkFL0n_INposnID-ISQNGKsIs6VsDZrGCQ";

app.post('/api/chat', async (req, res) => {
    try {
        const { message, images } = req.body;

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ reply: "خطأ: لم يتم وضع المفتاح داخل السيرفر." });
        }

        const parts = [];

        // إضافة النص
        if (message) {
            parts.push({ text: message });
        }

        // إضافة الصور إن وجدت
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

        // طلب الرد من سيرفرات جوجل باستخدام gemini-1.5-flash
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: parts }]
            })
        });

        const data = await response.json();

        // في حال نجاح الاستجابة من جوجل
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const botReply = data.candidates[0].content.parts[0].text;
            res.json({ reply: botReply });
        } else {
            // إظهار سبب الخطأ القادم من جوجل بدقة
            console.error('Google API Error Response:', data);
            const errorMessage = data.error?.message || "تعذر الحصول على رد من الذكاء الاصطناعي.";
            res.status(400).json({ reply: `خطأ من جوجل: ${errorMessage}` });
        }

    } catch (error) {
        console.error('Server Catch Error:', error);
        res.status(500).json({ reply: "حدث خطأ في الاتصال بالسيرفر الداخلي." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
