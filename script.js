const mainMenu = document.getElementById('main-menu');
const gameContainer = document.getElementById('game-container');
const boardElement = document.getElementById('board');
const undoButton = document.getElementById('undo-button');
const newGameButton = document.getElementById('new-game-button');
const homeButton = document.getElementById('home-button');
const playFriendButton = document.getElementById('play-friend-button');
const playComputerButton = document.getElementById('play-computer-button');
const statusElement = document.getElementById('status');

// Stats Elements
const winsCountEl = document.getElementById('wins-count');
const lossesCountEl = document.getElementById('losses-count');
const drawsCountEl = document.getElementById('draws-count');
const resetStatsButton = document.getElementById('reset-stats-button');

// Modal Elements
const gameOverModal = document.getElementById('game-over-modal');
const gameOverText = document.getElementById('game-over-text');
const playAgainButton = document.getElementById('play-again-button');
const modalHomeButton = document.getElementById('modal-home-button');

// Game state variables
let board = [];
let selectedSquare = null;
let turn = 'white';
let moveHistory = [];
let isGameOver = false;
let gameMode = 'friend';
let stats = { wins: 0, losses: 0, draws: 0 };

// Chess piece symbols (Unicode)
const pieceSymbols = {
    'R': '&#9814;', 'N': '&#9816;', 'B': '&#9815;', 'Q': '&#9813;', 'K': '&#9812;', 'P': '&#9817;',
    'r': '&#9820;', 'n': '&#9822;', 'b': '&#9821;', 'q': '&#9819;', 'k': '&#9818;', 'p': '&#9823;'
};

// Initial board setup
const initialBoardState = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

function initializeGame() {
    board = JSON.parse(JSON.stringify(initialBoardState));
    moveHistory = [];
    selectedSquare = null;
    turn = 'white';
    isGameOver = false;
    gameOverModal.style.display = 'none';
    updateBoardUI();
    updateStatus();
    checkKingStatus();
}

// UI Functions
function showMainMenu() {
    mainMenu.style.display = 'flex';
    gameContainer.style.display = 'none';
    gameOverModal.style.display = 'none';
    loadStats();
}

function showGame() {
    mainMenu.style.display = 'none';
    gameContainer.style.display = 'flex';
    initializeGame();
}

function updateBoardUI() {
    boardElement.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const square = document.createElement('div');
            square.classList.add('square', (i + j) % 2 === 0 ? 'white' : 'black');
            square.dataset.row = i;
            square.dataset.col = j;
            square.addEventListener('click', () => handleSquareClick(i, j));
            
            const piece = board[i][j];
            if (piece) {
                square.innerHTML = pieceSymbols[piece];
            }
            boardElement.appendChild(square);
        }
    }
}

function updateStatus() {
    if (isGameOver) {
        statusElement.textContent = `Game Over!`;
    } else {
        statusElement.textContent = `${turn}'s Turn`;
    }
}

function clearValidMovesUI() {
    document.querySelectorAll('.valid-move').forEach(el => el.classList.remove('valid-move'));
}

function showValidMovesUI(row, col) {
    clearValidMovesUI();
    const moves = getValidMoves(row, col);
    moves.forEach(move => {
        const [targetRow, targetCol] = move;
        boardElement.children[targetRow * 8 + targetCol].classList.add('valid-move');
    });
}

// Game Logic
function handleSquareClick(row, col) {
    if (isGameOver) return;
    const piece = board[row][col];
    const isPlayersPiece = (turn === 'white' && piece === piece.toUpperCase()) || (turn === 'black' && piece === piece.toLowerCase());
    if (selectedSquare) {
        const startRow = selectedSquare.row;
        const startCol = selectedSquare.col;
        if (startRow === row && startCol === col) {
            deselectSquare();
        } else {
            if (isValidMove(startRow, startCol, row, col)) {
                makeMove(startRow, startCol, row, col);
                deselectSquare();
                if (gameMode === 'computer' && !isGameOver && turn === 'black') {
                    setTimeout(makeComputerMove, 500);
                }
            } else {
                deselectSquare();
                if (isPlayersPiece) {
                    selectPiece(row, col);
                }
            }
        }
    } else if (isPlayersPiece) {
        selectPiece(row, col);
    }
}

function makeComputerMove() {
    const allLegalMoves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece === piece.toLowerCase()) {
                const moves = getValidMoves(r, c);
                moves.forEach(move => {
                    allLegalMoves.push({
                        startRow: r,
                        startCol: c,
                        endRow: move[0],
                        endCol: move[1]
                    });
                });
            }
        }
    }
    if (allLegalMoves.length > 0) {
        const randomMove = allLegalMoves[Math.floor(Math.random() * allLegalMoves.length)];
        makeMove(randomMove.startRow, randomMove.startCol, randomMove.endRow, randomMove.endCol);
    } else {
        checkGameStatus();
    }
}

function selectPiece(row, col) {
    selectedSquare = { element: boardElement.children[row * 8 + col], row, col };
    selectedSquare.element.classList.add('selected');
    showValidMovesUI(row, col);
}

function deselectSquare() {
    if (selectedSquare) {
        selectedSquare.element.classList.remove('selected');
        selectedSquare = null;
        clearValidMovesUI();
    }
}

function makeMove(startRow, startCol, endRow, endCol) {
    moveHistory.push(JSON.parse(JSON.stringify(board)));
    const piece = board[startRow][startCol];
    board[endRow][endCol] = piece;
    board[startRow][startCol] = '';
    if (piece.toLowerCase() === 'p' && (endRow === 0 || endRow === 7)) {
        board[endRow][endCol] = turn === 'white' ? 'Q' : 'q';
    }
    turn = turn === 'white' ? 'black' : 'white';
    updateBoardUI();
    updateStatus();
    checkGameStatus();
}

function undoMove() {
    if (moveHistory.length > 0) {
        board = moveHistory.pop();
        turn = turn === 'white' ? 'black' : 'white';
        isGameOver = false;
        gameOverModal.style.display = 'none';
        updateBoardUI();
        updateStatus();
        checkKingStatus();
        deselectSquare();
        if (gameMode === 'computer' && moveHistory.length > 0) {
            board = moveHistory.pop();
            turn = turn === 'white' ? 'black' : 'white';
            updateBoardUI();
            updateStatus();
            checkKingStatus();
            deselectSquare();
        }
    }
}

function getValidMoves(row, col) {
    const piece = board[row][col];
    if (!piece) return [];
    
    const isWhite = piece === piece.toUpperCase();
    let moves = [];
    const canMoveTo = (r, c) => {
        if (r < 0 || r > 7 || c < 0 || c > 7) return false;
        const targetPiece = board[r][c];
        if (targetPiece) {
            const isTargetWhite = targetPiece === targetPiece.toUpperCase();
            return isTargetWhite !== isWhite;
        }
        return true;
    };
    const isOccupiedBySameColor = (r, c) => {
        const targetPiece = board[r][c];
        if (!targetPiece) return false;
        const isTargetWhite = targetPiece === targetPiece.toUpperCase();
        return isTargetWhite === isWhite;
    };
    if (piece.toLowerCase() === 'p') {
        const direction = isWhite ? -1 : 1;
        if (canMoveTo(row + direction, col) && !board[row + direction][col]) {
            moves.push([row + direction, col]);
            if ((isWhite && row === 6) || (!isWhite && row === 1)) {
                if (!board[row + 2 * direction][col]) {
                    moves.push([row + 2 * direction, col]);
                }
            }
        }
        if (col > 0 && board[row + direction][col - 1] && !isOccupiedBySameColor(row + direction, col - 1)) {
            moves.push([row + direction, col - 1]);
        }
        if (col < 7 && board[row + direction][col + 1] && !isOccupiedBySameColor(row + direction, col + 1)) {
            moves.push([row + direction, col + 1]);
        }
    }
    if (piece.toLowerCase() === 'n') {
        const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        knightMoves.forEach(d => {
            const newRow = row + d[0];
            const newCol = col + d[1];
            if (canMoveTo(newRow, newCol)) {
                moves.push([newRow, newCol]);
            }
        });
    }
    if (piece.toLowerCase() === 'b' || piece.toLowerCase() === 'q') {
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        directions.forEach(d => {
            for (let i = 1; i < 8; i++) {
                const newRow = row + d[0] * i;
                const newCol = col + d[1] * i;
                if (!canMoveTo(newRow, newCol)) break;
                moves.push([newRow, newCol]);
                if (board[newRow][newCol]) break;
            }
        });
    }
    if (piece.toLowerCase() === 'r' || piece.toLowerCase() === 'q') {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        directions.forEach(d => {
            for (let i = 1; i < 8; i++) {
                const newRow = row + d[0] * i;
                const newCol = col + d[1] * i;
                if (!canMoveTo(newRow, newCol)) break;
                moves.push([newRow, newCol]);
                if (board[newRow][newCol]) break;
            }
        });
    }
    if (piece.toLowerCase() === 'k') {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
        directions.forEach(d => {
            const newRow = row + d[0];
            const newCol = col + d[1];
            if (canMoveTo(newRow, newCol)) {
                moves.push([newRow, newCol]);
            }
        });
    }
    return moves.filter(move => {
        const [targetRow, targetCol] = move;
        const tempBoard = JSON.parse(JSON.stringify(board));
        const movedPiece = tempBoard[row][col];
        tempBoard[targetRow][targetCol] = movedPiece;
        tempBoard[row][col] = '';
        const kingPos = findKingPosition(tempBoard, isWhite);
        return !isSquareUnderAttack(kingPos.row, kingPos.col, isWhite ? 'black' : 'white', tempBoard);
    });
}

function isValidMove(startRow, startCol, endRow, endCol) {
    const validMoves = getValidMoves(startRow, startCol);
    return validMoves.some(move => move[0] === endRow && move[1] === endCol);
}

function isSquareUnderAttack(row, col, attackingColor, currentBoard = board) {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = currentBoard[i][j];
            if (piece) {
                const isAttackingPieceWhite = piece === piece.toUpperCase();
                const isAttackingPieceColor = isAttackingPieceWhite ? 'white' : 'black';
                if (isAttackingPieceColor === attackingColor) {
                    const attackingMoves = getPseudoLegalMoves(i, j, currentBoard);
                    if (attackingMoves.some(move => move[0] === row && move[1] === col)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function getPseudoLegalMoves(row, col, currentBoard) {
    const piece = currentBoard[row][col];
    if (!piece) return [];
    const isWhite = piece === piece.toUpperCase();
    let moves = [];
    const canMoveTo = (r, c) => {
        if (r < 0 || r > 7 || c < 0 || c > 7) return false;
        const targetPiece = currentBoard[r][c];
        if (targetPiece) {
            const isTargetWhite = targetPiece === targetPiece.toUpperCase();
            return isTargetWhite !== isWhite;
        }
        return true;
    };
    if (piece.toLowerCase() === 'p') {
        const direction = isWhite ? -1 : 1;
        if (canMoveTo(row + direction, col) && !currentBoard[row + direction][col]) {
            moves.push([row + direction, col]);
        }
        if (col > 0 && currentBoard[row + direction][col - 1] && !((isWhite && currentBoard[row + direction][col - 1] === currentBoard[row + direction][col - 1].toUpperCase()) || (!isWhite && currentBoard[row + direction][col - 1] === currentBoard[row + direction][col - 1].toLowerCase()))) {
            moves.push([row + direction, col - 1]);
        }
        if (col < 7 && currentBoard[row + direction][col + 1] && !((isWhite && currentBoard[row + direction][col + 1] === currentBoard[row + direction][col + 1].toUpperCase()) || (!isWhite && currentBoard[row + direction][col + 1] === currentBoard[row + direction][col + 1].toLowerCase()))) {
            moves.push([row + direction, col + 1]);
        }
    }
    if (piece.toLowerCase() === 'n') {
        const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        knightMoves.forEach(d => {
            const newRow = row + d[0];
            const newCol = col + d[1];
            if (canMoveTo(newRow, newCol)) {
                moves.push([newRow, newCol]);
            }
        });
    }
    if (piece.toLowerCase() === 'b' || piece.toLowerCase() === 'q') {
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        directions.forEach(d => {
            for (let i = 1; i < 8; i++) {
                const newRow = row + d[0] * i;
                const newCol = col + d[1] * i;
                if (!canMoveTo(newRow, newCol)) break;
                moves.push([newRow, newCol]);
                if (currentBoard[newRow][newCol]) break;
            }
        });
    }
    if (piece.toLowerCase() === 'r' || piece.toLowerCase() === 'q') {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        directions.forEach(d => {
            for (let i = 1; i < 8; i++) {
                const newRow = row + d[0] * i;
                const newCol = col + d[1] * i;
                if (!canMoveTo(newRow, newCol)) break;
                moves.push([newRow, newCol]);
                if (currentBoard[newRow][newCol]) break;
            }
        });
    }
    if (piece.toLowerCase() === 'k') {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
        directions.forEach(d => {
            const newRow = row + d[0];
            const newCol = col + d[1];
            if (canMoveTo(newRow, newCol)) {
                moves.push([newRow, newCol]);
            }
        });
    }
    return moves;
}

function findKingPosition(currentBoard, isWhite) {
    const kingSymbol = isWhite ? 'K' : 'k';
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (currentBoard[i][j] === kingSymbol) {
                return { row: i, col: j };
            }
        }
    }
    return null;
}

function checkKingStatus() {
    const kingPos = findKingPosition(board, turn === 'white');
    if (kingPos) {
        const kingSquare = boardElement.children[kingPos.row * 8 + kingPos.col];
        document.querySelectorAll('.king-in-check').forEach(el => el.classList.remove('king-in-check'));
        if (isSquareUnderAttack(kingPos.row, kingPos.col, turn === 'white' ? 'black' : 'white')) {
            kingSquare.classList.add('king-in-check');
        }
    }
}

function checkGameStatus() {
    const allLegalMoves = [];
    const currentPlayer = turn;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece) {
                const isPlayersPiece = (currentPlayer === 'white' && piece === piece.toUpperCase()) || (currentPlayer === 'black' && piece === piece.toLowerCase());
                if (isPlayersPiece) {
                    const moves = getValidMoves(r, c);
                    if (moves.length > 0) {
                        allLegalMoves.push(...moves);
                    }
                }
            }
        }
    }
    if (allLegalMoves.length === 0) {
        isGameOver = true;
        const kingPos = findKingPosition(board, currentPlayer === 'white');
        const inCheck = isSquareUnderAttack(kingPos.row, kingPos.col, currentPlayer === 'white' ? 'black' : 'white');

        if (inCheck) {
            gameOverText.textContent = `Checkmate! ${currentPlayer === 'white' ? 'Black' : 'White'} wins!`;
            if (gameMode === 'computer') {
                if (currentPlayer === 'white') {
                    stats.losses++;
                } else {
                    stats.wins++;
                }
            }
        } else {
            gameOverText.textContent = `Stalemate! It's a draw!`;
            if (gameMode === 'computer') {
                stats.draws++;
            }
        }
        if (gameMode === 'computer') {
            saveStats();
        }
        gameOverModal.style.display = 'flex';
        updateStatus();
    } else {
        checkKingStatus();
    }
}

// Stats functions
function loadStats() {
    const savedStats = localStorage.getItem('chessStats');
    if (savedStats) {
        stats = JSON.parse(savedStats);
    }
    updateStatsUI();
}

function saveStats() {
    localStorage.setItem('chessStats', JSON.stringify(stats));
    updateStatsUI();
}

function updateStatsUI() {
    winsCountEl.textContent = stats.wins;
    lossesCountEl.textContent = stats.losses;
    drawsCountEl.textContent = stats.draws;
}

function resetStats() {
    stats = { wins: 0, losses: 0, draws: 0 };
    saveStats();
}

// Event Listeners
homeButton.addEventListener('click', showMainMenu);
modalHomeButton.addEventListener('click', showMainMenu);
playFriendButton.addEventListener('click', () => {
    gameMode = 'friend';
    showGame();
});
playComputerButton.addEventListener('click', () => {
    gameMode = 'computer';
    showGame();
});
newGameButton.addEventListener('click', initializeGame);
playAgainButton.addEventListener('click', initializeGame);
undoButton.addEventListener('click', undoMove);
resetStatsButton.addEventListener('click', resetStats);

// Initial screen
showMainMenu();