const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");
const capturedWhite = document.getElementById("captured-white");
const capturedBlack = document.getElementById("captured-black");
const turnIndicator = document.getElementById("turn-indicator");
const roleIndicator = document.getElementById("role-indicator");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let capturedPieces = [];

// Get Unicode symbol for each piece
const getPieceUnicode = (piece) => {
  const unicode = {
    p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
    P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
  };
  if (!piece) return "";
  const code = piece.color === "w" ? piece.type.toUpperCase() : piece.type.toLowerCase();
  return unicode[code] || "";
};

// Render the board
const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";

  turnIndicator.textContent = `Turn: ${chess.turn() === "w" ? "White" : "Black"}`;
  boardElement.classList.remove("flipped");

  const rowIndices = playerRole === "b" ? [...Array(8).keys()].reverse() : [...Array(8).keys()];
  const colIndices = playerRole === "b" ? [...Array(8).keys()].reverse() : [...Array(8).keys()];

  rowIndices.forEach((rowIndex) => {
    colIndices.forEach((colIndex) => {
      const square = board[rowIndex][colIndex];

      const squareElement = document.createElement("div");
      squareElement.classList.add("square", (rowIndex + colIndex) % 2 === 0 ? "light" : "dark");
      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = colIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: colIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", () => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => e.preventDefault());

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };
          handleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  renderCapturedPieces();
};


const renderCapturedPieces = () => {
  capturedWhite.innerHTML = "";
  capturedBlack.innerHTML = "";
  capturedPieces.forEach(piece => {
    const el = document.createElement("span");
    el.textContent = getPieceUnicode({ type: piece.type, color: piece.color });
    if (piece.color === "w") {
      capturedWhite.appendChild(el);
    } else {
      capturedBlack.appendChild(el);
    }
  });
};


const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q"
  };
  socket.emit("move", move);
};


socket.on("playerRole", (role) => {
  playerRole = role;
  roleIndicator.innerHTML = `You are: <span class="font-bold">${role === "w" ? "White" : "Black"}</span>`;
  renderBoard();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  roleIndicator.innerHTML = `You are: <span class="font-bold">Spectator</span>`;
  renderBoard();
});


socket.on("boardState", (fen) => {
  const oldBoard = chess.board().flat();
  chess.load(fen);
  const newBoard = chess.board().flat();

  capturedPieces = [];
  newBoard.forEach((piece, i) => {
    if (piece === null && oldBoard[i]) {
      capturedPieces.push(oldBoard[i]); 
    }
  });

  renderBoard();
});


socket.on("invalidMove", (move) => {
  alert("Invalid move attempted!");
});

socket.on("move", (move) => {
  
});


renderBoard();
