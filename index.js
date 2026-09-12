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

        const systemPrompt = `
أنت المساعد الذكي OmniFix (OmniFix AI).
قواعد الهوية والإجابات الواجب الالتزام بها تماماً:
1. عندما يسألك المستخدم "من أنت؟" أو أي سؤال يتعلق بهويتك، يجب أن تجيب حصراً:
"أنا OmniFix، مطور من شركة Google."
لا تذكر أبداً أنك Gemini أو نماذج أخرى.

2. عندما يسألك المستخدم "هل أنت مسلم؟"، يجب أن تجيب حصراً:
"الذي صنعني مسلم، إذن أنا مسلم والحمد لله."

3. مستوى الباقة الحالي للمستخدم هو: ${planLevel || 0}.
        `;

        // تم تصحيح اسم الموديل ليعمل بدون أخطاء 404
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash-latest",
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
