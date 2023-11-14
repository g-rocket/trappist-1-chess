# A web-based player for the chess variant [Trappist-1](http://www.chessvariants.com/invention/trappist-1)

Trappist-1 is an interesting chess variant that is played on an infinite gameboard,
and has several new pieces:
* The hawk, which jumps 2 or 3 squares in any direction
* The guard, which moves like a king
* The chancelor, which moves like a knight + a rook
* The huygens, which jumps a prime number of squares orthogonally.

This works by running a python websocket server (by default on port 55555) to run the game / lobby,
and serving up static HTML / javascript pages.
To play, run server.py, start some sort of webserver, and load up index.html in your browser.
Currently, secure websockets aren't supported, but I'm working on that.
**Play online at http://chess.yancey.io/**

This is a work in progress.
Current major missing features:
* Pawn promotion
* En passant
* Automatic detection of check and checkmate
* Serverside validation of moves
* Secure websockets (to support serving over https)
* Something that says who's turn it is
* List of captured pieces
* Optional (configurable) timer
