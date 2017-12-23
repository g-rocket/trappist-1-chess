var myAddress = null;

function updateLobby(players) {
    playerListElement = document.getElementById('players')
    selectedAddress = playerListElement.value;
    document.getElementById('start').disabled = true;
    if (players.length <= 0) {
        // only us
        playerListElement.innerHTML = '<option disabled>Waiting for players...</option>'
    } else {
        playersHtml = ''
        for(var player of players) {
            playersHtml += '<option value="';
            playersHtml += player.address;
            playersHtml += '"';
            if(player.address == selectedAddress) {
                playersHtml += ' selected';
                document.getElementById('start').disabled = false;
            }
            playersHtml += '>';
            playersHtml += player.name;
            playersHtml += '</option>';
        }
        playerListElement.innerHTML = playersHtml;
    }
}

function setName() {
    socket.send(JSON.stringify({
        page: 'lobby',
        message: 'setName',
        name: document.getElementById('name').value,
    }));
}

function startGame() {
    socket.send(JSON.stringify({
        page: 'lobby',
        message: 'startGame',
        otherPlayer: document.getElementById('players').value,
    }));
}

var socket = new WebSocket('ws://'+location.hostname+':5000/');
socket.onmessage = function(event) {
    message = JSON.parse(event.data)
    console.log('recieved',message)
    switch(message.message) {
    case 'lobbyStart':
        myAddress = message.address;
        document.getElementById('name').value=message.name;
        document.getElementById('name').disabled=false;
        document.getElementById('setName').disabled=false;
        updateLobby(message.players)
        break;
    case 'lobbyUpdate':
        updateLobby(message.players)
        break;
    case 'startGame':
        window.location.href = '/game.html?' + message.gameId
    }
}

socket.onopen = function(event) {
    socket.send(JSON.stringify({
        page: 'lobby',
        message: 'newPlayer',
    }));
}
