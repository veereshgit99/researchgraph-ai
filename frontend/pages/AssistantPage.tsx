import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { generateAssistantResponse } from '../services/geminiService';
import SendIcon from '../components/icons/SendIcon';
import SparklesIcon from '../components/icons/SparklesIcon';

// This is a simple markdown to HTML converter
const parseMarkdown = (text: string) => {
    // Basic bold, italic, and code block support
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-200/50 rounded px-1 py-0.5 text-sm font-mono text-blue-800">$1</code>');
    text = text.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 text-white p-4 rounded-lg my-2 overflow-x-auto"><code class="text-sm font-mono">$1</code></pre>');
    text = text.replace(/\n/g, '<br />');
    return text;
};

const SuggestionButton: React.FC<{ text: string, onClick: () => void }> = ({ text, onClick }) => (
    <button 
      onClick={onClick}
      className="bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-xl p-4 text-left text-gray-700 hover:bg-gray-100/80 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md"
    >
      {text}
    </button>
);

interface AssistantPageProps {
  initialPrompt: string;
  onPromptConsumed: () => void;
}

const AssistantPage: React.FC<AssistantPageProps> = ({ initialPrompt, onPromptConsumed }) => {
  const [messages, setMessages] = useState<Message[]>([
      { id: '1', text: "Hello! I'm your AI research assistant. Ask me anything about papers, concepts, methods, or help exploring the research landscape.", sender: 'assistant' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const suggestions = [
      "Explain the Transformer architecture",
      "What are the latest advances in computer vision?",
      "Compare BERT and GPT models",
      "Show me papers about few-shot learning",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (prompt: string) => {
    if (prompt.trim() === '' || isLoading) return;
    if (showSuggestions) setShowSuggestions(false);

    const userMessage: Message = { id: Date.now().toString(), text: prompt, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(m => ({
      role: m.sender === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: m.text }],
    }));

    try {
      const responseText = await generateAssistantResponse(history, prompt);
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), text: responseText, sender: 'assistant' };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = { id: (Date.now() + 1).toString(), text: "Sorry, I couldn't get a response. Please try again.", sender: 'assistant' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
      onPromptConsumed();
    }
  }, [initialPrompt, onPromptConsumed]);

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <div className="w-full max-w-4xl h-full flex flex-col animate-fade-in pt-20 md:pt-24">
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="flex flex-col gap-5">
          {messages.map(message => (
            <div key={message.id} className={`flex gap-3 items-start ${message.sender === 'user' ? 'justify-end ml-10' : 'mr-10'}`}>
              {message.sender === 'assistant' && (
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border border-gray-300/50">
                  <SparklesIcon className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <div 
                className={`max-w-xl p-4 rounded-2xl shadow-sm transition-all duration-300 ${
                  message.sender === 'user'
                    ? 'bg-gray-800 text-white rounded-br-none'
                    : 'bg-white border border-gray-200/80 text-gray-800 rounded-bl-none'
                }`}
              >
                <div className="prose prose-sm max-w-none text-inherit" dangerouslySetInnerHTML={{ __html: parseMarkdown(message.text) }} />
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex gap-3 items-start mr-10">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border border-gray-300/50">
                  <SparklesIcon className="w-5 h-5 text-gray-600 animate-pulse" />
                </div>
                <div className="max-w-xl p-4 rounded-2xl bg-white border border-gray-200/80 shadow-sm rounded-bl-none">
                    <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
                        <span className="h-2.5 w-2.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></span>
                        <span className="h-2.5 w-2.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></span>
                    </div>
                </div>
              </div>
          )}
          {showSuggestions && messages.length <= 1 && (
            <div className="my-6 animate-fade-in">
                <p className="text-center text-sm text-gray-500 mb-4">Try asking about:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {suggestions.map(text => (
                        <SuggestionButton key={text} text={text} onClick={() => handleSuggestionClick(text)} />
                    ))}
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="px-4 py-4 border-t border-gray-200/80 bg-[#FDFBF6]">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend(input)}
            placeholder="Ask about papers, concepts, methods..."
            className="w-full pr-14 pl-5 py-3.5 bg-white border border-gray-300/80 rounded-xl text-base text-[#1A202C] placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 shadow-sm"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={isLoading || input.trim() === ''}
            className="absolute inset-y-1.5 right-2 flex items-center justify-center w-10 h-10 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
            aria-label="Send message"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;