const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Map to hold WebSocket servers for each game ID
const wssMap = new Map();
const gameStates = new Map();

// Helper to get or create a WebSocket server for a game ID
const getWssForGame = (gameId) => {
    if (!wssMap.has(gameId)) {
        const wss = new WebSocket.Server({ noServer: true });
        wssMap.set(gameId, wss);

        // Initialize game state for this ID
        gameStates.set(gameId, {
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
            actionHistory: []
        });

        const initialGameState = { ...gameStates.get(gameId) };

        let gameClockInterval;
        let playClockInterval;

        const broadcastState = () => {
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(gameStates.get(gameId)));
                }
            });
        };

        const startGameClock = () => {
            const gameState = gameStates.get(gameId);
            if (!gameClockInterval) {
                gameState.gameClockRunning = true;
                gameClockInterval = setInterval(() => {
                    if (gameState.gameTimeLeft > 0) {
                        gameState.gameTimeLeft--;
                        broadcastState();
                    } else {
                        stopGameClock();
                    }
                }, 1000);
            }
        };

        const stopGameClock = () => {
            const gameState = gameStates.get(gameId);
            clearInterval(gameClockInterval);
            gameClockInterval = null;
            gameState.gameClockRunning = false;
            broadcastState();
        };

        const startPlayClock = () => {
            const gameState = gameStates.get(gameId);
            if (!playClockInterval) {
                gameState.playClockRunning = true;
                playClockInterval = setInterval(() => {
                    if (gameState.playTimeLeft > 0) {
                        gameState.playTimeLeft--;
                        broadcastState();
                    } else {
                        stopPlayClock();
                    }
                }, 1000);
            }
        };

        const stopPlayClock = () => {
            const gameState = gameStates.get(gameId);
            clearInterval(playClockInterval);
            playClockInterval = null;
            gameState.playClockRunning = false;
            broadcastState();
        };

        wss.on('connection', (ws) => {
            console.log(`Client connected to game ${gameId}!`);
            ws.send(JSON.stringify(gameStates.get(gameId)));

            ws.on('message', (message) => {
                const parsedMessage = JSON.parse(message);
                const gameState = gameStates.get(gameId);

                if (parsedMessage.type === 'START_GAME_CLOCK') {
                    startGameClock();
                } else if (parsedMessage.type === 'STOP_GAME_CLOCK') {
                    stopGameClock();
                } else if (parsedMessage.type === 'START_PLAY_CLOCK') {
                    startPlayClock();
                } else if (parsedMessage.type === 'STOP_PLAY_CLOCK') {
                    stopPlayClock();
                } else if (parsedMessage.type === 'UPDATE_STATE') {
                    Object.assign(gameState, parsedMessage.payload);
                    broadcastState();
                } else if (parsedMessage.type === 'END_GAME') {
                    stopGameClock();
                    stopPlayClock();
                    gameStates.set(gameId, { ...initialGameState });
                    broadcastState();
                }
            });

            ws.on('close', () => {
                console.log(`Client disconnected from game ${gameId}`);
            });

            ws.on('error', (error) => {
                console.error(`WebSocket error in game ${gameId}:`, error);
            });
        });

        return wss;
    }
    return wssMap.get(gameId);
};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/game/:gameId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.on('upgrade', (request, socket, head) => {
    const pathname = request.url;
    const gameId = pathname.split('/')[2];
    
    if (pathname.startsWith('/game/') && gameId) {
        const wss = getWssForGame(gameId);
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});