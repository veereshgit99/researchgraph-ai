import React from 'react';
import { Paper } from '../types';
import ConceptChip from './ConceptChip';

interface PaperCardProps {
  paper: Paper;
  onClick: () => void;
  onConceptClick: (conceptName: string) => void;
}

const PaperCard: React.FC<PaperCardProps> = ({ paper, onClick, onConceptClick }) => {
  
  const handleChipClick = (e: React.MouseEvent, conceptName: string) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    onConceptClick(conceptName);
  };

  return (
    <div 
      onClick={onClick}
      className="cursor-pointer bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{paper.title}</h3>
      <p className="text-sm text-gray-500 mb-3">{paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''} - <span className="font-medium text-gray-600">{paper.publication}</span></p>
      <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-2 flex-grow">{paper.abstract}</p>
      <div className="flex flex-wrap gap-2 mt-auto">
        {paper.concepts.slice(0, 4).map(concept => (
          <ConceptChip key={concept} name={concept} onClick={(e) => handleChipClick(e, concept)} />
        ))}
      </div>
    </div>
  );
};

export default PaperCard;