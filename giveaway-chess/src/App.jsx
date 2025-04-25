import { useState, useEffect, useCallback } from "react";
import { Chessboard } from "react-chessboard";
import "./App.css";
import axios from "axios";
import { GiveawayChess } from "./giveawayChess";

function App() {
  const [game, setGame] = useState(new GiveawayChess());
  const [boardPosition, setBoardPosition] = useState("start");
  const [moveHistory, setMoveHistory] = useState([]);
  const [playerColor, setPlayerColor] = useState("w");
  const [gameStatus, setGameStatus] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [boardWidth, setBoardWidth] = useState(500);
  // Add state for piece selection and highlighting
  const [pieceSquare, setPieceSquare] = useState("");
  const [squareStyles, setSquareStyles] = useState({});
  // Add state for last move
  const [lastMove, setLastMove] = useState(null);

  // Create a custom game instance for Giveaway Chess
  // Note: This will need modification to implement Giveaway Chess rules
  // For now, we're using standard chess rules as placeholders

  useEffect(() => {
    // Handle responsive board sizing
    const handleResize = () => {
      const width = Math.min(
        window.innerWidth - 40,
        window.innerHeight - 200,
        600
      );
      setBoardWidth(width);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Request AI move from the Flask backend
  const requestAiMove = useCallback(async () => {
    if (game.isGameOver() || playerColor === game.turn()) return;

    setIsThinking(true);
    try {
      const response = await axios.post("/api/get_ai_move", {
        fen: game.fen(),
        move_history: moveHistory,
      });

      console.log("AI move response:", response.data);

      const aiMove = response.data.move;
      if (aiMove) {
        makeMove(aiMove.from, aiMove.to);
      }
    } catch (error) {
      console.error("Error getting AI move:", error);
    } finally {
      setIsThinking(false);
    }
  }, [game, moveHistory, playerColor]);

  // Check if the game state has changed and the AI should move
  useEffect(() => {
    if (game.turn() !== playerColor && !game.isGameOver()) {
      requestAiMove();
    }

    // Update game status
    if (game.isGameOver()) {
      const winner = game.getWinner();
      if (winner) {
        setGameStatus(`Game over! ${winner === "w" ? "White" : "Black"} wins!`);
      } else {
        setGameStatus("Game ended in a draw");
      }
    } else {
      setGameStatus(`${game.turn() === "w" ? "White" : "Black"} to move`);
    }
  }, [game, playerColor, requestAiMove]);

  // Function to handle piece movement
  function makeMove(sourceSquare, targetSquare) {
    try {
      // In Giveaway Chess, captures are forced
      // This will need custom logic to enforce that rule
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // Always promote to queen for simplicity
      });

      if (move) {
        setBoardPosition(game.fen());
        setMoveHistory([...moveHistory, move]);

        // Set the last move for highlighting
        setLastMove({ from: sourceSquare, to: targetSquare });

        // Clear highlighted squares after move
        setPieceSquare("");
        setSquareStyles({});

        return true;
      }
    } catch (error) {
      console.error("Invalid move:", error);
    }
    return false;
  }

  // Highlight legal moves for the selected piece
  const highlightLegalMoves = useCallback(
    (square) => {
      // Reset styles
      const newStyles = {};

      // Add last move highlighting if available
      if (lastMove) {
        newStyles[lastMove.from] = {
          backgroundColor: "rgba(155, 199, 232, 0.6)", // Light blue for source square
        };
        newStyles[lastMove.to] = {
          backgroundColor: "rgba(155, 199, 232, 0.6)", // Light blue for target square
        };
      }

      // Exit if it's not the player's turn
      if (game.turn() !== playerColor || game.isGameOver()) {
        setSquareStyles(newStyles);
        return;
      }

      // Add selected square style (overrides last move highlight if same square)
      newStyles[square] = {
        backgroundColor: "rgba(255, 217, 102, 0.6)", // Yellow for selected piece
      };

      // Get legal moves for the current position
      const legalMoves = game.legalMoves();

      // Find moves for the selected piece
      const movesForPiece = legalMoves.filter((move) => move.from === square);

      // Add styles for possible destination squares
      movesForPiece.forEach((move) => {
        newStyles[move.to] = {
          // Different styles for captures vs non-captures
          backgroundColor: move.captured
            ? "rgba(255, 97, 97, 0.6)" // Capture - red highlight
            : "rgba(97, 218, 97, 0.6)", // Normal move - green highlight
        };
      });

      // Update styles
      setSquareStyles(newStyles);
    },
    [game, playerColor, lastMove]
  );

  // Handle piece click to show legal moves
  const onSquareClick = useCallback(
    (square) => {
      // If we already have a piece selected
      if (pieceSquare) {
        // Try to make a move from selected piece to clicked square
        const moveSuccess = makeMove(pieceSquare, square);

        // If move wasn't successful, select the new square if it has a piece
        if (!moveSuccess) {
          const piece = game
            .board()
            .flat()
            .find((p) => p && p.square === square);
          if (piece && piece.color === playerColor) {
            setPieceSquare(square);
            highlightLegalMoves(square);
          } else {
            // Clear selection if clicking on empty square or opponent's piece
            setPieceSquare("");
            setSquareStyles({});
            // Restore last move highlight
            if (lastMove) {
              const newStyles = {
                [lastMove.from]: {
                  backgroundColor: "rgba(155, 199, 232, 0.6)",
                },
                [lastMove.to]: { backgroundColor: "rgba(155, 199, 232, 0.6)" },
              };
              setSquareStyles(newStyles);
            }
          }
        }
      } else {
        // Check if there's a piece on the clicked square
        const piece = game
          .board()
          .flat()
          .find((p) => p && p.square === square);
        if (piece && piece.color === playerColor) {
          setPieceSquare(square);
          highlightLegalMoves(square);
        }
      }
    },
    [pieceSquare, game, playerColor, highlightLegalMoves, lastMove]
  );

  function onDrop(sourceSquare, targetSquare) {
    if (game.turn() !== playerColor || game.isGameOver()) return false;

    // Clear highlighted squares
    setPieceSquare("");
    setSquareStyles({});

    return makeMove(sourceSquare, targetSquare);
  }

  function resetGame() {
    const newGame = new GiveawayChess();
    setGame(newGame);
    setBoardPosition("start");
    setMoveHistory([]);
    setGameStatus(`${newGame.turn() === "w" ? "White" : "Black"} to move`);
    setPieceSquare("");
    setSquareStyles({});
    setLastMove(null); // Clear the last move
  }

  function undoMove() {
    if (moveHistory.length < 2) return; // Need at least 2 moves to undo (player + AI)

    game.undo(); // Undo AI move
    game.undo(); // Undo player move

    setBoardPosition(game.fen());

    const newMoveHistory = moveHistory.slice(0, -2);
    setMoveHistory(newMoveHistory);
    setPieceSquare("");

    // Set last move to the previous move, or null if no moves left
    if (newMoveHistory.length > 0) {
      const prevMove = newMoveHistory[newMoveHistory.length - 1];
      setLastMove({ from: prevMove.from, to: prevMove.to });
      // Update square styles to show the last move highlight
      const newStyles = {
        [prevMove.from]: { backgroundColor: "rgba(155, 199, 232, 0.6)" },
        [prevMove.to]: { backgroundColor: "rgba(155, 199, 232, 0.6)" },
      };
      setSquareStyles(newStyles);
    } else {
      setLastMove(null);
      setSquareStyles({});
    }
  }

  function switchSides() {
    setPlayerColor(playerColor === "w" ? "b" : "w");
    setPieceSquare("");

    // Keep last move highlighting when switching sides
    if (lastMove) {
      const newStyles = {
        [lastMove.from]: { backgroundColor: "rgba(155, 199, 232, 0.6)" },
        [lastMove.to]: { backgroundColor: "rgba(155, 199, 232, 0.6)" },
      };
      setSquareStyles(newStyles);
    } else {
      setSquareStyles({});
    }
  }

  // Add this useEffect to ensure last move highlighting is visible when no piece is selected
  useEffect(() => {
    if (!pieceSquare && lastMove) {
      const newStyles = {
        [lastMove.from]: { backgroundColor: "rgba(155, 199, 232, 0.6)" },
        [lastMove.to]: { backgroundColor: "rgba(155, 199, 232, 0.6)" },
      };
      setSquareStyles(newStyles);
    }
  }, [pieceSquare, lastMove]);

  return (
    <div className="app-container">
      <h1>Giveaway Chess AI</h1>

      <div className="game-container">
        <div className="board-container">
          <Chessboard
            id="giveaway-chess"
            position={boardPosition}
            onPieceDrop={onDrop}
            onSquareClick={onSquareClick}
            boardWidth={boardWidth}
            boardOrientation={playerColor === "w" ? "white" : "black"}
            customBoardStyle={{
              borderRadius: "4px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
            }}
            customSquareStyles={squareStyles}
          />
        </div>

        <div className="game-info">
          <div className="status">
            {isThinking ? "AI is thinking..." : gameStatus}
          </div>

          <div className="controls">
            <button onClick={resetGame}>New Game</button>
            <button onClick={undoMove} disabled={moveHistory.length < 2}>
              Undo Move
            </button>
            <button onClick={switchSides}>Switch Sides</button>
          </div>

          <div className="move-history">
            <h3>Move History</h3>
            <div className="moves-list">
              {moveHistory.map((move, index) => (
                <div key={index} className="move-item">
                  {index % 2 === 0 ? `${Math.floor(index / 2) + 1}. ` : ""}
                  {move.san}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
