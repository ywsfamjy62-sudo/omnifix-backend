const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: "الرسالة فارغة" });
        }

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: `أنت المساعد الذكي الشامل OmniFix AI.
1. تجيب على المحادثات وتكتب الأكواد البرمجية بدقة عالية وبدون أخطاء.
2. عندما يطلب منك المستخدم (صورة أو رسم أو تصميم أو تعديل صورة)، لا تعطه نصائح للذهاب لمواقع أخرى، بل قم بصياغة الوصف بالإنجليزية وضعه داخل هذا الرابط مباشرة:
IMAGE:[https://image.pollinations.ai/prompt/وصف_الصورة_بالانجليزي?width=1024&height=1024&nologo=true]
ثم اكتب له شرحاً بسيطاً تحت الصورة باللغة العربية.`
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
