class GobangGame {
    constructor() {
        this.boardSize = 15;
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1; // 1: 黑子, 2: 白子
        this.gameOver = false;
        this.difficulty = 'easy'; // easy, medium, hard
        this.isAITurn = false;

        this.initializeBoard();
        this.bindEvents();
        this.updateDisplay();
    }

    initializeBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';

        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', () => this.handleCellClick(i, j));
                boardElement.appendChild(cell);
            }
        }
    }

    bindEvents() {
        // 难度选择
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.difficulty = e.target.dataset.level;
                this.resetGame();
            });
        });

        // 重置按钮
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
    }

    handleCellClick(row, col) {
        if (this.gameOver || this.isAITurn || this.board[row][col] !== 0) {
            return;
        }

        // 先下棋，再切换玩家
        const result = this.makeMove(row, col, this.currentPlayer);

        if (result && !this.gameOver) {
            // 切换到下一个玩家（如果是白子，则让AI下棋）
            this.switchPlayer();
            this.updateDisplay();

            // 如果是白子回合（AI），则让AI下棋
            if (this.currentPlayer === 2 && !this.gameOver) {
                this.isAITurn = true;
                setTimeout(() => {
                    this.aiMove();
                    this.isAITurn = false;
                }, 500);
            }
        }
    }

    makeMove(row, col, player) {
        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize || this.board[row][col] !== 0) {
            return false;
        }

        this.board[row][col] = player;
        this.drawPiece(row, col, player);

        if (this.checkWin(row, col, player)) {
            this.gameOver = true;
            const message = player === 1 ? '恭喜你获胜！' : '很遗憾，你输了！';
            this.showMessage(message, 'win-message');
        } else if (this.isBoardFull()) {
            this.gameOver = true;
            this.showMessage('平局！', 'draw-message');
        }

        return true;
    }

    drawPiece(row, col, player) {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cell.innerHTML = '';

        if (player === 1) {
            const piece = document.createElement('div');
            piece.className = 'piece-black';
            cell.appendChild(piece);
        } else if (player === 2) {
            const piece = document.createElement('div');
            piece.className = 'piece-white';
            cell.appendChild(piece);
        }
    }

    checkWin(row, col, player) {
        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 对角线 \
            [1, -1]   // 对角线 /
        ];

        for (let [dx, dy] of directions) {
            let count = 1; // 包括当前位置

            // 向一个方向检查
            count += this.countDirection(row, col, dx, dy, player);
            // 向相反方向检查
            count += this.countDirection(row, col, -dx, -dy, player);

            if (count >= 5) {
                return true;
            }
        }

        return false;
    }

    countDirection(row, col, dx, dy, player) {
        let count = 0;
        let x = row + dx;
        let y = col + dy;

        while (x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize && this.board[x][y] === player) {
            count++;
            x += dx;
            y += dy;
        }

        return count;
    }

    isBoardFull() {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    }

    aiMove() {
        if (this.gameOver) return;

        let move;

        switch (this.difficulty) {
            case 'easy':
                move = this.getEasyAIMove();
                break;
            case 'medium':
                move = this.getMediumAIMove();
                break;
            case 'hard':
                move = this.getHardAIMove();
                break;
            default:
                move = this.getEasyAIMove();
        }

        if (move) {
            this.makeMove(move.row, move.col, this.currentPlayer);
        }
    }

    getEasyAIMove() {
        // 简单难度：随机选择空位
        const emptyCells = [];
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === 0) {
                    emptyCells.push({row: i, col: j});
                }
            }
        }

        if (emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            return emptyCells[randomIndex];
        }

        return null;
    }

    getMediumAIMove() {
        // 中等难度：优先考虑防守和进攻
        // 先检查是否有能赢的棋
        const winningMove = this.findWinningMove(2);
        if (winningMove) return winningMove;

        // 再检查是否需要防守
        const defensiveMove = this.findWinningMove(1);
        if (defensiveMove) return defensiveMove;

        // 最后随机选择
        return this.getEasyAIMove();
    }

    getHardAIMove() {
        // 困难难度：使用Minimax算法
        const bestMove = this.minimax(this.board, 2, 0, -Infinity, Infinity, true);
        return bestMove.move;
    }

    minimax(board, player, depth, alpha, beta, isMaximizing) {
        // 检查是否结束
        if (depth > 3) {
            return { score: this.evaluateBoard(board) };
        }

        const emptyCells = [];
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (board[i][j] === 0) {
                    emptyCells.push({row: i, col: j});
                }
            }
        }

        if (emptyCells.length === 0) {
            return { score: this.evaluateBoard(board) };
        }

        let bestMove = null;
        let bestScore;

        if (isMaximizing) {
            bestScore = -Infinity;
            for (const move of emptyCells) {
                board[move.row][move.col] = 2; // AI是白子
                const result = this.minimax(board, 1, depth + 1, alpha, beta, false);
                board[move.row][move.col] = 0; // 回溯

                if (result.score > bestScore) {
                    bestScore = result.score;
                    bestMove = move;
                }

                alpha = Math.max(alpha, bestScore);
                if (beta <= alpha) {
                    break; // Alpha-beta剪枝
                }
            }
        } else {
            bestScore = Infinity;
            for (const move of emptyCells) {
                board[move.row][move.col] = 1; // 玩家是黑子
                const result = this.minimax(board, 2, depth + 1, alpha, beta, true);
                board[move.row][move.col] = 0; // 回溯

                if (result.score < bestScore) {
                    bestScore = result.score;
                    bestMove = move;
                }

                beta = Math.min(beta, bestScore);
                if (beta <= alpha) {
                    break; // Alpha-beta剪枝
                }
            }
        }

        return { move: bestMove, score: bestScore };
    }

    evaluateBoard(board) {
        // 评估函数：计算局面得分
        let score = 0;

        // 检查所有方向
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (board[i][j] !== 0) {
                    const player = board[i][j];
                    for (let [dx, dy] of directions) {
                        let count = 1;
                        let blocked = 0;

                        // 正向
                        let x = i + dx;
                        let y = j + dy;
                        while (x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize && board[x][y] === player) {
                            count++;
                            x += dx;
                            y += dy;
                        }
                        if (x < 0 || x >= this.boardSize || y < 0 || y >= this.boardSize || board[x][y] !== 0) {
                            blocked++;
                        }

                        // 反向
                        x = i - dx;
                        y = j - dy;
                        while (x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize && board[x][y] === player) {
                            count++;
                            x -= dx;
                            y -= dy;
                        }
                        if (x < 0 || x >= this.boardSize || y < 0 || y >= this.boardSize || board[x][y] !== 0) {
                            blocked++;
                        }

                        // 根据连子数和阻挡情况评分
                        if (count >= 5) {
                            score += player === 2 ? 100000 : 100000;
                        } else if (count === 4 && blocked === 0) {
                            score += player === 2 ? 10000 : 1000;
                        } else if (count === 4 && blocked === 1) {
                            score += player === 2 ? 1000 : 100;
                        } else if (count === 3 && blocked === 0) {
                            score += player === 2 ? 1000 : 100;
                        } else if (count === 3 && blocked === 1) {
                            score += player === 2 ? 100 : 10;
                        } else if (count === 2 && blocked === 0) {
                            score += player === 2 ? 100 : 10;
                        }
                    }
                }
            }
        }

        return score;
    }

    findWinningMove(player) {
        // 检查是否存在可以获胜的移动
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === 0) {
                    this.board[i][j] = player;
                    if (this.checkWin(i, j, player)) {
                        this.board[i][j] = 0;
                        return {row: i, col: j};
                    }
                    this.board[i][j] = 0;
                }
            }
        }
        return null;
    }

    showMessage(text, className) {
        const messageElement = document.getElementById('message');
        messageElement.textContent = text;
        messageElement.className = 'message ' + className;
    }

    updateDisplay() {
        const currentPlayerElement = document.getElementById('current-player');
        currentPlayerElement.textContent = `当前玩家: ${this.currentPlayer === 1 ? '黑子' : '白子'}`;

        // 更新当前玩家高亮
        const playerIcons = document.querySelectorAll('.player-icon');
        playerIcons.forEach(icon => icon.style.opacity = '0.5');
        if (this.currentPlayer === 1) {
            document.querySelector('.black-player').style.opacity = '1';
        } else {
            document.querySelector('.white-player').style.opacity = '1';
        }
    }

    resetGame() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.isAITurn = false;

        this.initializeBoard();
        this.updateDisplay();
        this.showMessage('', '');
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new GobangGame();
});