/**
 * phash.ts — 64-bit DCT-based Perceptual Hash (pHash) implementation for Expo / React Native.
 * 
 * 1. Resizes image to 32x32 pixels via expo-image-manipulator.
 * 2. Decodes base64 PNG into a 32x32 grayscale matrix.
 * 3. Computes 2D Discrete Cosine Transform (DCT) on the 32x32 matrix.
 * 4. Extracts top-left 8x8 low frequencies.
 * 5. Thresholds 64 coefficients against the mean AC value to produce a 64-bit hash.
 * 6. Compares hashes via Hamming distance (distance <= 3 corresponds to >95% similarity).
 */

import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Convert base64 string to Uint8Array.
 */
function base64ToByteArray(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  let len = base64.length;
  if (base64.endsWith('=')) len--;
  if (base64.endsWith('=')) len--;

  const bytes = new Uint8Array(Math.floor((len * 3) / 4));
  let p = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const b0 = lookup[base64.charCodeAt(i)];
    const b1 = lookup[base64.charCodeAt(i + 1)];
    const b2 = lookup[base64.charCodeAt(i + 2)];
    const b3 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (b0 << 2) | (b1 >> 4);
    if (p < bytes.length) bytes[p++] = ((b1 & 15) << 4) | (b2 >> 2);
    if (p < bytes.length) bytes[p++] = ((b2 & 3) << 6) | (b3 & 63);
  }
  return bytes;
}

/**
 * Minimal BitReader for DEFLATE decompression.
 */
class BitReader {
  private bytes: Uint8Array;
  private bytePos = 0;
  private bitPos = 0;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  readBit(): number {
    if (this.bytePos >= this.bytes.length) return 0;
    const bit = (this.bytes[this.bytePos] >> this.bitPos) & 1;
    this.bitPos++;
    if (this.bitPos === 8) {
      this.bitPos = 0;
      this.bytePos++;
    }
    return bit;
  }

  readBits(count: number): number {
    let res = 0;
    for (let i = 0; i < count; i++) {
      res |= this.readBit() << i;
    }
    return res;
  }

  alignToByte(): void {
    if (this.bitPos > 0) {
      this.bitPos = 0;
      this.bytePos++;
    }
  }

  readBytes(count: number): Uint8Array {
    this.alignToByte();
    const slice = this.bytes.subarray(this.bytePos, this.bytePos + count);
    this.bytePos += count;
    return slice;
  }

  get pos(): number {
    return this.bytePos;
  }
}

/**
 * Lightweight Zlib DEFLATE uncompressor (RFC 1951).
 */
function inflateZlib(data: Uint8Array): Uint8Array {
  // Skip 2-byte Zlib header
  let offset = 2;
  const reader = new BitReader(data.subarray(offset));

  const outChunks: Uint8Array[] = [];
  let isFinal = 0;

  while (!isFinal) {
    isFinal = reader.readBits(1);
    const blockType = reader.readBits(2);

    if (blockType === 0) {
      // Uncompressed block
      reader.alignToByte();
      const len = reader.readBits(16);
      const nlen = reader.readBits(16);
      const raw = reader.readBytes(len);
      outChunks.push(raw);
    } else if (blockType === 1 || blockType === 2) {
      // Fixed (1) or Dynamic (2) Huffman tree
      let litTable: number[], distTable: number[];

      if (blockType === 1) {
        // Fixed Huffman codes defined by RFC 1951
        litTable = buildFixedLitTable();
        distTable = buildFixedDistTable();
      } else {
        // Dynamic Huffman codes
        const hlit = reader.readBits(5) + 257;
        const hdist = reader.readBits(5) + 1;
        const hclen = reader.readBits(4) + 4;

        const codeOrder = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
        const codeLengths = new Uint8Array(19);
        for (let i = 0; i < hclen; i++) {
          codeLengths[codeOrder[i]] = reader.readBits(3);
        }

        const codeTree = buildHuffmanTree(codeLengths);
        const lengths = new Uint8Array(hlit + hdist);
        let ptr = 0;

        while (ptr < hlit + hdist) {
          const sym = decodeSymbol(reader, codeTree);
          if (sym < 16) {
            lengths[ptr++] = sym;
          } else if (sym === 16) {
            const copyCount = reader.readBits(2) + 3;
            const prev = lengths[ptr - 1];
            for (let c = 0; c < copyCount; c++) lengths[ptr++] = prev;
          } else if (sym === 17) {
            const repeatZero = reader.readBits(3) + 3;
            for (let c = 0; c < repeatZero; c++) lengths[ptr++] = 0;
          } else if (sym === 18) {
            const repeatZero = reader.readBits(7) + 11;
            for (let c = 0; c < repeatZero; c++) lengths[ptr++] = 0;
          }
        }

        const litLengths = lengths.subarray(0, hlit);
        const distLengths = lengths.subarray(hlit);
        litTable = buildHuffmanTree(litLengths);
        distTable = buildHuffmanTree(distLengths);
      }

      // Decode compressed data stream
      const decompressed = decodeHuffmanBlock(reader, litTable, distTable, outChunks);
      outChunks.push(decompressed);
    } else {
      break;
    }
  }

  // Combine chunks
  let totalLen = 0;
  for (const c of outChunks) totalLen += c.length;
  const result = new Uint8Array(totalLen);
  let p = 0;
  for (const c of outChunks) {
    result.set(c, p);
    p += c.length;
  }
  return result;
}

// Helpers for Huffman trees
function buildFixedLitTable(): number[] {
  const lengths = new Uint8Array(288);
  for (let i = 0; i <= 143; i++) lengths[i] = 8;
  for (let i = 144; i <= 255; i++) lengths[i] = 9;
  for (let i = 256; i <= 279; i++) lengths[i] = 7;
  for (let i = 280; i <= 287; i++) lengths[i] = 8;
  return buildHuffmanTree(lengths);
}

function buildFixedDistTable(): number[] {
  const lengths = new Uint8Array(32);
  for (let i = 0; i < 32; i++) lengths[i] = 5;
  return buildHuffmanTree(lengths);
}

function buildHuffmanTree(lengths: Uint8Array): number[] {
  const maxLen = 15;
  const blCount = new Int32Array(maxLen + 1);
  for (let i = 0; i < lengths.length; i++) {
    if (lengths[i] > 0) blCount[lengths[i]]++;
  }

  const nextCode = new Int32Array(maxLen + 1);
  let code = 0;
  for (let bits = 1; bits <= maxLen; bits++) {
    code = (code + blCount[bits - 1]) << 1;
    nextCode[bits] = code;
  }

  const tree: number[] = [];
  for (let i = 0; i < lengths.length; i++) {
    const len = lengths[i];
    if (len !== 0) {
      let c = nextCode[len]++;
      // Reversely map bits into flat lookup array
      let revCode = 0;
      for (let b = 0; b < len; b++) {
        revCode = (revCode << 1) | (c & 1);
        c >>= 1;
      }
      tree[revCode | (len << 16)] = i;
    }
  }
  return tree;
}

function decodeSymbol(reader: BitReader, tree: number[]): number {
  let code = 0;
  for (let len = 1; len <= 15; len++) {
    code = (code << 1) | reader.readBit();
    const key = code | (len << 16);
    if (tree[key] !== undefined) return tree[key];
  }
  return 0;
}

function decodeHuffmanBlock(
  reader: BitReader,
  litTree: number[],
  distTree: number[],
  priorChunks: Uint8Array[],
): Uint8Array {
  const output: number[] = [];

  const getByteAt = (offset: number): number => {
    if (offset <= output.length) {
      return output[output.length - offset];
    }
    let remaining = offset - output.length;
    for (let i = priorChunks.length - 1; i >= 0; i--) {
      if (remaining <= priorChunks[i].length) {
        return priorChunks[i][priorChunks[i].length - remaining];
      }
      remaining -= priorChunks[i].length;
    }
    return 0;
  };

  const lengthExtraBits = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
  const lengthBase = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];

  const distExtraBits = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
  const distBase = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];

  while (true) {
    const sym = decodeSymbol(reader, litTree);
    if (sym === 256) break;

    if (sym < 256) {
      output.push(sym);
    } else {
      const lenCode = sym - 257;
      const extraBits = lengthExtraBits[lenCode];
      const matchLen = lengthBase[lenCode] + (extraBits > 0 ? reader.readBits(extraBits) : 0);

      const distSym = decodeSymbol(reader, distTree);
      const dExtraBits = distExtraBits[distSym];
      const distance = distBase[distSym] + (dExtraBits > 0 ? reader.readBits(dExtraBits) : 0);

      for (let i = 0; i < matchLen; i++) {
        output.push(getByteAt(distance));
      }
    }
  }

  return new Uint8Array(output);
}

/**
 * Decode PNG bytes to 32x32 grayscale luminance matrix.
 */
function decodePNGTo32x32Grayscale(pngBytes: Uint8Array): number[][] {
  const idatChunks: Uint8Array[] = [];
  let width = 32;
  let height = 32;
  let colorType = 6; // default RGBA

  let pos = 8; // skip 8-byte PNG header
  while (pos < pngBytes.length - 8) {
    const length = (pngBytes[pos] << 24) | (pngBytes[pos + 1] << 16) | (pngBytes[pos + 2] << 8) | pngBytes[pos + 3];
    const type = String.fromCharCode(pngBytes[pos + 4], pngBytes[pos + 5], pngBytes[pos + 6], pngBytes[pos + 7]);

    if (type === 'IHDR') {
      width = (pngBytes[pos + 8] << 24) | (pngBytes[pos + 9] << 16) | (pngBytes[pos + 10] << 8) | pngBytes[pos + 11];
      height = (pngBytes[pos + 12] << 24) | (pngBytes[pos + 13] << 16) | (pngBytes[pos + 14] << 8) | pngBytes[pos + 15];
      colorType = pngBytes[pos + 17];
    } else if (type === 'IDAT') {
      idatChunks.push(pngBytes.subarray(pos + 8, pos + 8 + length));
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + length;
  }

  let totalIdat = 0;
  for (const chunk of idatChunks) totalIdat += chunk.length;
  const mergedIdat = new Uint8Array(totalIdat);
  let p = 0;
  for (const chunk of idatChunks) {
    mergedIdat.set(chunk, p);
    p += chunk.length;
  }

  // Uncompress IDAT data
  const rawBytes = inflateZlib(mergedIdat);

  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const stride = 1 + width * bpp;
  const matrix: number[][] = [];

  const prevLine = new Uint8Array(width * bpp);

  for (let y = 0; y < height; y++) {
    const lineStart = y * stride;
    const filterType = rawBytes[lineStart];
    const currentLine = new Uint8Array(width * bpp);
    const rowLuminance: number[] = [];

    for (let x = 0; x < width * bpp; x++) {
      const rawVal = rawBytes[lineStart + 1 + x];
      const left = x >= bpp ? currentLine[x - bpp] : 0;
      const up = prevLine[x];
      const upLeft = x >= bpp ? prevLine[x - bpp] : 0;

      let val = rawVal;
      if (filterType === 1) {
        val = (rawVal + left) & 0xff;
      } else if (filterType === 2) {
        val = (rawVal + up) & 0xff;
      } else if (filterType === 3) {
        val = (rawVal + Math.floor((left + up) / 2)) & 0xff;
      } else if (filterType === 4) {
        const paeth = paethPredictor(left, up, upLeft);
        val = (rawVal + paeth) & 0xff;
      }
      currentLine[x] = val;
    }

    prevLine.set(currentLine);

    for (let col = 0; col < width; col++) {
      let r = 0, g = 0, b = 0;
      if (bpp === 4) {
        r = currentLine[col * 4];
        g = currentLine[col * 4 + 1];
        b = currentLine[col * 4 + 2];
      } else if (bpp === 3) {
        r = currentLine[col * 3];
        g = currentLine[col * 3 + 1];
        b = currentLine[col * 3 + 2];
      } else {
        r = g = b = currentLine[col];
      }
      // Standard BT.601 RGB to Grayscale luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      rowLuminance.push(lum);
    }

    matrix.push(rowLuminance);
  }

  return matrix;
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * Compute 2D Discrete Cosine Transform (DCT) on 32x32 matrix and return 64-bit pHash bitstring.
 */
export function computeDCTAndHash(matrix: number[][]): string {
  const N = 32;
  const dct = new Array(8).fill(0).map(() => new Float64Array(8));

  // Cosine lookup table
  const cosTable: number[][] = [];
  for (let u = 0; u < 8; u++) {
    cosTable[u] = [];
    for (let x = 0; x < N; x++) {
      cosTable[u][x] = Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N));
    }
  }

  for (let u = 0; u < 8; u++) {
    const cu = u === 0 ? 1 / Math.SQRT2 : 1;
    for (let v = 0; v < 8; v++) {
      const cv = v === 0 ? 1 / Math.SQRT2 : 1;
      let sum = 0;
      for (let x = 0; x < N; x++) {
        const cosX = cosTable[u][x];
        for (let y = 0; y < N; y++) {
          sum += matrix[y][x] * cosX * cosTable[v][y];
        }
      }
      dct[u][v] = 0.25 * cu * cv * sum;
    }
  }

  // Compute mean of 63 AC coefficients (excluding DC term at [0][0])
  let acSum = 0;
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      if (u === 0 && v === 0) continue;
      acSum += dct[u][v];
    }
  }
  const acAvg = acSum / 63;

  // Construct 64-bit binary string
  let hashBits = '';
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      hashBits += dct[u][v] > acAvg ? '1' : '0';
    }
  }

  return hashBits;
}

/**
 * Calculates a 64-bit DCT perceptual hash for an image URI.
 */
export async function calculatePHash(imageUri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 32, height: 32 } }],
    { format: ImageManipulator.SaveFormat.PNG, base64: true },
  );

  if (!manipulated.base64) {
    throw new Error('ImageManipulator did not return base64 string.');
  }

  const bytes = base64ToByteArray(manipulated.base64);
  const matrix = decodePNGTo32x32Grayscale(bytes);
  return computeDCTAndHash(matrix);
}

/**
 * Computes Hamming distance between two 64-bit hash bitstrings.
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 64;
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) dist++;
  }
  return dist;
}

/**
 * Computes similarity percentage between two 64-bit pHashes.
 */
export function calculateSimilarity(hash1: string, hash2: string): number {
  const dist = hammingDistance(hash1, hash2);
  return ((64 - dist) / 64) * 100;
}

/**
 * Returns true if similarity > 95% (Hamming distance <= 3 out of 64 bits).
 */
export function isDuplicate(hash1: string, hash2: string, thresholdPercent = 95): boolean {
  const dist = hammingDistance(hash1, hash2);
  // Hamming distance <= 3 out of 64 bits gives (61/64) = 95.3125% similarity
  return dist <= 3;
}
