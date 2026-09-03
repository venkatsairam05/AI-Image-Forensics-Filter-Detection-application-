export interface BoundingZone {
  x: number; // 0 - 100 percentage from left
  y: number; // 0 - 100 percentage from top
  width: number; // 0 - 100 percentage width
  height: number; // 0 - 100 percentage height
  label: string;
  category: 'anatomy' | 'texture' | 'lighting' | 'frequency' | 'geometry' | 'artifact';
}

export interface AIMarker {
  id: string;
  category: 'anatomy' | 'texture' | 'lighting' | 'frequency' | 'geometry' | 'coherence' | 'artifact';
  name: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  evidence: string;
  boundingZone?: BoundingZone;
}

export interface FilterDetection {
  id: string;
  name: string;
  detected: boolean;
  confidence: number; // 0 - 100
  estimatedIntensity: string;
  details: string;
  type: 'beauty_smoothing' | 'saturation_color' | 'sharpening' | 'vignette_contrast' | 'bokeh_blur' | 'compression_artifact' | 'other';
}

export interface TechnicalMetrics {
  elaDiscrepancy: string;
  noiseConsistency: string;
  frequencyArtifacts: string;
  chromaticLighting: string;
  metadataInspection: {
    hasExif: boolean;
    softwareTag?: string;
    dimensions?: string;
    colorSpace?: string;
    cameraModel?: string;
    notes: string;
  };
  recommendations: string[];
}

export interface ForensicResult {
  overallScore: number; // 0 - 100 AI generation confidence percentage
  verdict: 'AI_GENERATED' | 'HIGHLY_SUSPICIOUS' | 'LIKELY_AUTHENTIC' | 'AUTHENTIC' | 'HEAVILY_FILTERED';
  verdictConfidence: number; // 0 - 100
  verdictSummary: string;
  detectedModelFamily: string; // e.g. "Flux / Midjourney / Stable Diffusion", "Mobile Computational", "Authentic Camera"
  scoresBreakdown: {
    aiProbability: number;
    authenticityConfidence: number;
    manipulationConfidence: number;
    filterConfidence: number;
  };
  aiMarkers: AIMarker[];
  filtersDetected: FilterDetection[];
  technicalMetrics: TechnicalMetrics;
  analyzedAt: string;
  imageInfo: {
    filename: string;
    fileSizeBytes: number;
    dimensions: {
      width: number;
      height: number;
    };
    aspectRatio: string;
  };
}

export type ForensicViewMode = 'original' | 'overlay' | 'ela' | 'noise' | 'saturation' | 'gradient' | 'split';
