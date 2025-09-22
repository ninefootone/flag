const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const url = require('url');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

// NEW: Use a Map to store game states, keyed by gameId
const games = new Map();

// Default state for a new game
const initialGameState = {
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
    coinTossResult: null,
    twoMinuteWarningIssued: false
};

const gameClockIntervals = new Map();
const playClockIntervals = new Map();
const gameClients = new Map();
const gameHistories = new Map();

const getGameState = (gameId) => {
    if (!games.has(gameId)) {
        games.set(gameId, JSON.parse(JSON.stringify(initialGameState)));
        gameHistories.set(gameId, []);
    }
    return games.get(gameId);
};

const saveStateToHistory = (gameId, state) => {
    const history = gameHistories.get(gameId);
    history.push(JSON.parse(JSON.stringify(state)));
    if (history.length > 10) {
        history.shift(); // Remove the oldest state
    }
};

const startGameClock = (gameId) => {
    if (!gameClockIntervals.has(gameId)) {
        const gameState = getGameState(gameId);
        gameState.gameClockRunning = true;
        gameClockIntervals.set(gameId, setInterval(() => {
            if (gameState.gameTimeLeft > 0) {
                gameState.gameTimeLeft--;
                broadcastState(gameId);
            } else {
                stopGameClock(gameId);
            }
        }, 1000));
    }
};

const stopGameClock = (gameId) => {
    if (gameClockIntervals.has(gameId)) {
        clearInterval(gameClockIntervals.get(gameId));
        gameClockIntervals.delete(gameId);
        const gameState = getGameState(gameId);
        gameState.gameClockRunning = false;
        broadcastState(gameId);
    }
};

const startPlayClock = (gameId) => {
    if (!playClockIntervals.has(gameId)) {
        const gameState = getGameState(gameId);
        gameState.playClockRunning = true;
        playClockIntervals.set(gameId, setInterval(() => {
            if (gameState.playTimeLeft > 0) {
                gameState.playTimeLeft--;
                broadcastState(gameId);
            } else {
                stopPlayClock(gameId);
            }
        }, 1000));
    }
};

const stopPlayClock = (gameId) => {
    if (playClockIntervals.has(gameId)) {
        clearInterval(playClockIntervals.get(gameId));
        playClockIntervals.delete(gameId);
        const gameState = getGameState(gameId);
        gameState.playClockRunning = false;
        broadcastState(gameId);
    }
};

const broadcastState = (gameId) => {
    if (gameClients.has(gameId)) {
        gameClients.get(gameId).forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                const gameState = getGameState(gameId);
                client.send(JSON.stringify(gameState));
            }
        });
    }
};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// NEW: Handle upgrade for WebSocket connections on the /game/:gameId path
server.on('upgrade', (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;
    const match = pathname.match(/^\/game\/(\w+)$/);

    if (match) {
        const gameId = match[1];
        wss.handleUpgrade(request, socket, head, (ws) => {
            ws.gameId = gameId; // Store gameId on the WebSocket connection
            if (!gameClients.has(gameId)) {
                gameClients.set(gameId, new Set());
            }
            gameClients.get(gameId).add(ws);
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});


wss.on('connection', function connection(ws) {
    console.log(`A new client connected to game ${ws.gameId}!`);
    const gameState = getGameState(ws.gameId);
    ws.send(JSON.stringify(gameState));

    ws.on('message', function incoming(message) {
        const parsedMessage = JSON.parse(message);
        console.log(`Received action from game ${ws.gameId}:`, parsedMessage.type);
        
        const gameState = getGameState(ws.gameId);
        const gameHistory = gameHistories.get(ws.gameId);

        if (parsedMessage.type === 'UPDATE_STATE' || parsedMessage.type === 'END_GAME') {
            saveStateToHistory(ws.gameId, gameState);
        }

        if (parsedMessage.type === 'START_GAME_CLOCK') {
            startGameClock(ws.gameId);
        } else if (parsedMessage.type === 'STOP_GAME_CLOCK') {
            stopGameClock(ws.gameId);
        } else if (parsedMessage.type === 'START_PLAY_CLOCK') {
            startPlayClock(ws.gameId);
        } else if (parsedMessage.type === 'STOP_PLAY_CLOCK') {
            stopPlayClock(ws.gameId);
        } else if (parsedMessage.type === 'UPDATE_STATE') {
            // Check if this update is a game clock reset
            if (parsedMessage.payload.gameTimeLeft !== undefined && parsedMessage.payload.gameTimeLeft === gameState.halfDuration) {
                const endHalfLog = '<li>--- End of First Half ---</li>';
                gameState.scoreLogHTML = endHalfLog + gameState.scoreLogHTML;
            }
            Object.assign(gameState, parsedMessage.payload);
            broadcastState(ws.gameId);
        } else if (parsedMessage.type === 'END_GAME') {
            stopGameClock(ws.gameId);
            stopPlayClock(ws.gameId);
            games.delete(ws.gameId);
            gameHistories.delete(ws.gameId);
            ws.send(JSON.stringify(initialGameState));
            ws.close();
        } else if (parsedMessage.type === 'UNDO_ACTION') {
            if (gameHistory.length > 0) {
                const lastState = gameHistory.pop();
                Object.assign(gameState, lastState);
                stopGameClock(ws.gameId);
                stopPlayClock(ws.gameId);
                broadcastState(ws.gameId);
            } else {
                console.log('No more actions to undo.');
            }
        }
    });

    ws.on('close', () => {
        console.log(`A client disconnected from game ${ws.gameId}.`);
        if (gameClients.has(ws.gameId)) {
            gameClients.get(ws.gameId).delete(ws);
            if (gameClients.get(ws.gameId).size === 0) {
                console.log(`All clients disconnected from game ${ws.gameId}. Game state preserved.`);
            }
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});