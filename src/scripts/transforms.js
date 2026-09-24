/**
 * Motor Matemático de Transformadas para Visión Artificial y Astrofísica
 * Implementado en JavaScript nativo con TypedArrays (Float32Array) para ejecución instantánea en navegador.
 */

// =============================================================================
// 1. FILTRADO ESPACIAL Y OPERADOR SOBEL
// =============================================================================

export function applySobel(grayscaleArray, width, height, options = {}) {
  const { mode = 'magnitude', threshold = 0, gain = 1.0 } = options;
  const output = new Uint8ClampedArray(width * height);

  const Kx = [
    -1, 0, +1,
    -2, 0, +2,
    -1, 0, +1
  ];

  const Ky = [
    -1, -2, -1,
     0,  0,  0,
    +1, +2, +1
  ];

  for (let y = 1; y < height - 1; y++) {
    const yPrev = (y - 1) * width;
    const yCurr = y * width;
    const yNext = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      // Ventana 3x3
      const p00 = grayscaleArray[yPrev + (x - 1)];
      const p01 = grayscaleArray[yPrev + x];
      const p02 = grayscaleArray[yPrev + (x + 1)];

      const p10 = grayscaleArray[yCurr + (x - 1)];
      const p12 = grayscaleArray[yCurr + (x + 1)];

      const p20 = grayscaleArray[yNext + (x - 1)];
      const p21 = grayscaleArray[yNext + x];
      const p22 = grayscaleArray[yNext + (x + 1)];

      // Convolución discreta
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

      output[yCurr + x] = val >= threshold ? Math.min(255, val) : 0;
    }
  }

  return output;
}

// =============================================================================
// 2. TRANSFORMADA RÁPIDA DE FOURIER 2D (FFT COOLEY-TUKEY)
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
      const tempR = real[i]; real[i] = real[j]; real[j] = tempR;
      const tempI = imag[i]; imag[i] = imag[j]; imag[j] = tempI;
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

  // 1. FFT a lo largo de cada fila
  const rowR = new Float32Array(size);
  const rowI = new Float32Array(size);
  for (let y = 0; y < size; y++) {
    const offset = y * size;
    for (let x = 0; x < size; x++) {
      rowR[x] = real[offset + x];
      rowI[x] = imag[offset + x];
    }
    fft1D(rowR, rowI, false);
    for (let x = 0; x < size; x++) {
      real[offset + x] = rowR[x];
      imag[offset + x] = rowI[x];
    }
  }

  // 2. FFT a lo largo de cada columna
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

  // 3. FFT Shift (centrar frecuencia cero en N/2, N/2)
  const shiftReal = new Float32Array(size * size);
  const shiftImag = new Float32Array(size * size);
  const half = size / 2;

  for (let y = 0; y < size; y++) {
    const newY = (y + half) % size;
    for (let x = 0; x < size; x++) {
      const newX = (x + half) % size;
      shiftReal[newY * size + newX] = real[y * size + x];
      shiftImag[newY * size + newX] = imag[y * size + x];
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
    const logVal = Math.log1p(mag);
    logMags[i] = logVal;
    if (logVal > maxLog) maxLog = logVal;
  }

  const scale = maxLog > 0 ? 255 / maxLog : 0;
  for (let i = 0; i < size * size; i++) {
    output[i] = Math.min(255, Math.floor(logMags[i] * scale));
  }

  return output;
}

// =============================================================================
// 3. FILTRADO EN FRECUENCIA Y RECONSTRUCCIÓN CON IFT 2D (FENÓMENO DE GIBBS)
// =============================================================================

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
      const dist2 = dx * dx + dy * dy;
      const idx = y * size + x;

      let pass = false;
      if (type === 'highpass') {
        pass = dist2 >= r2;
      } else {
        pass = dist2 <= r2;
      }

      if (pass) {
        filteredR[idx] = shiftReal[idx];
        filteredI[idx] = shiftImag[idx];
      } else {
        filteredR[idx] = 0.0;
        filteredI[idx] = 0.0;
      }
    }
  }

  // Des-centrar (IFFT shift)
  const unshiftedR = new Float32Array(size * size);
  const unshiftedI = new Float32Array(size * size);
  const half = size / 2;

  for (let y = 0; y < size; y++) {
    const origY = (y + half) % size;
    for (let x = 0; x < size; x++) {
      const origX = (x + half) % size;
      unshiftedR[origY * size + origX] = filteredR[y * size + x];
      unshiftedI[origY * size + origX] = filteredI[y * size + x];
    }
  }

  // 1. IFFT sobre filas
  const rowR = new Float32Array(size);
  const rowI = new Float32Array(size);
  for (let y = 0; y < size; y++) {
    const offset = y * size;
    for (let x = 0; x < size; x++) {
      rowR[x] = unshiftedR[offset + x];
      rowI[x] = unshiftedI[offset + x];
    }
    fft1D(rowR, rowI, true);
    for (let x = 0; x < size; x++) {
      unshiftedR[offset + x] = rowR[x];
      unshiftedI[offset + x] = rowI[x];
    }
  }

  // 2. IFFT sobre columnas
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

  // 3. Magnitud espacial reconstruida (evidenciando el sobreimpulso de Gibbs)
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
// 4. TRANSFORMADA WAVELET DISCRETA 2D (HAAR DWT)
// =============================================================================

export function computeDWT2D(grayscaleArray, width, height) {
  const halfW = width >> 1;
  const halfH = height >> 1;
  const invSqrt2 = 1.0 / Math.SQRT2;

  // Paso 1: Filtrado de filas
  const rowTemp = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    const yOff = y * width;
    for (let x = 0; x < halfW; x++) {
      const x0 = grayscaleArray[yOff + (x * 2)];
      const x1 = grayscaleArray[yOff + (x * 2 + 1)];
      rowTemp[yOff + x] = (x0 + x1) * invSqrt2;         // L
      rowTemp[yOff + halfW + x] = (x0 - x1) * invSqrt2; // H
    }
  }

  // Paso 2: Filtrado de columnas
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

  return { LL, LH, HL, HH, halfW, halfH };
}

export function getWaveletQuadImage(dwtResult) {
  const { LL, LH, HL, HH, halfW, halfH } = dwtResult;
  const width = halfW * 2;
  const height = halfH * 2;
  const output = new Uint8ClampedArray(width * height);

  // Normalizar cada sub-banda a [0, 255]
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

  copySubband(LL, 0, 0, false);       // Cuadrante superior izq: LL
  copySubband(HL, halfW, 0, true);     // Cuadrante superior der: HL
  copySubband(LH, 0, halfH, true);     // Cuadrante inferior izq: LH
  copySubband(HH, halfW, halfH, true); // Cuadrante inferior der: HH

  return output;
}

export function isolateWaveletStars(dwtResult, thresholdPercentile = 98.5) {
  const { LH, HL, HH, halfW, halfH } = dwtResult;
  const n = halfW * halfH;
  const energy = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    energy[i] = Math.sqrt(LH[i] * LH[i] + HL[i] * HL[i] + HH[i] * HH[i]);
  }

  // Hallar umbral según percentil
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
    if (energy[i] >= threshold) {
      output[i] = Math.min(255, Math.floor((energy[i] - threshold) * scale));
    } else {
      output[i] = 0; // Cero absoluto: gas galáctico anulado
    }
  }

  return { output, halfW, halfH };
}
