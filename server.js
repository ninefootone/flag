const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

// Map to store game states by ID
const gameStates = new Map();

// Clock intervals by game ID
const gameClockIntervals = new Map();
const playClockIntervals = new Map();

const broadcastState = (gameId) => {
    const gameState = gameStates.get(gameId);
    if (!gameState) return;

    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN && client.gameId === gameId) {
            client.send(JSON.stringify(gameState));
        }
    });
};

const startGameClock = (gameId) => {
    let gameState = gameStates.get(gameId);
    if (!gameState || gameClockIntervals.has(gameId)) return;

    gameState.gameClockRunning = true;
    const interval = setInterval(() => {
        if (gameState.gameTimeLeft > 0) {
            gameState.gameTimeLeft--;
            broadcastState(gameId);
        } else {
            stopGameClock(gameId);
        }
    }, 1000);
    gameClockIntervals.set(gameId, interval);
    broadcastState(gameId);
};

const stopGameClock = (gameId) => {
    if (gameClockIntervals.has(gameId)) {
        clearInterval(gameClockIntervals.get(gameId));
        gameClockIntervals.delete(gameId);
        const gameState = gameStates.get(gameId);
        if (gameState) {
            gameState.gameClockRunning = false;
            broadcastState(gameId);
        }
    }
};

const startPlayClock = (gameId) => {
    let gameState = gameStates.get(gameId);
    if (!gameState || playClockIntervals.has(gameId)) return;

    gameState.playClockRunning = true;
    const interval = setInterval(() => {
        if (gameState.playTimeLeft > 0) {
            gameState.playTimeLeft--;
            broadcastState(gameId);
        } else {
            stopPlayClock(gameId);
        }
    }, 1000);
    playClockIntervals.set(gameId, interval);
    broadcastState(gameId);
};

const stopPlayClock = (gameId) => {
    if (playClockIntervals.has(gameId)) {
        clearInterval(playClockIntervals.get(gameId));
        playClockIntervals.delete(gameId);
        const gameState = gameStates.get(gameId);
        if (gameState) {
            gameState.playClockRunning = false;
            broadcastState(gameId);
        }
    }
};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/game/:gameId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    const parts = pathname.split('/');
    const gameId = parts[2];

    if (parts[1] === 'game' && gameId) {
        wss.handleUpgrade(request, socket, head, (ws) => {
            ws.gameId = gameId;
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

wss.on('connection', function connection(ws, request) {
    const gameId = ws.gameId;
    console.log(`A new client connected to game ${gameId}!`);

    // Initialize game state if it doesn't exist
    if (!gameStates.has(gameId)) {
        gameStates.set(gameId, {
            gameId,
            gameStarted: false,
            gameEnded: false,
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
            playClockRunning: false,
            actionHistory: []
        });
    }
    ws.send(JSON.stringify(gameStates.get(gameId)));

    ws.on('message', function incoming(message) {
        const { type, payload } = JSON.parse(message);
        let gameState = gameStates.get(ws.gameId);
        if (!gameState) return;

        console.log(`Received action from client in game ${ws.gameId}: ${type}`);

        switch (type) {
            case 'START_GAME':
                // Save initial state to history for undo functionality
                gameState.actionHistory = [];
                Object.assign(gameState, payload);
                break;
            case 'UPDATE_STATE':
                // Save state before update for undo functionality
                if (payload.scores || payload.timeoutsUsed) {
                    gameState.actionHistory.push(JSON.parse(JSON.stringify(gameState)));
                    if (gameState.actionHistory.length > 10) {
                        gameState.actionHistory.shift();
                    }
                }
                Object.assign(gameState, payload);
                break;
            case 'START_GAME_CLOCK':
                startGameClock(ws.gameId);
                return;
            case 'STOP_GAME_CLOCK':
                stopGameClock(ws.gameId);
                return;
            case 'START_PLAY_CLOCK':
                startPlayClock(ws.gameId);
                return;
            case 'STOP_PLAY_CLOCK':
                stopPlayClock(ws.gameId);
                return;
            case 'END_GAME':
                stopGameClock(ws.gameId);
                stopPlayClock(ws.gameId);
                gameState.gameEnded = true;
                break;
            case 'UNDO_ACTION':
                if (gameState.actionHistory.length > 0) {
                    const lastState = gameState.actionHistory.pop();
                    Object.assign(gameState, lastState);
                }
                break;
            default:
                console.log('Unknown action type:', type);
                return;
        }

        broadcastState(ws.gameId);
    });

    ws.on('close', () => {
        console.log(`A client disconnected from game ${ws.gameId}.`);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});