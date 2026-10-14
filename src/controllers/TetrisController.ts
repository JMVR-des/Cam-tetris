import { useState, useEffect, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { TetrisModel, Piece } from '../models/TetrisModel';

export function useTetrisController() {
    const [grid, setGrid] = useState<number[][]>(() => TetrisModel.createEmptyGrid());
    const [currentPiece, setCurrentPiece] = useState<Piece>({ shape: [], x: 0, y: 0, type: 0 });
    const [score, setScore] = useState<number>(0);
    const [linesCleared, setLinesCleared] = useState<number>(0);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    const gridRef = useRef(grid);
    const currentPieceRef = useRef(currentPiece);
    const isPlayingRef = useRef(isPlaying);
    const gameInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    gridRef.current = grid;
    currentPieceRef.current = currentPiece;
    isPlayingRef.current = isPlaying;

    const spawnPiece = useCallback(() => {
        const newPiece = TetrisModel.getRandomPiece();
        if (TetrisModel.checkCollision(newPiece.shape, newPiece.x, newPiece.y, gridRef.current)) {
            setGameOver(true);
            setIsPlaying(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        setCurrentPiece(newPiece);
    }, []);

    const moveDown = useCallback(() => {
        if (gameOver) return;
        const { shape, x, y } = currentPieceRef.current;
        if (!shape.length) return;

        if (!TetrisModel.checkCollision(shape, x, y + 1, gridRef.current)) {
            setCurrentPiece((prev) => ({ ...prev, y: prev.y + 1 }));
        } else {
            const nextGrid = TetrisModel.mergePiece(shape, x, y, gridRef.current);
            const { newGrid, linesCleared: cleared } = TetrisModel.clearFullLines(nextGrid);

            setGrid(newGrid);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            if (cleared > 0) {
                setScore((prev) => prev + cleared * 100);
                setLinesCleared((prev) => prev + cleared);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            spawnPiece();
        }
    }, [gameOver, spawnPiece]);

    const moveLeft = () => {
        const { shape, x, y } = currentPieceRef.current;
        if (!shape.length || gameOver) return;
        if (!TetrisModel.checkCollision(shape, x - 1, y, gridRef.current)) {
            setCurrentPiece((prev) => ({ ...prev, x: prev.x - 1 }));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const moveRight = () => {
        const { shape, x, y } = currentPieceRef.current;
        if (!shape.length || gameOver) return;
        if (!TetrisModel.checkCollision(shape, x + 1, y, gridRef.current)) {
            setCurrentPiece((prev) => ({ ...prev, x: prev.x + 1 }));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const rotate = () => {
        const { shape, x, y } = currentPieceRef.current;
        if (!shape.length || gameOver) return;

        const rotated = shape[0].map((_, index) =>
            shape.map((row) => row[index]).reverse()
        );

        if (!TetrisModel.checkCollision(rotated, x, y, gridRef.current)) {
            setCurrentPiece((prev) => ({ ...prev, shape: rotated }));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const hardDrop = () => {
        const { shape, x, y } = currentPieceRef.current;
        if (!shape.length || gameOver) return;

        let finalY = y;
        while (!TetrisModel.checkCollision(shape, x, finalY + 1, gridRef.current)) {
            finalY++;
        }

        const nextGrid = TetrisModel.mergePiece(shape, x, finalY, gridRef.current);
        const { newGrid, linesCleared: cleared } = TetrisModel.clearFullLines(nextGrid);

        setGrid(newGrid);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        if (cleared > 0) {
            setScore((prev) => prev + cleared * 100);
            setLinesCleared((prev) => prev + cleared);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        spawnPiece();
    };

    const startGame = () => {
        if (isPlayingRef.current) return;
        setIsPlaying(true);
        setGameOver(false);
        if (!currentPieceRef.current.shape.length) {
            spawnPiece();
        }
    };

    const resetGame = () => {
        setGrid(TetrisModel.createEmptyGrid());
        setScore(0);
        setLinesCleared(0);
        setGameOver(false);
        setIsPlaying(false);
        setCurrentPiece({ shape: [], x: 0, y: 0, type: 0 });
    };

    useEffect(() => {
        if (isPlaying && !gameOver) {
            gameInterval.current = setInterval(() => {
                moveDown();
            }, 1000);
        } else {
            if (gameInterval.current) clearInterval(gameInterval.current);
        }
        return () => {
            if (gameInterval.current) clearInterval(gameInterval.current);
        };
    }, [isPlaying, gameOver, moveDown]);

    return {
        grid,
        currentPiece,
        score,
        linesCleared,
        gameOver,
        isPlaying,
        moveLeft,
        moveRight,
        rotate,
        hardDrop,
        startGame,
        resetGame,
    };
}