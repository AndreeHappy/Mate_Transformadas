/**
 * Motor Matemático Avanzado: Sobel, FFT 2D, Reconstrucción Gibbs,
 * Wavelet Haar & Daubechies 4, y Simulador de Ruido de Sal y Pimienta (Rayos Cósmicos).
 */

// =============================================================================
// SIMULADOR DE RUIDO DE SAL Y PIMIENTA (RAYOS CÓSMICOS EN SENSORES CCD/CMOS)
// =============================================================================

export function addSaltAndPepperNoise(grayscaleArray, percentage = 0) {
  const len = grayscaleArray.length;
  const noisy = new Uint8ClampedArray(len);
  noisy.set(grayscaleArray);

  if (percentage <= 0) return noisy;

  const count = Math.floor((percentage / 100) * len);
  // Usar semilla pseudo-aleatoria estable
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * len);
    // 50% probabilidad de sal (255 - impacto de rayo cósmico), 50% pimienta (0 - píxel muerto)
    noisy[idx] = Math.random() < 0.5 ? 255 : 0;
  }

  return noisy;
}

// =============================================================================
// FILTRO ESPACIAL SOBEL
// =============================================================================

export function applySobel(grayscaleArray, width, height, options = {}) {
  const { mode = 'magnitude', threshold = 0, gain = 1.0 } = options;
  const output = new Uint8ClampedArray(width * height);

  for (let y = 1; y < height - 1; y++) {
    const yPrev = (y - 1) * width;
    const yCurr = y * width;
    const yNext = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      const p00 = grayscaleArray[yPrev + (x - 1)];
      const p02 = grayscaleArray[yPrev + (x + 1)];
      const p10 = grayscaleArray[yCurr + (x - 1)];
      const p12 = grayscaleArray[yCurr + (x + 1)];
      const p20 = grayscaleArray[yNext + (x - 1)];
      const p22 = grayscaleArray[yNext + (x + 1)];

      const p01 = grayscaleArray[yPrev + x];
      const p21 = grayscaleArray[yNext + x];

      const gx = (-p00 + p02) + (-2 * p10 + 2 * p12) + (-p20 + p22);
      const gy = (-p00 - 2 * p01 - p02) + (p20 + 2 * p21 + p22);

      let val = 0;
      if (mode === 'gx') {
        val = Math.abs(gx) * gain;
      } else if (mode === 'gy') {
        val = Math.abs(gy) * gain;
      } else {
        val = Math.sqrt(gx * gx + gy * gy) * gain;
      }

      output[yCurr + x] = val >= threshold ? Math.min(255, Math.floor(val)) : 0;
    }
  }

  return output;
}

// =============================================================================
// TRANSFORMADA RÁPIDA DE FOURIER 2D (FFT COOLEY-TUKEY)
// =============================================================================

function bitReverse(n, bits) {
  let reversed = 0;
  for (let i = 0; i < bits; i++) {
    reversed = (reversed << 1) | (n & 1);
    n >>= 1;
  }
  return reversed;
}

function fft1D(real, imag, inverse = false) {
  const n = real.length;
  const bits = Math.log2(n);

  for (let i = 0; i < n; i++) {
    const j = bitReverse(i, bits);
    if (j > i) {
      const tr = real[i]; real[i] = real[j]; real[j] = tr;
      const ti = imag[i]; imag[i] = imag[j]; imag[j] = ti;
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const angle = (inverse ? 2 * Math.PI : -2 * Math.PI) / len;
    const wStepR = Math.cos(angle);
    const wStepI = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let wR = 1.0;
      let wI = 0.0;
      for (let j = 0; j < half; j++) {
        const uR = real[i + j];
        const uI = imag[i + j];
        const vR = real[i + j + half] * wR - imag[i + j + half] * wI;
        const vI = real[i + j + half] * wI + imag[i + j + half] * wR;

        real[i + j] = uR + vR;
        imag[i + j] = uI + vI;
        real[i + j + half] = uR - vR;
        imag[i + j + half] = uI - vI;

        const nextWR = wR * wStepR - wI * wStepI;
        wI = wR * wStepI + wI * wStepR;
        wR = nextWR;
      }
    }
  }

  if (inverse) {
    for (let i = 0; i < n; i++) {
      real[i] /= n;
      imag[i] /= n;
    }
  }
}

export function computeFFT2D(grayscaleArray, size) {
  const real = new Float32Array(size * size);
  const imag = new Float32Array(size * size);

  for (let i = 0; i < size * size; i++) {
    real[i] = grayscaleArray[i];
    imag[i] = 0.0;
  }

  const rowR = new Float32Array(size);
  const rowI = new Float32Array(size);
  for (let y = 0; y < size; y++) {
    const off = y * size;
    for (let x = 0; x < size; x++) {
      rowR[x] = real[off + x];
      rowI[x] = imag[off + x];
    }
    fft1D(rowR, rowI, false);
    for (let x = 0; x < size; x++) {
      real[off + x] = rowR[x];
      imag[off + x] = rowI[x];
    }
  }

  const colR = new Float32Array(size);
  const colI = new Float32Array(size);
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      colR[y] = real[y * size + x];
      colI[y] = imag[y * size + x];
    }
    fft1D(colR, colI, false);
    for (let y = 0; y < size; y++) {
      real[y * size + x] = colR[y];
      imag[y * size + x] = colI[y];
    }
  }

  // Desplazar cuadrantes (fftshift)
  const shiftReal = new Float32Array(size * size);
  const shiftImag = new Float32Array(size * size);
  const half = size / 2;

  for (let y = 0; y < size; y++) {
    const ny = (y + half) % size;
    for (let x = 0; x < size; x++) {
      const nx = (x + half) % size;
      shiftReal[ny * size + nx] = real[y * size + x];
      shiftImag[ny * size + nx] = imag[y * size + x];
    }
  }

  return { shiftReal, shiftImag, size };
}

export function getLogSpectrumImage(shiftReal, shiftImag, size) {
  const output = new Uint8ClampedArray(size * size);
  const logMags = new Float32Array(size * size);
  let maxLog = 0;

  for (let i = 0; i < size * size; i++) {
    const mag = Math.sqrt(shiftReal[i] * shiftReal[i] + shiftImag[i] * shiftImag[i]);
    const val = Math.log1p(mag);
    logMags[i] = val;
    if (val > maxLog) maxLog = val;
  }

  const scale = maxLog > 0 ? 255 / maxLog : 0;
  for (let i = 0; i < size * size; i++) {
    output[i] = Math.min(255, Math.floor(logMags[i] * scale));
  }

  return output;
}

export function applyFrequencyFilterAndIFT(shiftReal, shiftImag, size, cutoffRadius = 25, type = 'highpass') {
  const filteredR = new Float32Array(size * size);
  const filteredI = new Float32Array(size * size);
  const cx = size / 2;
  const cy = size / 2;
  const r2 = cutoffRadius * cutoffRadius;

  for (let y = 0; y < size; y++) {
    const dy = y - cy;
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const d2 = dx * dx + dy * dy;
      const idx = y * size + x;
      const pass = type === 'highpass' ? d2 >= r2 : d2 <= r2;

      filteredR[idx] = pass ? shiftReal[idx] : 0.0;
      filteredI[idx] = pass ? shiftImag[idx] : 0.0;
    }
  }

  // Des-centrar (ifftshift)
  const unshiftedR = new Float32Array(size * size);
  const unshiftedI = new Float32Array(size * size);
  const half = size / 2;

  for (let y = 0; y < size; y++) {
    const ny = (y + half) % size;
    for (let x = 0; x < size; x++) {
      const nx = (x + half) % size;
      unshiftedR[ny * size + nx] = filteredR[y * size + x];
      unshiftedI[ny * size + nx] = filteredI[y * size + x];
    }
  }

  const rowR = new Float32Array(size);
  const rowI = new Float32Array(size);
  for (let y = 0; y < size; y++) {
    const off = y * size;
    for (let x = 0; x < size; x++) {
      rowR[x] = unshiftedR[off + x];
      rowI[x] = unshiftedI[off + x];
    }
    fft1D(rowR, rowI, true);
    for (let x = 0; x < size; x++) {
      unshiftedR[off + x] = rowR[x];
      unshiftedI[off + x] = rowI[x];
    }
  }

  const colR = new Float32Array(size);
  const colI = new Float32Array(size);
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      colR[y] = unshiftedR[y * size + x];
      colI[y] = unshiftedI[y * size + x];
    }
    fft1D(colR, colI, true);
    for (let y = 0; y < size; y++) {
      unshiftedR[y * size + x] = colR[y];
      unshiftedI[y * size + x] = colI[y];
    }
  }

  const output = new Uint8ClampedArray(size * size);
  let maxMag = 0;
  for (let i = 0; i < size * size; i++) {
    const mag = Math.sqrt(unshiftedR[i] * unshiftedR[i] + unshiftedI[i] * unshiftedI[i]);
    if (mag > maxMag) maxMag = mag;
  }

  const scale = maxMag > 0 ? 255 / maxMag : 1;
  for (let i = 0; i < size * size; i++) {
    const mag = Math.sqrt(unshiftedR[i] * unshiftedR[i] + unshiftedI[i] * unshiftedI[i]);
    output[i] = Math.min(255, Math.floor(mag * scale));
  }

  return output;
}

// =============================================================================
// TRANSFORMADA WAVELET DISCRETA 2D (HAAR Y DAUBECHIES 4)
// =============================================================================

// Coeficientes Daubechies 4 (db4) ortogonales
const DB4_H = [
  0.4829629131445341,
  0.8365163037378079,
  0.2241438680420134,
  -0.1294095225512604
];
const DB4_G = [
  -0.1294095225512604,
  -0.2241438680420134,
  0.8365163037378079,
  -0.4829629131445341
];

export function computeDWT2D(grayscaleArray, width, height, motherWavelet = 'haar') {
  const halfW = width >> 1;
  const halfH = height >> 1;

  if (motherWavelet === 'db4') {
    return computeDWT2D_DB4(grayscaleArray, width, height);
  }

  // Haar estándar (db1)
  const invSqrt2 = 1.0 / Math.SQRT2;
  const rowTemp = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    const yOff = y * width;
    for (let x = 0; x < halfW; x++) {
      const x0 = grayscaleArray[yOff + (x * 2)];
      const x1 = grayscaleArray[yOff + (x * 2 + 1)];
      rowTemp[yOff + x] = (x0 + x1) * invSqrt2;
      rowTemp[yOff + halfW + x] = (x0 - x1) * invSqrt2;
    }
  }

  const LL = new Float32Array(halfW * halfH);
  const LH = new Float32Array(halfW * halfH);
  const HL = new Float32Array(halfW * halfH);
  const HH = new Float32Array(halfW * halfH);

  for (let y = 0; y < halfH; y++) {
    const y0Off = (y * 2) * width;
    const y1Off = (y * 2 + 1) * width;
    const outOff = y * halfW;

    for (let x = 0; x < halfW; x++) {
      const r0L = rowTemp[y0Off + x];
      const r1L = rowTemp[y1Off + x];
      const r0H = rowTemp[y0Off + halfW + x];
      const r1H = rowTemp[y1Off + halfW + x];

      LL[outOff + x] = (r0L + r1L) * invSqrt2;
      HL[outOff + x] = (r0L - r1L) * invSqrt2;
      LH[outOff + x] = (r0H + r1H) * invSqrt2;
      HH[outOff + x] = (r0H - r1H) * invSqrt2;
    }
  }

  return { LL, LH, HL, HH, halfW, halfH, mother: 'haar' };
}

function computeDWT2D_DB4(grayscaleArray, width, height) {
  const halfW = width >> 1;
  const halfH = height >> 1;
  const rowTemp = new Float32Array(width * height);

  // Filtrado DB4 en filas con condiciones periódicas de frontera
  for (let y = 0; y < height; y++) {
    const yOff = y * width;
    for (let x = 0; x < halfW; x++) {
      const i0 = (x * 2) % width;
      const i1 = (x * 2 + 1) % width;
      const i2 = (x * 2 + 2) % width;
      const i3 = (x * 2 + 3) % width;

      const p0 = grayscaleArray[yOff + i0];
      const p1 = grayscaleArray[yOff + i1];
      const p2 = grayscaleArray[yOff + i2];
      const p3 = grayscaleArray[yOff + i3];

      const low = DB4_H[0] * p0 + DB4_H[1] * p1 + DB4_H[2] * p2 + DB4_H[3] * p3;
      const high = DB4_G[0] * p0 + DB4_G[1] * p1 + DB4_G[2] * p2 + DB4_G[3] * p3;

      rowTemp[yOff + x] = low;
      rowTemp[yOff + halfW + x] = high;
    }
  }

  const LL = new Float32Array(halfW * halfH);
  const LH = new Float32Array(halfW * halfH);
  const HL = new Float32Array(halfW * halfH);
  const HH = new Float32Array(halfW * halfH);

  // Filtrado DB4 en columnas
  for (let y = 0; y < halfH; y++) {
    const y0 = ((y * 2) % height) * width;
    const y1 = ((y * 2 + 1) % height) * width;
    const y2 = ((y * 2 + 2) % height) * width;
    const y3 = ((y * 2 + 3) % height) * width;
    const outOff = y * halfW;

    for (let x = 0; x < halfW; x++) {
      // Rama Low
      const l0 = rowTemp[y0 + x];
      const l1 = rowTemp[y1 + x];
      const l2 = rowTemp[y2 + x];
      const l3 = rowTemp[y3 + x];
      LL[outOff + x] = DB4_H[0] * l0 + DB4_H[1] * l1 + DB4_H[2] * l2 + DB4_H[3] * l3;
      HL[outOff + x] = DB4_G[0] * l0 + DB4_G[1] * l1 + DB4_G[2] * l2 + DB4_G[3] * l3;

      // Rama High
      const h0 = rowTemp[y0 + halfW + x];
      const h1 = rowTemp[y1 + halfW + x];
      const h2 = rowTemp[y2 + halfW + x];
      const h3 = rowTemp[y3 + halfW + x];
      LH[outOff + x] = DB4_H[0] * h0 + DB4_H[1] * h1 + DB4_H[2] * h2 + DB4_H[3] * h3;
      HH[outOff + x] = DB4_G[0] * h0 + DB4_G[1] * h1 + DB4_G[2] * h2 + DB4_G[3] * h3;
    }
  }

  return { LL, LH, HL, HH, halfW, halfH, mother: 'db4' };
}

export function getWaveletQuadImage(dwtResult) {
  const { LL, LH, HL, HH, halfW, halfH } = dwtResult;
  const width = halfW * 2;
  const height = halfH * 2;
  const output = new Uint8ClampedArray(width * height);

  function copySubband(subband, startX, startY, isDetail = false) {
    let max = 0;
    for (let i = 0; i < subband.length; i++) {
      const v = Math.abs(subband[i]);
      if (v > max) max = v;
    }
    const scale = max > 0 ? 255 / max : 1;

    for (let y = 0; y < halfH; y++) {
      for (let x = 0; x < halfW; x++) {
        const val = isDetail ? Math.abs(subband[y * halfW + x]) * scale : subband[y * halfW + x] * scale;
        output[(startY + y) * width + (startX + x)] = Math.min(255, Math.floor(val));
      }
    }
  }

  copySubband(LL, 0, 0, false);
  copySubband(HL, halfW, 0, true);
  copySubband(LH, 0, halfH, true);
  copySubband(HH, halfW, halfH, true);

  return output;
}

export function isolateWaveletStars(dwtResult, thresholdPercentile = 98.5, shrinkage = 'hard') {
  const { LH, HL, HH, halfW, halfH } = dwtResult;
  const n = halfW * halfH;
  const energy = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    energy[i] = Math.sqrt(LH[i] * LH[i] + HL[i] * HL[i] + HH[i] * HH[i]);
  }

  const copy = Float32Array.from(energy).sort();
  const rank = Math.floor((thresholdPercentile / 100) * n);
  const threshold = copy[Math.min(n - 1, rank)];

  const output = new Uint8ClampedArray(n);
  let max = 0;
  for (let i = 0; i < n; i++) {
    if (energy[i] > max) max = energy[i];
  }
  const scale = max > threshold ? 255 / (max - threshold) : 1;

  for (let i = 0; i < n; i++) {
    const e = energy[i];
    if (e >= threshold) {
      if (shrinkage === 'soft') {
        // Soft thresholding de Donoho: sign(e) * (|e| - lambda)
        output[i] = Math.min(255, Math.floor((e - threshold) * scale));
      } else {
        // Hard thresholding directo
        output[i] = Math.min(255, Math.floor(e * (255 / max)));
      }
    } else {
      output[i] = 0;
    }
  }

  return { output, halfW, halfH, threshold };
}
