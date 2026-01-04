import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Feather, Volume2, User } from 'lucide-react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm Mr Bukkan, your personal poet. 🎭\n\nGive me any topic, and I'll craft a beautiful poem just for you. Try topics like 'sunset', 'friendship', 'dreams', or anything that inspires you!", 
      sender: 'bot', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recitingMessageId, setRecitingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const recitePoem = (text, messageId) => {
    window.speechSynthesis.cancel();
    
    setRecitingMessageId(messageId);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    
    utterance.onend = () => {
      setRecitingMessageId(null);
    };
    
    utterance.onerror = () => {
      setRecitingMessageId(null);
    };
    
    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopReciting = () => {
    window.speechSynthesis.cancel();
    setRecitingMessageId(null);
  };

  const generatePoem = async (topic) => {
    try {
      const response = await fetch(`${API_URL}/api/generate-poem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();
      
      if (response.ok) {
        return data.poem;
      } else {
        return "I'm having trouble composing right now. Please try again in a moment.";
      }
    } catch (error) {
      console.error("Error generating poem:", error);
      return "I'm experiencing some technical difficulties. Please try again later.";
    }
  };

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = {
        id: messages.length + 1,
        text: input,
        sender: 'user',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages([...messages, userMessage]);
      const topic = input;
      setInput('');
      setIsLoading(true);
      
      const poem = await generatePoem(topic);
      
      const botMessage = {
        id: messages.length + 2,
        text: poem,
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="header-icon">
            <Feather className="icon-feather" />
          </div>
          <div>
            <h1 className="header-title">Create Poem with Mr Bukkan</h1>
            <p className="header-subtitle">
              {isLoading ? 'Composing your poem...' : 'Your personal poet • Ready to create'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === 'user' ? 'message-user' : 'message-bot'}`}
          >
            <div className={`avatar ${message.sender === 'bot' ? 'avatar-bot' : 'avatar-user'}`}>
              {message.sender === 'bot' ? (
                <Feather className="avatar-icon" />
              ) : (
                <User className="avatar-icon" />
              )}
            </div>
            <div className="message-content-wrapper">
              <div className={`message-bubble ${message.sender === 'bot' ? 'bubble-bot' : 'bubble-user'}`}>
                <p className="message-text">{message.text}</p>
                {message.sender === 'bot' && message.id !== 1 && (
                  <button
                    onClick={() => recitingMessageId === message.id ? stopReciting() : recitePoem(message.text, message.id)}
                    className={`recite-button ${recitingMessageId === message.id ? 'recite-active' : ''}`}
                  >
                    <Volume2 className={`recite-icon ${recitingMessageId === message.id ? 'icon-bounce' : ''}`} />
                    <span>{recitingMessageId === message.id ? 'Stop Reciting' : 'Recite Poem'}</span>
                  </button>
                )}
              </div>
              <p className="message-time">{message.time}</p>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="message message-bot">
            <div className="avatar avatar-bot">
              <Feather className="avatar-icon" />
            </div>
            <div className="message-content-wrapper">
              <div className="message-bubble bubble-bot">
                <div className="loading-indicator">
                  <Loader2 className="loading-spinner" />
                  <span className="loading-text">Crafting verses...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-area">
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a topic for your poem..."
            disabled={isLoading}
            className="input-field"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="send-button"
          >
            {isLoading ? (
              <Loader2 className="button-icon spinner" />
            ) : (
              <Send className="button-icon" />
            )}
          </button>
        </div>
        
        {/* Copyright and Hit Counter */}
        <div className="footer">
          <span className="footer-text">copyright©2026 Mr Bukkan</span>
          <span className="footer-separator">•</span>
          <span className="footer-text">📧 bukkan1309@gmail.com</span>
          <span className="footer-separator">•</span>
          <div className="visitor-counter">
            <span className="visitor-label">👁️ Visitors:</span>
            <div className="visitor-badge">
              <span className="visitor-count">{messages.filter(m => m.sender === 'user').length + 1337}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
