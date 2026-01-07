import { useState, useEffect, useRef } from 'react';
import Message from './Message';
import './Chat.css';

function Chat({ user, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setHistoryLoading(false);
        return;
      }

      const response = await fetch('/api/chat/history', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        onLogout();
        return;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: input,
          history: messages.slice(-10).map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        onLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi không xác định');
      }

      const botMessage = {
        role: 'assistant',
        text: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        text: `⚠️ ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ lịch sử chat?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat/history', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMessages([]);
      }
    } catch (error) {
      alert('Không thể xóa lịch sử chat');
    }
  };

  if (historyLoading) {
    return (
      <div className="chat-container">
        <div className="loading">Đang tải lịch sử chat...</div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div>
          <h2>💬 MLN131 Chatbot</h2>
          <p className="user-info">Xin chào, {user.username}!</p>
        </div>
        <div className="header-actions">
          <button onClick={clearHistory} className="btn-clear">
            🗑️ Xóa lịch sử
          </button>
          <button onClick={onLogout} className="btn-logout">
            🚪 Đăng xuất
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h3>👋 Chào bạn!</h3>
            <p>Tôi là trợ lý ảo về Chương 2: Sứ mệnh lịch sử của giai cấp công nhân.</p>
            <p>Bạn có thể hỏi tôi về:</p>
            <ul>
              <li>• Khái niệm và đặc điểm GCCN</li>
              <li>• Nội dung sứ mệnh lịch sử</li>
              <li>• Điều kiện quy định sứ mệnh</li>
              <li>• GCCN hiện nay</li>
              <li>• GCCN Việt Nam</li>
            </ul>
          </div>
        ) : (
          messages.map((msg, idx) => <Message key={idx} message={msg} />)
        )}
        {loading && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={sendMessage} className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập câu hỏi của bạn..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          📤 Gửi
        </button>
      </form>
    </div>
  );
}

export default Chat;
