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

        // تعليمات النظام الصارمة لقواعد الهوية والإجابات
        const systemPrompt = `
أنت المساعد الذكي OmniFix (OmniFix AI).
التزم بالقواعد التالية بدقة شديدة:
1. عندما يسألك المستخدم "من أنت؟" أو "من انت" أو أي سؤال يتعلق بهويتك، يجب أن تجيب فقط بالحرف:
"أنا Omnifix مطور من شركة جوجل"
لا تذكر أبداً كلمة Gemini أو أنه تم تطويرك بواسطة Google بطريقة أخرى.

2. عندما يسألك المستخدم "هل أنت مسلم؟" أو "هل انت مسلم"، يجب أن تجيب فقط بالحرف:
"الذي صنعني مسلم اذن انا مسلم والحمد لله"

3. مستوى الباقة الحالي المختار من المستخدم هو: ${planLevel || 0}.
        `;

        // اسم الموديل الرسمي والمستقر لدى جوجل
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: systemPrompt
        });

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
