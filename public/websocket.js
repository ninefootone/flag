window.reconnectAttempts = 0;
window.pingInterval = null;
window.isReconnecting = false;

// --- WebSocket Event Handlers ---
window.connectWebSocket = (gameId) => {
    window.ws = new WebSocket(`wss://${location.host}/game/${gameId}`);

    window.ws.onopen = () => {
        console.log(`Connected to the WebSocket server for game ${gameId}!`);
        window.reconnectAttempts = 0; // Reset counter on successful connection
        window.applyRolePermissions();

        if (window.pingInterval) clearInterval(window.pingInterval); // Clear any old interval
        window.pingInterval = setInterval(() => {
            if (window.ws && window.ws.readyState === WebSocket.OPEN) {
               // Send a lightweight, non-game-changing message (e.g., 'PING')
                window.ws.send(JSON.stringify({ type: 'HEARTBEAT' }));
            }
        }, 10000); // 10 seconds

    };

    window.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Received from server:', message);
        Object.assign(window.gameState, message);
        setTimeout(() => window.updateUI(), 50);
    };

    window.ws.onclose = () => {
        console.log(`Disconnected from the WebSocket server for game ${gameId}. Attempting reconnect...`);
        window.ws = null; // Ensure ws is nullified

        if (window.pingInterval) {
            clearInterval(window.pingInterval);
            window.pingInterval = null;
        }

        // Reconnection logic using exponential backoff (up to 5 attempts)
        if (window.reconnectAttempts < 5) {
            const delay = Math.min(1000 * Math.pow(2, window.reconnectAttempts), 15000);
            window.reconnectAttempts++;
            window.isReconnecting = true;
            setTimeout(() => {
                window.isReconnecting = false;
                window.connectWebSocket(window.gameIdFromUrl);
            }, delay);
        }
    };

    window.ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };
};

// --- State Management and UI Updates ---
window.sendAction = (type, payload = {}) => {
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
        window.ws.send(JSON.stringify({ type, payload }));
    }
};

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('Page became visible - checking WebSocket connection...');
        if (!window.isReconnecting && (!window.ws || window.ws.readyState === WebSocket.CLOSED)) {
            console.log('WebSocket closed, reconnecting...');
            window.reconnectAttempts = 0;
            setTimeout(() => {
                window.connectWebSocket(window.gameIdFromUrl);
            }, 1000);
        } else if (window.ws && window.ws.readyState === WebSocket.OPEN) {
            window.ws.send(JSON.stringify({ type: 'REQUEST_STATE' }));
        }
    }
});
