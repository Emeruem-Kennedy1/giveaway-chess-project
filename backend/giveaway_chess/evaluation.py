import chess
from .rules import GiveawayChessRules


class GiveawayChessEvaluation:
    """
    Evaluation function for Giveaway Chess positions.
    In Giveaway Chess, the objective is the opposite of traditional chess:
    we want to lose our pieces and force our opponent to capture them.
    """

    # Piece values (negative because having fewer pieces is better)
    PIECE_VALUES = {
        chess.PAWN: -1,
        chess.KNIGHT: -3,
        chess.BISHOP: -3,
        chess.ROOK: -5,
        chess.QUEEN: -9,
        chess.KING: -0,  # King value is 0 since it's capturable and not special
    }

    # Mobility bonus (negative because having fewer moves is better)
    MOBILITY_WEIGHT = -0.01

    @staticmethod
    def evaluate(board, perspective):
        """
        Evaluate the position from the given perspective.

        Args:
            board: A chess.Board instance
            perspective: The player's perspective (chess.WHITE or chess.BLACK)

        Returns:
            A numerical value representing the position's quality.
            Higher values are better for the player with the given perspective.
        """
        # Check if the game is over
        if GiveawayChessRules.is_game_over(board):
            winner = GiveawayChessRules.get_winner(board)
            if winner == perspective:
                return 10000  # Win
            elif winner is not None:
                return -10000  # Loss
            return 0  # Draw

        score = 0

        # Material count (in Giveaway Chess, fewer pieces is better)
        for square in chess.SQUARES:
            piece = board.piece_at(square)
            if piece:
                value = GiveawayChessEvaluation.PIECE_VALUES[piece.piece_type]
                if piece.color == perspective:
                    score += value
                else:
                    score -= value

        # Mobility (in Giveaway Chess, fewer legal moves is better)
        board_copy = board.copy()

        # Count legal moves for the current player
        if board.turn == perspective:
            legal_moves = len(GiveawayChessRules.get_legal_moves(board))
            score += legal_moves * GiveawayChessEvaluation.MOBILITY_WEIGHT
        else:
            # Switch turn to calculate opponent's legal moves
            board_copy.turn = not board_copy.turn
            legal_moves = len(GiveawayChessRules.get_legal_moves(board_copy))
            score -= legal_moves * GiveawayChessEvaluation.MOBILITY_WEIGHT

        # Bonus for forcing opponent captures
        captures = GiveawayChessRules.get_forced_captures(board)
        if captures and board.turn != perspective:
            score += 0.5 * len(captures)

        # King activity
        for color in [perspective, not perspective]:
            king_square = board.king(color)
            if king_square is not None:
                # Centralization bonus for king
                file, rank = chess.square_file(king_square), chess.square_rank(
                    king_square
                )
                file_center_distance = abs(3.5 - file)
                rank_center_distance = abs(3.5 - rank)
                king_centrality = 7 - (file_center_distance + rank_center_distance)

                # Add king centrality to score (positive for our king, negative for opponent's)
                if color == perspective:
                    score += king_centrality * 0.1
                else:
                    score -= king_centrality * 0.1

        # Look-ahead for imminent forced captures
        if board.turn == perspective:
            # For each legal move, see if it creates a forced capture for opponent
            for move in GiveawayChessRules.get_legal_moves(board):
                board_copy = board.copy()
                board_copy.push(move)

                forced_captures = GiveawayChessRules.get_forced_captures(board_copy)
                if forced_captures:
                    score += 1.0  # Strong bonus for creating forced capture
                    break  # Found at least one good move

        return score
