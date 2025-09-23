const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

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

// Clock control functions
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

server.on('upgrade', (request, socket, head) => {
    const pathname = request.url.split('?')[0];
    const gameId = pathname.split('/')[2];

    if (pathname.startsWith('/game/') && gameId) {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request, gameId);
        });
    } else {
        socket.destroy();
    }
});

wss.on('connection', (ws, req, gameId) => {
    ws.gameId = gameId;
    console.log(`Client connected to game ${gameId}`);

    // Initialize or retrieve game state
    let currentGameState = gameStates[gameId];
    if (!currentGameState) {
        currentGameState = { ...initialGameState };
        currentGameState.gameId = gameId; // Store gameId in state
        gameStates[gameId] = currentGameState;
        console.log(`Created new game state for ${gameId}`);
    }

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        const { type, payload } = parsedMessage;

        switch (type) {
            case 'START_GAME':
                const halfDuration = payload.halfDuration;
                const playClockDuration = payload.playClockDuration;
                const timeoutsPerHalf = payload.timeoutsPerHalf;
                currentGameState.halfDuration = halfDuration * 60; // Convert minutes to seconds
                currentGameState.playClockDuration = playClockDuration;
                currentGameState.timeoutsPerHalf = timeoutsPerHalf;
                currentGameState.gameTimeLeft = currentGameState.halfDuration;
                currentGameState.playTimeLeft = currentGameState.playClockDuration;
                currentGameState.team1Name = payload.team1Name;
                currentGameState.team2Name = payload.team2Name;
                currentGameState.date = payload.date;
                currentGameState.location = payload.location;
                currentGameState.gameStarted = true;
                broadcastState(gameId);
                break;
            case 'SCORE_UPDATE':
                const scoreTeam = payload.team;
                const scorePoints = payload.points;
                const scoreType = payload.scoreType;
                const scoreTime = formatTime(payload.gameTimeLeft);
                const teamName = currentGameState[scoreTeam + 'Name'];
                currentGameState.scores[scoreTeam] += scorePoints;
                let scoreText = `${teamName} scores a ${scoreType} for ${scorePoints} points!`;
                if (payload.playerNumbers && payload.playerNumbers.length > 0) {
                    scoreText += ` (Players: ${payload.playerNumbers.join(', ')})`;
                }
                const scoreLogEntry = `<li>[${scoreTime}] ${scoreText}</li>`;
                currentGameState.scoreLogHTML += scoreLogEntry;
                broadcastState(gameId);
                break;
            case 'TIMEOUT_USED':
                const timeoutTeam = payload.team;
                const timeoutTime = formatTime(payload.gameTimeLeft);
                const timeoutTeamName = currentGameState[timeoutTeam + 'Name'];
                currentGameState.timeoutsUsed[timeoutTeam === 'team1' ? '1' : '2']++;
                const timeoutLogEntry = `<li>[${timeoutTime}] Timeout called by ${timeoutTeamName}.</li>`;
                currentGameState.timeoutLogHTML += timeoutLogEntry;
                broadcastState(gameId);
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