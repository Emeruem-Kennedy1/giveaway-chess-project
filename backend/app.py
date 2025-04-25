from flask import Flask, request, jsonify # noqa
import chess

# Import our custom implementations
from giveaway_chess.rules import GiveawayChessBoard, GiveawayChessRules # noqa
from ai.search import IterativeDeepeningSearch

app = Flask(__name__)


class GiveawayChessAI:
    def __init__(self, time_limit=3.0, max_depth=5):
        """
        Initialize the Giveaway Chess AI.

        Args:
            time_limit: Time limit for the search in seconds
            max_depth: Maximum search depth
        """
        self.search = IterativeDeepeningSearch()
        self.search.set_time_limit(time_limit)
        self.search.set_max_depth(max_depth)

    def get_best_move(self, fen, move_history=None):
        """
        Find the best move for the current position using iterative deepening search.

        Args:
            fen: Current board position in FEN notation
            move_history: List of previous moves (optional)

        Returns:
            A move object with 'from' and 'to' fields
        """
        # Create a chess board from the FEN
        board = GiveawayChessBoard(fen)

        # Get the best move using iterative deepening
        move = self.search.get_best_move(board)

        if move:
            # Convert the move to the format expected by the frontend
            from_square = chess.square_name(move.from_square)
            to_square = chess.square_name(move.to_square)

            return {"from": from_square, "to": to_square}

        return None


# Initialize the AI
ai = GiveawayChessAI(max_depth=20, time_limit=30)


@app.route("/get_ai_move", methods=["POST"])
def get_ai_move():
    """API endpoint to get the AI's next move"""
    data = request.json
    fen = data.get("fen")
    move_history = data.get("move_history", [])

    if not fen:
        return jsonify({"error": "FEN position is required"}), 400

    try:
        move = ai.get_best_move(fen, move_history)
        return jsonify({"move": move})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health_check():
    """Simple health check endpoint"""
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True)
