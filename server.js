const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

let currentGameState = {
    date: '',
    location: '',
    team1Name: 'Home Team',
    team2Name: 'Away Team',
    scores: { team1: 0, team2: 0 },
    timeoutsUsed: { '1': 0, '2': 0 },
    gameTimeLeft: 1200,
    playTimeLeft: 40,
    currentDown: 1,
    halfDuration: 1200,
    playClockDuration: 40,
    timeoutsPerHalf: 2,
    scoreLogHTML: '',
    timeoutLogHTML: '',
    gameClockRunning: false,
    playClockRunning: false
};

let gameClockInterval;
let playClockInterval;

const startGameClock = () => {
    if (!gameClockInterval) {
        currentGameState.gameClockRunning = true;
        gameClockInterval = setInterval(() => {
            if (currentGameState.gameTimeLeft > 0) {
                currentGameState.gameTimeLeft--;
                broadcastState();
            } else {
                stopGameClock();
            }
        }, 1000);
    }
};

const stopGameClock = () => {
    clearInterval(gameClockInterval);
    gameClockInterval = null;
    currentGameState.gameClockRunning = false;
    broadcastState();
};

const startPlayClock = () => {
    if (!playClockInterval) {
        currentGameState.playClockRunning = true;
        playClockInterval = setInterval(() => {
            if (currentGameState.playTimeLeft > 0) {
                currentGameState.playTimeLeft--;
                broadcastState();
            } else {
                stopPlayClock();
            }
        }, 1000);
    }
};

const stopPlayClock = () => {
    clearInterval(playClockInterval);
    playClockInterval = null;
    currentGameState.playClockRunning = false;
    broadcastState();
};

const broadcastState = () => {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(currentGameState));
        }
    });
};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

wss.on('connection', function connection(ws) {
    console.log('A new client connected!');
    ws.send(JSON.stringify(currentGameState));

    ws.on('message', function incoming(message) {
        const parsedMessage = JSON.parse(message);
        console.log('received action:', parsedMessage.type);
        
        if (parsedMessage.type === 'START_GAME_CLOCK') {
            startGameClock();
        } else if (parsedMessage.type === 'STOP_GAME_CLOCK') {
            stopGameClock();
        } else if (parsedMessage.type === 'START_PLAY_CLOCK') {
            startPlayClock();
        } else if (parsedMessage.type === 'STOP_PLAY_CLOCK') {
            stopPlayClock();
        } else if (parsedMessage.type === 'UPDATE_STATE') {
            currentGameState = { ...currentGameState, ...parsedMessage.payload };
            broadcastState();
        }
    });

    ws.on('close', () => {
        console.log('A client disconnected.');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});