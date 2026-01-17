export interface Finding {
  type: 'critical' | 'warning' | 'info';
  severity: number; // 0-100
  category: 'metadata' | 'statistics' | 'forensics' | 'ai-signature';
  message: string;
  details?: string;
  evidence?: any;
}

export interface CameraInfo {
  make?: string;
  model?: string;
  software?: string;
  lensModel?: string;
  orientation?: number;
  xResolution?: number;
  yResolution?: number;
}

export interface GPSInfo {
  latitude?: number;
  longitude?: number;
  altitude?: number;
  latitudeRef?: string;
  longitudeRef?: string;
}

export interface TimestampAnalysis {
  fileCreated?: Date;
  fileModified?: Date;
  exifDateTimeOriginal?: Date;
  exifDateTimeDigitized?: Date;
  exifDateTime?: Date;
  gpsTimestamp?: Date;
  inconsistencies: Finding[];
}

export interface AISignature {
  tool?: string;
  toolType?: 'diffusion' | 'generative' | 'editing' | 'export';
  confidence: number;
  evidence: string;
}

export interface ChannelStats {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  median: number;
}

export interface StatisticalAnalysis {
  red: ChannelStats;
  green: ChannelStats;
  blue: ChannelStats;
  overallBrightness: number;
  overallContrast: number;
  saturation: number;
}

export interface NoiseAnalysis {
  spatialCorrelation: number;
  noiseVariance: number;
  uniformity: number;
  isAISignature: boolean;
  confidence: number;
}

export interface ColorHistogram {
  r: number[];
  g: number[];
  b: number[];
  colorRichness: number;
  isUniform: boolean;
  isAISignature: boolean;
  confidence: number;
}

export interface EdgeAnalysis {
  density: number; // percentage
  distribution: 'uniform' | 'natural' | 'artificial';
  isAISignature: boolean;
  confidence: number;
}

// ============================================
// NEW: Enhanced Forensic Analysis Types
// ============================================

/**
 * Error Level Analysis (ELA) results
 * Detects manipulation by analyzing recompression artifacts
 */
export interface ELAAnalysis {
  variance: number;
  meanDifference: number;
  maxDifference: number;
  hotspotCount: number;
  hotspotPercentage: number;
  hasManipulation: boolean;
  severity: number;
}

/**
 * Frequency domain analysis results
 * Detects AI patterns in image spectrum
 */
export interface FrequencyAnalysis {
  hasAnomalies: boolean;
  anomalyType: string;
  spectralEnergy: number;
  gridArtifacts: boolean;
  periodicPatterns: boolean;
  severity: number;
}

/**
 * Texture pattern analysis results
 * Detects synthetic/artificial textures
 */
export interface TextureAnalysis {
  naturalness: number; // 0-100, higher is more natural
  repetitionScore: number;
  microPatternScore: number;
  textureRichness: number;
  isArtificial: boolean;
  severity: number;
}

/**
 * JPEG compression analysis results
 * Detects DCT artifacts and double compression
 */
export interface CompressionAnalysis {
  hasInconsistency: boolean;
  inconsistencyType?: string;
  hasStandardQuantization: boolean;
  estimatedQuality?: number;
  blockArtifacts: boolean;
  ghostingDetected: boolean;
  qualityMismatch: boolean;
  severity: number;
}

/**
 * AI artifact detection results
 * Detects GAN/diffusion model fingerprints
 */
export interface AIArtifactAnalysis {
  hasArtifacts: boolean;
  artifactTypes: string[];
  ganFingerprint: number;
  diffusionMarkers: number;
  description: string;
  severity: number;
}

// ============================================
// Original Forensic Analysis Types
// ============================================

export interface ForensicAnalysis {
  isScreenshot: boolean;
  screenshotProbability: number;
  exportToolDetected?: string;
  hasStandardQuantization: boolean;
  quantizationQuality?: number;
  thumbnailConsistent: boolean;
  fileFormatValid: boolean;
}

export interface MetadataAnalysisResult {
  status: 'passed' | 'warning' | 'failed';
  findings: Finding[];
  cameraInfo?: CameraInfo;
  timestamps?: TimestampAnalysis;
  aiSignatures?: AISignature[];
  gpsInfo?: GPSInfo;
  hasEXIF: boolean;
  hasGPS: boolean;
}

export interface StatisticalAnalysisResult {
  status: 'passed' | 'warning' | 'failed';
  findings: Finding[];
  channelStats?: StatisticalAnalysis;
  noiseAnalysis?: NoiseAnalysis;
  colorHistogram?: ColorHistogram;
  edgeAnalysis?: EdgeAnalysis;
}

/**
 * Enhanced forensics analysis result with AI detection
 */
export interface ForensicsAnalysisResult {
  status: 'passed' | 'warning' | 'failed';
  findings: Finding[];
  forensics?: ForensicAnalysis;
  // New enhanced analysis results
  elaAnalysis?: ELAAnalysis;
  frequencyAnalysis?: FrequencyAnalysis;
  textureAnalysis?: TextureAnalysis;
  compressionAnalysis?: CompressionAnalysis;
  aiArtifactAnalysis?: AIArtifactAnalysis;
}

export interface DetailedVerificationResult {
  status: 'VERIFIED' | 'RISKY' | 'REJECTED';
  confidence: number; // 0-100
  riskScore: number; // 0-100
  processingTime: number; // milliseconds

  analysis: {
    metadata: MetadataAnalysisResult;
    statistics: StatisticalAnalysisResult;
    forensics: ForensicsAnalysisResult;
  };

  summary: {
    totalFindings: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    recommendation: string;
  };

  // New: Detailed AI detection summary
  aiDetection?: {
    isLikelyAI: boolean;
    confidence: number;
    detectionMethods: string[];
    primaryIndicators: string[];
  };
}

export interface VerificationRequest {
  image: string; // Base64 data URL
}
