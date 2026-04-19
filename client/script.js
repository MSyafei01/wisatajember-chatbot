document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chat-box');
  const inputField = document.getElementById('user-input');
  let chatHistory = [];

  // Pesan Selamat Datang
  addBotMessage("👋 Halo Sobat Travel JEMBER! Aku asisten AI Jember. Mau tanya pantai, kuliner, atau sejarah? Silakan ketik atau pilih saran di bawah ya. 🌊🏞️");

  // Event Listener untuk Enter Key
  inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Event Listener untuk Saran (Quick Replies)
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const query = chip.getAttribute('data-query');
      inputField.value = query;
      sendMessage();
    });
  });
});

// Fungsi untuk menambah pesan user
function addUserMessage(text) {
  const chatBox = document.getElementById('chat-box');
  const userDiv = document.createElement('div');
  userDiv.className = 'user';
  userDiv.innerHTML = `<span>🧑 ${escapeHTML(text)}</span>`;
  chatBox.appendChild(userDiv);
}

// Fungsi untuk menambah pesan bot
function addBotMessage(text) {
  const chatBox = document.getElementById('chat-box');
  const botDiv = document.createElement('div');
  botDiv.className = 'bot';
  botDiv.innerHTML = `<span><i class="fas fa-map-pin"></i> ${escapeHTML(text)}</span>`;
  chatBox.appendChild(botDiv);
}

// Fungsi sederhana untuk mencegah XSS (Cross-Site Scripting)
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Fungsi untuk menampilkan animasi "sedang mengetik"
function showTypingIndicator() {
  const chatBox = document.getElementById('chat-box');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'bot typing-indicator-container';
  typingDiv.id = 'typing-indicator';
  typingDiv.innerHTML = `
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  chatBox.appendChild(typingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Fungsi untuk menghapus animasi mengetik
function removeTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}

// Fungsi Utama Send Message
async function sendMessage() {
  const input = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const userText = input.value.trim();
  
  if (!userText) return;

  // Tampilkan pesan user
  addUserMessage(userText);
  input.value = "";
  
  // Scroll ke bawah
  const chatBox = document.getElementById('chat-box');
  chatBox.scrollTop = chatBox.scrollHeight;

  // Disable tombol & tampilkan indikator mengetik
  sendBtn.disabled = true;
  showTypingIndicator();

  try {
    // Simulasi delay untuk realisme (bisa dihapus jika API cepat)
    // await new Promise(resolve => setTimeout(resolve, 800));

chatHistory.push({ role: "user", content: userText });

const res = await fetch("http://localhost:3000/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ 
    message: userText,
    history: chatHistory
  })
});

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    
    // Hapus indikator mengetik
    removeTypingIndicator();
    
    // Tampilkan balasan bot
    addBotMessage(data.reply);
    
  } catch (error) {
    console.error("Error:", error);
    removeTypingIndicator();
    addBotMessage("⚠️ Maaf, ada gangguan jaringan atau server belum menyala. Pastikan backend berjalan di port 3000 ya.");
  } finally {
    sendBtn.disabled = false;
    chatBox.scrollTop = chatBox.scrollHeight;
    input.focus();
  }
}