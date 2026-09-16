// Function to send message and get response from backend
async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const userMessage = inputField.value.trim();

    if (!userMessage) return;

    // 1. Display user message in chat
    appendMessage('user', userMessage);
    inputField.value = '';

    // 2. Display loading indicator
    const loadingId = appendMessage('bot', 'جاري التفكير...');

    try {
        // 3. Send request to your Express Server API endpoint
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userMessage })
        });

        const data = await response.json();

        // 4. Update bot message with AI response
        updateMessage(loadingId, data.reply || 'عذراً، لم أتمكن من الحصول على رد.');

    } catch (error) {
        console.error('Error:', error);
        updateMessage(loadingId, 'حدث خطأ في الاتصال بالسيرفر. التأكد من تشغيل السيرفر.');
    }
}

// Helper function to append message to UI
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

// Helper function to update existing message
function updateMessage(id, text) {
    const msgDiv = document.getElementById(id);
    if (msgDiv) {
        msgDiv.innerText = text;
    }
}
