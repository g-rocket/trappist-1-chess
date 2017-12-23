#!/usr/bin/env python3
import json
import traceback
import uuid

from SimpleWebSocketServer import SimpleWebSocketServer, WebSocket

from game import Game

lobby = {}
games = {}

def toAddress(addressString):
    ip, portStr = addressString.rsplit(':',1)
    return ip, int(portStr)

class ChessSocket(WebSocket):
    def handleMessage(self):
        try:
            print(self.address, 'recieve message', self.data)
            message = json.loads(self.data)
            if message['page'] == 'lobby':
                if message['message'] == 'newPlayer':
                    self.newPlayer(message)
                    self.updateOtherLobby()
                elif message['message'] == 'setName':
                    lobby[self.address]['name'] = message['name']
                    self.updateOtherLobby()
                elif message['message'] == 'startGame':
                    otherAddress = toAddress(message['otherPlayer'])
                    if otherAddress in lobby:
                        gameId = uuid.uuid4().hex
                        games[gameId] = Game()
                        self.redirectToGame(gameId)
                        lobby[otherAddress]['socket'].redirectToGame(gameId)
        except Exception as e:
            traceback.print_exc()
            raise e

    def redirectToGame(self, gameId):
        self.sendMessage(json.dumps({
            'message': 'startGame',
            'gameId': gameId,
        }))

    def newPlayer(self, message):
        lobby[self.address] = {
            'socket': self,
            'name': '{}:{}'.format(*self.address),
            'address': '{}:{}'.format(*self.address),
        }
        self.sendMessage(json.dumps({
            'message': 'lobbyStart',
            'name': lobby[self.address]['name'],
            'address': lobby[self.address]['address'],
            'players': [{
                    'name': player['name'],
                    'address': player['address'],
                }
                for address, player in lobby.items()
                if address != self.address
            ],
        }))

    def updateOtherLobby(self):
        for address, player in lobby.items():
            if address != self.address:
                player['socket'].updateOwnLobby()

    def updateOwnLobby(self):
        self.sendMessage(json.dumps({
            'message': 'lobbyUpdate',
            'players': [
                {
                    'name': player['name'],
                    'address': player['address'],
                }
                for address, player in lobby.items()
                if address != self.address
            ],
        }))

    def handleConnected(self):
        print(self.address, 'connected')

    def handleClose(self):
        if self.address in lobby:
            del lobby[self.address]
            self.updateOtherLobby()
        print(self.address, 'closed')

if __name__ == '__main__':
    server = SimpleWebSocketServer('', 5000, ChessSocket)
    server.serveforever()
