'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  status?: 'sending' | 'sent' | 'error';
}

interface AIChatProps {
  onSendMessage: (message: string) => Promise<string>;
  isProcessing: boolean;
}

export const AIChat: React.FC<AIChatProps> = ({ onSendMessage, isProcessing }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I can help you create and manipulate shapes on the canvas. Try saying "Create a red rectangle" or "Arrange all shapes in a grid".',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const response = await onSendMessage(input.trim());

      // Update user message status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Update user message status to error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'error' } : msg
        )
      );

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-lg
          flex items-center justify-center transition-all duration-200
          ${isOpen ? 'bg-gray-600' : 'bg-blue-500 hover:bg-blue-600'}
          text-white z-50
        `}
      >
        {isOpen ? <CloseIcon /> : <AIIcon />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-40">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <AIIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">AI Canvas Agent</h3>
                <p className="text-xs text-gray-500">
                  {isProcessing ? 'Processing...' : 'Ready to help'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-gray-500">
                <LoadingDots />
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me to create or modify shapes..."
                className="flex-1 px-4 py-2 bg-gray-100 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-200
                  ${input.trim() && !isProcessing
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                <SendIcon />
              </button>
            </div>
          </form>

          {/* Quick commands */}
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-1">
              {quickCommands.map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => setInput(cmd)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const quickCommands = [
  'Create a red circle',
  'Make a grid of squares',
  'Create a login form',
  'Align all shapes',
];

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[80%] px-4 py-2 rounded-2xl text-sm
          ${isUser
            ? 'bg-blue-500 text-white rounded-br-md'
            : isSystem
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
          }
          ${message.status === 'sending' ? 'opacity-70' : ''}
          ${message.status === 'error' ? 'bg-red-100 text-red-700' : ''}
        `}
      >
        {message.content}
      </div>
    </div>
  );
};

const LoadingDots: React.FC = () => (
  <div className="flex gap-1">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

const AIIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
    <circle cx="8.5" cy="14.5" r="1.5" />
    <circle cx="15.5" cy="14.5" r="1.5" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SendIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
