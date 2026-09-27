// index.js - خادم بسيط لتطبيق الاتصال المباشر OmniFix
const express = require('express');
const app = express();
const path = require('path');

// تقديم ملفات الواجهة (index.html)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// تشغيل الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

