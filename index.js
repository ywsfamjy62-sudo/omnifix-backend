const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// إعدادات الـ CORS والـ Body Parser
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// تهيئة مكتبة Gemini بالاعتماد على متغيرات البيئة
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// 1️⃣ الصفحة الرئيسية (تمنع ظهور خطأ 500 عند زيارة الرابط المباشر)
app.get('/', (req, res) => {
  // إذا كان ملف index.html موجوداً في نفس المجلد سيتم عرضه، وإلا يرجع رسالة نجاح
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('OmniFix AI Backend is Running Successfully!');
    }
  });
});

// 2️⃣ نقطة نهاية المحادثة والذكاء الاصطناعي
app.post('/api/chat', async (req, res) => {
  try {
    const { message, images } = req.body;

    if (!message && (!images || images.length === 0)) {
      return res.status(400).json({ error: 'الرجاء كتابة رسالة أو إرسال صورة.' });
    }

    // فحص ما إذا كان الطلب لرسم صورة
    const imageKeywords = ['ارسم', 'انشئ صورة', 'توليد صورة', 'صورة لـ', 'اصنعلي صورة', 'draw', 'generate image', 'create image', 'image of'];
    const isImageRequest = imageKeywords.some(keyword => message && message.toLowerCase().includes(keyword));

    if (isImageRequest && (!images || images.length === 0)) {
      let cleanPrompt = message;
      imageKeywords.forEach(k => {
        cleanPrompt = cleanPrompt.replace(new RegExp(k, 'gi'), '');
      });
      cleanPrompt = cleanPrompt.trim() || message;

      const promptEncoded = encodeURIComponent(cleanPrompt);
      const imageUrl = `https://pollinations.ai/p/${promptEncoded}?width=1024&height=1024&seed=${Math.floor(Math.random() * 999999)}&nologo=true`;
      
      return res.json({ 
        reply: 'إليك الصورة التي طلبتها:',
        isImage: true,
        imageUrl: imageUrl 
      });
    }

    // التحقق من وجود مفتاح API
    if (!genAI) {
      return res.status(500).json({ error: 'مفتاح GEMINI_API_KEY غير معرف في إعدادات البيئة (Vercel).' });
    }

    // محادثة الذكاء الاصطناعي Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    let contents = [];

    // معالجة الصور إن وجدت (Base64)
    if (images && images.length > 0) {
      images.forEach((imgBase64) => {
        const matches = imgBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          contents.push({
            inlineData: { mimeType: matches[1], data: matches[2] }
          });
        }
      });
    }

    if (message) contents.push(message);

    const result = await model.generateContent(contents);
    const responseText = await result.response.text();

    return res.json({ reply: responseText, isImage: false });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء معالجة الطلب في السيرفر.' });
  }
});

// تشغيل السيرفر محلياً
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// تصدير app ليعمل كـ Serverless Function على Vercel
module.exports = app;
// تحديث قائمة الترجمات لنصوص المدة
i18n.ar.duration24 = "المدة: 24 ساعة";
i18n.ar.duration48 = "المدة: 48 ساعة (مميزة)";
i18n.en.duration24 = "Duration: 24 Hours";
i18n.en.duration48 = "Duration: 48 Hours (Special)";

// توليد 30 باقة مع تحديد مدة كل باقة
function generatePlans() {
  const grid = document.getElementById('plansGrid');
  grid.innerHTML = '';
  const t = i18n[currentLang];

  for (let i = 1; i <= 30; i++) {
    const adsNum = i * 2; // تزيد بمقدار 2 إعلانات لكل باقة
    const price = i === 1 ? 0 : (i * 1.99).toFixed(2);
    
    // تحديد مدة الباقة (الباقة 30 مدتها 48 ساعة، والبقية 24 ساعة)
    const durationText = i === 30 
      ? (currentLang === 'ar' ? '⏳ المدة: 48 ساعة' : '⏳ Duration: 48 Hours')
      : (currentLang === 'ar' ? '⏳ المدة: 24 ساعة' : '⏳ Duration: 24 Hours');

    const card = document.createElement('div');
    card.className = `plan-card ${i === 1 ? 'active-plan' : ''} ${i === 30 ? 'special-plan' : ''}`;
    
    card.innerHTML = `
      <div>
        <div class="plan-title">${currentLang === 'ar' ? `الباقة ${i}` : `Plan ${i}`} ${i === 30 ? '🔥' : ''}</div>
        <div class="plan-price">${price == 0 ? t.freeText : `$${price}`}</div>
        <ul class="plan-features">
          <li>📺 ${t.adsCount} <b>${adsNum}</b></li>
          <li>${durationText}</li>
          <li>⚡ ${currentLang === 'ar' ? 'سرعة الرد:' : 'Speed:'} Level ${i}</li>
          <li>🎨 ${currentLang === 'ar' ? 'توليد صور بجودة' : 'Image Quality'} ${i === 1 ? 'Standard' : i < 15 ? 'HD' : '4K'}</li>
        </ul>
      </div>
      <button class="plan-btn" style="${i === 1 ? 'background:#10b981;' : i === 30 ? 'background: linear-gradient(135deg, #f59e0b, #d97706);' : ''}" onclick="selectPlan(${i}, ${i === 30 ? 48 : 24})">
        ${i === 1 ? t.currentBtn : t.selectBtn}
      </button>
    `;
    grid.appendChild(card);
  }
}

// دالة الاشتراك وتفعيل مدة الباقة
function selectPlan(planNumber, hours) {
  const msg = currentLang === 'ar' 
    ? `تم الاشتراك في الباقة ${planNumber} بنجاح! المدة المتاحة: ${hours} ساعة.` 
    : `Successfully subscribed to Plan ${planNumber}! Duration: ${hours} hours.`;
  alert(msg);
}
