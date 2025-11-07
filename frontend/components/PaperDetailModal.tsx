import React, { useState, useEffect } from 'react';
import { Paper } from '../types';
import ConceptChip from './ConceptChip';
import CloseIcon from './icons/CloseIcon';
import ExternalLinkIcon from './icons/ExternalLinkIcon';
import GraphIcon from './icons/GraphIcon';
import SparklesIcon from './icons/SparklesIcon';

interface PaperDetailModalProps {
  paper: Paper;
  onClose: () => void;
  onConceptClick: (conceptName: string) => void;
  onAskAI: (paper: Paper) => void;
  onViewInGraph: () => void;
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h4>
    {children}
  </div>
);

const PaperDetailModal: React.FC<PaperDetailModalProps> = ({ paper, onClose, onConceptClick, onAskAI, onViewInGraph }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200); // Match animation duration
  };

  // Handle Escape key press
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

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isClosing ? 'animate-fade-out' : 'animate-fade-in'
      }`}
      style={{ backgroundColor: 'rgba(26, 32, 44, 0.7)' }}
      onClick={handleClose}
    >
      <div
        className={`bg-[#FDFBF6] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden ${
          isClosing ? 'animate-scale-out' : 'animate-scale-in'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between p-6 border-b border-gray-200/80 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{paper.title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {paper.authors.join(', ')} - <span className="font-medium text-gray-700">{paper.publication}</span>
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
          <DetailSection title="Abstract">
            <p className="text-gray-700 leading-relaxed">{paper.abstract}</p>
          </DetailSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <DetailSection title="Concepts">
              <div className="flex flex-wrap gap-2">
                {paper.concepts.map((concept) => (
                  <ConceptChip key={concept} name={concept} onClick={() => onConceptClick(concept)} />
                ))}
              </div>
            </DetailSection>

            <DetailSection title="Dataset">
              <p className="text-gray-800 font-medium">{paper.dataset}</p>
            </DetailSection>

            <DetailSection title="Metrics">
              <div className="flex flex-wrap gap-2">
                {paper.metrics.map((metric) => (
                  <span key={metric} className="bg-gray-200/70 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                    {metric}
                  </span>
                ))}
              </div>
            </DetailSection>

            <DetailSection title="Models">
              <div className="flex flex-wrap gap-2">
                {paper.models.map((model) => (
                  <span key={model} className="bg-green-100/70 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                    {model}
                  </span>
                ))}
              </div>
            </DetailSection>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 p-4 bg-white/50 border-t border-gray-200/80 flex-shrink-0">
           <div className="flex items-center gap-3">
             <button
              onClick={onViewInGraph}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-700 bg-white border border-gray-200/90 hover:bg-gray-100/80 transition-colors"
            >
              <GraphIcon className="w-4 h-4" /> View in Graph
            </button>
             <button
              onClick={() => onAskAI(paper)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-700 bg-white border border-gray-200/90 hover:bg-gray-100/80 transition-colors"
            >
              <SparklesIcon className="w-4 h-4" /> Ask AI
            </button>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={paper.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-700 bg-gray-200/70 hover:bg-gray-300/80 transition-colors"
            >
              View PDF <ExternalLinkIcon />
            </a>
            <a
              href={paper.arxivUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 transition-colors"
            >
              View on ArXiv <ExternalLinkIcon />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PaperDetailModal;