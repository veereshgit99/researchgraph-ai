import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import PaperCard from '../components/PaperCard';
import { TRENDING_PAPERS, TRENDING_CONCEPTS } from '../constants';
import { Paper, Concept, Page } from '../types';
import PaperDetailModal from '../components/PaperDetailModal';
import ConceptDetailModal from '../components/ConceptDetailModal';

interface SearchPageProps {
  setActivePage: (page: Page) => void;
  setInitialPrompt: (prompt: string) => void;
}

const SearchPage: React.FC<SearchPageProps> = ({ setActivePage, setInitialPrompt }) => {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);

  const handleConceptClick = (conceptName: string) => {
    const conceptData = TRENDING_CONCEPTS.find(c => c.name === conceptName);
    if (conceptData) {
      setSelectedConcept(conceptData);
    }
  };

  const handleAskAboutPaper = (paper: Paper) => {
    setInitialPrompt(`Tell me more about the paper: "${paper.title}"`);
    setSelectedPaper(null);
    setActivePage('assistant');
  };

  const handleAskAboutConcept = (concept: Concept) => {
    setInitialPrompt(`Explain the concept of "${concept.name}" in detail.`);
    setSelectedConcept(null);
    setActivePage('assistant');
  };

  const handleViewInGraph = () => {
    setSelectedPaper(null);
    setSelectedConcept(null);
    setActivePage('graph');
  };

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-4 animate-fade-in pb-10">
        <div className="text-center pt-24 pb-16">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1A202C] mb-4">
            AI Research Explorer
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Discover and connect across papers, concepts, and methods in the AI/ML landscape.
          </p>
        </div>
        
        <div className="mb-16 flex justify-center">
          <SearchBar placeholder="Search any paper, concept, method..." />
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">Trending Papers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRENDING_PAPERS.map(paper => (
              <PaperCard key={paper.id} paper={paper} onClick={() => setSelectedPaper(paper)} onConceptClick={handleConceptClick} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-8 text-gray-800">Popular Concepts</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {TRENDING_CONCEPTS.map(concept => (
              <div 
                key={concept.id} 
                onClick={() => handleConceptClick(concept.name)}
                className="cursor-pointer bg-white/60 p-4 rounded-xl border border-gray-200/80 w-full hover:shadow-lg hover:border-blue-300 transition-all duration-300 transform hover:scale-105"
              >
                <div className="font-semibold text-gray-800">{concept.name}</div>
                <div className="text-sm text-gray-500">{concept.paperCount.toLocaleString()} papers</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedPaper && (
        <PaperDetailModal 
          paper={selectedPaper} 
          onClose={() => setSelectedPaper(null)} 
          onConceptClick={handleConceptClick}
          onAskAI={handleAskAboutPaper}
          onViewInGraph={handleViewInGraph}
        />
      )}
      {selectedConcept && (
        <ConceptDetailModal 
          concept={selectedConcept}
          onClose={() => setSelectedConcept(null)}
          onAskAI={handleAskAboutConcept}
          onViewInGraph={handleViewInGraph}
        />
      )}
    </>
  );
};

export default SearchPage;