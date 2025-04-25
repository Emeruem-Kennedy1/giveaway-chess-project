import time
from .minimax import Minimax


class IterativeDeepeningSearch:
    """
    Iterative deepening search for Giveaway Chess.
    Incrementally increases search depth until time limit is reached.
    """

    def __init__(self, evaluation_fn=None):
        """
        Initialize the iterative deepening search.

        Args:
            evaluation_fn: Function to evaluate a position. If None, use the default evaluation.
        """
        self.minimax = Minimax(evaluation_fn)
        self.time_limit = 5.0  # Default time limit in seconds
        self.max_depth = 10  # Maximum depth to search

    def set_time_limit(self, seconds):
        """
        Set the time limit for the search.

        Args:
            seconds: Time limit in seconds
        """
        self.time_limit = seconds

    def set_max_depth(self, depth):
        """
        Set the maximum depth for the search.

        Args:
            depth: Maximum depth
        """
        self.max_depth = depth

    def get_best_move(self, board, perspective=None):
        """
        Find the best move for the current position using iterative deepening.

        Args:
            board: A chess.Board instance
            perspective: The player's perspective (chess.WHITE or chess.BLACK). If None, use board.turn.

        Returns:
            The best move found within the time limit
        """
        if perspective is None:
            perspective = board.turn

        best_move = None
        start_time = time.time()

        # Start with depth 1 and increase until time limit or max depth
        for depth in range(1, self.max_depth + 1):
            # Check if we've exceeded the time limit
            if time.time() - start_time > self.time_limit:
                break

            move = self.minimax.get_best_move(board, depth, perspective)
            if move:
                best_move = move

            # Print info for debugging
            elapsed = time.time() - start_time
            print(
                f"Depth {depth}: Best move {best_move}, {self.minimax.nodes_evaluated} nodes, {elapsed:.2f} seconds"
            )

        total_time = time.time() - start_time
        print(f"Final decision: {best_move}, search time: {total_time:.2f} seconds")

        return best_move
