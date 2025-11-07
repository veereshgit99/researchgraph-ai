
import React from 'react';
import { Page } from '../types';
import SearchIcon from './icons/SearchIcon';
import GraphIcon from './icons/GraphIcon';
import SparklesIcon from './icons/SparklesIcon';

interface HeaderProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const NavButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 ${
        isActive
          ? 'bg-[#1A202C] text-white shadow-lg'
          : 'text-gray-500 hover:bg-gray-200/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ activePage, setActivePage }) => {
  return (
    <header className="fixed top-4 md:top-6 z-50">
      <nav className="flex items-center gap-2 p-2 bg-white/70 backdrop-blur-xl rounded-full shadow-md border border-gray-200/80">
        <NavButton
          label="Search"
          icon={<SearchIcon />}
          isActive={activePage === 'search'}
          onClick={() => setActivePage('search')}
        />
        <NavButton
          label="Graph"
          icon={<GraphIcon />}
          isActive={activePage === 'graph'}
          onClick={() => setActivePage('graph')}
        />
        <NavButton
          label="Assistant"
          icon={<SparklesIcon />}
          isActive={activePage === 'assistant'}
          onClick={() => setActivePage('assistant')}
        />
      </nav>
    </header>
  );
};

export default Header;
