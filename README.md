# Cam-Tetris (Hand Gesture Control) 🎮✋

Aplicación móvil híbrida desarrollada con **React Native**, **Expo** y **TypeScript**, que implementa un juego de Tetris interactivo controlado en tiempo real mediante visión por computadora y reconocimiento de gestos de la mano.

## 🚀 Características
- **Arquitectura MVC (Modelo - Vista - Controlador):** Separación limpia de reglas de juego, componentes visuales e interactivos.
- **Visión por Computadora On-Device:** Integración de Google MediaPipe Hands para la captura y tracking de los 21 landmarks de la mano sin dependencias de servidores externos.
- **Control Aéreo sin Contacto (Touchless):**
  - Desplazamiento Izquierda / Derecha por proximidad lateral.
  - Rotación mediante gesto de mano abierta hacia arriba.
  - Caída rápida (*Hard Drop*) mediante descenso de mano.
- **HUD Semitransparente:** Interfaz gráfica holográfica superpuesta a la imagen de la cámara frontal en vivo.

## 🛠️ Tecnologías
- React Native / Expo SDK
- TypeScript
- Google MediaPipe Hands
- `react-native-webview`
- `expo-camera` / `expo-haptics`

## 📦 Instalación y Ejecución
```bash
git clone <URL_DEL_REPOSITORIO>
cd Cam-tetris
npm install
npx expo start -c
