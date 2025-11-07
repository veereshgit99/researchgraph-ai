import React, { useState } from 'react';
import Header from './components/Header';
import SearchPage from './pages/SearchPage';
import GraphPage from './pages/GraphPage';
import AssistantPage from './pages/AssistantPage';
import { Page } from './types';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('search');
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState<string>('');

  const handlePromptConsumed = () => {
    setAssistantInitialPrompt('');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'search':
        return <SearchPage setActivePage={setActivePage} setInitialPrompt={setAssistantInitialPrompt} />;
      case 'graph':
        return <GraphPage />;
      case 'assistant':
        return <AssistantPage initialPrompt={assistantInitialPrompt} onPromptConsumed={handlePromptConsumed} />;
      default:
        return <SearchPage setActivePage={setActivePage} setInitialPrompt={setAssistantInitialPrompt} />;
    }
  };

  return (
    <div className="h-screen bg-[#FDFBF6] text-[#1A202C] flex flex-col items-center">
      <Header activePage={activePage} setActivePage={setActivePage} />
      <main className="w-full h-full flex-grow flex flex-col items-center">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;