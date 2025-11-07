
import { Paper, Concept, GraphNode, GraphEdge } from './types';

export const TRENDING_PAPERS: Paper[] = [
  {
    id: '1',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Łukasz Kaiser', 'Illia Polosukhin'],
    publication: 'NeurIPS 2017',
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks, including an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature. We show that the Transformer generalizes well to other tasks by applying it successfully to English constituency parsing both with large and limited training data.',
    concepts: ['Transformer', 'Self-Attention', 'NLP', 'Machine Translation'],
    metrics: ['BLEU Score', 'Perplexity'],
    dataset: 'WMT 2014',
    models: ['Transformer (base)', 'Transformer (big)'],
    pdfUrl: 'https://arxiv.org/pdf/1706.03762.pdf',
    arxivUrl: 'https://arxiv.org/abs/1706.03762',
  },
  {
    id: '2',
    title: 'Generative Adversarial Networks',
    authors: ['Ian J. Goodfellow', 'Jean Pouget-Abadie', 'Mehdi Mirza', 'Bing Xu', 'David Warde-Farley', 'Sherjil Ozair', 'Aaron Courville', 'Yoshua Bengio'],
    publication: 'NeurIPS 2014',
    abstract: 'We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models: a generative model G that captures the data distribution, and a discriminative model D that estimates the probability that a sample came from the training data rather than G. The training procedure for G is to maximize the probability of D making a mistake. This framework corresponds to a minimax two-player game. In the space of arbitrary functions G and D, a unique solution exists, with G recovering the training data distribution and D equal to 1/2 everywhere. In the case where G and D are defined by multilayer perceptrons, the entire system can be trained with backpropagation. There is no need for any Markov chains or unrolled approximate inference networks during either training or generation of samples. Experiments demonstrate the potential of the framework through qualitative and quantitative evaluation of the generated samples.',
    concepts: ['GAN', 'Generative Models', 'Computer Vision', 'Adversarial Training'],
    metrics: ['Inception Score', 'Fréchet Inception Distance'],
    dataset: 'MNIST, CIFAR-10',
    models: ['GAN', 'DCGAN'],
    pdfUrl: 'https://arxiv.org/pdf/1406.2661.pdf',
    arxivUrl: 'https://arxiv.org/abs/1406.2661',
  },
  {
    id: '3',
    title: 'Deep Residual Learning for Image Recognition',
    authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
    publication: 'CVPR 2016',
    abstract: 'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions. We provide comprehensive empirical evidence showing that these residual networks are easier to optimize, and can gain accuracy from considerably increased depth. On the ImageNet dataset we evaluate residual nets with a depth of up to 152 layers---8x deeper than VGG nets but still having lower complexity. An ensemble of these residual nets achieves 3.57% error on the ImageNet test set. This result won the 1st place on the ILSVRC 2015 classification task. We also present analysis on CIFAR-10 with 100 and 1000 layers.',
    concepts: ['ResNet', 'Deep Learning', 'Image Recognition', 'Residual Connection'],
    metrics: ['Top-1 Accuracy', 'Top-5 Accuracy'],
    dataset: 'ImageNet, CIFAR-10',
    models: ['ResNet-50', 'ResNet-101', 'ResNet-152'],
    pdfUrl: 'https://arxiv.org/pdf/1512.03385.pdf',
    arxivUrl: 'https://arxiv.org/abs/1512.03385',
  },
];

export const TRENDING_CONCEPTS: Concept[] = [
  { id: 'c1', name: 'Diffusion Models', paperCount: 1204 },
  { id: 'c2', name: 'Self-Supervised Learning', paperCount: 987 },
  { id: 'c3', name: 'Graph Neural Networks', paperCount: 852 },
  { id: 'c4', name: 'Reinforcement Learning', paperCount: 1530 },
  { id: 'c5', name: 'Multi-modal Learning', paperCount: 765 },
  { id: 'c6', name: 'Federated Learning', paperCount: 642 },
];

export const GRAPH_NODES: GraphNode[] = [
    { id: '1', label: 'Attention Is All You Need', type: 'paper', x: 200, y: 300 },
    { id: 'c1', label: 'Transformer', type: 'concept', x: 450, y: 200 },
    { id: 'c2', label: 'Self-Attention', type: 'concept', x: 450, y: 400 },
    { id: 'm1', label: 'BERT', type: 'paper', x: 700, y: 300 },
    { id: '2', label: 'Generative Adversarial Networks', type: 'paper', x: 200, y: 600 },
    { id: 'c3', label: 'GAN', type: 'concept', x: 450, y: 600 },
];

export const GRAPH_EDGES: GraphEdge[] = [
    { source: '1', target: 'c1' },
    { source: '1', target: 'c2' },
    { source: 'm1', target: 'c1' },
    { source: '2', target: 'c3' },
    { source: 'c3', target: 'm1' }
];