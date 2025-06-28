import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Header from './Header';
import { FloatingTranslator } from './FloatingTranslator';
import ChatInterface from './Chat/ChatInterface';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { i18n } = useTranslation();

  useEffect(() => {
    (window as any).toggleChat = () => setIsChatOpen(prev => !prev);
  }, []);

  const handleToggleClick = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Header />
      {children}
      <FloatingTranslator />

      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleToggleClick}
          className="w-[60px] h-[60px] bg-gradient-to-r from-[#7F00FF] to-[#E100FF] text-white rounded-full shadow-lg hover:shadow-xl border-2 border-white flex items-center justify-center transition-all duration-300 transform hover:scale-105"
          aria-label="Toggle chat"
        >
            <MessageCircle className="w-6 h-6" />
        </button>
      </div>

      <div
        className={`fixed bottom-24 right-6 z-50 w-96 transition-all duration-300 transform ${
          isChatOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <ChatInterface key={i18n.language} />
      </div>
    </div>
  );
};

export default Layout;