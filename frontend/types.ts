
export type Page = 'search' | 'graph' | 'assistant';

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  publication: string;
  abstract: string;
  concepts: string[];
  metrics: string[];
  dataset: string;
  models: string[];
  pdfUrl: string;
  arxivUrl: string;
}

export interface Concept {
  id: string;
  name: string;
  paperCount: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'paper' | 'concept' | 'method';
  x: number;
  y: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
}