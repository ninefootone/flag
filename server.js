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
        gameState._gameClockStartedAt = Date.now();
        gameState._gameClockStartingTime = gameState.gameTimeLeft;
        gameClockFunctions[gameId] = setInterval(() => {
            const elapsed = Math.floor((Date.now() - gameState._gameClockStartedAt) / 1000);
            const newTime = gameState._gameClockStartingTime - elapsed;
            if (newTime > 0) {
                gameState.gameTimeLeft = newTime;
                broadcastState(gameId);
            } else {
                gameState.gameTimeLeft = 0;
                broadcastState(gameId);
                stopGameClock(gameState, gameId);
            }
        }, 500);
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
        gameState._playClockStartedAt = Date.now();
        gameState._playClockStartingTime = gameState.playTimeLeft;
        playClockFunctions[gameId] = setInterval(() => {
            const elapsed = Math.floor((Date.now() - gameState._playClockStartedAt) / 1000);
            const newTime = gameState._playClockStartingTime - elapsed;
            if (newTime > 0) {
                gameState.playTimeLeft = newTime;
                broadcastState(gameId);
            } else {
                gameState.playTimeLeft = 0;
                broadcastState(gameId);
                stopPlayClock(gameState, gameId);
            }
        }, 500);
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
            case 'REQUEST_STATE':
                ws.send(JSON.stringify(currentGameState));
                break;
            case 'UPDATE_STATE':
                Object.assign(currentGameState, parsedMessage.payload);
                if (parsedMessage.payload.gameStarted) {
                    currentGameState.gameStarted = true;
                }
                // If clock is running and time was manually adjusted, re-anchor the timestamp
                if (parsedMessage.payload.gameTimeLeft !== undefined && currentGameState.gameClockRunning) {
                    currentGameState._gameClockStartedAt = Date.now();
                    currentGameState._gameClockStartingTime = parsedMessage.payload.gameTimeLeft;
                }
                if (parsedMessage.payload.playTimeLeft !== undefined && currentGameState.playClockRunning) {
                    currentGameState._playClockStartedAt = Date.now();
                    currentGameState._playClockStartingTime = parsedMessage.payload.playTimeLeft;
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

// Team submission endpoint
app.use(express.json());

app.post('/submit-team', async (req, res) => {
  const { teamName, league, logoUrl } = req.body;
  if (!teamName || !teamName.trim()) {
    return res.status(400).json({ error: 'Team name required' });
  }
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'Whistle App', email: 'hello@gridiron-stats.co' },
        to: [{ email: 'hello@gridiron-stats.co', name: 'Whistle Team' }],
        subject: `New Team Submission: ${teamName.trim()}`,
        htmlContent: `
          <h2>New Team Submission</h2>
          <p><strong>Team Name:</strong> ${teamName.trim()}</p>
          <p><strong>League:</strong> ${league?.trim() || 'Not provided'}</p>
          <p><strong>Logo URL:</strong> ${logoUrl?.trim() || 'Not provided'}</p>
        `,
      }),
    });
    if (!response.ok) throw new Error('Brevo API error');
    res.json({ success: true });
  } catch (err) {
    console.error('Team submission error:', err);
    res.status(500).json({ error: 'Failed to send submission' });
  }
});

const port = process.env.PORT || 5000;

app.post('/submit-feedback', async (req, res) => {
  const { feedbackType, message, email } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message required' });
  }
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'Whistle App', email: 'hello@gridiron-stats.co' },
        to: [{ email: 'hello@gridiron-stats.co', name: 'Whistle Team' }],
        subject: `Whistle Feedback: ${feedbackType || 'General'}`,
        htmlContent: `
          <h2>Whistle App Feedback</h2>
          <p><strong>Type:</strong> ${feedbackType || 'General'}</p>
          <p><strong>Message:</strong> ${message.trim()}</p>
          <p><strong>Email:</strong> ${email?.trim() || 'Not provided'}</p>
        `,
      }),
    });
    if (!response.ok) throw new Error('Brevo API error');
    res.json({ success: true });
  } catch (err) {
    console.error('Feedback submission error:', err);
    res.status(500).json({ error: 'Failed to send feedback' });
  }
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});