const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

// Initial game state
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
    twoMinuteWarningIssued: false,
    gameStarted: false,
    gameEnded: false
};

let currentGameState = { ...initialGameState };
let gameStateHistory = [];
const MAX_HISTORY_SIZE = 10;
let gameClockInterval;
let playClockInterval;

const saveStateToHistory = (state) => {
    gameStateHistory.push(JSON.parse(JSON.stringify(state)));
    if (gameStateHistory.length > MAX_HISTORY_SIZE) {
        gameStateHistory.shift(); // Remove the oldest state
    }
};

const broadcastState = () => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(currentGameState));
        }
    });
};

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

app.use(express.static('public'));

app.get('/game/:gameId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.on('upgrade', (request, socket, head) => {
    const pathname = request.url.split('?')[0];
    if (pathname.startsWith('/game/')) {
        const gameId = pathname.substring(6); // Get the gameId from the URL
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request, gameId);
        });
    } else {
        socket.destroy();
    }
});

let gameStates = {}; // In-memory store for game states

wss.on('connection', (ws, request, gameId) => {
    if (!gameStates[gameId]) {
        console.log(`Creating new game state for ID: ${gameId}`);
        gameStates[gameId] = JSON.parse(JSON.stringify(initialGameState));
    }
    const currentGameState = gameStates[gameId];

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        
        switch (parsedMessage.type) {
            case 'START_GAME_CLOCK':
                startGameClock(currentGameState, gameId);
                break;
            case 'STOP_GAME_CLOCK':
                stopGameClock(currentGameState, gameId);
                break;
            case 'START_PLAY_CLOCK':
                startPlayClock(currentGameState, gameId);
                break;
            case 'STOP_PLAY_CLOCK':
                stopPlayClock(currentGameState, gameId);
                break;
            case 'UPDATE_STATE':
                const oldState = JSON.parse(JSON.stringify(currentGameState));
                Object.assign(currentGameState, parsedMessage.payload);
                if (parsedMessage.payload.gameStarted) {
                    currentGameState.gameStarted = true;
                }
                gameStates[gameId] = currentGameState;
                broadcastState(gameId);
                break;
            case 'END_GAME':
                stopGameClock(currentGameState, gameId);
                stopPlayClock(currentGameState, gameId);
                currentGameState.gameEnded = true; // Set the flag to true
                gameStates[gameId] = currentGameState;
                broadcastState(gameId);
                break;
            case 'UNDO_ACTION':
                // Undo logic...
                break;
        }
    });

    // Send the current game state to the newly connected client
    ws.send(JSON.stringify(currentGameState));

    ws.on('close', () => {
        console.log(`Client disconnected from game ${gameId}`);
        // Optionally, clear the game state if all clients disconnect
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});


server.listen(5000, () => {
    console.log(`Server is running on port 5000`);
});

const gameClockFunctions = {};
const playClockFunctions = {};

// Modify clock functions to be game-specific
function startGameClock(gameState, gameId) {
    if (!gameClockFunctions[gameId]) {
        gameState.gameClockRunning = true;
        gameClockFunctions[gameId] = setInterval(() => {
            if (gameState.gameTimeLeft > 0) {
                gameState.gameTimeLeft--;
                broadcastState(gameId);
            } else {
                stopGameClock(gameState, gameId);
            }
        }, 1000);
    }
}

function stopGameClock(gameState, gameId) {
    clearInterval(gameClockFunctions[gameId]);
    delete gameClockFunctions[gameId];
    gameState.gameClockRunning = false;
    broadcastState(gameId);
}

function startPlayClock(gameState, gameId) {
    if (!playClockFunctions[gameId]) {
        gameState.playClockRunning = true;
        playClockFunctions[gameId] = setInterval(() => {
            if (gameState.playTimeLeft > 0) {
                gameState.playTimeLeft--;
                broadcastState(gameId);
            } else {
                stopPlayClock(gameState, gameId);
            }
        }, 1000);
    }
}

function stopPlayClock(gameState, gameId) {
    clearInterval(playClockFunctions[gameId]);
    delete playClockFunctions[gameId];
    gameState.playClockRunning = false;
    broadcastState(gameId);
}

function broadcastState(gameId) {
    const gameState = gameStates[gameId];
    if (gameState) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.gameId === gameId) {
                client.send(JSON.stringify(gameState));
            }
        });
    }
}