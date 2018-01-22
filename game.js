var params = location.search.slice(1).split(',');
var gameId = params[0];
var myPlayer = params[1];

var boardLoc = [0,0];
var squareSize;
var flip = myPlayer == 'black';

var piecePaths = {
    'pawn': 'M20 80 A35 35 0 1 1 80 80 Z M20 90 H80',
    'rook': 'M20 80 V20 H80 V80 Z M20 90 H80',
    'chancelor': 'M20 80 V55 H45 V80 Z M55 80 V55 H80 V80 Z M20 45 V20 H45 V45 Z M55 45 V20 H80 V45 Z M20 90 H80',
    'bishop': 'M20 80 L50 20 L80 80 Z M20 90 H80',
    'knight': 'M55 80 V55 H80 V80 Z M20 45 V20 H45 V45 Z M55 45 V20 H80 V45 Z M55 90 H80',
    'hawk': 'M40 80 L50 20 L60 80 Z M40 90 H60',
    'guard': 'M20 80 A35 35 0 1 1 80 80 Z M30 70 L50 35 L70 70 Z M20 90 H80',
    'king': 'M20 80 A35 35 0 0 1 10 55 H45 V80 Z M10 45 A35 35 0 0 1 45 10 V45 Z M90 45 A35 35 0 0 0 55 10 V45 Z M80 80 A35 35 0 0 0 90 55 H55 V80 Z M20 90 H80',
    'huygens': 'M20 80 L30 55 H45 V80 Z M55 80 V55 H70 L80 80 Z M35 45 L45 20 V45 Z M55 45 V20 L65 45 Z M20 90 H80',
    'queen': 'M20 80 V20 H80 V80 Z L50 30 L80 80 M20 90 H80',
}

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
    'white': {},
    'black': {},
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

function getPossibleMoves(pieceName, player, x, y, minX, minY, maxX, maxY) {
    switch(pieceName) {
    case 'pawn':
        var dir = player == 'white'? 1: -1;
        return [
            [x+1, y + dir],
            [x-1, y + dir],
        ].filter(function([mx, my]) {
            return getPiece(mx, my)[0] != null;
        }).concat([[x, y + dir]].concat(
            [[x, y + dir + dir]].filter(function() {
                console.log(pieces[player][pieceName][getPiece(x, y)[2]])
                return pieces[player][pieceName][getPiece(x, y)[2]][2] == 0;
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
        return getPossibleMoves('knight', player, x, y, minX, minY, maxX, maxY).concat(
            getPossibleMoves('rook', player, x, y, minX, minY, maxX, maxY))
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
        return getPossibleMoves('rook', player, x, y, minX, minY, maxX, maxY).concat(
            getPossibleMoves('bishop', player, x, y, minX, minY, maxX, maxY))
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
        return getPossibleMoves('guard', player, x, y, minX, minY, maxX, maxY).filter(function([mx,my]) {
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
    return getPossibleMoves(pieceName, myPlayer, x, y, minX, minY, maxX, maxY).map(
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
    } else if(selectedPiece[0] != null) {
        var pieceName = selectedPiece[1];
        var [x, y] = pieces[selectedPiece[0]][pieceName][selectedPiece[2]];
        for(var [mx, my, mplayer] of getPossibleMoves(pieceName, selectedPiece[0], x, y, r.minX, r.minY, r.maxX, r.maxY)) {
            if((mx+my) % 2) {
                ctx.fillStyle = 'rgb(100, 100, 200)'
            } else {
                ctx.fillStyle = 'rgb(0, 0, 150)'
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
                    ctx.fillStyle = 'rgb(255, 0, 0)'
                }
                ctx.strokeStyle = 'rgb(0, 0, 0)'
                var piecePath = new Path2D(piecePaths[pieceName])
                ctx.save();
                ctx.transform(r.squareSize/100, 0, 0, r.squareSize/100, r.sX(piece[0]), r.sY(piece[1]));
                ctx.fill(piecePath);
                ctx.stroke(piecePath);
                ctx.restore();
            }
        }
    }
}
