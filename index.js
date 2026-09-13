const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { message, images, planLevel } = req.body;

        if (!message && (!images || images.length === 0)) {
            return res.status(400).json({ success: false, error: "الرسالة فارغة" });
        }

        const cleanMsg = (message || "").trim().toLowerCase();

        // 1️⃣ إجابات فورية لأسئلة الهوية والدين
        if (cleanMsg.includes("من انت") || cleanMsg.includes("من أنت")) {
            return res.json({ success: true, reply: "أنا Omnifix مطور من شركة جوجل" });
        }

        if (cleanMsg.includes("هل انت مسلم") || cleanMsg.includes("هل أنت مسلم")) {
            return res.json({ success: true, reply: "الذي صنعني مسلم اذن انا مسلم والحمد لله" });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ 
                success: false, 
                error: "مفتاح GEMINI_API_KEY غير معرف على Render." 
            });
        }

        const systemPrompt = `أنت المساعد الذكي OmniFix (OmniFix AI). مستوى الباقة الحالي: ${planLevel || 0}.`;

        let parts = [{ text: `${systemPrompt}\n\nالمستخدم: ${message || ""}` }];

        if (images && Array.isArray(images)) {
            images.forEach(img => {
                const match = img.match(/^data:(.+);base64,(.+)$/);
                if (match) {
                    parts.push({
                        inline_data: { mime_type: match[1], data: match[2] }
                    });
                }
            });
        }

        // 2️⃣ طلب الموديل الحديث المباشر gemini-3.6-flash
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts }] })
        });

        const data = await response.json();

        if (response.ok && data.candidates && data.candidates[0].content.parts[0].text) {
            return res.json({ success: true, reply: data.candidates[0].content.parts[0].text });
        } else {
            const errorMsg = data.error ? data.error.message : "فشل طلب API";
            return res.status(500).json({ success: false, error: `خطأ جوجل: ${errorMsg}` });
        }

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
