export function getSeverityLevel(score: number): 'critical' | 'warning' | 'info' {
  if (score >= 75) return 'critical';
  if (score >= 40) return 'warning';
  return 'info';
}

export function calculateConfidence(
  baseScore: number,
  positiveFactors: number[],
  negativeFactors: number[]
): number {
  let score = baseScore;

  for (const factor of positiveFactors) {
    score += factor;
  }

  for (const factor of negativeFactors) {
    score -= factor;
  }

  return Math.max(0, Math.min(100, score));
}

export function formatDate(date: Date): string {
  if (!date) return 'N/A';
  return date.toISOString();
}

export function parseEXIFDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  try {
    // EXIF date format: "2024:01:15 14:30:45"
    const parts = dateStr.split(' ');
    if (parts.length !== 2) return null;

    const dateParts = parts[0].split(':');
    if (dateParts.length !== 3) return null;

    const timeParts = parts[1].split(':');
    if (timeParts.length !== 3) return null;

    return new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
      parseInt(timeParts[0]),
      parseInt(timeParts[1]),
      parseInt(timeParts[2])
    );
  } catch {
    return null;
  }
}

export function parseGPSTimestamp(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null;

  try {
    // GPS date: "2024:01:15", GPS time: "14:30:45"
    const dateParts = dateStr.split(':');
    const timeParts = timeStr.split(':');

    return new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
      parseInt(timeParts[0]),
      parseInt(timeParts[1]),
      parseInt(timeParts[2])
    );
  } catch {
    return null;
  }
}

export function isImagePNG(data: string): boolean {
  return data.startsWith('data:image/png');
}

export function isImageJPEG(data: string): boolean {
  return data.startsWith('data:image/jpeg') || data.startsWith('data:image/jpg');
}

export function extractBase64(dataUrl: string): Buffer {
  const matches = dataUrl.match(/^data:image\/[a-z]+;base64,(.+)$/);
  if (!matches || !matches[1]) {
    throw new Error('Invalid data URL');
  }

  return Buffer.from(matches[1], 'base64');
}

export function parsePNGChunks(buffer: Buffer): Map<string, string> {
  const chunks = new Map<string, string>();
  const signature = buffer.subarray(0, 8);

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  if (!signature.equals(PNG_SIGNATURE)) {
    return chunks;
  }

  let offset = 8;
  let textContent: string | undefined;

  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const chunkData = buffer.subarray(offset + 8, offset + 8 + length);
    const crc = buffer.readUInt32BE(offset + 8 + length);

    // Parse text chunks
    if (type === 'tEXt' || type === 'zTXt' || type === 'iTXt') {
      try {
        let chunkText: string | undefined;
        if (type === 'iTXt') {
          // iTXt: keyword + null separator + compressed flag + compression method + language tag + translated keyword + null + text
          const nullIdx1 = chunkData.indexOf(0x00);
          const nullIdx2 = chunkData.indexOf(0x00, nullIdx1 + 1);
          const nullIdx3 = chunkData.indexOf(0x00, nullIdx2 + 1);
          if (nullIdx3 > 0) {
            const compressed = chunkData[nullIdx2 + 1];
            chunkText = chunkData.subarray(nullIdx3 + 1).toString('utf-8');
          }
        } else if (type === 'zTXt') {
          // zTXt: keyword + null separator + compressed text
          const nullIdx = chunkData.indexOf(0x00);
          if (nullIdx > 0) {
            const compressedData = chunkData.subarray(nullIdx + 1);
            chunkText = compressedData.toString('utf-8');
          }
        } else {
          // tEXt: keyword + null separator + text
          const nullIdx = chunkData.indexOf(0x00);
          if (nullIdx > 0) {
            const keyword = chunkData.subarray(0, nullIdx).toString('ascii');
            chunkText = chunkData.subarray(nullIdx + 1).toString('latin1');
            chunks.set(keyword.toLowerCase(), chunkText);
          }
        }

        if (chunkText) {
          textContent = chunkText;
        }
      } catch {
        // Skip invalid chunks
      }
    }

    // IEND chunk marks end of file
    if (type === 'IEND') break;

    offset += 12 + length;
  }

  if (textContent) {
    chunks.set('tEXt', textContent);
  }

  return chunks;
}

export function hasC2PAMetadata(buffer: Buffer): boolean {
  // Check for JUMBF or C2PA related boxes in JPEG APP markers
  const APP13_MARKER = 0xFFED;
  const JUMBF_BOX = Buffer.from('jumb', 'ascii');

  let offset = 2;
  while (offset + 2 < buffer.length) {
    if (buffer[offset] === 0xFF && buffer[offset + 1] === APP13_MARKER) {
      const length = buffer.readUInt16BE(offset + 2);
      if (offset + 4 + length > buffer.length) break;

      const markerData = buffer.subarray(offset + 4, offset + 4 + length);
      if (markerData.includes(JUMBF_BOX)) {
        return true;
      }
      offset += 4 + length;
    } else {
      offset++;
    }
  }

  return false;
}
