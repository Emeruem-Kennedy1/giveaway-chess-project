import chess


class GiveawayChessBoard(chess.Board):
    """Custom chess board that ignores check validation for Giveaway Chess"""

    def __init__(self, fen=chess.STARTING_FEN):
        super().__init__(fen)

    def is_check(self):
        """Override to disable check detection"""
        return False

    def is_into_check(self, move):
        """Override to allow moves that would put the king in check"""
        return False

    def _is_safe(self, *args, **kwargs):
        """Override internal method to disable king safety checks"""
        return True

    def is_legal(self, move):
        """Redefined legal move checker to ignore check validation"""
        return move in self.pseudo_legal_moves

    def generate_legal_moves(self, *args, **kwargs):
        """Use pseudo-legal moves as legal moves to ignore check validation"""
        return self.generate_pseudo_legal_moves(*args, **kwargs)


class GiveawayChessRules:
    """
    Implementation of Giveaway Chess (also known as Antichess) rules.

    In Giveaway Chess:
    1. Captures are mandatory if available
    2. There is no check or checkmate
    3. The king can be captured
    4. The goal is to lose all your pieces or reach a position where you have no legal moves
    """

    @staticmethod
    def get_forced_captures(board):
        """
        Get all forced capture moves in the current position.

        Args:
            board: A chess.Board instance

        Returns:
            A list of legal capture moves
        """
        capture_moves = []

        for move in board.legal_moves:
            if board.is_capture(move):
                capture_moves.append(move)

        return capture_moves

    @staticmethod
    def get_legal_moves(board):
        """
        Get all legal moves in the current position according to Giveaway Chess rules.
        If captures are available, only return captures.

        Args:
            board: A chess.Board instance

        Returns:
            A list of legal moves
        """
        captures = GiveawayChessRules.get_forced_captures(board)

        if captures:
            return captures

        return list(board.legal_moves)

    @staticmethod
    def is_game_over(board):
        """
        Check if the game is over according to Giveaway Chess rules.
        Game is over if a player has no pieces or no legal moves.

        Args:
            board: A chess.Board instance

        Returns:
            True if the game is over, False otherwise
        """
        # Check if the current player has no pieces left
        if GiveawayChessRules.count_pieces(board, board.turn) == 0:
            return True

        # Check if the current player has no legal moves
        return len(GiveawayChessRules.get_legal_moves(board)) == 0

    @staticmethod
    def count_pieces(board, color):
        """
        Count the number of pieces of a given color on the board.

        Args:
            board: A chess.Board instance
            color: Chess.WHITE or Chess.BLACK

        Returns:
            The number of pieces of the given color
        """
        count = 0

        for square in chess.SQUARES:
            piece = board.piece_at(square)
            if piece and piece.color == color:
                count += 1

        return count

    @staticmethod
    def get_winner(board):
        """
        Get the winner of the game according to Giveaway Chess rules.

        Args:
            board: A chess.Board instance

        Returns:
            chess.WHITE if white won, chess.BLACK if black won, None if the game is not over
        """
        if not GiveawayChessRules.is_game_over(board):
            return None

        # If the current player has no pieces, they won
        if GiveawayChessRules.count_pieces(board, board.turn) == 0:
            return board.turn

        # If the current player has no legal moves, the opponent won
        return not board.turn
