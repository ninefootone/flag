const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, '')));

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

// Store game states in memory, keyed by gameId
const gameStates = {};
const gameClockFunctions = {};
const playClockFunctions = {};

// Helper function to broadcast state to all clients for a specific game
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

// Function to start the game clock
function startGameClock(gameState, gameId) {
    if (gameState.gameClockRunning) return;
    gameState.gameClockRunning = true;
    gameClockFunctions[gameId] = setInterval(() => {
        if (gameState.gameTimeLeft > 0) {
            gameState.gameTimeLeft--;
            if (gameState.gameTimeLeft === 120 && !gameState.twoMinuteWarningIssued) {
                gameState.twoMinuteWarningIssued = true;
                // You can add a notification here or an audio cue
                console.log('Two-minute warning!');
            }
            broadcastState(gameId);
        } else {
            stopGameClock(gameState, gameId);
        }
    }, 1000);
}

// Function to stop the game clock
function stopGameClock(gameState, gameId) {
    clearInterval(gameClockFunctions[gameId]);
    gameState.gameClockRunning = false;
    broadcastState(gameId);
}

// Function to start the play clock
function startPlayClock(gameState, gameId) {
    if (gameState.playClockRunning) return;
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

// Function to stop the play clock
function stopPlayClock(gameState, gameId) {
    clearInterval(playClockFunctions[gameId]);
    gameState.playClockRunning = false;
    broadcastState(gameId);
}

server.on('upgrade', (request, socket, head) => {
    const pathname = request.url;
    console.log(`Upgrade request for path: ${pathname}`);
    
    // Check if the request URL is a valid WebSocket path
    // In this case, we'll assume any request to a path starting with /game/ is for a WebSocket
    const gameMatch = pathname.match(/^\/game\/(.*)$/);
    if (gameMatch) {
        const gameId = gameMatch[1];
        if (!gameStates[gameId]) {
            console.log(`Creating new game with ID: ${gameId}`);
            gameStates[gameId] = JSON.parse(JSON.stringify(initialGameState)); // Deep copy
        }
        
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request, gameId);
        });
    } else {
        socket.destroy();
    }
});

wss.on('connection', (ws, request, gameId) => {
    console.log(`Client connected to game ${gameId}`);
    ws.gameId = gameId;

    const currentGameState = gameStates[gameId];

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        console.log('Received message:', parsedMessage);

        switch (parsedMessage.type) {
            case 'CREATE_GAME':
                // Handled in the upgrade listener
                break;
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
                currentGameState.gameEnded = true;
                gameStates[gameId] = currentGameState;
                broadcastState(gameId);
                break;
        }
    });

    ws.send(JSON.stringify(currentGameState));

    ws.on('close', () => {
        console.log(`Client disconnected from game ${gameId}`);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});