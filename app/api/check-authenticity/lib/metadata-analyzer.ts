import piexif from 'piexifjs';
import {
  Finding,
  CameraInfo,
  GPSInfo,
  TimestampAnalysis,
  AISignature,
  MetadataAnalysisResult,
} from '../types';
import { detectAITool, isExportTool, PNG_AI_CHUNK_KEYWORDS, C2PA_AI_ASSERTIONS } from '../constants/ai-tools';
import {
  parseEXIFDate,
  parseGPSTimestamp,
  isImagePNG,
  isImageJPEG,
  extractBase64,
  parsePNGChunks,
  hasC2PAMetadata,
  getSeverityLevel,
} from './utils';

export async function analyzeMetadata(imageData: string): Promise<MetadataAnalysisResult> {
  const findings: Finding[] = [];
  const aiSignatures: AISignature[] = [];
  const isPNG = isImagePNG(imageData);
  const isJPEG = isImageJPEG(imageData);

  let cameraInfo: CameraInfo | undefined;
  let gpsInfo: GPSInfo | undefined;
  let timestamps: TimestampAnalysis | undefined;
  let hasEXIF = false;
  let hasGPS = false;

  try {
    const buffer = extractBase64(imageData);

    // EXIF Analysis
    if (isJPEG) {
      try {
        const exifObj = piexif.load(imageData);
        hasEXIF = true;

        const zeroTh = exifObj['0th'] || {};
        const exif = exifObj['Exif'] || {};
        const gps = exifObj['GPS'] || {};

        // Camera Information
        const make = zeroTh[piexif.ImageIFD.Make];
        const model = zeroTh[piexif.ImageIFD.Model];
        const software = zeroTh[piexif.ImageIFD.Software];
        const lensModel = exif[piexif.ExifIFD.LensModel];

        cameraInfo = {
          make,
          model,
          software,
          lensModel,
          orientation: zeroTh[piexif.ImageIFD.Orientation],
          xResolution: zeroTh[piexif.ImageIFD.XResolution],
          yResolution: zeroTh[piexif.ImageIFD.YResolution],
        };

        // Check for AI tools in software field
        if (software) {
          const aiDetection = detectAITool(software);
          if (aiDetection.detected) {
            const signature: AISignature = {
              tool: aiDetection.tool,
              toolType: aiDetection.type as any,
              confidence: 95,
              evidence: `Software field contains: "${software}"`,
            };
            aiSignatures.push(signature);

            findings.push({
              type: 'critical',
              severity: 100,
              category: 'ai-signature',
              message: `AI generation software detected: ${aiDetection.tool}`,
              details: `Software metadata field contains known AI tool signature`,
              evidence: aiDetection,
            });
          }

          // Check for export tools
          if (isExportTool(software)) {
            findings.push({
              type: 'warning',
              severity: 50,
              category: 'metadata',
              message: 'Export tool detected',
              details: `Image appears to be exported from: ${software}`,
              evidence: { software },
            });
          }
        }

        // Check for camera make
        if (!make) {
          findings.push({
            type: 'warning',
            severity: 40,
            category: 'metadata',
            message: 'Missing camera manufacturer information',
            details: 'No hardware signature detected. Image may be a screenshot, export, or edited.',
          });
        }

        // Check for GPS and extract coordinates
        const gpsLatitude = gps[piexif.GPSIFD.GPSLatitude];
        const gpsLongitude = gps[piexif.GPSIFD.GPSLongitude];
        const gpsLatitudeRef = gps[piexif.GPSIFD.GPSLatitudeRef];
        const gpsLongitudeRef = gps[piexif.GPSIFD.GPSLongitudeRef];
        const gpsAltitude = gps[piexif.GPSIFD.GPSAltitude];
        
        hasGPS = !!(gpsLatitude && gpsLongitude);

        if (hasGPS) {
          // Convert GPS coordinates from DMS to decimal degrees
          const lat = convertDMSToDecimal(gpsLatitude, gpsLatitudeRef);
          const lng = convertDMSToDecimal(gpsLongitude, gpsLongitudeRef);
          
          gpsInfo = {
            latitude: lat,
            longitude: lng,
            altitude: gpsAltitude ? gpsAltitude[0] / gpsAltitude[1] : undefined,
            latitudeRef: gpsLatitudeRef,
            longitudeRef: gpsLongitudeRef,
          };
        } else {
          findings.push({
            type: 'warning',
            severity: 30,
            category: 'metadata',
            message: 'Missing GPS location data',
            details: 'No geolocation information found in metadata',
          });
        }

        // Timestamp Analysis
        const timestampAnalysis = analyzeTimestamps(zeroTh, exif, gps);
        if (timestampAnalysis.inconsistencies.length > 0) {
          timestamps = timestampAnalysis;
          findings.push(...timestampAnalysis.inconsistencies);
        }

      } catch (exifError) {
        findings.push({
          type: 'warning',
          severity: 35,
          category: 'metadata',
          message: 'Unable to parse EXIF metadata',
          details: 'EXIF structure may be corrupted or missing',
          evidence: { error: String(exifError) },
        });
      }
    } else {
      // PNG specific analysis
      findings.push({
        type: 'info',
        severity: 15,
        category: 'metadata',
        message: 'PNG format - limited EXIF support',
        details: 'PNG files may have embedded metadata in text chunks',
      });

      // Parse PNG chunks
      const pngChunks = parsePNGChunks(buffer);

      // Check for AI-related text chunks
      for (const [keyword, content] of pngChunks.entries()) {
        const lowerContent = content.toLowerCase();

        for (const aiKeyword of PNG_AI_CHUNK_KEYWORDS) {
          if (lowerContent.includes(aiKeyword)) {
            findings.push({
              type: 'critical',
              severity: 100,
              category: 'ai-signature',
              message: 'AI generation parameters detected in PNG chunks',
              details: `Found AI-related keyword "${aiKeyword}" in ${keyword} chunk`,
              evidence: { keyword, aiKeyword, content: content.substring(0, 200) },
            });

            aiSignatures.push({
              tool: 'Unknown PNG-based AI tool',
              toolType: 'diffusion',
              confidence: 90,
              evidence: `PNG ${keyword} chunk contains: ${aiKeyword}`,
            });
            break;
          }
        }
      }

      // Check C2PA/JUMBF
      if (hasC2PAMetadata(buffer)) {
        findings.push({
          type: 'warning',
          severity: 45,
          category: 'metadata',
          message: 'C2PA/JUMBF metadata detected',
          details: 'Content Credentials present - may indicate AI generation or digital watermarking',
        });
      }

      if (!hasEXIF) {
        findings.push({
          type: 'warning',
          severity: 35,
          category: 'metadata',
          message: 'No EXIF metadata found',
          details: 'PNG has no embedded EXIF data. May be a screenshot or edited image',
        });
      }
    }

    // Determine overall status
    const hasCriticalAI = findings.some(f => f.type === 'critical' && f.category === 'ai-signature');
    const hasWarnings = findings.some(f => f.severity >= 40);

    return {
      status: hasCriticalAI ? 'failed' : (hasWarnings ? 'warning' : 'passed'),
      findings,
      cameraInfo,
      gpsInfo,
      timestamps,
      aiSignatures,
      hasEXIF,
      hasGPS,
    };

  } catch (error: any) {
    return {
      status: 'failed',
      findings: [{
        type: 'critical',
        severity: 100,
        category: 'metadata',
        message: 'Metadata analysis failed',
        details: error.message || 'Unknown error during metadata extraction',
        evidence: { error: String(error) },
      }],
      hasEXIF: false,
      hasGPS: false,
    };
  }
}

/**
 * Convert GPS coordinates from DMS (degrees, minutes, seconds) to decimal degrees
 */
function convertDMSToDecimal(dms: any, ref: string): number | undefined {
  if (!dms || !Array.isArray(dms) || dms.length < 3) return undefined;
  
  try {
    // DMS format: [[degrees, 1], [minutes, 1], [seconds, 100]]
    const degrees = dms[0][0] / dms[0][1];
    const minutes = dms[1][0] / dms[1][1];
    const seconds = dms[2][0] / dms[2][1];
    
    let decimal = degrees + (minutes / 60) + (seconds / 3600);
    
    // Apply direction (S and W are negative)
    if (ref === 'S' || ref === 'W') {
      decimal = -decimal;
    }
    
    return Math.round(decimal * 1000000) / 1000000; // 6 decimal places
  } catch {
    return undefined;
  }
}

function analyzeTimestamps(
  zeroTh: any,
  exif: any,
  gps: any
): TimestampAnalysis {
  const inconsistencies: Finding[] = [];

  const exifDateTimeOriginal = parseEXIFDate(exif?.[piexif.ExifIFD.DateTimeOriginal]);
  const exifDateTimeDigitized = parseEXIFDate(exif?.[piexif.ExifIFD.DateTimeDigitized]);
  const exifDateTime = parseEXIFDate(zeroTh?.[piexif.ImageIFD.DateTime]);

  const gpsDateStr = gps?.[piexif.GPSIFD.GPSDateStamp];
  const gpsTimeStr = gps?.[piexif.GPSIFD.GPSTimeStamp];
  const gpsTimestamp = parseGPSTimestamp(gpsDateStr, gpsTimeStr);

  const timestampAnalysis: TimestampAnalysis = {
    exifDateTimeOriginal: exifDateTimeOriginal || undefined,
    exifDateTimeDigitized: exifDateTimeDigitized || undefined,
    exifDateTime: exifDateTime || undefined,
    gpsTimestamp: gpsTimestamp || undefined,
    inconsistencies,
  };

  // Check timestamp inconsistencies
  if (exifDateTimeOriginal && exifDateTimeDigitized) {
    const diff = Math.abs(exifDateTimeOriginal.getTime() - exifDateTimeDigitized.getTime());
    if (diff > 60000) { // More than 1 minute difference
      inconsistencies.push({
        type: 'warning',
        severity: 25,
        category: 'metadata',
        message: 'Timestamp inconsistency detected',
        details: `DateTimeOriginal and DateTimeDigitized differ by ${Math.round(diff / 1000)} seconds`,
        evidence: {
          original: exifDateTimeOriginal.toISOString(),
          digitized: exifDateTimeDigitized.toISOString(),
          difference: diff,
        },
      });
    }
  }

  // Check for future timestamps
  const now = new Date();
  if (exifDateTimeOriginal && exifDateTimeOriginal > now) {
    inconsistencies.push({
      type: 'warning',
      severity: 40,
      category: 'metadata',
      message: 'Future timestamp detected',
      details: `DateTimeOriginal is in the future: ${exifDateTimeOriginal.toISOString()}`,
      evidence: { timestamp: exifDateTimeOriginal.toISOString() },
    });
  }

  // Check GPS timestamp consistency
  if (gpsTimestamp && exifDateTimeOriginal) {
    const diff = Math.abs(gpsTimestamp.getTime() - exifDateTimeOriginal.getTime());
    if (diff > 30000) { // More than 30 seconds
      inconsistencies.push({
        type: 'warning',
        severity: 20,
        category: 'metadata',
        message: 'GPS timestamp mismatch',
        details: `GPS timestamp differs from EXIF timestamp by ${Math.round(diff / 1000)} seconds`,
        evidence: {
          gpsTime: gpsTimestamp.toISOString(),
          exifTime: exifDateTimeOriginal.toISOString(),
          difference: diff,
        },
      });
    }
  }

  return timestampAnalysis;
}
