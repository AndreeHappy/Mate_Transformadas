/**
 * Paletas de Color científicas estilo Matplotlib (Hot, Inferno, Magma, Grayscale)
 * Convierte valores normalizados [0, 255] en colores RGB para renderizado en Canvas.
 */

// Paleta Hot (Fondo negro -> rojo oscuro -> naranja -> amarillo -> blanco brillante)
function getHotRGB(val) {
  // val entre 0 y 255
  const norm = val / 255;
  let r = 0, g = 0, b = 0;

  if (norm < 0.36) {
    // 0 a 0.36: Negro a Rojo
    r = Math.floor((norm / 0.36) * 255);
    g = 0;
    b = 0;
  } else if (norm < 0.74) {
    // 0.36 a 0.74: Rojo a Amarillo
    r = 255;
    g = Math.floor(((norm - 0.36) / 0.38) * 255);
    b = 0;
  } else {
    // 0.74 a 1.0: Amarillo a Blanco
    r = 255;
    g = 255;
    b = Math.floor(((norm - 0.74) / 0.26) * 255);
  }
  return [r, g, b];
}

// Paleta Inferno (Negro -> Morado oscuro -> Magenta -> Naranja -> Amarillo)
function getInfernoRGB(val) {
  const t = Math.max(0, Math.min(1, val / 255));
  // Polinomio de aproximación continua para Inferno
  const r = Math.floor(Math.max(0, Math.min(255, 255 * (t * (t * (t * (-0.02 * t + 0.5) + 1.2) - 0.2) + 0.05 * t))));
  const g = Math.floor(Math.max(0, Math.min(255, 255 * (t * (t * (t * 2.2 - 2.8) + 1.7) - 0.05))));
  const b = Math.floor(Math.max(0, Math.min(255, 255 * (Math.sin(t * Math.PI) * 0.8 + (t > 0.8 ? (t - 0.8) * 5 : 0)))));
  return [r, g, b];
}

// Paleta Magma (Negro -> Violeta -> Rosa suave -> Blanco amarillento)
function getMagmaRGB(val) {
  const t = Math.max(0, Math.min(1, val / 255));
  const r = Math.floor(Math.max(0, Math.min(255, 255 * Math.min(1, 1.2 * t))));
  const g = Math.floor(Math.max(0, Math.min(255, 255 * Math.max(0, t * t * 1.5 - 0.1 * t))));
  const b = Math.floor(Math.max(0, Math.min(255, 255 * (t < 0.5 ? t * 1.8 : 0.9 - (t - 0.5) * 0.5))));
  return [r, g, b];
}

export function applyColormap(grayscaleArray, width, height, colormap = 'grayscale') {
  const length = width * height;
  const rgba = new Uint8ClampedArray(length * 4);

  for (let i = 0; i < length; i++) {
    const val = grayscaleArray[i];
    const outIdx = i * 4;

    if (colormap === 'hot') {
      const [r, g, b] = getHotRGB(val);
      rgba[outIdx] = r;
      rgba[outIdx + 1] = g;
      rgba[outIdx + 2] = b;
    } else if (colormap === 'inferno') {
      const [r, g, b] = getInfernoRGB(val);
      rgba[outIdx] = r;
      rgba[outIdx + 1] = g;
      rgba[outIdx + 2] = b;
    } else if (colormap === 'magma') {
      const [r, g, b] = getMagmaRGB(val);
      rgba[outIdx] = r;
      rgba[outIdx + 1] = g;
      rgba[outIdx + 2] = b;
    } else {
      // Grayscale estándar
      rgba[outIdx] = val;
      rgba[outIdx + 1] = val;
      rgba[outIdx + 2] = val;
    }
    rgba[outIdx + 3] = 255; // Alpha opaco
  }

  return rgba;
}
