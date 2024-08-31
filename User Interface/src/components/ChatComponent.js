import React, { useState, useEffect, useRef } from 'react';
import { getResponse } from '../services/api';
import botAvatar from '../assets/bot.png'; // Path to the bot avatar
import moonIcon from '../assets/moon.png'; // Path to moon icon
import sunIcon from '../assets/sun.png'; // Path to sun icon
import logo from '../assets/logo.png'; // Path to your logo
import './ChatComponent.css';

const ChatComponent = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState('');  // Static user ID for now
  const [isBotTyping, setIsBotTyping] = useState(false);  // Track if the bot is typing
  const [darkMode, setDarkMode] = useState(false); // Theme state
  const [botMessage, setBotMessage] = useState('');  // Current bot message being typed

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Generate and set a new user ID every time the component mounts
    const newUserId = generateUserId();
    setUserId(newUserId);
  }, []);

  const generateUserId = () => {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (query.trim() === '') return;

    const userMessage = { sender: 'user', text: query };
    setMessages([...messages, userMessage]);
    setQuery('');

    setIsBotTyping(true);

    try {
      const res = await getResponse(userId, query);
      simulateTyping(res);
    } catch (error) {
      console.error("Error fetching response:", error);
      setIsBotTyping(false);
    }
  };

  const simulateTyping = (fullMessage) => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullMessage.length) {
        setBotMessage((prev) => prev + fullMessage.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setMessages(prevMessages => [...prevMessages, { sender: 'bot', text: fullMessage }]);
        setBotMessage('');
        setIsBotTyping(false);
      }
    }, 50);  // Adjust the speed here if needed
  };

  // Function to format message with bold and bullet points
  const formatMessage = (text) => {
    // First, apply bold formatting
    const parts = text.split(/(\*\*.+?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>; // Render bold text without ** markers
      }
      return formatBulletPoints(part, index); // Handle bullet points
    });
  };
  

  const formatBulletPoints = (text) => {
    // Replace * with • and add space after each *
    const formattedText = text.split('*').filter(line => line.trim() !== '').map((line, index) => (
      <span key={index}>
        {index > 0 && ' • '}
        {line.trimStart()} {/* Trim only the start to maintain the space after * */}
      </span>
    ));
  
    return formattedText;
  };
  

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, botMessage]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`chat-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="chat-header">
        <button onClick={toggleTheme} className="theme-toggle">
          <img src={darkMode ? sunIcon : moonIcon} alt="toggle theme" />
        </button>
        <h1>ArabMedicalGPT</h1>
        <div className="logo-container">
          <a href="/"><img src={logo} alt="ArabMedicalGPT Logo" className="logo-image" /></a>
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
            dir="rtl" // Right-to-left direction for Arabic text
          >
            {message.sender === 'bot' && (
              <img
                src={botAvatar}
                alt="bot avatar"
                className="chat-avatar"
              />
            )}
            <div className="chat-bubble">
              <p>{formatMessage(message.text)}</p>
            </div>
          </div>
        ))}
        {isBotTyping && (
          <div className="chat-message bot-message" dir="rtl">
            <img
              src={botAvatar}
              alt="bot avatar"
              className="chat-avatar"
            />
            <div className="chat-bubble">
              <p>{botMessage || '...'}</p> {/* Typing indicator or message being typed */}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="chat-form" dir="rtl">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="أرسل رسالتك..."
          className="chat-input"
        />
        <button type="submit" className="chat-submit">
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default ChatComponent;
