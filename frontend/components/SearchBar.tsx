
import React from 'react';
import SearchIcon from './icons/SearchIcon';

interface SearchBarProps {
  placeholder: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ placeholder }) => {
  return (
    <div className="relative w-full max-w-2xl">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <SearchIcon className="text-gray-400" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-full text-lg text-[#1A202C] placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow duration-300 shadow-sm focus:shadow-lg"
      />
    </div>
  );
};

export default SearchBar;
