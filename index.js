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
