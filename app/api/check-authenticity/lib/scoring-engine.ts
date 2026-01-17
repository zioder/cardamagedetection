import {
  Finding,
  MetadataAnalysisResult,
  ForensicsAnalysisResult,
  DetailedVerificationResult,
} from '../types';
import { calculateConfidence } from './utils';

/**
 * Score all analysis results and determine final verification status
 * Uses forensic and metadata analysis
 */
export function scoreResults(
  metadata: MetadataAnalysisResult,
  forensics: ForensicsAnalysisResult
): DetailedVerificationResult {
  const allFindings = [
    ...metadata.findings,
    ...forensics.findings,
  ];

  // Count severity types
  const criticalFindings = allFindings.filter(f => f.type === 'critical');
  const warningFindings = allFindings.filter(f => f.type === 'warning');
  const infoFindings = allFindings.filter(f => f.type === 'info');

  const criticalCount = criticalFindings.length;
  const warningCount = warningFindings.length;
  const infoCount = infoFindings.length;

  // Calculate comprehensive risk score
  const riskScore = calculateRiskScore(metadata, forensics);

  // Determine AI detection status
  const aiDetection = detectAIGeneration(metadata, forensics);

  // Determine final status
  let status: 'VERIFIED' | 'RISKY' | 'REJECTED';
  let confidence = 50;

  // Priority 1: High confidence AI detection
  if (aiDetection.isLikelyAI && aiDetection.confidence >= 75) {
    status = 'REJECTED';
    confidence = aiDetection.confidence;
  }
  // Priority 2: Critical findings in ai-signature category
  else if (criticalCount > 0 && criticalFindings.some(f => f.category === 'ai-signature')) {
    status = 'REJECTED';
    confidence = calculateConfidence(90, [10], []);
  }
  // Priority 3: High risk score
  else if (riskScore >= 70) {
    status = 'RISKY';
    confidence = calculateConfidence(riskScore, [15], [-10]);
  }
  // Priority 4: Moderate risk or AI detection with lower confidence
  else if (riskScore >= 45 || (aiDetection.isLikelyAI && aiDetection.confidence >= 50)) {
    status = 'RISKY';
    confidence = calculateConfidence(riskScore, [10], [-5]);
  }
  // Default: Verified
  else {
    status = 'VERIFIED';
    const positiveFactors: number[] = [];
    if (metadata.hasGPS) positiveFactors.push(15);
    if (metadata.hasEXIF) positiveFactors.push(10);
    if (metadata.cameraInfo?.make) positiveFactors.push(10);
    confidence = calculateConfidence(30, positiveFactors, []);
  }

  // Generate recommendation
  const recommendation = generateRecommendation(
    status,
    metadata,
    forensics,
    aiDetection
  );

  return {
    status,
    confidence: Math.round(confidence),
    riskScore: Math.round(riskScore),
    processingTime: 0, // Will be set by caller

    analysis: {
      metadata,
      statistics: { status: 'passed', findings: [] }, // Empty placeholder
      forensics,
    },

    summary: {
      totalFindings: allFindings.length,
      criticalCount,
      warningCount,
      infoCount,
      recommendation,
    },

    aiDetection,
  };
}

/**
 * Calculate comprehensive risk score from all analysis modules
 */
function calculateRiskScore(
  metadata: MetadataAnalysisResult,
  forensics: ForensicsAnalysisResult
): number {
  let score = 0;
  const weights = {
    forensics: 1.0,     // Forensic analysis (highest priority)
    aiSignature: 0.95,  // AI signatures in metadata
    metadata: 0.6,      // Metadata issues
  };

  // 1. Forensic Analysis Signals (most important)
  if (forensics.elaAnalysis?.hasManipulation) {
    score += forensics.elaAnalysis.severity * weights.forensics;
  }

  if (forensics.frequencyAnalysis?.hasAnomalies) {
    score += forensics.frequencyAnalysis.severity * weights.forensics;
  }

  if (forensics.textureAnalysis?.isArtificial) {
    score += forensics.textureAnalysis.severity * weights.forensics;
  }

  if (forensics.compressionAnalysis?.hasInconsistency) {
    score += forensics.compressionAnalysis.severity * weights.forensics * 0.8;
  }

  if (forensics.aiArtifactAnalysis?.hasArtifacts) {
    // AI artifacts are very strong indicators
    score += forensics.aiArtifactAnalysis.severity * weights.forensics * 1.3;
  }

  // 2. AI signatures in metadata
  if (metadata.aiSignatures && metadata.aiSignatures.length > 0) {
    score += 85 * weights.aiSignature;
  }

  // 3. Critical findings from all categories
  for (const finding of metadata.findings) {
    if (finding.type === 'critical' && finding.category === 'ai-signature') {
      score += finding.severity * weights.aiSignature;
    } else if (finding.type === 'warning') {
      score += finding.severity * 0.4;
    }
  }

  // 4. Forensics findings (from finding list)
  for (const finding of forensics.findings) {
    if (finding.type === 'critical') {
      score += finding.severity * weights.forensics;
    } else if (finding.type === 'warning') {
      score += finding.severity * 0.5;
    }
  }

  // 5. Screenshot detection
  if (forensics.forensics?.isScreenshot) {
    score += 40;
  }

  // 6. Export tool detection
  if (forensics.forensics?.exportToolDetected) {
    score += 35;
  }

  // POSITIVE FACTORS (reduce risk)

  // Authentic camera signatures reduce risk significantly
  if (metadata.hasEXIF) {
    score -= 15;
  }

  if (metadata.hasGPS) {
    score -= 15;
  }

  if (metadata.cameraInfo?.make && metadata.cameraInfo?.model) {
    score -= 20;
  }

  // Natural texture patterns reduce risk
  if (forensics.textureAnalysis && forensics.textureAnalysis.naturalness > 70) {
    score -= 15;
  }

  // Low ELA variance with no hotspots is good
  if (forensics.elaAnalysis &&
    !forensics.elaAnalysis.hasManipulation &&
    forensics.elaAnalysis.variance < 10) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Determine if image is likely AI-generated based on all signals
 */
function detectAIGeneration(
  metadata: MetadataAnalysisResult,
  forensics: ForensicsAnalysisResult
): {
  isLikelyAI: boolean;
  confidence: number;
  detectionMethods: string[];
  primaryIndicators: string[];
} {
  const detectionMethods: string[] = [];
  const primaryIndicators: string[] = [];
  let totalScore = 0;
  let methodCount = 0;

  // 1. Metadata AI signatures (strongest signal)
  if (metadata.aiSignatures && metadata.aiSignatures.length > 0) {
    detectionMethods.push('metadata_signatures');
    for (const sig of metadata.aiSignatures) {
      primaryIndicators.push(`AI tool: ${sig.tool}`);
      totalScore += sig.confidence;
      methodCount++;
    }
  }

  // 2. ELA analysis
  if (forensics.elaAnalysis?.hasManipulation && forensics.elaAnalysis.severity >= 50) {
    detectionMethods.push('error_level_analysis');
    primaryIndicators.push(`ELA variance: ${forensics.elaAnalysis.variance.toFixed(1)}`);
    totalScore += forensics.elaAnalysis.severity;
    methodCount++;
  }

  // 3. Frequency analysis
  if (forensics.frequencyAnalysis?.hasAnomalies) {
    detectionMethods.push('frequency_analysis');
    primaryIndicators.push(`Spectral anomaly: ${forensics.frequencyAnalysis.anomalyType}`);
    totalScore += forensics.frequencyAnalysis.severity;
    methodCount++;
  }

  // 4. Texture analysis
  if (forensics.textureAnalysis?.isArtificial) {
    detectionMethods.push('texture_analysis');
    primaryIndicators.push(`Texture naturalness: ${forensics.textureAnalysis.naturalness.toFixed(1)}%`);
    totalScore += forensics.textureAnalysis.severity;
    methodCount++;
  }

  // 5. AI artifact detection (very strong signal)
  if (forensics.aiArtifactAnalysis?.hasArtifacts) {
    detectionMethods.push('artifact_detection');
    for (const artifact of forensics.aiArtifactAnalysis.artifactTypes.slice(0, 3)) {
      primaryIndicators.push(`Artifact: ${artifact.replace(/_/g, ' ')}`);
    }
    totalScore += forensics.aiArtifactAnalysis.severity * 1.2; // Weight this higher
    methodCount++;
  }

  // 6. JPEG compression anomalies
  if (forensics.compressionAnalysis?.hasInconsistency) {
    detectionMethods.push('compression_analysis');
    primaryIndicators.push(`Compression issue: ${forensics.compressionAnalysis.inconsistencyType}`);
    totalScore += forensics.compressionAnalysis.severity;
    methodCount++;
  }

  // Calculate weighted confidence
  const confidence = methodCount > 0 ? totalScore / methodCount : 0;

  // Multiple detection methods increase confidence
  const multiplier = 1 + (Math.min(methodCount, 5) * 0.08);
  const adjustedConfidence = Math.min(100, confidence * multiplier);

  // Require at least 2 detection methods for high confidence AI detection
  // Or 1 method with very high confidence (metadata signatures)
  const isLikelyAI: boolean = (methodCount >= 2 && adjustedConfidence >= 55) ||
    (methodCount >= 3 && adjustedConfidence >= 45) ||
    (metadata.aiSignatures && metadata.aiSignatures.length > 0 && adjustedConfidence >= 70) ||
    false;

  return {
    isLikelyAI,
    confidence: Math.round(adjustedConfidence),
    detectionMethods,
    primaryIndicators: primaryIndicators.slice(0, 5), // Top 5 indicators
  };
}

/**
 * Generate human-readable recommendation
 */
function generateRecommendation(
  status: 'VERIFIED' | 'RISKY' | 'REJECTED',
  metadata: MetadataAnalysisResult,
  forensics: ForensicsAnalysisResult,
  aiDetection?: {
    isLikelyAI: boolean;
    confidence: number;
    detectionMethods: string[];
    primaryIndicators: string[];
  }
): string {
  if (status === 'REJECTED') {
    // Compile reasons for rejection
    const reasons: string[] = [];

    if (aiDetection?.isLikelyAI) {
      reasons.push(`AI generation detected with ${aiDetection.confidence}% confidence`);
      if (aiDetection.primaryIndicators.length > 0) {
        reasons.push(aiDetection.primaryIndicators[0]);
      }
    }

    if (metadata.aiSignatures && metadata.aiSignatures.length > 0) {
      const tools = metadata.aiSignatures.map(s => s.tool).filter(Boolean).join(', ');
      if (tools) {
        reasons.push(`AI tool signatures: ${tools}`);
      }
    }

    if (forensics.aiArtifactAnalysis?.hasArtifacts) {
      reasons.push(forensics.aiArtifactAnalysis.description);
    }

    if (forensics.elaAnalysis?.hasManipulation) {
      reasons.push('Image manipulation detected via ELA');
    }

    const reasonText = reasons.slice(0, 2).join('. ');
    return `REJECTED: ${reasonText}. This image appears to be AI-generated or heavily manipulated and cannot be used for authentic car damage assessment.`;
  }

  if (status === 'RISKY') {
    const concerns: string[] = [];

    if (aiDetection?.isLikelyAI) {
      concerns.push('potential AI generation');
    }
    if (!metadata.hasEXIF) {
      concerns.push('missing camera metadata');
    }
    if (!metadata.hasGPS) {
      concerns.push('no location data');
    }
    if (forensics.elaAnalysis?.hasManipulation) {
      concerns.push('editing detected');
    }
    if (forensics.textureAnalysis?.isArtificial) {
      concerns.push('synthetic textures');
    }
    if (forensics.aiArtifactAnalysis?.hasArtifacts) {
      concerns.push('AI artifacts');
    }
    if (forensics.frequencyAnalysis?.hasAnomalies) {
      concerns.push('frequency anomalies');
    }
    if (forensics.forensics?.isScreenshot) {
      concerns.push('screenshot detected');
    }

    const concernText = concerns.slice(0, 4).join(', ') || 'authenticity concerns';
    return `RISKY: Image has ${concernText}. Proceed with caution - manual verification recommended before processing damage claim.`;
  }

  // VERIFIED
  const positiveFactors: string[] = [];

  if (metadata.hasEXIF) positiveFactors.push('valid camera metadata');
  if (metadata.hasGPS) positiveFactors.push('GPS location verified');
  if (metadata.cameraInfo?.make && metadata.cameraInfo?.model) {
    positiveFactors.push(`${metadata.cameraInfo.make} ${metadata.cameraInfo.model} signature`);
  }
  if (forensics.textureAnalysis && forensics.textureAnalysis.naturalness > 70) {
    positiveFactors.push('natural texture patterns');
  }
  if (forensics.elaAnalysis && !forensics.elaAnalysis.hasManipulation) {
    positiveFactors.push('consistent compression');
  }

  if (positiveFactors.length > 0) {
    return `VERIFIED: Image appears authentic (${positiveFactors.slice(0, 3).join(', ')}). Safe to proceed with car damage analysis.`;
  }

  return `VERIFIED: No AI generation or manipulation signatures detected. Safe to proceed with car damage analysis.`;
}
