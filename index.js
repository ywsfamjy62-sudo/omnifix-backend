const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY");

// قائمة الباقات الـ 10 الكاملة
const PACKAGES = [
    { id: 1, name: "الباقة العادية", adsRequired: 0 },
    { id: 2, name: "باقة الدقة المتقدمة", adsRequired: 1 },
    { id: 3, name: "باقة المبرمج الذكي", adsRequired: 2 },
    { id: 4, name: "باقة السرعة الخارقة", adsRequired: 3 },
    { id: 5, name: "باقة التفكير العميق", adsRequired: 4 },
    { id: 6, name: "باقة مطور الألعاب (Unity Expert)", adsRequired: 5 },
    { id: 7, name: "باقة تحليل البيانات", adsRequired: 6 },
    { id: 8, name: "باقة كتابة المحتوى الإبداعي", adsRequired: 7 },
    { id: 9, name: "باقة الترجمة الاحترافية", adsRequired: 8 },
    { id: 10, name: "الباقة الشاملة القصوى", adsRequired: 10 }
];

// دالة الاتصال بجوجل مع إعادة المحاولة في حال خطأ 503
async function generateWithRetry(model, prompt, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            return await result.response.text();
        } catch (error) {
            if (error.status === 503 && i < retries - 1) {
                await new Promise(res => setTimeout(res, 2000)); // انتظار ثانتين وإعادة المحاولة
                continue;
            }
            throw error;
        }
    }
}

app.post('/api/chat', async (req, res) => {
    try {
        const { message, packageId, adsWatched } = req.body;
        
        const selectedPackage = PACKAGES.find(p => p.id === packageId) || PACKAGES[0];

        // التحقق من مشاهدة عدد الإعلانات المطلوبة للباقة
        if (adsWatched < selectedPackage.adsRequired) {
            return res.status(400).json({ 
                error: `يجب مشاهدة ${selectedPackage.adsRequired} إعلانات لتفعيل هذه الباقة.` 
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
        const replyText = await generateWithRetry(model, message);

        res.json({ reply: replyText });

    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            reply: "السيرفر مشغول حالياً بسبب كثرة الطلبات، يرجى المحاولة بعد بضع ثوانٍ." 
        });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
