import React from 'react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ text, sender, timestamp }) => {
  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-[16px] px-4 py-3 shadow-sm ${
          sender === 'user'
            ? 'bg-gradient-to-r from-[#7F00FF] to-[#E100FF] text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        {sender === 'bot' ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{text}</p>
        )}
        <p className={`text-xs mt-1 ${sender === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;