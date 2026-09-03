export interface SampleImage {
  id: string;
  title: string;
  category: 'AI Generated' | 'Authentic DSLR' | 'Filtered / Beautified' | 'AI Spliced';
  description: string;
  url: string;
  expectedVerdict: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'sample-ai-portrait',
    title: 'AI Synthetic Portrait',
    category: 'AI Generated',
    description: 'Hyper-realistic face generated with modern diffusion (Midjourney v6 / Flux). Features subtle iris specular mismatch and synthetic skin smoothing.',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    expectedVerdict: 'AI Generated (~94% Confidence)'
  },
  {
    id: 'sample-dslr-nature',
    title: 'Authentic DSLR Photography',
    category: 'Authentic DSLR',
    description: 'Captured with optical sensor (Canon EOS 5D Mark IV), natural optical depth of field, uniform Bayer sensor PRNU noise, and consistent lighting geometry.',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    expectedVerdict: 'Authentic (~96% Confidence)'
  },
  {
    id: 'sample-filtered-selfie',
    title: 'Heavily Filtered Portrait',
    category: 'Filtered / Beautified',
    description: 'Authentic camera capture subjected to extreme bilateral skin smoothing, artificial vibrance boosting, and computational eye sharpening filters.',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    expectedVerdict: 'Heavily Filtered (~88% Filter Confidence)'
  },
  {
    id: 'sample-ai-landscape',
    title: 'Diffusion Surreal Landscape',
    category: 'AI Generated',
    description: 'Complex atmospheric synthetic scene exhibiting impossible perspective horizons, repetition in foliage fractals, and uniform deconvolution noise.',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80',
    expectedVerdict: 'AI Generated (~91% Confidence)'
  }
];
