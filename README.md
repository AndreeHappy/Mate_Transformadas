# Mate_Transformadas 🌌📐

> **Laboratorio Interactivo de Análisis Armónico, Transformadas y Visión por Computadora para Redes Neuronales Convolucionales (CNNs)**  
> Maestría en Ciencia de Datos • Basado en el **Capítulo 10: *Harmonic Analysis for CNNs*** del libro *Mathematical Foundations for Deep Learning* (CRC Press, DOI: [10.1201/9781032690742-10](https://doi.org/10.1201/9781032690742-10)).

---

## 🚀 Demostración en Vivo (GitHub Pages)

🔗 **Acceso Web:** [https://AndreeHappy.github.io/Mate_Transformadas/](https://AndreeHappy.github.io/Mate_Transformadas/)

---

## 🎯 Propósito del Proyecto

Este proyecto es una plataforma interactiva de soporte didáctico y defensa académica que demuestra cómo las herramientas del análisis armónico resuelven desafíos de dimensionalidad, costo computacional y extracción de características en imágenes científicas masivas del **Telescopio Espacial James Webb (JWST)**.

### Módulos Principales:

1. **Laboratorio Visual Interactivo (Canvas API):**
   * **1. Operador Sobel:** Detección de gradiente espacial bidimensional $|\nabla I| = \sqrt{G_x^2 + G_y^2}$.
   * **2. Transformada de Fourier 2D (FFT):** Análisis espectral centrado con escala logarítmica ($20 \log(|F| + 1)$).
   * **3. Reconstrucción IFT y Fenómeno de Gibbs:** Simulación del sobreimpulso oscilatorio (+8.95%) originado por el truncamiento de frecuencias en fuentes puntuales.
   * **4. Wavelet 2D:** Descomposición multirresolución en sub-bandas ortogonales ($LL, HL, LH, HH$).
   * **5. Aislamiento Estelar Óptimo:** Filtrado y umbralizado sobre la sub-banda $HH$ con bases Haar y Daubechies 4 (`db4`).
   * **6. Comparativa de 6 Paneles:** Réplica interactiva en navegador de la Figura 10.5 del libro de texto.

2. **Simulador Cuantitativo de Hardware (VRAM & FLOPs):**
   * Cálculo de la memoria requerida ($FP32$) para procesar imágenes completas del JWST (como *Stephan's Quintet*, 153.5 MP) en una sola capa convolucional ($39.30\text{ GB} \implies \text{CUDA Out Of Memory}$).
   * Demostración analítica de cómo el submuestreo diádico ($\downarrow 2$) de las Wavelets reduce el tensor en un **75% a 9.82 GB**, haciéndolo viable en GPUs de grado consumidor.

3. **Pizarra Matemática Paso a Paso (`/matematica-paso-a-paso`):**
   * **Sec. 10.4.2:** Convolución espacial resuelta suma por suma con la matriz oficial $3 \times 3$ y filtro $2 \times 2$ del libro, demostrando analíticamente el resultado $\begin{bmatrix}-4 & -4 \\ -4 & -4\end{bmatrix}$.
   * **Sec. 10.4.1:** Teorema de Convolución $\mathcal{F}\{f * g\} = F \cdot G$ y relleno con ceros (Zero-Padding a $4 \times 4$).
   * **Sec. 10.2 & 10.2.3:** Transformada de Fourier, impulsos delta a $\pm 100\pi$ y $\pm 240\pi$, y la Identidad de Euler ($e^{j\theta} - e^{-j\theta} = 2j\sin\theta$) que cancela la parte imaginaria en la reconstrucción.
   * **Sec. 10.3:** Wavelets vs Fourier en señales no-estacionarias y por qué Daubechies 4 (`db4`) aísla eventos transitorios.
   * **Sec. 10.6:** Pipeline oficial en Python / OpenCV (`cv2.dft`, `cv2.Sobel`, etc.).

---

## 🛠️ Tecnologías Utilizadas

* **Framework:** [Astro 5](https://astro.build/) (Renderizado estático ultraligero)
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/) (Diseño limpio en modo claro científico)
* **Renderizado Matemático:** [KaTeX](https://katex.org/) (Notación matemática LaTeX en tiempo real)
* **Visualización:** Canvas API (Procesamiento de imágenes y mapas de color en cliente)
* **Despliegue:** GitHub Pages con GitHub Actions

---

## 💻 Ejecución Local

Clona el repositorio e instala las dependencias:

```bash
# Clonar repositorio
git clone https://github.com/AndreeHappy/Mate_Transformadas.git
cd Mate_Transformadas

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo local
npm run dev

# Compilar para producción
npm run build

# Previsualizar compilación local
npm run preview
```

---

## 📚 Referencias

* Chapter 10: *Harmonic Analysis for CNNs*. En *Mathematical Foundations for Deep Learning*, CRC Press / Taylor & Francis Group. DOI: [10.1201/9781032690742-10](https://doi.org/10.1201/9781032690742-10).
* NASA, ESA, CSA, STScI: Datos de imágenes infrarrojas NIRCam / MIRI del Telescopio Espacial James Webb.
