import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useCameraPermissions } from 'expo-camera';
import { useTetrisController } from './src/controllers/TetrisController';
import { TetrisView } from './src/views/TetrisView';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const controller = useTetrisController();

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.infoText}>Comprobando permisos de cámara...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionMessage}>
          Se requiere acceso a la cámara frontal para controlar el Tetris con gestos.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <TetrisView
        grid={controller.grid}
        currentPiece={controller.currentPiece}
        score={controller.score}
        linesCleared={controller.linesCleared}
        gameOver={controller.gameOver}
        isPlaying={controller.isPlaying}
        onMoveLeft={controller.moveLeft}
        onMoveRight={controller.moveRight}
        onRotate={controller.rotate}
        onHardDrop={controller.hardDrop}
        onStartGame={controller.startGame}
        onResetGame={controller.resetGame}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  infoText: { color: '#94a3b8', fontSize: 16 },
  permissionMessage: {
    textAlign: 'center',
    color: '#f8fafc',
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});