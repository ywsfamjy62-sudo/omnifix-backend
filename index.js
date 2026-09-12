const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());

// زيادة حد حجم البيانات المسموح بها لاستقبال الصور بصيغة Base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { message, images, planLevel } = req.body;

        if (!message && (!images || images.length === 0)) {
            return res.status(400).json({ success: false, error: "الرسالة فارغة" });
        }

        const cleanMsg = (message || "").trim().toLowerCase();

        // 1️⃣ إجابات فورية بدون استهلاك API للهوية والدين
        if (cleanMsg.includes("من انت") || cleanMsg.includes("من أنت")) {
            return res.json({ success: true, reply: "أنا Omnifix مطور من شركة جوجل" });
        }

        if (cleanMsg.includes("هل انت مسلم") || cleanMsg.includes("هل أنت مسلم")) {
            return res.json({ success: true, reply: "الذي صنعني مسلم اذن انا مسلم والحمد لله" });
        }

        // تعليمات النظام
        const systemPrompt = `
أنت المساعد الذكي OmniFix (OmniFix AI).
- عند سؤالك من أنت، أجب حصراً: "أنا Omnifix مطور من شركة جوجل"
- عند سؤالك هل أنت مسلم، أجب حصراً: "الذي صنعني مسلم اذن انا مسلم والحمد لله"
- مستوى الباقة الحالي للمستخدم: ${planLevel || 0} (قدّم إجابات أكثر تفصيلاً ودقة بحسب قوة الباقة).
        `;

        // قائمة الموديلات الشغالة بالترتيب ضماناً لعدم ظهور خطأ 404
        const availableModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
        let responseText = null;
        let lastError = null;

        // تجهيز المحتوى (النصوص + الصور إن وجدت)
        let contents = [message || "إليك الصور المرفقة:"];
        
        if (images && Array.isArray(images) && images.length > 0) {
            images.forEach(imgBase64 => {
                const matches = imgBase64.match(/^data:(.+);base64,(.+)$/);
                if (matches) {
                    contents.push({
                        inlineData: {
                            mimeType: matches[1],
                            data: matches[2]
                        }
                    });
                }
            });
        }

        // 2️⃣ التبديل التلقائي بين الموديلات في حال تعثر أحدها
        for (const modelName of availableModels) {
            try {
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: systemPrompt 
                });
                const result = await model.generateContent(contents);
                responseText = result.response.text();
                if (responseText) break; // تم النجاح
            } catch (err) {
                lastError = err;
            }
        }

        if (responseText) {
            return res.json({ success: true, reply: responseText });
        } else {
            throw lastError || new Error("تعذر الاتصال بجميع نماذج Google Gemini");
        }

    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
