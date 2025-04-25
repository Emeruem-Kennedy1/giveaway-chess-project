/* eslint-disable no-unused-vars */
import { Chess } from "chess.js";

export class GiveawayChess {
  constructor(fen) {
    // Initialize with the standard start position if no FEN is provided
    this._chess = new Chess(
      fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    );

    // Modify the internal chess.js implementation to disable check-related validations
    this._disableCheckValidation();

    this._forcedCaptures = [];
    this._updateForcedCaptures();
  }

  // Disable all check-related validations in chess.js
  _disableCheckValidation() {
    // Override check detection methods
    this._chess.isCheck = () => false;
    this._chess.isCheckmate = () => false;
    this._chess.inCheck = () => false;

    // Override the internal move validation to allow king captures
    // This accesses private methods in chess.js - might break with library updates
    if (this._chess._attacked) {
      const originalAttacked = this._chess._attacked;
      this._chess._attacked = function (color, square) {
        // Skip the king's square when calculating attacks
        return false;
      };
    }

    // Monkey patch other internal methods as needed
    // These might vary depending on the version of chess.js
    if (this._chess._king_attacked) {
      this._chess._king_attacked = function (color) {
        return false;
      };
    }
  }

  // Get the current position in FEN notation
  fen() {
    return this._chess.fen();
  }

  // Get the current turn ('w' or 'b')
  turn() {
    return this._chess.turn();
  }

  // Get the current board representation
  board() {
    return this._chess.board();
  }

  // Generate all moves without checking for checks
  _generateAllMoves() {
    // Get all pseudo-legal moves from chess.js
    const moves = this._chess.moves({ verbose: true });

    // Since we've disabled check validation, these should include king captures
    return moves;
  }

  // Check if the game is over (in Giveaway Chess, losing all pieces is a win)
  isGameOver() {
    // Game is over if a player has no pieces left
    if (
      this._noRemainingPieces(this.turn()) ||
      this._noRemainingPieces(this.turn() === "w" ? "b" : "w")
    ) {
      return true;
    }

    // Check for stalemate - no legal moves (including forced captures)
    const legalMoves = this.legalMoves();
    return legalMoves.length === 0;
  }

  // Check if there is a winner
  getWinner() {
    if (!this.isGameOver()) {
      return null;
    }

    // In Giveaway Chess, the player who loses all their pieces wins
    if (this._noRemainingPieces("w")) {
      return "w"; // White wins by losing all pieces
    } else if (this._noRemainingPieces("b")) {
      return "b"; // Black wins by losing all pieces
    }

    // If the current player has no legal moves, the opponent wins
    return this.turn() === "w" ? "b" : "w";
  }

  // Helper method to check if a player has no remaining pieces
  _noRemainingPieces(color) {
    const board = this.board();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          return false;
        }
      }
    }

    return true;
  }

  // Get all legal moves according to standard chess rules
  _allLegalMoves() {
    return this._generateAllMoves();
  }

  // Update the list of forced captures
  _updateForcedCaptures() {
    this._forcedCaptures = this._allLegalMoves().filter(
      (move) => move.captured
    );
  }

  // Get all legal moves according to Giveaway Chess rules
  // In Giveaway Chess, captures are forced if available
  legalMoves() {
    if (this._forcedCaptures.length > 0) {
      return this._forcedCaptures;
    }
    return this._allLegalMoves();
  }

  // Make a move
  move(moveObj) {
    // Reapply check validation override
    this._disableCheckValidation();

    // If we have forced captures, only allow those moves
    if (this._forcedCaptures.length > 0) {
      const isForced = this._forcedCaptures.some(
        (forced) => forced.from === moveObj.from && forced.to === moveObj.to
      );

      if (!isForced) {
        throw new Error("Forced capture available. Must capture a piece.");
      }
    }

    // Try to make the move with error handling
    let move;

    try {
      // Make the move using the underlying chess.js instance
      move = this._chess.move(moveObj);
    } catch (e) {
      console.error("Error in move:", e);

      // Special handling for undefined piece type errors
      if (
        e instanceof TypeError &&
        e.message.includes("Cannot read properties of undefined")
      ) {
        // Try an alternative approach - make the move directly
        try {
          // Get the piece at the source square
          const boardArr = this._chess.board();
          const fromFile = moveObj.from.charCodeAt(0) - "a".charCodeAt(0);
          const fromRank = 8 - parseInt(moveObj.from[1]);

          // Validate piece exists
          if (!boardArr[fromRank] || !boardArr[fromRank][fromFile]) {
            throw new Error("No piece at source square");
          }

          // Reset the position and try a different approach
          const fen = this._chess.fen();
          this._chess = new Chess(fen);
          this._disableCheckValidation();

          // Try the move again
          move = this._chess.move(moveObj);

          if (!move) {
            throw new Error("Move still invalid after reset");
          }
        } catch (innerError) {
          console.error("Alternative move approach failed:", innerError);
          throw new Error("Cannot make move: piece information is corrupted");
        }
      } else {
        throw new Error("Invalid move: " + e.message);
      }
    }

    if (!move) {
      throw new Error("Invalid move");
    }

    // Update forced captures for the next player
    this._disableCheckValidation();
    this._updateForcedCaptures();

    return move;
  }

  // Undo the last move
  undo() {
    const move = this._chess.undo();
    if (move) {
      // Re-apply check validation override
      this._disableCheckValidation();
      this._updateForcedCaptures();
    }
    return move;
  }

  // Reset the game
  reset() {
    this._chess.reset();

    // Re-apply check validation override
    this._disableCheckValidation();
    this._updateForcedCaptures();
  }

  // Load a position from FEN
  load(fen) {
    const result = this._chess.load(fen);
    if (result) {
      // Re-apply check validation override
      this._disableCheckValidation();
      this._updateForcedCaptures();
    }
    return result;
  }
}
