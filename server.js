const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

let currentGameState = {};

// Use this line to serve your static files from the 'public' directory.
// This handles requests for your index.html, script.js, and style.css files.
app.use(express.static(path.join(__dirname, 'public')));

// This is the root route. It tells the app to serve the main index.html file
// when a user visits the URL directly.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// This is your WebSocket server logic, which handles real-time communication.
wss.on('connection', function connection(ws) {
    console.log('A new client connected!');

    ws.send(JSON.stringify(currentGameState));

    ws.on('message', function incoming(message) {
        console.log('received: %s', message);

        try {
            const parsedMessage = JSON.parse(message);
            currentGameState = parsedMessage;
        } catch (error) {
            console.error('Failed to parse message:', error);
        }

        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

    ws.on('close', () => {
        console.log('A client disconnected.');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// This handles the WebSocket upgrade request directly, which is more
// reliable on some platforms.
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});