const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// تحديد API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { message, planLevel } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: "الرسالة فارغة" });
        }

        const cleanMsg = message.trim().toLowerCase();

        // الرد الفوري المباشر لأسئلة الهوية والدين بدون طلب API
        if (cleanMsg.includes("من انت") || cleanMsg.includes("من أنت")) {
            return res.json({ success: true, reply: "أنا Omnifix مطور من شركة جوجل" });
        }

        if (cleanMsg.includes("هل انت مسلم") || cleanMsg.includes("هل أنت مسلم")) {
            return res.json({ success: true, reply: "الذي صنعني مسلم اذن انا مسلم والحمد لله" });
        }

        const systemPrompt = `
أنت المساعد الذكي OmniFix (OmniFix AI).
- عند سؤالك من أنت، أجب حصراً: "أنا Omnifix مطور من شركة جوجل"
- عند سؤالك هل أنت مسلم، أجب حصراً: "الذي صنعني مسلم اذن انا مسلم والحمد لله"
- مستوى الباقة الحالي للمستخدم: ${planLevel || 0}
        `;

        // استخدام الاصدار المستقر gemini-1.5-flash مع v1
        const model = genAI.getGenerativeModel(
            { 
                model: "gemini-1.5-flash",
                systemInstruction: systemPrompt 
            },
            { apiVersion: 'v1' } // تجنب أخطاء v1beta
        );

        const result = await model.generateContent(message);
        const responseText = result.response.text();

        res.json({ success: true, reply: responseText });

    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
