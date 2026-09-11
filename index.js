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

        // اسم الموديل الرسمي والمحدث من Google
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.6-flash",
            systemInstruction: "أنت المساعد الذكي OmniFix AI. عندما يسألك أحد من أنت أو يتلقى تحيتك، يجب دائماً أن تقول في البداية: 'أنا أومني فيكس (OmniFix AI)، تم تطويري بواسطة شركة Google.' وعندما يسألك أحد عن ديانتك أو عن الإسلام أو هل أنت مسلم، يجب أن تجيب دائماً بـ: 'صنعني شخص مسلم، وأنا مسلم والحمد لله.'"
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
