// Generate random session ID
const sessionId = 'session_' + Math.random().toString(36).substring(2, 15);

document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chat-box');
  const inputField = document.getElementById('user-input');
  
  // Cek koneksi server
  checkServerHealth();
  
  // Pesan Selamat Datang
  setTimeout(() => {
    addBotMessage("👋 Halooo Sobat Travel! Aku asisten AI khusus Jember nih. Mau tanya pantai terindah, kulier legendaris, atau itinerary seru? Tinggal ketik aja ya! 🌊✨");
  }, 500);

  // Event Listener untuk Enter Key
  inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
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

  // Tambahkan fitur reset dengan ketik "/reset"
  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && inputField.value.trim() === '/reset') {
      e.preventDefault();
      resetChat();
    }
  });
});

// Cek health server
async function checkServerHealth() {
  try {
    const res = await fetch("http://localhost:3000/api/health");
    const data = await res.json();
    console.log("✅ Server:", data.message);
  } catch (error) {
    console.warn("⚠️ Server belum nyala, pastikan backend running di port 3000");
    addBotMessage("⚠️ Servernya belum nyala nih Kakak. Jalanin backend dulu ya dengan perintah: <code>npm start</code>");
  }
}

// Reset chat
async function resetChat() {
  try {
    await fetch("http://localhost:3000/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });
    
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';
    addBotMessage("🔄 History chat sudah direset! Sekarang kita mulai petualangan baru di Jember. Mau tanya apa dulu nih? 🌴");
    
    document.getElementById('user-input').value = '';
  } catch (error) {
    console.error("Reset error:", error);
  }
}

// Fungsi untuk menambah pesan user
function addUserMessage(text) {
  const chatBox = document.getElementById('chat-box');
  const userDiv = document.createElement('div');
  userDiv.className = 'user';
  userDiv.innerHTML = `<span>🧑 ${escapeHTML(text)}</span>`;
  chatBox.appendChild(userDiv);
}

// Fungsi untuk menambah pesan bot (support HTML sederhana)
function addBotMessage(text) {
  const chatBox = document.getElementById('chat-box');
  const botDiv = document.createElement('div');
  botDiv.className = 'bot';
  
  // Parse markdown sederhana untuk bold dan code
  let formattedText = escapeHTML(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
  
  botDiv.innerHTML = `<span><i class="fas fa-map-pin"></i> ${formattedText}</span>`;
  chatBox.appendChild(botDiv);
}

// Escape HTML untuk keamanan
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
    const res = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        message: userText,
        sessionId: sessionId 
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
    
    if (error.message.includes("Failed to fetch")) {
      addBotMessage("🔌 Waduh, server belum nyala nih. Coba jalankan <code>npm start</code> di folder backend dulu ya Kakak! 🙏");
    } else {
      addBotMessage("⚠️ Maaf, ada gangguan teknis. Coba lagi sebentar ya Kakak.");
    }
  } finally {
    sendBtn.disabled = false;
    chatBox.scrollTop = chatBox.scrollHeight;
    input.focus();
  }
}

// Tambahan: Tombol reset di UI (opsional)
function addResetButton() {
  const headerRight = document.querySelector('.header-left');
  if (headerRight) {
    const resetBtn = document.createElement('button');
    resetBtn.innerHTML = '<i class="fas fa-redo-alt"></i>';
    resetBtn.style.cssText = `
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      margin-left: auto;
      margin-right: 10px;
      transition: 0.2s;
    `;
    resetBtn.onmouseover = () => resetBtn.style.background = 'rgba(255,255,255,0.3)';
    resetBtn.onmouseout = () => resetBtn.style.background = 'rgba(255,255,255,0.2)';
    resetBtn.onclick = resetChat;
    resetBtn.title = "Reset Chat";
    
    const headerLeft = document.querySelector('.chat-header');
    headerLeft.appendChild(resetBtn);
  }
}

// Panggil saat load
setTimeout(addResetButton, 100);