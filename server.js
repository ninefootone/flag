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

// Express app routing
app.use(express.static('public'));

app.get('/game/:gameId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebSocket server setup
server.on('upgrade', (request, socket, head) => {
    const pathname = request.url.split('?')[0];
    if (pathname.startsWith('/game/')) {
        const gameId = pathname.substring(6);
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request, gameId);
        });
    } else {
        socket.destroy();
    }
});

wss.on('connection', (ws, request, gameId) => {
    ws.gameId = gameId; // Store gameId on the client for easy lookup
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
                Object.assign(currentGameState, parsedMessage.payload);
                if (parsedMessage.payload.gameStarted) {
                    currentGameState.gameStarted = true;
                }
                gameStates[gameId] = currentGameState;
                broadcastState(gameId);
                break;
            // NEW: Defensive Stat Logging
            case 'LOG_DEFENSIVE_STAT':
                {
                    const payload = parsedMessage.payload;
                    const teamId = payload.teamId;
                    const statType = payload.statType;
                    const notes = payload.notes;
                    const timeDisplay = payload.time;

                    // 1. Format the stat type for display (e.g., 'tackle-for-loss' -> 'Tackle For Loss')
                    const formattedStat = statType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                    // 2. Access team names (using '==' for loose comparison of '1' or 1)
                    const teamName = teamId == 1 ? currentGameState.team1Name : currentGameState.team2Name;
                    const opposingTeamName = teamId == 1 ? currentGameState.team2Name : currentGameState.team1Name;

                    const actionDescription = `${formattedStat} logged for **${teamName}** (vs ${opposingTeamName})`;
                    const notesText = notes ? ` - ${notes}` : '';
                    
                    // 3. Build the HTML log entry, using the log structure from the scoreboard log.
                    const liHTML = `<li class="log-item defensive-log-item">[${timeDisplay}] <span class="log-stat-type">DEFENSE:</span> ${actionDescription}${notesText}</li>`;

                    // 4. Update the state's score log HTML
                    currentGameState.scoreLogHTML += liHTML;
                    
                    // 5. Save and broadcast to all clients
                    gameStates[gameId] = currentGameState;
                    broadcastState(gameId);
                }
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