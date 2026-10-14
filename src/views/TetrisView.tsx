import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { COLS, ROWS, SHAPE_COLORS, Piece } from '../models/TetrisModel';

const screenWidth = Dimensions.get('window').width;

interface TetrisViewProps {
    grid: number[][];
    currentPiece: Piece;
    score: number;
    linesCleared: number;
    gameOver: boolean;
    isPlaying: boolean;
    onMoveLeft: () => void;
    onMoveRight: () => void;
    onRotate: () => void;
    onHardDrop: () => void;
    onStartGame: () => void;
    onResetGame: () => void;
}

export const TetrisView: React.FC<TetrisViewProps> = ({
    grid,
    currentPiece,
    score,
    linesCleared,
    gameOver,
    isPlaying,
    onMoveLeft,
    onMoveRight,
    onRotate,
    onHardDrop,
    onStartGame,
    onResetGame,
}) => {
    const [gestureStatus, setGestureStatus] = useState<string>('Iniciando IA...');
    const [highlightZone, setHighlightZone] = useState<'LEFT' | 'RIGHT' | 'ROTATE' | 'DROP' | null>(null);
    const webViewRef = useRef<WebView>(null);

    const mediaPipeHTML = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body, html { width: 100%; height: 100%; overflow: hidden; background-color: #000; }
          #video {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            object-fit: cover;
            transform: scaleX(-1);
            opacity: 0.45;
          }
          #canvas {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            transform: scaleX(-1);
          }
        </style>
      </head>
      <body>
        <video id="video" playsinline webkit-playsinline muted autoplay></video>
        <canvas id="canvas"></canvas>

        <script>
          window.onerror = function(msg, url, line) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ error: msg + " (L:" + line + ")" }));
            }
          };

          const videoElement = document.getElementById('video');
          const canvasElement = document.getElementById('canvas');
          const canvasCtx = canvasElement.getContext('2d');

          let lastGestureTime = 0;
          const DEBOUNCE_MS = 380;
          let hasReturnedToCenter = true;

          function emitGesture(gesture) {
            const now = Date.now();
            if (now - lastGestureTime > DEBOUNCE_MS) {
              lastGestureTime = now;
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ gesture: gesture }));
              }
            }
          }

          function onResults(results) {
            try {
              canvasCtx.save();
              canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

              if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                // Seleccionar la mano más grande / cercana de forma segura
                let primaryHand = results.multiHandLandmarks[0];

                if (results.multiHandLandmarks.length > 1) {
                  const h0 = results.multiHandLandmarks[0];
                  const h1 = results.multiHandLandmarks[1];
                  const d0 = Math.abs(h0[9].y - h0[0].y) + Math.abs(h0[9].x - h0[0].x);
                  const d1 = Math.abs(h1[9].y - h1[0].y) + Math.abs(h1[9].x - h1[0].x);
                  if (d1 > d0) {
                    primaryHand = h1;
                  }
                }

                const lm = primaryHand;
                const wrist = lm[0];
                const indexTip = lm[8];
                const middleTip = lm[12];
                const ringTip = lm[16];
                const pinkyTip = lm[20];

                const isHandOpenUp = (
                  indexTip.y < lm[6].y &&
                  middleTip.y < lm[10].y &&
                  ringTip.y < lm[14].y &&
                  pinkyTip.y < lm[18].y
                );

                const handX = wrist.x;
                const handY = wrist.y;

                // Zona Muerta Central (entre 0.35 y 0.65)
                if (handX >= 0.35 && handX <= 0.65 && handY <= 0.78) {
                  hasReturnedToCenter = true;
                }

                // 1. Rotar (Mano abierta en la parte alta)
                if (isHandOpenUp && handY < 0.45) {
                  emitGesture('ROTATE');
                }
                // 2. Caída (Mano abajo)
                else if (handY > 0.80) {
                  emitGesture('DROP');
                }
                //AHORA (Corregido y sincronizado con el espejo):
                else if (hasReturnedToCenter) {
                if (handX < 0.32) {
                    // Tu mano física a la derecha
                    emitGesture('RIGHT');
                    hasReturnedToCenter = false;
                } else if (handX > 0.68) {
                    // Tu mano física a la izquierda
                    emitGesture('LEFT');
                    hasReturnedToCenter = false;
                }
                }

                // Dibujar puntos
                for (let i = 0; i < lm.length; i++) {
                  const pt = lm[i];
                  canvasCtx.beginPath();
                  canvasCtx.arc(pt.x * canvasElement.width, pt.y * canvasElement.height, 4, 0, 2 * Math.PI);
                  canvasCtx.fillStyle = '#38bdf8';
                  canvasCtx.fill();
                }

                // Líneas guía de referencia
                canvasCtx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
                canvasCtx.lineWidth = 2;
                canvasCtx.beginPath();
                canvasCtx.moveTo(canvasElement.width * 0.32, 0);
                canvasCtx.lineTo(canvasElement.width * 0.32, canvasElement.height);
                canvasCtx.moveTo(canvasElement.width * 0.68, 0);
                canvasCtx.lineTo(canvasElement.width * 0.68, canvasElement.height);
                canvasCtx.stroke();
              }
              canvasCtx.restore();
            } catch (err) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ error: err.toString() }));
              }
            }
          }

          const hands = new Hands({
            locateFile: (file) => 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/' + file
          });

          hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 0,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6
          });

          hands.onResults(onResults);

          navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 480 },
              height: { ideal: 640 }
            },
            audio: false
          }).then((stream) => {
            videoElement.srcObject = stream;
            videoElement.onloadedmetadata = () => {
              videoElement.play();
              canvasElement.width = videoElement.videoWidth;
              canvasElement.height = videoElement.videoHeight;
              
              const camera = new Camera(videoElement, {
                onFrame: async () => {
                  try {
                    await hands.send({ image: videoElement });
                  } catch (e) {
                    // ignorar frames descartados
                  }
                },
                width: 480,
                height: 640
              });
              camera.start();
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ ready: true }));
              }
            };
          }).catch((err) => {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ error: 'Permiso camara web: ' + err.message }));
            }
          });
        </script>
      </body>
    </html>
  `;

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.error) {
                setGestureStatus(`Error: ${data.error}`);
                return;
            }

            if (data.ready) {
                setGestureStatus('Mano lista ✋');
                return;
            }

            if (data.gesture && isPlaying && !gameOver) {
                setGestureStatus(`Gesto: ${data.gesture}`);
                setHighlightZone(data.gesture);
                setTimeout(() => setHighlightZone(null), 250);

                if (data.gesture === 'LEFT') onMoveLeft();
                if (data.gesture === 'RIGHT') onMoveRight();
                if (data.gesture === 'ROTATE') onRotate();
                if (data.gesture === 'DROP') onHardDrop();
            }
        } catch (e) {
            // Ignorar mensajes con formato irregular
        }
    };

    const renderGameBoard = () => {
        const displayGrid = grid.map((row) => [...row]);
        const { shape, x, y, type } = currentPiece;

        if (shape.length) {
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c] !== 0) {
                        const py = y + r;
                        const px = x + c;
                        if (py >= 0 && py < ROWS && px >= 0 && px < COLS) {
                            displayGrid[py][px] = type;
                        }
                    }
                }
            }
        }

        return displayGrid.map((row, rIndex) => (
            <View key={`row-${rIndex}`} style={styles.gridRow}>
                {row.map((cell, cIndex) => (
                    <View
                        key={`cell-${cIndex}`}
                        style={[
                            styles.cell,
                            cell !== 0 ? { backgroundColor: SHAPE_COLORS[cell], borderColor: '#000000' } : styles.emptyCell,
                        ]}
                    />
                ))}
            </View>
        ));
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.cameraWrapper}>
                <WebView
                    ref={webViewRef}
                    originWhitelist={['*']}
                    source={{ html: mediaPipeHTML, baseUrl: 'https://localhost' }}
                    style={styles.webView}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    mediaCapturePermissionGrantType="grant"
                    onMessage={handleMessage}
                />

                <View style={styles.overlay} pointerEvents="box-none">
                    <View style={styles.headerInfo}>
                        <View style={styles.scoreBox}>
                            <Text style={styles.label}>PUNTAJE</Text>
                            <Text style={styles.value}>{score}</Text>
                        </View>

                        <View style={styles.radarPill}>
                            <Text style={styles.radarText}>{gestureStatus}</Text>
                        </View>

                        <View style={styles.scoreBox}>
                            <Text style={styles.label}>LÍNEAS</Text>
                            <Text style={styles.value}>{linesCleared}</Text>
                        </View>
                    </View>

                    <View style={styles.zonesArea} pointerEvents="none">
                        <View style={[styles.sensorZone, highlightZone === 'LEFT' && styles.sensorZoneActive]}>
                            <Text style={styles.sensorText}>◀ IZQ</Text>
                        </View>
                        <View style={[styles.sensorZone, highlightZone === 'RIGHT' && styles.sensorZoneActive]}>
                            <Text style={styles.sensorText}>DER ▶</Text>
                        </View>
                    </View>

                    <View style={styles.tetrisContainer} pointerEvents="none">
                        <View style={styles.board}>{renderGameBoard()}</View>
                    </View>

                    <View style={styles.controlHUD}>
                        {gameOver ? (
                            <View style={styles.gameOverCard}>
                                <Text style={styles.gameOverText}>¡JUEGO TERMINADO!</Text>
                                <TouchableOpacity style={styles.resetBtn} onPress={onResetGame}>
                                    <Text style={styles.resetBtnText}>REINTENTAR</Text>
                                </TouchableOpacity>
                            </View>
                        ) : !isPlaying ? (
                            <TouchableOpacity style={styles.startBtn} onPress={onStartGame}>
                                <Text style={styles.startBtnText}>INICIAR PARTIDA CON IA ✋🎮</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.activeHintBox}>
                                <Text style={styles.activeHintText}>
                                    👋 Mueve tu mano en el aire frente a la cámara frontal para jugar
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    cameraWrapper: {
        flex: 1,
        position: 'relative',
    },
    webView: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000000',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: 12,
        justifyContent: 'space-between',
    },
    headerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    scoreBox: {
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderWidth: 1.5,
        borderColor: '#38bdf8',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignItems: 'center',
        minWidth: 75,
    },
    radarPill: {
        backgroundColor: 'rgba(2, 132, 199, 0.85)',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#38bdf8',
    },
    radarText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    label: {
        color: '#38bdf8',
        fontSize: 10,
        fontWeight: 'bold',
    },
    value: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    zonesArea: {
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        bottom: 100,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    sensorZone: {
        width: 65,
        borderWidth: 1.5,
        borderColor: 'rgba(56, 189, 248, 0.25)',
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(56, 189, 248, 0.05)',
    },
    sensorZoneActive: {
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.4)',
    },
    sensorText: {
        color: '#38bdf8',
        fontSize: 11,
        fontWeight: 'bold',
    },
    tetrisContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    board: {
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        borderWidth: 2,
        borderColor: '#334155',
        borderRadius: 8,
        padding: 2,
    },
    gridRow: {
        flexDirection: 'row',
    },
    cell: {
        width: Math.min(screenWidth * 0.08, 24),
        height: Math.min(screenWidth * 0.08, 24),
        borderWidth: 0.5,
        borderRadius: 2,
    },
    emptyCell: {
        borderColor: 'rgba(51, 65, 85, 0.25)',
        backgroundColor: 'transparent',
    },
    controlHUD: {
        paddingBottom: 8,
        alignItems: 'center',
        width: '100%',
    },
    startBtn: {
        backgroundColor: '#2563eb',
        borderWidth: 2,
        borderColor: '#38bdf8',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 12,
    },
    startBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    activeHintBox: {
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#334155',
    },
    activeHintText: {
        color: '#cbd5e1',
        fontSize: 12,
        textAlign: 'center',
    },
    gameOverCard: {
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
    },
    gameOverText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    resetBtn: {
        backgroundColor: '#ffffff',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    resetBtnText: {
        color: '#ef4444',
        fontWeight: 'bold',
    },
});