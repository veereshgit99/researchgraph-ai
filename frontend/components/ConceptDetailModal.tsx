import React, { useState, useEffect } from 'react';
import { Concept } from '../types';
import { TRENDING_PAPERS } from '../constants';
import CloseIcon from './icons/CloseIcon';
import GraphIcon from './icons/GraphIcon';
import SparklesIcon from './icons/SparklesIcon';

interface ConceptDetailModalProps {
  concept: Concept;
  onClose: () => void;
  onAskAI: (concept: Concept) => void;
  onViewInGraph: () => void;
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h4>
    {children}
  </div>
);

const ConceptDetailModal: React.FC<ConceptDetailModalProps> = ({ concept, onClose, onAskAI, onViewInGraph }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const relatedPapers = TRENDING_PAPERS.filter(p => p.concepts.includes(concept.name)).slice(0, 3);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isClosing ? 'animate-fade-out' : 'animate-fade-in'
      }`}
      style={{ backgroundColor: 'rgba(26, 32, 44, 0.7)' }}
      onClick={handleClose}
    >
      <div
        className={`bg-[#FDFBF6] rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden ${
          isClosing ? 'animate-scale-out' : 'animate-scale-in'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between p-6 border-b border-gray-200/80 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{concept.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Concept mentioned in {concept.paperCount.toLocaleString()} papers
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-200/80 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="p-6 overflow-y-auto">
          <DetailSection title="Recently Used By">
            <div className="space-y-3">
              {relatedPapers.length > 0 ? (
                relatedPapers.map(paper => (
                  <div key={paper.id} className="p-3 bg-white/70 rounded-lg border border-gray-200/80">
                    <p className="font-semibold text-gray-800">{paper.title}</p>
                    <p className="text-xs text-gray-500">{paper.authors.slice(0,2).join(', ')} et al. - {paper.publication}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic text-sm">No trending papers found for this concept.</p>
              )}
            </div>
          </DetailSection>
        </div>

        <footer className="flex items-center justify-end gap-3 p-4 bg-white/50 border-t border-gray-200/80 flex-shrink-0">
           <button
            onClick={onViewInGraph}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-700 bg-white border border-gray-200/90 hover:bg-gray-100/80 transition-colors"
          >
            <GraphIcon className="w-4 h-4" /> View in Graph
          </button>
           <button
            onClick={() => onAskAI(concept)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 transition-colors"
          >
            <SparklesIcon className="w-4 h-4" /> Ask AI
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConceptDetailModal;