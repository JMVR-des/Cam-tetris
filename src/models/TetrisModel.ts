export const COLS = 10;
export const ROWS = 20;

export const SHAPE_COLORS: Record<number, string> = {
    1: '#ef4444', // I - Rojo
    2: '#3b82f6', // O - Azul
    3: '#10b981', // T - Verde
    4: '#f59e0b', // S - Naranja
    5: '#8b5cf6', // Z - Violeta
    6: '#ec4899', // J - Rosa
    7: '#06b6d4', // L - Cian
};

export const TETROMINOS = [
    [], // Vacío
    [[1, 1, 1, 1]], // I
    [[2, 2], [2, 2]], // O
    [[0, 3, 0], [3, 3, 3]], // T
    [[0, 4, 4], [4, 4, 0]], // S
    [[5, 5, 0], [0, 5, 5]], // Z
    [[6, 0, 0], [6, 6, 6]], // J
    [[0, 0, 7], [7, 7, 7]], // L
];

export interface Piece {
    shape: number[][];
    x: number;
    y: number;
    type: number;
}

export class TetrisModel {
    static createEmptyGrid(): number[][] {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    static getRandomPiece(): Piece {
        const type = Math.floor(Math.random() * 7) + 1;
        const shape = TETROMINOS[type];
        const x = Math.floor((COLS - shape[0].length) / 2);
        return { shape, x, y: 0, type };
    }

    static checkCollision(shape: number[][], offsetX: number, offsetY: number, grid: number[][]): boolean {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] !== 0) {
                    const nextX = offsetX + c;
                    const nextY = offsetY + r;

                    if (nextX < 0 || nextX >= COLS || nextY >= ROWS) {
                        return true;
                    }

                    if (nextY >= 0 && grid[nextY][nextX] !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    static mergePiece(shape: number[][], x: number, y: number, grid: number[][]): number[][] {
        const newGrid = grid.map((row) => [...row]);
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] !== 0) {
                    const targetY = y + r;
                    const targetX = x + c;
                    if (targetY >= 0 && targetY < ROWS && targetX >= 0 && targetX < COLS) {
                        newGrid[targetY][targetX] = shape[r][c];
                    }
                }
            }
        }
        return newGrid;
    }

    static clearFullLines(grid: number[][]): { newGrid: number[][]; linesCleared: number } {
        let lines = 0;
        const filteredGrid = grid.filter((row) => {
            const isFull = row.every((cell) => cell !== 0);
            if (isFull) lines++;
            return !isFull;
        });

        while (filteredGrid.length < ROWS) {
            filteredGrid.unshift(Array(COLS).fill(0));
        }

        return { newGrid: filteredGrid, linesCleared: lines };
    }
}