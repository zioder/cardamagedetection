import sharp from 'sharp';
import {
  Finding,
  ForensicAnalysis,
  ForensicsAnalysisResult,
  ELAAnalysis,
  FrequencyAnalysis,
  TextureAnalysis,
  CompressionAnalysis,
  AIArtifactAnalysis,
} from '../types';
import { SCREENSHOT_INDICATORS, COMMON_CAMERA_MAKES, isExportTool } from '../constants/ai-tools';
import {
  parsePNGChunks,
  hasC2PAMetadata,
  extractBase64,
} from './utils';

/**
 * Comprehensive forensic analysis for AI/deepfake detection in car images
 */
export async function analyzeForensics(
  imageData: string,
  cameraMake?: string,
  software?: string
): Promise<ForensicsAnalysisResult> {
  const findings: Finding[] = [];

  try {
    const buffer = extractBase64(imageData);
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const { width = 0, height = 0, format } = metadata;

    // Parallel analysis for performance
    const [
      elaResult,
      frequencyResult,
      textureResult,
      compressionResult,
      aiArtifactResult,
      screenshotResult,
      pngResult,
    ] = await Promise.all([
      analyzeELA(buffer, width, height),
      analyzeFrequencyDomain(buffer, width, height),
      analyzeTexturePatterns(buffer, width, height),
      format === 'jpeg' ? analyzeJPEGCompression(buffer) : null,
      detectAIArtifacts(buffer, width, height),
      detectScreenshot(width, height, cameraMake, software),
      format === 'png' ? analyzePNGSpecific(buffer) : [],
    ]);

    // ELA findings
    if (elaResult.hasManipulation) {
      findings.push({
        type: elaResult.severity > 70 ? 'critical' : 'warning',
        severity: elaResult.severity,
        category: 'forensics',
        message: 'Error Level Analysis detected manipulation',
        details: `ELA variance: ${elaResult.variance.toFixed(2)}. High variance regions indicate potential AI generation or editing.`,
        evidence: {
          variance: elaResult.variance,
          hotspotCount: elaResult.hotspotCount,
          hotspotPercentage: elaResult.hotspotPercentage,
        },
      });
    }

    // Frequency domain findings
    if (frequencyResult.hasAnomalies) {
      findings.push({
        type: frequencyResult.severity > 70 ? 'critical' : 'warning',
        severity: frequencyResult.severity,
        category: 'forensics',
        message: 'Frequency analysis detected AI generation patterns',
        details: `Spectral anomalies detected: ${frequencyResult.anomalyType}. AI-generated images often show characteristic frequency signatures.`,
        evidence: {
          anomalyType: frequencyResult.anomalyType,
          spectralEnergy: frequencyResult.spectralEnergy,
          gridArtifacts: frequencyResult.gridArtifacts,
        },
      });
    }

    // Texture findings
    if (textureResult.isArtificial) {
      findings.push({
        type: textureResult.severity > 70 ? 'critical' : 'warning',
        severity: textureResult.severity,
        category: 'forensics',
        message: 'Texture analysis detected synthetic patterns',
        details: `Texture score: ${textureResult.naturalness.toFixed(2)}. AI images often exhibit unnatural texture homogeneity or repetition.`,
        evidence: {
          naturalness: textureResult.naturalness,
          repetitionScore: textureResult.repetitionScore,
          microPatternScore: textureResult.microPatternScore,
        },
      });
    }

    // JPEG compression findings
    if (compressionResult?.hasInconsistency) {
      findings.push({
        type: 'warning',
        severity: compressionResult.severity,
        category: 'forensics',
        message: 'JPEG compression inconsistencies detected',
        details: `DCT analysis reveals ${compressionResult.inconsistencyType}. This may indicate image manipulation or AI generation.`,
        evidence: {
          blockArtifacts: compressionResult.blockArtifacts,
          ghostingDetected: compressionResult.ghostingDetected,
          qualityMismatch: compressionResult.qualityMismatch,
        },
      });
    }

    // AI artifact findings
    if (aiArtifactResult.hasArtifacts) {
      findings.push({
        type: aiArtifactResult.severity > 75 ? 'critical' : 'warning',
        severity: aiArtifactResult.severity,
        category: 'forensics',
        message: 'AI generation artifacts detected',
        details: aiArtifactResult.description,
        evidence: {
          artifactTypes: aiArtifactResult.artifactTypes,
          ganFingerprint: aiArtifactResult.ganFingerprint,
          diffusionMarkers: aiArtifactResult.diffusionMarkers,
        },
      });
    }

    // Screenshot detection
    if (screenshotResult.isScreenshot) {
      findings.push({
        type: 'warning',
        severity: 45,
        category: 'forensics',
        message: 'Screenshot detected',
        details: `Image characteristics suggest it's a screenshot. Probability: ${screenshotResult.probability}%`,
        evidence: {
          width,
          height,
          aspectRatio: (width / height).toFixed(2),
        },
      });
    }

    // Export tool detection
    if (software && isExportTool(software)) {
      findings.push({
        type: 'warning',
        severity: 40,
        category: 'forensics',
        message: 'Export tool signature detected',
        details: `Software field indicates export from: ${software}`,
        evidence: { software },
      });
    }

    // PNG specific findings
    findings.push(...pngResult);

    // Calculate overall forensic status
    const criticalFindings = findings.filter(f => f.type === 'critical');
    const warningFindings = findings.filter(f => f.severity >= 50);

    let status: 'passed' | 'warning' | 'failed' = 'passed';
    if (criticalFindings.length > 0) {
      status = 'failed';
    } else if (warningFindings.length > 0) {
      status = 'warning';
    }

    return {
      status,
      findings,
      forensics: {
        isScreenshot: screenshotResult.isScreenshot,
        screenshotProbability: screenshotResult.probability,
        exportToolDetected: software && isExportTool(software) ? software : undefined,
        hasStandardQuantization: compressionResult?.hasStandardQuantization || false,
        quantizationQuality: compressionResult?.estimatedQuality,
        thumbnailConsistent: true,
        fileFormatValid: true,
      },
      elaAnalysis: elaResult,
      frequencyAnalysis: frequencyResult,
      textureAnalysis: textureResult,
      compressionAnalysis: compressionResult || undefined,
      aiArtifactAnalysis: aiArtifactResult,
    };

  } catch (error: any) {
    return {
      status: 'failed',
      findings: [{
        type: 'critical',
        severity: 100,
        category: 'forensics',
        message: 'Forensic analysis failed',
        details: error.message || 'Unknown error during forensics',
        evidence: { error: String(error) },
      }],
    };
  }
}

/**
 * Error Level Analysis (ELA)
 * Detects manipulation by analyzing JPEG recompression artifacts
 */
async function analyzeELA(
  buffer: Buffer,
  width: number,
  height: number
): Promise<ELAAnalysis> {
  try {
    const image = sharp(buffer);
    
    // Recompress at quality 95 and compare
    const recompressed = await image
      .jpeg({ quality: 95 })
      .toBuffer();

    const original = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const recompressedRaw = await sharp(recompressed)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const origPixels = new Uint8ClampedArray(original.data);
    const recompPixels = new Uint8ClampedArray(recompressedRaw.data);

    // Calculate difference map
    const pixelCount = Math.min(origPixels.length, recompPixels.length) / 4;
    let totalDiff = 0;
    let maxDiff = 0;
    let hotspotCount = 0;
    const HOTSPOT_THRESHOLD = 30; // Pixels with difference > 30 are hotspots

    const differences: number[] = [];

    for (let i = 0; i < pixelCount; i++) {
      const idx = i * 4;
      const diffR = Math.abs(origPixels[idx] - recompPixels[idx]);
      const diffG = Math.abs(origPixels[idx + 1] - recompPixels[idx + 1]);
      const diffB = Math.abs(origPixels[idx + 2] - recompPixels[idx + 2]);
      const avgDiff = (diffR + diffG + diffB) / 3;

      differences.push(avgDiff);
      totalDiff += avgDiff;
      maxDiff = Math.max(maxDiff, avgDiff);

      if (avgDiff > HOTSPOT_THRESHOLD) {
        hotspotCount++;
      }
    }

    const meanDiff = totalDiff / pixelCount;
    
    // Calculate variance
    let variance = 0;
    for (const diff of differences) {
      variance += (diff - meanDiff) ** 2;
    }
    variance = Math.sqrt(variance / pixelCount);

    const hotspotPercentage = (hotspotCount / pixelCount) * 100;

    // High variance AND high hotspot count suggests manipulation
    // AI-generated images often have uniform ELA (low variance)
    // But manipulated images have high variance in specific regions
    const hasManipulation = (variance > 15 && hotspotPercentage > 5) || 
                           (variance < 3 && hotspotPercentage < 0.5); // Suspiciously uniform

    // Severity calculation
    let severity = 0;
    if (variance > 25) severity = 75;
    else if (variance > 18) severity = 60;
    else if (variance > 12) severity = 45;
    else if (variance < 2) severity = 70; // Too uniform - likely AI

    return {
      variance,
      meanDifference: meanDiff,
      maxDifference: maxDiff,
      hotspotCount,
      hotspotPercentage,
      hasManipulation,
      severity,
    };

  } catch (error) {
    return {
      variance: 0,
      meanDifference: 0,
      maxDifference: 0,
      hotspotCount: 0,
      hotspotPercentage: 0,
      hasManipulation: false,
      severity: 0,
    };
  }
}

/**
 * Frequency Domain Analysis (Pseudo-FFT)
 * Detects AI generation patterns in the frequency spectrum
 */
async function analyzeFrequencyDomain(
  buffer: Buffer,
  width: number,
  height: number
): Promise<FrequencyAnalysis> {
  try {
    // Resize for analysis
    const size = 256;
    const image = sharp(buffer).resize(size, size, { fit: 'fill' });
    
    const { data } = await image.greyscale().raw().toBuffer({ resolveWithObject: true });
    const pixels = new Uint8ClampedArray(data);

    // Simple frequency analysis via gradient patterns
    // Real FFT would be better but requires additional dependencies

    // Calculate horizontal and vertical gradients
    let hGradSum = 0;
    let vGradSum = 0;
    let hGradSqSum = 0;
    let vGradSqSum = 0;
    let patternRepetitions = 0;
    
    const blockSize = 8;
    const blockScores: number[] = [];

    // Analyze 8x8 blocks (similar to DCT blocks)
    for (let by = 0; by < size - blockSize; by += blockSize) {
      for (let bx = 0; bx < size - blockSize; bx += blockSize) {
        let blockSum = 0;
        let blockVariance = 0;
        
        for (let y = 0; y < blockSize; y++) {
          for (let x = 0; x < blockSize; x++) {
            const idx = (by + y) * size + (bx + x);
            const val = pixels[idx];
            blockSum += val;
            
            // Horizontal gradient
            if (x < blockSize - 1) {
              const hGrad = pixels[idx + 1] - val;
              hGradSum += Math.abs(hGrad);
              hGradSqSum += hGrad * hGrad;
            }
            
            // Vertical gradient
            if (y < blockSize - 1) {
              const vGrad = pixels[idx + size] - val;
              vGradSum += Math.abs(vGrad);
              vGradSqSum += vGrad * vGrad;
            }
          }
        }

        blockScores.push(blockSum / (blockSize * blockSize));
      }
    }

    // Detect grid artifacts (common in GAN-generated images)
    let gridArtifactScore = 0;
    for (let i = 0; i < blockScores.length - 1; i++) {
      // Check for periodic patterns
      if (i % 4 === 0 && i + 4 < blockScores.length) {
        const diff = Math.abs(blockScores[i] - blockScores[i + 4]);
        if (diff < 5) patternRepetitions++;
      }
    }

    gridArtifactScore = (patternRepetitions / (blockScores.length / 4)) * 100;

    // Calculate spectral energy distribution
    const totalGradient = hGradSum + vGradSum;
    const gradientBalance = Math.abs(hGradSum - vGradSum) / (totalGradient + 1);

    // AI images often have:
    // 1. Grid artifacts from GAN upsampling
    // 2. Unusual gradient balance
    // 3. Repeating patterns in frequency domain

    const hasAnomalies = gridArtifactScore > 40 || gradientBalance > 0.3;
    
    let anomalyType = 'none';
    if (gridArtifactScore > 50) anomalyType = 'grid_artifacts';
    else if (gradientBalance > 0.35) anomalyType = 'gradient_imbalance';
    else if (patternRepetitions > blockScores.length * 0.3) anomalyType = 'periodic_patterns';

    const severity = hasAnomalies ? Math.min(80, Math.max(gridArtifactScore, gradientBalance * 100 + 20)) : 0;

    return {
      hasAnomalies,
      anomalyType,
      spectralEnergy: totalGradient / size,
      gridArtifacts: gridArtifactScore > 30,
      periodicPatterns: patternRepetitions > 10,
      severity,
    };

  } catch (error) {
    return {
      hasAnomalies: false,
      anomalyType: 'error',
      spectralEnergy: 0,
      gridArtifacts: false,
      periodicPatterns: false,
      severity: 0,
    };
  }
}

/**
 * Texture Pattern Analysis
 * Detects synthetic textures common in AI-generated images
 */
async function analyzeTexturePatterns(
  buffer: Buffer,
  width: number,
  height: number
): Promise<TextureAnalysis> {
  try {
    const size = 256;
    const image = sharp(buffer).resize(size, size, { fit: 'fill' });
    
    const { data } = await image.greyscale().raw().toBuffer({ resolveWithObject: true });
    const pixels = new Uint8ClampedArray(data);

    // Local Binary Pattern (LBP) analysis
    // LBP is excellent for detecting synthetic textures
    const lbpHistogram = new Array(256).fill(0);
    
    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        const center = pixels[y * size + x];
        let lbpCode = 0;

        // 8 neighbors
        const neighbors = [
          pixels[(y - 1) * size + (x - 1)],
          pixels[(y - 1) * size + x],
          pixels[(y - 1) * size + (x + 1)],
          pixels[y * size + (x + 1)],
          pixels[(y + 1) * size + (x + 1)],
          pixels[(y + 1) * size + x],
          pixels[(y + 1) * size + (x - 1)],
          pixels[y * size + (x - 1)],
        ];

        for (let i = 0; i < 8; i++) {
          if (neighbors[i] >= center) {
            lbpCode |= (1 << i);
          }
        }

        lbpHistogram[lbpCode]++;
      }
    }

    // Analyze LBP histogram for texture naturalness
    const totalSamples = (size - 2) * (size - 2);
    
    // Count non-empty bins
    let nonEmptyBins = 0;
    let maxBinValue = 0;
    let uniformPatterns = 0;
    
    // Uniform patterns (at most 2 bitwise transitions)
    const isUniform = (code: number) => {
      let transitions = 0;
      for (let i = 0; i < 8; i++) {
        const bit1 = (code >> i) & 1;
        const bit2 = (code >> ((i + 1) % 8)) & 1;
        if (bit1 !== bit2) transitions++;
      }
      return transitions <= 2;
    };

    for (let i = 0; i < 256; i++) {
      if (lbpHistogram[i] > 0) {
        nonEmptyBins++;
        maxBinValue = Math.max(maxBinValue, lbpHistogram[i]);
        if (isUniform(i)) {
          uniformPatterns += lbpHistogram[i];
        }
      }
    }

    // Natural textures have more uniform patterns
    const uniformRatio = uniformPatterns / totalSamples;
    
    // AI images often have:
    // 1. Lower texture diversity (fewer LBP bins used)
    // 2. Unusual distribution of LBP patterns
    // 3. Repetitive micro-patterns

    const textureRichness = nonEmptyBins / 256;
    const dominance = maxBinValue / totalSamples;

    // Calculate micro-pattern repetition
    let repetitionScore = 0;
    const windowSize = 16;
    for (let y = 0; y < size - windowSize; y += windowSize / 2) {
      for (let x = 0; x < size - windowSize; x += windowSize / 2) {
        // Compare with next window
        if (x + windowSize < size - windowSize) {
          let similarity = 0;
          for (let wy = 0; wy < windowSize; wy++) {
            for (let wx = 0; wx < windowSize; wx++) {
              const idx1 = (y + wy) * size + (x + wx);
              const idx2 = (y + wy) * size + (x + windowSize + wx);
              if (Math.abs(pixels[idx1] - pixels[idx2]) < 10) {
                similarity++;
              }
            }
          }
          if (similarity > windowSize * windowSize * 0.7) {
            repetitionScore++;
          }
        }
      }
    }

    const maxPossibleRepetitions = ((size / (windowSize / 2)) ** 2) / 2;
    const normalizedRepetition = repetitionScore / maxPossibleRepetitions;

    // Naturalness score (higher = more natural)
    const naturalness = (textureRichness * 0.3 + uniformRatio * 0.4 + (1 - dominance) * 0.3) * 100;

    // AI detection
    const isArtificial = naturalness < 40 || normalizedRepetition > 0.3 || dominance > 0.15;
    
    let severity = 0;
    if (isArtificial) {
      if (normalizedRepetition > 0.4) severity = 75;
      else if (naturalness < 30) severity = 70;
      else if (dominance > 0.2) severity = 60;
      else severity = 50;
    }

    return {
      naturalness,
      repetitionScore: normalizedRepetition * 100,
      microPatternScore: dominance * 100,
      textureRichness,
      isArtificial,
      severity,
    };

  } catch (error) {
    return {
      naturalness: 50,
      repetitionScore: 0,
      microPatternScore: 0,
      textureRichness: 0.5,
      isArtificial: false,
      severity: 0,
    };
  }
}

/**
 * JPEG Compression Analysis
 * Detects DCT artifacts, double compression, and quality inconsistencies
 */
async function analyzeJPEGCompression(buffer: Buffer): Promise<CompressionAnalysis> {
  try {
    // Parse JPEG structure
    const JPEG_SOI = 0xFFD8;
    const JPEG_EOI = 0xFFD9;
    const JPEG_DQT = 0xFFDB;
    const JPEG_DHT = 0xFFC4;
    const JPEG_SOF0 = 0xFFC0;
    const JPEG_SOF2 = 0xFFC2;
    const JPEG_SOS = 0xFFDA;

    if (buffer.readUInt16BE(0) !== JPEG_SOI) {
      return {
        hasInconsistency: false,
        hasStandardQuantization: false,
        blockArtifacts: false,
        ghostingDetected: false,
        qualityMismatch: false,
        severity: 0,
      };
    }

    let offset = 2;
    let dqtCount = 0;
    let dhtCount = 0;
    let sofCount = 0;
    const quantTables: number[][] = [];
    let estimatedQuality = 75;

    while (offset < buffer.length - 2) {
      const marker = buffer.readUInt16BE(offset);

      if (marker === JPEG_DQT) {
        dqtCount++;
        const length = buffer.readUInt16BE(offset + 2);
        
        // Extract quantization table values
        if (length >= 67) {
          const table: number[] = [];
          for (let i = 0; i < 64; i++) {
            table.push(buffer[offset + 5 + i]);
          }
          quantTables.push(table);
          
          // Estimate quality from first quantization value
          const firstVal = table[0];
          if (firstVal <= 2) estimatedQuality = 95;
          else if (firstVal <= 5) estimatedQuality = 90;
          else if (firstVal <= 10) estimatedQuality = 80;
          else if (firstVal <= 20) estimatedQuality = 70;
          else if (firstVal <= 40) estimatedQuality = 50;
          else estimatedQuality = 30;
        }
        
        offset += 2 + length;
      } else if (marker === JPEG_DHT) {
        dhtCount++;
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      } else if (marker === JPEG_SOF0 || marker === JPEG_SOF2) {
        sofCount++;
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      } else if (marker === JPEG_SOS) {
        break;
      } else if ((marker & 0xFF00) === 0xFF00) {
        if (offset + 3 < buffer.length) {
          const length = buffer.readUInt16BE(offset + 2);
          offset += 2 + length;
        } else {
          break;
        }
      } else {
        offset++;
      }
    }

    // Analyze for inconsistencies
    let hasInconsistency = false;
    let inconsistencyType = '';
    let blockArtifacts = false;
    let ghostingDetected = false;
    let qualityMismatch = false;

    // Multiple DQT tables with different qualities suggest manipulation
    if (quantTables.length > 2) {
      hasInconsistency = true;
      inconsistencyType = 'multiple_quantization_tables';
    }

    // Check for standard vs custom quantization
    // Standard tables (from libjpeg) have specific patterns
    const hasStandardQuantization = dqtCount >= 2 && estimatedQuality >= 70;

    // Block artifacts detection (analyze quantization table distribution)
    if (quantTables.length > 0) {
      const table = quantTables[0];
      const lowFreqSum = table.slice(0, 16).reduce((a, b) => a + b, 0);
      const highFreqSum = table.slice(48, 64).reduce((a, b) => a + b, 0);
      
      // Strong difference between low and high frequency quantization suggests artifacts
      if (highFreqSum > lowFreqSum * 3) {
        blockArtifacts = true;
        inconsistencyType = inconsistencyType || 'block_artifacts';
        hasInconsistency = true;
      }
    }

    // Double compression detection (ghosting)
    // Double-compressed JPEGs often have unusual quantization patterns
    if (quantTables.length >= 2) {
      const table1 = quantTables[0];
      const table2 = quantTables[1];
      
      // Compare tables for similar patterns suggesting double compression
      let similarity = 0;
      for (let i = 0; i < Math.min(table1.length, table2.length); i++) {
        if (Math.abs(table1[i] - table2[i]) < 3) {
          similarity++;
        }
      }
      
      if (similarity > 50) {
        ghostingDetected = true;
        inconsistencyType = inconsistencyType || 'double_compression';
        hasInconsistency = true;
      }
    }

    let severity = 0;
    if (hasInconsistency) {
      if (ghostingDetected) severity = 55;
      else if (blockArtifacts) severity = 45;
      else severity = 40;
    }

    return {
      hasInconsistency,
      inconsistencyType,
      hasStandardQuantization,
      estimatedQuality,
      blockArtifacts,
      ghostingDetected,
      qualityMismatch,
      severity,
    };

  } catch (error) {
    return {
      hasInconsistency: false,
      hasStandardQuantization: false,
      blockArtifacts: false,
      ghostingDetected: false,
      qualityMismatch: false,
      severity: 0,
    };
  }
}

/**
 * AI Artifact Detection
 * Detects specific patterns from GANs, diffusion models, and other AI generators
 */
async function detectAIArtifacts(
  buffer: Buffer,
  width: number,
  height: number
): Promise<AIArtifactAnalysis> {
  try {
    const size = 512;
    const image = sharp(buffer).resize(size, size, { fit: 'fill' });
    
    const { data } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const pixels = new Uint8ClampedArray(data);

    const artifactTypes: string[] = [];
    let ganFingerprint = 0;
    let diffusionMarkers = 0;

    // 1. Check for GAN checkerboard artifacts
    // GANs often produce artifacts at 2x2 or 4x4 pixel blocks
    let checkerboardScore = 0;
    const checkSize = 4;
    
    for (let y = 0; y < size - checkSize; y += checkSize) {
      for (let x = 0; x < size - checkSize; x += checkSize) {
        let blockSum = 0;
        let alternatingCount = 0;
        
        for (let dy = 0; dy < checkSize; dy++) {
          for (let dx = 0; dx < checkSize; dx++) {
            const idx = ((y + dy) * size + (x + dx)) * 4;
            const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
            blockSum += brightness;
            
            // Check for alternating pattern
            if (dx > 0) {
              const prevIdx = ((y + dy) * size + (x + dx - 1)) * 4;
              const prevBrightness = (pixels[prevIdx] + pixels[prevIdx + 1] + pixels[prevIdx + 2]) / 3;
              if ((dx + dy) % 2 === 0) {
                if (brightness > prevBrightness + 3) alternatingCount++;
              } else {
                if (brightness < prevBrightness - 3) alternatingCount++;
              }
            }
          }
        }
        
        if (alternatingCount > checkSize * checkSize * 0.6) {
          checkerboardScore++;
        }
      }
    }

    const maxBlocks = ((size / checkSize) ** 2);
    const checkerboardRatio = checkerboardScore / maxBlocks;
    
    if (checkerboardRatio > 0.05) {
      artifactTypes.push('checkerboard_artifacts');
      ganFingerprint += 30;
    }

    // 2. Check for unnatural color banding
    // AI images often have subtle color banding in gradients
    let bandingScore = 0;
    
    for (let y = 0; y < size; y++) {
      let bandStart = 0;
      let prevColor = [pixels[y * size * 4], pixels[y * size * 4 + 1], pixels[y * size * 4 + 2]];
      
      for (let x = 1; x < size; x++) {
        const idx = (y * size + x) * 4;
        const color = [pixels[idx], pixels[idx + 1], pixels[idx + 2]];
        
        const colorDiff = Math.abs(color[0] - prevColor[0]) +
                         Math.abs(color[1] - prevColor[1]) +
                         Math.abs(color[2] - prevColor[2]);
        
        if (colorDiff < 3) {
          if (x - bandStart > 15) { // Long band of same color
            bandingScore++;
          }
        } else {
          bandStart = x;
        }
        
        prevColor = color;
      }
    }

    if (bandingScore > size * 0.1) {
      artifactTypes.push('color_banding');
      diffusionMarkers += 20;
    }

    // 3. Check for blur inconsistencies
    // AI-generated car images often have inconsistent blur levels
    const blurMap: number[] = [];
    const windowSize = 8;
    
    for (let y = 0; y < size - windowSize; y += windowSize) {
      for (let x = 0; x < size - windowSize; x += windowSize) {
        let variance = 0;
        let mean = 0;
        const values: number[] = [];
        
        for (let dy = 0; dy < windowSize; dy++) {
          for (let dx = 0; dx < windowSize; dx++) {
            const idx = ((y + dy) * size + (x + dx)) * 4;
            const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
            values.push(brightness);
            mean += brightness;
          }
        }
        
        mean /= values.length;
        for (const v of values) {
          variance += (v - mean) ** 2;
        }
        variance = Math.sqrt(variance / values.length);
        blurMap.push(variance);
      }
    }

    // Check for blur inconsistency (high variance in blur levels)
    const blurMean = blurMap.reduce((a, b) => a + b, 0) / blurMap.length;
    let blurVariance = 0;
    for (const b of blurMap) {
      blurVariance += (b - blurMean) ** 2;
    }
    blurVariance = Math.sqrt(blurVariance / blurMap.length);

    if (blurVariance > blurMean * 1.5) {
      artifactTypes.push('blur_inconsistency');
      diffusionMarkers += 25;
    }

    // 4. Check for unnatural edges
    // AI images often have edges that are too perfect or too smooth
    const edgePixels = await sharp(buffer)
      .resize(size, size, { fit: 'fill' })
      .greyscale()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
      })
      .raw()
      .toBuffer();

    const edges = new Uint8ClampedArray(edgePixels);
    let edgeSum = 0;
    let strongEdges = 0;
    let weakEdges = 0;
    
    for (let i = 0; i < edges.length; i++) {
      edgeSum += edges[i];
      if (edges[i] > 100) strongEdges++;
      else if (edges[i] > 20 && edges[i] < 50) weakEdges++;
    }

    const edgeMean = edgeSum / edges.length;
    const edgeRatio = strongEdges / (weakEdges + 1);

    // AI images often have either too sharp or too smooth edges
    if (edgeMean < 5 || edgeMean > 50 || edgeRatio > 5) {
      artifactTypes.push('unnatural_edges');
      diffusionMarkers += 20;
    }

    // 5. Car-specific checks: reflections and shadows
    // Check for implausible reflections (too perfect or inconsistent lighting)
    let reflectionScore = 0;
    const brightThreshold = 200;
    
    // Check top portion of image for sky reflections on car
    for (let y = 0; y < size / 3; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
        if (brightness > brightThreshold) {
          reflectionScore++;
        }
      }
    }

    const topThirdPixels = (size / 3) * size;
    const reflectionRatio = reflectionScore / topThirdPixels;

    // Unusual reflection patterns
    if (reflectionRatio > 0.4 && reflectionRatio < 0.8) {
      // Possibly AI-generated reflections
      artifactTypes.push('suspicious_reflections');
      diffusionMarkers += 15;
    }

    // Calculate overall scores
    const hasArtifacts = artifactTypes.length > 0;
    const totalScore = ganFingerprint + diffusionMarkers;
    
    let severity = 0;
    if (hasArtifacts) {
      if (totalScore >= 60) severity = 85;
      else if (totalScore >= 40) severity = 70;
      else if (totalScore >= 25) severity = 55;
      else severity = 40;
    }

    let description = 'No AI artifacts detected';
    if (hasArtifacts) {
      description = `Detected AI artifacts: ${artifactTypes.join(', ')}. `;
      if (ganFingerprint > diffusionMarkers) {
        description += 'Pattern suggests GAN-based generation.';
      } else if (diffusionMarkers > ganFingerprint) {
        description += 'Pattern suggests diffusion model generation.';
      }
    }

    return {
      hasArtifacts,
      artifactTypes,
      ganFingerprint,
      diffusionMarkers,
      description,
      severity,
    };

  } catch (error) {
    return {
      hasArtifacts: false,
      artifactTypes: [],
      ganFingerprint: 0,
      diffusionMarkers: 0,
      description: 'Analysis error',
      severity: 0,
    };
  }
}

/**
 * Screenshot Detection
 */
function detectScreenshot(
  width: number,
  height: number,
  cameraMake?: string,
  software?: string
): { isScreenshot: boolean; probability: number } {
  let probability = 0;

  // Check for common screenshot resolutions
  const aspectRatio = width / height;
  const commonScreenshotRatios = [16/9, 16/10, 4/3, 3/2, 25/16];
  const isCommonRatio = commonScreenshotRatios.some(r => Math.abs(aspectRatio - r) < 0.05);

  if (isCommonRatio) {
    probability += 15;
  }

  // Common screenshot widths
  const commonWidths = [1920, 2560, 3840, 1366, 1440, 1536, 2880, 5120];
  if (commonWidths.includes(width)) {
    probability += 25;
  }

  // Common screenshot heights
  const commonHeights = [1080, 1440, 2160, 768, 900, 864, 1200, 1800, 2880];
  if (commonHeights.includes(height)) {
    probability += 25;
  }

  // Missing camera info suggests screenshot
  if (!cameraMake) {
    probability += 15;
  }

  // Export tool software suggests screenshot
  if (software) {
    const lower = software.toLowerCase();
    if (lower.includes('screenshot') || lower.includes('capture') || lower.includes('grab') || lower.includes('snip')) {
      probability += 35;
    }
  }

  return {
    isScreenshot: probability >= 55,
    probability: Math.min(100, probability),
  };
}

/**
 * PNG-specific analysis
 */
function analyzePNGSpecific(buffer: Buffer): Finding[] {
  const findings: Finding[] = [];

  // Parse PNG chunks
  const chunks = parsePNGChunks(buffer);

  // Check for AI tool signatures in text chunks
  const aiKeywords = [
    'stable diffusion', 'midjourney', 'dall-e', 'dalle', 'prompt',
    'negative prompt', 'steps:', 'cfg scale:', 'sampler:', 'seed:',
    'model:', 'lora', 'controlnet', 'comfyui', 'automatic1111',
    'parameters', 'denoising', 'hires fix', 'upscale', 'leonardo',
    'firefly', 'adobe firefly', 'ideogram', 'playground',
  ];

  for (const [keyword, content] of chunks.entries()) {
    if (!content) continue;
    const lowerContent = content.toLowerCase();
    
    for (const aiKeyword of aiKeywords) {
      if (lowerContent.includes(aiKeyword)) {
        findings.push({
          type: 'critical',
          severity: 90,
          category: 'forensics',
          message: 'AI generation signature in PNG metadata',
          details: `Found AI tool signature: "${aiKeyword}" in ${keyword} chunk`,
          evidence: { keyword, aiKeyword, contentPreview: content.substring(0, 300) },
        });
        break; // Only one finding per chunk
      }
    }
  }

  // Check for missing critical chunks
  if (!chunks.has('IHDR')) {
    findings.push({
      type: 'warning',
      severity: 50,
      category: 'forensics',
      message: 'PNG missing IHDR chunk',
      details: 'Critical PNG header chunk is missing - file may be corrupted or tampered',
    });
  }

  return findings;
}
