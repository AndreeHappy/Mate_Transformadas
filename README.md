# Mate_Transformadas

### Laboratorio Computacional de Análisis Armónico para Redes Neuronales Convolucionales (CNNs)

**Programa:** Maestría en Ciencia de Datos  
**Fundamento Teórico:** Capítulo 10: *Harmonic Analysis for CNNs*  
**Texto de Referencia:** *Mathematical Foundations for Deep Learning*, CRC Press / Taylor & Francis Group.  
**Identificador Digital (DOI):** [10.1201/9781032690742-10](https://doi.org/10.1201/9781032690742-10)  

---

## Acceso al Despliegue en Producción

Plataforma Web (GitHub Pages):  
[https://AndreeHappy.github.io/Mate_Transformadas/](https://AndreeHappy.github.io/Mate_Transformadas/)

---

## 1. Resumen Ejecutivo

Este entorno computacional interactivo ha sido desarrollado con fines docentes y de investigación para modelar, evaluar y validar el comportamiento de los operadores del análisis armónico aplicados al procesamiento de imágenes astronómicas de ultra-alta resolución capturadas por el Telescopio Espacial James Webb (JWST, instrumentos NIRCam y MIRI).

El sistema aborda tres problemas críticos en visión artificial y aprendizaje profundo:

1. **Dimensionalidad y Demanda de Memoria VRAM:** La saturación de memoria de hardware ($FP32$) originada por convoluciones espaciales directas sobre tensores masivos (e.g., *Stephan's Quintet*, $153.5\text{ Megapíxeles} \implies 39.30\text{ GB}$ por capa convolucional).
2. **Eficiencia Asintótica:** La aceleración del cálculo convolucional transformando la operación de dominio espacial $\mathcal{O}(N^2 \cdot K^2)$ al dominio frecuencial $\mathcal{O}(N \log N)$ mediante el Teorema de Convolución.
3. **Localización Espacio-Frecuencia:** Las limitaciones de la Transformada Discreta de Fourier en señales no-estacionarias y la superioridad de la Transformada Wavelet Discreta (DWT, bases Haar y Daubechies 4) para aislar fuentes puntuales (estrellas) sin arrastrar la componente continua de gas difuso.

---

## 2. Correspondencia Rigurosa con el Capítulo 10

La arquitectura de la aplicación replica con exactitud los fundamentos matemáticos y experimentales expuestos en el texto guía:

### Sección 10.4.2: Convolución Espacial en CNNs
* **Planteamiento:** Operación de convolución directa deslizando un kernel $K \in \mathbb{R}^{2 \times 2}$ sobre una matriz de entrada $I \in \mathbb{R}^{3 \times 3}$:
  $$I = \begin{bmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \\ 7 & 8 & 9 \end{bmatrix}, \quad K = \begin{bmatrix} 1 & 0 \\ 0 & -1 \end{bmatrix}$$
* **Resultado:** Mapa de características con dimensiones $(3 - 2 + 1) \times (3 - 2 + 1) = 2 \times 2$:
  $$(f * g)_{\text{spatial}} = \begin{bmatrix} -4 & -4 \\ -4 & -4 \end{bmatrix}$$
* **Validación en la Pizarra:** En la sección `/matematica-paso-a-paso` se detallan las 16 multiplicaciones y 12 adiciones elementales que componen los cuatro cuadrantes.

### Sección 10.4.1: Teorema de Convolución y Relleno con Ceros (Zero-Padding)
* **Teorema:** $\mathcal{F}\{f(t) * g(t)\} = F(\omega) \cdot G(\omega)$.
* **Implementación:** Expansión dimensional con ceros a tamaño $4 \times 4$ ($I_{\text{pad}}$ y $K_{\text{pad}}$) para prevenir distorsiones por convolución circular periódica. La multiplicación punto a punto en frecuencia $\text{IFFT2D}(\text{FFT2D}(I_{\text{pad}}) \odot \text{FFT2D}(K_{\text{pad}}))$ reproduce analíticamente la matriz $\begin{bmatrix}-4 & -4 \\ -4 & -4\end{bmatrix}$.

### Secciones 10.2 y 10.2.3: Transformada de Fourier e Identidad de Euler
* **Descomposición:** Análisis espectral de la señal bi-tonal $f(t) = 3\sin(100\pi t) + 2\sin(240\pi t)$, determinando impulsos delta a $\pm 100\pi\text{ rad/s}$ y $\pm 240\pi\text{ rad/s}$.
* **Reconstrucción Inversa (IFT):** Aplicación de la identidad $e^{j\theta} - e^{-j\theta} = 2j\sin(\theta)$ para anular formalmente la unidad imaginaria ($j^2 = -1$) y recuperar la señal real.

### Sección 10.3: Transformada Wavelet (WT) y Daubechies 4 (db4)
* **Limitación de Fourier:** Pérdida de localización temporal/espacial ante señales no-estacionarias (pulso transitorio $f(t) = 10$ para $1 \le t \le 2$).
* **Resolución Multiescala:** Aislamiento simultáneo mediante escala fina ($s=1$, sensible a discontinuidades estelares) y escala gruesa ($s=8$, sensible a gradientes continuos de emisión nebular).

### Sección 10.6: Pipeline Experimental en OpenCV
* Implementación de los operadores `cv2.dft`, `np.fft.fftshift`, el espectro de magnitud logarítmico ($20 \log(|F| + 1)$) y el gradiente de Sobel con `ksize=5`. El módulo "Comparativa de 6 Paneles" reproduce la Figura 10.5 del libro de texto.

---

## 3. Especificaciones Técnicas

* **Framework Base:** Astro 5 (Arquitectura orientada a contenido con compilación estática estricta)
* **Motor de Estilos:** Tailwind CSS (Diseño responsivo para entornos científicos y académicos)
* **Motor Simbólico y Tipográfico:** KaTeX (Interpretación de fórmulas matemáticas en tiempo de ejecución)
* **Procesamiento Gráfico:** HTML5 Canvas API (Manipulación de mapas de píxeles y paletas termográficas Inferno, Magma y Hot)
* **Integración Continua:** GitHub Actions (`deploy.yml`) para despliegue automatizado en GitHub Pages

---

## 4. Instrucciones de Compilación y Ejecución Local

Para clonar e inicializar el repositorio localmente:

```bash
# 1. Clonar el repositorio
git clone https://github.com/AndreeHappy/Mate_Transformadas.git
cd Mate_Transformadas

# 2. Instalar dependencias del proyecto
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev

# 4. Generar la compilación estática para producción
npm run build

# 5. Previsualizar la distribución final
npm run preview
```

---

## 5. Referencias Bibliográficas

1. *Mathematical Foundations for Deep Learning*. Chapter 10: "Harmonic Analysis for CNNs", pages 298–320. CRC Press, Taylor & Francis Group. DOI: [10.1201/9781032690742-10](https://doi.org/10.1201/9781032690742-10).
2. Space Telescope Science Institute (STScI), NASA, ESA, CSA. *James Webb Space Telescope Early Release Observations: Stephan's Quintet, Carina Nebula (Cosmic Cliffs), Cartwheel Galaxy*.
3. Mallat, S. *A Wavelet Tour of Signal Processing: The Sparse Way*. Academic Press, 3rd Edition.
