import json

class Game:
    def __init__(self):
        self.pieces = {
            'white': {
                'pawn': [
                    # left jager unit
                    [ 1,  0],
                    [ 2,  1],
                    [ 3,  2],
                    [ 4,  1],
                    [ 5,  0],
                    # right jager unit
                    [18,  0],
                    [19,  1],
                    [20,  2],
                    [21,  1],
                    [22,  0],
                    # extras left of traditional line
                    [ 4,  7],
                    [ 5,  8],
                    [ 6,  9],
                    [ 7,  9],
                    # extras right of traditional line
                    [19,  7],
                    [18,  8],
                    [17,  9],
                    [16,  9],
                    # traditional
                    [ 8,  9],
                    [ 9,  9],
                    [10,  9],
                    [11,  9],
                    [12,  9],
                    [13,  9],
                    [14,  9],
                    [15,  9],
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
                    [ 1, 23],
                    [ 2, 22],
                    [ 3, 21],
                    [ 4, 22],
                    [ 5, 23],
                    # right jager unit
                    [18, 23],
                    [19, 22],
                    [20, 21],
                    [21, 22],
                    [22, 23],
                    # extras left of traditional line
                    [ 4, 16],
                    [ 5, 15],
                    [ 6, 14],
                    [ 7, 14],
                    # extras right of traditional line
                    [19, 16],
                    [18, 15],
                    [17, 14],
                    [16, 14],
                    # traditional
                    [ 8, 14],
                    [ 9, 14],
                    [10, 14],
                    [11, 14],
                    [12, 14],
                    [13, 14],
                    [14, 14],
                    [15, 14],
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

    def makeMove(self, message):
        if message['player'] != self.turn:
            print('invalid move')
            return
        self.turn = otherPlayer(self.turn)
        self.pieces[message['player']][message['pieceName']][message['pieceIndex']] = message['dest']
        otherPlayerPieces = self.pieces[otherPlayer(message['player'])]
        for pieceName, piecesByName in otherPlayerPieces.items():
            otherPlayerPieces[pieceName] = [piece for piece in piecesByName if piece != message['dest']]
        for socket in self.players:
            socket.sendMessage(json.dumps({
                'message': 'updateBoard',
                'pieces': self.pieces,
            }))

def otherPlayer(player):
    return 'black' if player == 'white' else 'white'
