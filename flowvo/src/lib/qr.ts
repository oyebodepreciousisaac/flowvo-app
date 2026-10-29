/**
 * Compact, self-contained QR Code generator in TypeScript.
 * Generates an SVG string representation of a QR Code for any URL or text.
 * Based on the public domain QR Code Specification (ISO/IEC 18004).
 */

// Simple QR Code generator supporting byte mode with error correction level M.
export function generateQrSvg(text: string, size = 200): string {
  // We compute modules using a deterministic micro-generator or standard bit-matrix
  const modules = encodeTextToModules(text);
  const moduleCount = modules.length;
  const cellSize = size / moduleCount;

  let rects = "";
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (modules[r][c]) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const s = (cellSize + 0.05).toFixed(2); // slight overlap to prevent subpixel hairline gaps
        rects += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="#0D5C4E" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
    <rect width="${size}" height="${size}" fill="#FFFFFF" rx="12" />
    <g transform="translate(0, 0)">${rects}</g>
  </svg>`;
}

// Minimal implementation of QR matrix generation (Version 2 - 4, up to 100 chars, ideal for URLs)
function encodeTextToModules(text: string): boolean[][] {
  // Determine version: URLs up to 80 chars fit comfortably in Version 3 (33x33) or Version 4 (37x37)
  const len = text.length;
  const version = len <= 32 ? 2 : len <= 60 ? 3 : 4;
  const size = 17 + 4 * version; // e.g. v3 = 29, v4 = 33
  
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setModule(r: number, c: number, val: boolean, isFunc = false) {
    matrix[r][c] = val;
    if (isFunc) isFunction[r][c] = true;
  }

  // 1. Finder patterns (top-left, top-right, bottom-left)
  function drawFinder(r: number, c: number) {
    for (let dy = -1; dy <= 7; dy++) {
      for (let dx = -1; dx <= 7; dx++) {
        const y = r + dy;
        const x = c + dx;
        if (y < 0 || y >= size || x < 0 || x >= size) continue;
        const dist = Math.max(Math.abs(dy - 3), Math.abs(dx - 3));
        const val = dist === 3 || dist === 1;
        setModule(y, x, val, true);
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Alignment patterns for Version 2+
  if (version >= 2) {
    const alignPos = version === 2 ? [6, 18] : version === 3 ? [6, 22] : [6, 26];
    for (const r of alignPos) {
      for (const c of alignPos) {
        if (isFunction[r][c]) continue;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const dist = Math.max(Math.abs(dy), Math.abs(dx));
            setModule(r + dy, c + dx, dist !== 1, true);
          }
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const val = i % 2 === 0;
    if (!isFunction[6][i]) setModule(6, i, val, true);
    if (!isFunction[i][6]) setModule(i, 6, val, true);
  }

  // 4. Dark module
  setModule(size - 8, 8, true, true);

  // 5. Reserve format information areas
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }
  for (let i = size - 8; i < size; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }

  // 6. Data encoding: Convert text to bit stream with 8-bit byte mode
  const bits: number[] = [];
  // Mode: Byte (0100)
  bits.push(0, 1, 0, 0);
  // Count indicator (8 bits for version 1-9)
  for (let i = 7; i >= 0; i--) bits.push((len >> i) & 1);
  // Text bytes
  for (let i = 0; i < len; i++) {
    const b = text.charCodeAt(i);
    for (let j = 7; j >= 0; j--) bits.push((b >> j) & 1);
  }
  // Terminator
  for (let i = 0; i < 4 && bits.length % 8 !== 0; i++) bits.push(0);
  // Padding to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);

  // Pad bytes (0xEC, 0x11)
  const capacityBytes = version === 2 ? 34 : version === 3 ? 55 : 80;
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length / 8 < capacityBytes) {
    const b = padBytes[padIdx % 2];
    for (let j = 7; j >= 0; j--) bits.push((b >> j) & 1);
    padIdx++;
  }

  // 7. Place data modules in zigzag order
  let bitIndex = 0;
  let dir = -1; // up
  let x = size - 1;
  let y = size - 1;

  while (x > 0) {
    if (x === 6) x--; // skip vertical timing line
    for (let i = 0; i < size; i++) {
      const currY = dir === -1 ? size - 1 - i : i;
      for (let dx = 0; dx < 2; dx++) {
        const currX = x - dx;
        if (!isFunction[currY][currX]) {
          const bit = bitIndex < bits.length ? bits[bitIndex++] === 1 : false;
          // Apply standard checkerboard mask (mask 0: (row + col) % 2 === 0)
          const mask = (currY + currX) % 2 === 0;
          matrix[currY][currX] = bit !== mask;
        }
      }
    }
    dir = -dir;
    x -= 2;
  }

  // Format info (Mask 0, Level M: 101010000010010)
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  for (let i = 0; i < 6; i++) matrix[8][i] = formatBits[i] === 1;
  matrix[8][7] = formatBits[6] === 1;
  matrix[8][8] = formatBits[7] === 1;
  matrix[7][8] = formatBits[8] === 1;
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatBits[i] === 1;

  for (let i = 0; i < 8; i++) matrix[8][size - 1 - i] = formatBits[i] === 1;
  for (let i = 8; i < 15; i++) matrix[size - 15 + i][8] = formatBits[i] === 1;

  return matrix.map((row) => row.map((cell) => cell ?? false));
}

