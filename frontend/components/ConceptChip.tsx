import React from 'react';

interface ConceptChipProps {
  name: string;
  // FIX: Updated onClick prop to accept a MouseEvent to match the event handler signature from the DOM.
  onClick?: (event: React.MouseEvent<HTMLSpanElement>) => void;
}

const ConceptChip: React.FC<ConceptChipProps> = ({ name, onClick }) => {
  const isClickable = !!onClick;
  return (
    <span 
      onClick={onClick}
      className={`bg-blue-100/70 text-blue-800 text-xs font-medium px-3 py-1 rounded-full hover:bg-blue-200 transition-colors duration-200 ${isClickable ? 'cursor-pointer' : ''}`}
    >
      {name}
    </span>
  );
};

export default ConceptChip;