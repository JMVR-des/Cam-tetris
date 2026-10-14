import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface MediaPipeCameraViewProps {
    onGesture: (gesture: 'LEFT' | 'RIGHT' | 'ROTATE' | 'DROP') => void;
}

export const MediaPipeCameraView: React.FC<MediaPipeCameraViewProps> = ({ onGesture }) => {
    const webViewRef = useRef<WebView>(null);

    // HTML embebido con MediaPipe Hands y clasificador de gestos integrado
    const mediaPipeHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; }
          #video { transform: scaleX(-1); width: 100%; height: 100%; object-fit: cover; opacity: 0.45; }
          #canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: scaleX(-1); }
          #status { position: absolute; top: 10px; left: 10px; color: #38bdf8; font-family: monospace; font-size: 12px; }
        </style>
      </head>
      <body>
        <video id="video" playsinline></video>
        <canvas id="canvas"></canvas>
        <div id="status">Iniciando IA...</div>

        <script>
          const videoElement = document.getElementById('video');
          const canvasElement = document.getElementById('canvas');
          const canvasCtx = canvasElement.getContext('2d');
          const statusEl = document.getElementById('status');

          let lastGestureTime = 0;
          let prevWristX = null;

          function sendGesture(gesture) {
            const now = Date.now();
            // Debounce: mínimo 350ms entre gestos para no saturar Tetris
            if (now - lastGestureTime > 350) {
              lastGestureTime = now;
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ gesture }));
              }
            }
          }

          function onResults(results) {
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
              const landmarks = results.multiHandLandmarks[0];
              statusEl.innerText = "Mano detectada ✅";

              // 0: Muñeca, 4: Pulgar, 8: Índice, 12: Medio
              const wrist = landmarks[0];
              const indexTip = landmarks[8];
              const middleTip = landmarks[12];
              const wristY = wrist.y;

              // 1. Detección de desplazamiento lateral (Izquierda / Derecha)
              if (prevWristX !== null) {
                const diffX = wrist.x - prevWristX;
                // Coordenadas espejadas
                if (diffX > 0.08) {
                  sendGesture('LEFT');
                } else if (diffX < -0.08) {
                  sendGesture('RIGHT');
                }
              }
              prevWristX = wrist.x;

              // 2. Detección de Gesto Arriba (Rotar) o Abajo (Caída Rápida)
              // Si el índice y el medio están muy por encima de la muñeca
              if (indexTip.y < wristY - 0.35 && middleTip.y < wristY - 0.35) {
                sendGesture('ROTATE');
              } else if (wristY > 0.75) {
                sendGesture('DROP');
              }

              // Dibujar esqueleto verde/azul fosforescente
              for (let i = 0; i < landmarks.length; i++) {
                const pt = landmarks[i];
                canvasCtx.beginPath();
                canvasCtx.arc(pt.x * canvasElement.width, pt.y * canvasElement.height, 4, 0, 2 * Math.PI);
                canvasCtx.fillStyle = '#38bdf8';
                canvasCtx.fill();
              }
            } else {
              prevWristX = null;
              statusEl.innerText = "Buscando mano...";
            }
            canvasCtx.restore();
          }

          const hands = new Hands({
            locateFile: (file) => \`https://cdn.jsdelivr.net/npm/@mediapipe/hands/\${file}\`
          });

          hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });

          hands.onResults(onResults);

          const camera = new Camera(videoElement, {
            onFrame: async () => {
              canvasElement.width = videoElement.videoWidth;
              canvasElement.height = videoElement.videoHeight;
              await hands.send({ image: videoElement });
            },
            width: 480,
            height: 640
          });

          camera.start();
        </script>
      </body>
    </html>
  `;

    return (
        <View style={StyleSheet.absoluteFill}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: mediaPipeHtml }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                mediaCapturePermissionGrantType="grant"
                onMessage={(event) => {
                    try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.gesture) {
                            onGesture(data.gesture);
                        }
                    } catch (e) {
                        // Ignorar eventos no formateados
                    }
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    webview: {
        flex: 1,
        backgroundColor: '#000000',
    },
});