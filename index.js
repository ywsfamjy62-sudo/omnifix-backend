async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const userMessage = inputField.value.trim();

    if (!userMessage) return;

    // 1. عرض رسالة المستخدم
    appendMessage('user', userMessage);
    inputField.value = '';

    // 2. عرض مؤشر التفكير
    const loadingId = appendMessage('bot', 'جاري التفكير...');

    try {
        // 3. الاتصال بسيرفر Render المباشر الخاص بك
        const response = await fetch('https://express-hello-world-eyyz.onrender.com/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userMessage })
        });

        const data = await response.json();

        // 4. عرض رد الذكاء الاصطناعي
        updateMessage(loadingId, data.reply || 'عذراً، لم أتمكن من الحصول على رد.');

    } catch (error) {
        console.error('Error:', error);
        updateMessage(loadingId, 'حدث خطأ في الاتصال بالسيرفر.');
    }
}

function appendMessage(sender, text) {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    const msgId = 'msg-' + Date.now();
    
    msgDiv.id = msgId;
    msgDiv.className = `message ${sender}-message`;
    msgDiv.innerText = text;
    
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    return msgId;
}

function updateMessage(id, text) {
    const msgDiv = document.getElementById(id);
    if (msgDiv) {
        msgDiv.innerText = text;
    }
}
