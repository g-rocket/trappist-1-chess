var params = location.search.slice(1).split(',');
var gameId = params[0];
var myPlayer = params[1];

var boardLoc = [0,0];
var squareSize;
var flip = myPlayer == 'black';

var socket = new WebSocket('ws://'+location.hostname+':55555/');
socket.onmessage = function(event) {
    message = JSON.parse(event.data)
    console.log('recieved', message)
    switch(message.message) {
    case 'updateBoard':
        pieces = message.pieces;
        renderGame();
    }
}

socket.onopen = function(event) {
    socket.send(JSON.stringify({
        page: 'game',
        message: 'joinGame',
        gameId: gameId,
        player: myPlayer,
    }));
}

var pieces = {
    'white': {
        'pawn': [
            // left jager unit
            [ 1,  0],
            [ 2,  1],
            [ 3,  2],
            [ 4,  1],
            [ 5,  0],
            // right jager unit
            [18,  0],
            [19,  1],
            [20,  2],
            [21,  1],
            [22,  0],
            // extras left of traditional line
            [ 4,  7],
            [ 5,  8],
            [ 6,  9],
            [ 7,  9],
            // extras right of traditional line
            [19,  7],
            [18,  8],
            [17,  9],
            [16,  9],
            // traditional
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
            //extras
            [10,  7],
            [13,  7],
            //traditional
            [ 9,  8],
            [14,  8],
        ],
        'bishop': [
            //extras
            [11,  7],
            [12,  7],
            //traditional
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
            // left jager unit
            [ 1, 23],
            [ 2, 22],
            [ 3, 21],
            [ 4, 22],
            [ 5, 23],
            // right jager unit
            [18, 23],
            [19, 22],
            [20, 21],
            [21, 22],
            [22, 23],
            // extras left of traditional line
            [ 4, 16],
            [ 5, 15],
            [ 6, 14],
            [ 7, 14],
            // extras right of traditional line
            [19, 16],
            [18, 15],
            [17, 14],
            [16, 14],
            // traditional
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
            //extras
            [10, 16],
            [13, 16],
            //traditional
            [ 9, 15],
            [14, 15],
        ],
        'bishop': [
            //extras
            [11, 16],
            [12, 16],
            //traditional
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
var selectedPiece = [null, null, null];

var canvas, ctx;
function setup() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.clip();
    squareSize = canvas.width / 24;
    canvas.addEventListener('click', function(e) {
        var r = getRenderParams();
        var bX = r.bX(e.offsetX);
        var bY = r.bY(e.offsetY);
        if(selectedPiece[0] == myPlayer) {
            var [px, py] = pieces[selectedPiece[0]][selectedPiece[1]][selectedPiece[2]];
            var moves = getValidMoves(selectedPiece[1], px, py,
                        Math.min(px, bX), Math.min(py, bY),
                        Math.max(px, bX), Math.max(py, bY));
            for(var [mx, my, mylayer] of moves) {
                if(bX == mx && bY == my) {
                    socket.send(JSON.stringify({
                        page: 'game',
                        message: 'move',
                        gameId: gameId,
                        player: selectedPiece[0],
                        pieceName: selectedPiece[1],
                        pieceIndex: selectedPiece[2],
                        dest: [mx, my],
                    }));
                }
            }
        }
        selectedPiece = getPiece(bX, bY);
        renderGame();
    });
    canvas.addEventListener('mousemove', function(e) {
        var r = getRenderParams();
        if(!e.buttons & 1) return;
        boardLoc[0] -= e.movementX / r.squareSize;
        if(flip) {
            boardLoc[1] -= e.movementY / r.squareSize;
        } else {
            boardLoc[1] += e.movementY / r.squareSize;
        }
        renderGame();
    });
    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        var oldSize = squareSize;
        squareSize *= Math.pow(.999, e.deltaY);
        if(squareSize < 4) {
            squareSize = 4;
        }
        boardLoc[0] -= (e.offsetX / squareSize) - (e.offsetX / oldSize);
        var oy = e.offsetY;
        if(!flip) {
            oy = canvas.height - oy;
        }
        boardLoc[1] -= (oy / squareSize) - (oy / oldSize);
        renderGame();
    })
}

function getPiece(x, y) {
    for(var player in pieces) {
        for(var pieceName in pieces[player]) {
            for(var i = 0; i < pieces[player][pieceName].length; i++) {
                var piece = pieces[player][pieceName][i];
                if(piece[0] == x && piece[1] == y) {
                    return [player, pieceName, i];
                }
            }
        }
    }
    return [null, null, null];
}

function getPossibleMoves(pieceName, x, y, minX, minY, maxX, maxY) {
    switch(pieceName) {
    case 'pawn':
        var dir = flip? -1: 1;
        return [
            [x+1, y + dir],
            [x-1, y + dir],
        ].filter(function([mx, my]) {
            return getPiece(mx, my)[0] != null;
        }).concat([[x, y + dir]].concat(
            [[x, y + dir + dir]].filter(function() {
                return (myPlayer == 'white' && y == 9) || (myPlayer == 'black' && y == 14);
        })).filter(function([mx, my]) {
            return getPiece(mx, my)[0] == null;
        }));
    case 'knight':
        return [
            [x-1, y-2],
            [x-2, y-1],
            [x-1, y+2],
            [x-2, y+1],
            [x+1, y+2],
            [x+2, y+1],
            [x+1, y-2],
            [x+2, y-1],
        ];
    case 'hawk':
        return [
            [x-2, y-2],
            [x-3, y-3],
            [x-2, y  ],
            [x-3, y  ],
            [x-2, y+2],
            [x-3, y+3],
            [x  , y-2],
            [x  , y-3],
            [x  , y+2],
            [x  , y+3],
            [x+2, y-2],
            [x+3, y-3],
            [x+2, y  ],
            [x+3, y  ],
            [x+2, y+2],
            [x+3, y+3],
        ];
    case 'chancelor':
        return getPossibleMoves('knight', x, y, minX, minY, maxX, maxY).concat(
            getPossibleMoves('rook', x, y, minX, minY, maxX, maxY))
    case 'guard':
        return [
            [x-1, y-1],
            [x-1, y  ],
            [x-1, y+1],
            [x  , y-1],
            [x  , y+1],
            [x+1, y-1],
            [x+1, y  ],
            [x+1, y+1],
        ];
    case 'huygens':
        return Array.from(new Array(maxX - minX + 1), (a,i) => [minX + i, y]).concat(
               Array.from(new Array(maxY - minY + 1), (a,i) => [x, minY + i])).filter(
            function([mx, my]) {
                var dist = Math.abs((x == mx)? my - y: mx - x);
                return dist > 4 && isPrime(dist);
            }
        );
    case 'queen':
        return getPossibleMoves('rook', x, y, minX, minY, maxX, maxY).concat(
            getPossibleMoves('bishop', x, y, minX, minY, maxX, maxY))
    case 'bishop':
        moves = [];
        for(var [dx, dy] of [[-1,-1], [1,-1], [-1,1], [1,1]]) {
            var [px, py] = [x, y];
            while(px >= minX && px <= maxX && py >= minY && py <= maxY) {
                px += dx;
                py += dy;
                moves.push([px, py]);
                if(getPiece(px, py)[0] != null) break;
            }
        }
        return moves;
    case 'rook':
        moves = [];
        for(var [dx, dy] of [[0,-1], [0,1], [-1,0], [1,0]]) {
            var [px, py] = [x, y];
            while(px >= minX && px <= maxX && py >= minY && py <= maxY) {
                px += dx;
                py += dy;
                moves.push([px, py]);
                if(getPiece(px, py)[0] != null) break;
            }
        }
        return moves;
    case 'king':
        return getPossibleMoves('guard', x, y, minX, minY, maxX, maxY).filter(function([mx,my]) {
            return true;
        });
    default:
        console.log('invalid piece:',pieceName);
        return [];
    }
}

function isPrime(x) {
    if(x == 1 || (x%2) == 0 || (x%3) == 0) return false;
    var maxDiv = Math.sqrt(x);
    for(var divM6 = 6; divM6-1 < maxDiv; divM6 += 6) {
        if(x%(divM6-1) == 0 || x%(divM6+1) == 0) return false;
    }
    return true;
}

function getValidMoves(pieceName, x, y, minX, minY, maxX, maxY) {
    return getPossibleMoves(pieceName, x, y, minX, minY, maxX, maxY).map(
        function([mx, my]) {
            return [mx, my, getPiece(mx, my)[0]];
        }
    ).filter(function([mx, my, player]) {
        return player != myPlayer;
    });
}

function getRenderParams() {
    var width = canvas.width;
    var height = canvas.height;
    var squaresWide = width / squareSize;
    var squaresHigh = height / squareSize;
    return {
        width: width,
        height: height,
        squareSize: squareSize,
        squaresWide: squaresWide,
        squaresHigh: squaresHigh,
        minX: Math.floor(boardLoc[0]),
        minY: Math.floor(boardLoc[1]),
        maxX: Math.ceil(boardLoc[0] + squaresWide),
        maxY: Math.ceil(boardLoc[1] + squaresHigh),
        sX: function(bX) {
            return (bX - boardLoc[0]) * squareSize;
        },
        sY: function(bY) {
            var y = (bY - boardLoc[1]) * squareSize;
            if(flip) {
                return y
            } else {
                return height - y - squareSize;
            }
        },
        bX: function(sX) {
            return Math.floor(sX / r.squareSize + boardLoc[0]);
        },
        bY: function(sY) {
            if(!flip) {
                sY = height - sY - r.squareSize;
            }
            return Math.floor(sY / r.squareSize + boardLoc[1] + !flip)
        }
    }
}

function renderGame() {
    r = getRenderParams();
    for(var x = r.minX; x < r.maxX; x++) {
        for(var y = r.minY; y < r.maxY; y++) {
            if((x+y) % 2) {
                ctx.fillStyle = 'rgb(200, 200, 200)';
            } else {
                ctx.fillStyle = 'rgb(100, 100, 100)';
            }
            ctx.fillRect(r.sX(x), r.sY(y), r.squareSize, r.squareSize);
        }
    }
    if(selectedPiece[0] == myPlayer) {
        var pieceName = selectedPiece[1];
        var [x, y] = pieces[selectedPiece[0]][pieceName][selectedPiece[2]];
        for(var [mx, my, mplayer] of getValidMoves(pieceName, x, y, r.minX, r.minY, r.maxX, r.maxY)) {
            if(mplayer == null) {
                if((mx+my) % 2) {
                    ctx.fillStyle = 'rgb(100, 200, 100)'
                } else {
                    ctx.fillStyle = 'rgb(0, 150, 0)'
                }
            } else {
                if((mx+my) % 2) {
                    ctx.fillStyle = 'rgb(200, 100, 100)'
                } else {
                    ctx.fillStyle = 'rgb(150, 0, 0)'
                }
            }
            ctx.fillRect(r.sX(mx), r.sY(my), r.squareSize, r.squareSize);
        }
    }
    for(var player in pieces) {
        for(var pieceName in pieces[player]) {
            for(var piece of pieces[player][pieceName]) {
                if(player == 'white') {
                    ctx.fillStyle = 'rgb(255, 255, 255)'
                } else {
                    ctx.fillStyle = 'rgb(0, 0, 0)'
                }
                ctx.fillText(pieceName, r.sX(piece[0]), r.sY(piece[1]) + r.squareSize/2, r.squareSize)
            }
        }
    }
}
