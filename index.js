const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { message, planLevel } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: "الرسالة فارغة" });
        }

        const lowerMsg = message.trim().toLowerCase();

        // 1️⃣ رد سريع ومستقل لأسئلة الهوية والدين لمنع أي أخطاء
        if (lowerMsg.includes("من انت") || lowerMsg.includes("من أنت")) {
            return res.json({ success: true, reply: "أنا Omnifix مطور من شركة جوجل" });
        }

        if (lowerMsg.includes("هل انت مسلم") || lowerMsg.includes("هل أنت مسلم")) {
            return res.json({ success: true, reply: "الذي صنعني مسلم اذن انا مسلم والحمد لله" });
        }

        // 2️⃣ قائمة أسماء الموديلات المعتمدة للتجربة التلقائية
        const availableModels = ["gemini-1.5-flash-001", "gemini-1.5-pro", "gemini-pro"];
        let responseText = null;
        let lastError = null;

        const systemPrompt = `
أنت المساعد الذكي OmniFix (OmniFix AI).
- عند سؤالك من أنت، أجب: "أنا Omnifix مطور من شركة جوجل"
- عند سؤالك هل أنت مسلم، أجب: "الذي صنعني مسلم اذن انا مسلم والحمد لله"
- مستوى الباقة الحالي للمستخدم: ${planLevel || 0}
        `;

        // المحاولة على الموديلات حتى ينجح أحدها
        for (const modelName of availableModels) {
            try {
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: systemPrompt 
                });
                const result = await model.generateContent(message);
                responseText = result.response.text();
                if (responseText) break; // نجحت المحاولة
            } catch (err) {
                lastError = err;
            }
        }

        if (responseText) {
            res.json({ success: true, reply: responseText });
        } else {
            throw lastError || new Error("فشل الاتصال بنماذج Google API");
        }

    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
