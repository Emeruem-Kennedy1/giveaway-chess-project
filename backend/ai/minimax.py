from giveaway_chess.rules import GiveawayChessRules
from giveaway_chess.evaluation import GiveawayChessEvaluation


class Minimax:
    """
    Minimax algorithm with alpha-beta pruning for Giveaway Chess.
    """

    def __init__(self, evaluation_fn=None):
        """
        Initialize the minimax algorithm.

        Args:
            evaluation_fn: Function to evaluate a position. If None, use the default evaluation.
        """
        self.evaluation_fn = evaluation_fn or GiveawayChessEvaluation.evaluate
        self.nodes_evaluated = 0
        self.max_depth_reached = 0
        self.transposition_table = {}

    def get_best_move(self, board, depth, perspective=None):
        """
        Find the best move for the current position.

        Args:
            board: A chess.Board instance
            depth: Maximum search depth
            perspective: The player's perspective (chess.WHITE or chess.BLACK). If None, use board.turn.

        Returns:
            The best move according to the minimax algorithm
        """
        if perspective is None:
            perspective = board.turn

        self.nodes_evaluated = 0
        self.max_depth_reached = 0

        legal_moves = GiveawayChessRules.get_legal_moves(board)
        if not legal_moves:
            return None

        best_move = None
        best_value = float("-inf")
        alpha = float("-inf")
        beta = float("inf")

        # if there is only one legal move, return it
        if len(legal_moves) == 1:
            return legal_moves[0]

        for move in legal_moves:
            board.push(move)
            value = -self._alpha_beta(board, depth - 1, -beta, -alpha, perspective)
            board.pop()

            if value > best_value:
                best_value = value
                best_move = move

            alpha = max(alpha, value)

        return best_move

    def _alpha_beta(self, board, depth, alpha, beta, perspective):
        """
        Alpha-beta pruning implementation.

        Args:
            board: A chess.Board instance
            depth: Remaining search depth
            alpha: Alpha value for pruning
            beta: Beta value for pruning
            perspective: The player's perspective (chess.WHITE or chess.BLACK)

        Returns:
            The evaluated score for the position
        """
        self.nodes_evaluated += 1
        self.max_depth_reached = max(self.max_depth_reached, depth)

        # Generate a position key for the transposition table
        position_key = self._get_position_key(board)

        # Check transposition table
        if (
            position_key in self.transposition_table
            and self.transposition_table[position_key]["depth"] >= depth
        ):
            return self.transposition_table[position_key]["value"]

        # Check if the game is over or we've reached the maximum depth
        if depth == 0 or GiveawayChessRules.is_game_over(board):
            value = self.evaluation_fn(board, perspective)
            self.transposition_table[position_key] = {"value": value, "depth": depth}
            return value

        legal_moves = GiveawayChessRules.get_legal_moves(board)

        # Order moves to improve alpha-beta efficiency
        # (captured pieces and higher-value pieces first)
        legal_moves = self._order_moves(board, legal_moves)

        value = float("-inf")

        for move in legal_moves:
            board.push(move)
            value = max(
                value, -self._alpha_beta(board, depth - 1, -beta, -alpha, perspective)
            )
            board.pop()

            alpha = max(alpha, value)
            if alpha >= beta:
                break  # Beta cutoff

        # Store result in transposition table
        self.transposition_table[position_key] = {"value": value, "depth": depth}

        return value

    def _get_position_key(self, board):
        """
        Generate a unique key for the current position for transposition table.

        Args:
            board: A chess.Board instance

        Returns:
            A unique key representing the position
        """
        return board.fen()

    def _order_moves(self, board, moves):
        """
        Order moves to improve alpha-beta efficiency.
        Prioritize captures and high-value pieces.

        Args:
            board: A chess.Board instance
            moves: List of legal moves

        Returns:
            Ordered list of moves
        """
        move_scores = []

        for move in moves:
            score = 0

            # Prioritize captures
            if board.is_capture(move):
                # Get the captured piece value
                to_square = move.to_square
                captured_piece = board.piece_at(to_square)
                if captured_piece:
                    score += 10 * abs(
                        GiveawayChessEvaluation.PIECE_VALUES[captured_piece.piece_type]
                    )

            # Prioritize moves with higher-value pieces
            from_square = move.from_square
            moving_piece = board.piece_at(from_square)
            if moving_piece:
                score += abs(
                    GiveawayChessEvaluation.PIECE_VALUES[moving_piece.piece_type]
                )

            move_scores.append((move, score))

        # Sort moves by score in descending order
        move_scores.sort(key=lambda x: x[1], reverse=True)

        return [move for move, _ in move_scores]
