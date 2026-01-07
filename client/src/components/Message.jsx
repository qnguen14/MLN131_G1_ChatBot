import './Message.css';

function Message({ message }) {
  const isUser = message.role === 'user';
  
  const formatText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className={`message ${isUser ? 'user-message' : 'bot-message'}`}>
      <div className="message-label">
        {isUser ? 'Bạn' : 'MLN131 Bot'}
      </div>
      <div
        className="message-text"
        dangerouslySetInnerHTML={{ __html: formatText(message.text) }}
      />
    </div>
  );
}

export default Message;
