import json

class Game:
    def __init__(self):
        self.pieces = {
            'white': {
                'pawn': [
                    # left jager unit
                    [ 1,  0, 0],
                    [ 2,  1, 0],
                    [ 3,  2, 0],
                    [ 4,  1, 0],
                    [ 5,  0, 0],
                    # right jager unit
                    [18,  0, 0],
                    [19,  1, 0],
                    [20,  2, 0],
                    [21,  1, 0],
                    [22,  0, 0],
                    # extras left of traditional line
                    [ 4,  7, 0],
                    [ 5,  8, 0],
                    [ 6,  9, 0],
                    [ 7,  9, 0],
                    # extras right of traditional line
                    [19,  7, 0],
                    [18,  8, 0],
                    [17,  9, 0],
                    [16,  9, 0],
                    # traditional
                    [ 8,  9, 0],
                    [ 9,  9, 0],
                    [10,  9, 0],
                    [11,  9, 0],
                    [12,  9, 0],
                    [13,  9, 0],
                    [14,  9, 0],
                    [15,  9, 0],
                ],
                'knight': [
                    #extras
                    [10,  7],
                    [13,  7],
                    #traditional
                    [ 9,  8],
                    [14,  8],
                ],
                'bishop': [
                    #extras
                    [11,  7],
                    [12,  7],
                    #traditional
                    [10,  8],
                    [13,  8],
                ],
                'rook': [
                    [ 6,  8],
                    [17,  8],
                ],
                'queen': [
                    [11,  8],
                ],
                'king': [
                    [12,  8],
                ],
                'chancelor': [
                    [ 7,  8],
                    [16,  8],
                ],
                'hawk': [
                    [ 3,  0],
                    [20,  0],
                ],
                'guard': [
                    [ 8,  8],
                    [15,  8],
                ],
                'huygens': [
                    [ 5,  7],
                    [18,  7],
                ],
            },
            'black': {
                'pawn': [
                    # left jager unit
                    [ 1, 23, 0],
                    [ 2, 22, 0],
                    [ 3, 21, 0],
                    [ 4, 22, 0],
                    [ 5, 23, 0],
                    # right jager unit
                    [18, 23, 0],
                    [19, 22, 0],
                    [20, 21, 0],
                    [21, 22, 0],
                    [22, 23, 0],
                    # extras left of traditional line
                    [ 4, 16, 0],
                    [ 5, 15, 0],
                    [ 6, 14, 0],
                    [ 7, 14, 0],
                    # extras right of traditional line
                    [19, 16, 0],
                    [18, 15, 0],
                    [17, 14, 0],
                    [16, 14, 0],
                    # traditional
                    [ 8, 14, 0],
                    [ 9, 14, 0],
                    [10, 14, 0],
                    [11, 14, 0],
                    [12, 14, 0],
                    [13, 14, 0],
                    [14, 14, 0],
                    [15, 14, 0],
                ],
                'knight': [
                    #extras
                    [10, 16],
                    [13, 16],
                    #traditional
                    [ 9, 15],
                    [14, 15],
                ],
                'bishop': [
                    #extras
                    [11, 16],
                    [12, 16],
                    #traditional
                    [10, 15],
                    [13, 15],
                ],
                'rook': [
                    [ 6, 15],
                    [17, 15],
                ],
                'queen': [
                    [11, 15],
                ],
                'king': [
                    [12, 15],
                ],
                'chancelor': [
                    [ 7, 15],
                    [16, 15],
                ],
                'hawk': [
                    [ 3, 23],
                    [20, 23],
                ],
                'guard': [
                    [ 8, 15],
                    [15, 15],
                ],
                'huygens': [
                    [ 5, 16],
                    [18, 16],
                ],
            },
        }
        self.players = []
        self.turn = 'white'

    def addPlayer(self, player, socket):
        self.players.append(socket)
        socket.sendMessage(json.dumps({
            'message': 'updateBoard',
            'pieces': self.pieces,
        }))

    def makeMove(self, player, pieceName, pieceIndex, dest):
        if player != self.turn or not self.validateMove(player, pieceName, pieceIndex, dest):
            print('invalid move')
            return
        self.turn = otherPlayer(self.turn)
        # preserve en passant markers
        piece = self.pieces[player][pieceName][pieceIndex]
        if pieceName == 'pawn':
            self.pieces[player][pieceName][pieceIndex] = dest + [piece[2]]
        else:
            self.pieces[player][pieceName][pieceIndex] = dest
        otherPlayerPieces = self.pieces[otherPlayer(player)]
        # expire old en passant markers
        for pawn in self.pieces[player]['pawn']:
            if pawn[2] == 1:
                pawn[2] = 2
        # mark en passant
        if pieceName == 'pawn' and piece[2] == 0:
            #if piece
            self.pieces[player][pieceName][pieceIndex][2] = 1
        for otherPieceName, otherPieces in otherPlayerPieces.items():
            otherPlayerPieces[otherPieceName] = [piece for piece in otherPieces if piece[:2] != dest]
        for socket in self.players:
            socket.sendMessage(json.dumps({
                'message': 'updateBoard',
                'pieces': self.pieces,
            }))

    def validateMove(self, player, pieceName, pieceIndex, dest):
        return True

def otherPlayer(player):
    return 'black' if player == 'white' else 'white'
