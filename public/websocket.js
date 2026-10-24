window.reconnectAttempts = 0;
window.pingInterval = null;
window.isReconnecting = false;

// --- WebSocket Event Handlers ---
window.connectWebSocket = (gameId) => {
    window.lastGameId = gameId;
    const WS_HOST = 'flag-production-d4bb.up.railway.app';
    window.ws = new WebSocket(`wss://${WS_HOST}/game/${gameId}`);

    window.ws.onopen = () => {
        console.log(`Connected to the WebSocket server for game ${gameId}!`);
        window.reconnectAttempts = 0;
        window.applyRolePermissions();
        window.hideConnectionBanner();
        window.flushActionQueue();

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
        document.getElementById('connecting-spinner').classList.add('hidden');
        setTimeout(() => window.updateUI(), 50);
    };

    window.ws.onclose = () => {
        console.log(`Disconnected from the WebSocket server for game ${gameId}. Attempting reconnect...`);
        window.ws = null; // Ensure ws is nullified
        window.showConnectionBanner();

        if (window.pingInterval) {
            clearInterval(window.pingInterval);
            window.pingInterval = null;
        }

        // Keep retrying with exponential backoff, capped at 10s between attempts.
        // (Previously gave up after 5 attempts, ~30s, leaving the app silently offline.)
        const delay = Math.min(1000 * Math.pow(2, window.reconnectAttempts), 10000);
        window.reconnectAttempts++;
        window.isReconnecting = true;
        clearTimeout(window.reconnectTimer);
        window.reconnectTimer = setTimeout(() => {
            window.isReconnecting = false;
            window.connectWebSocket(gameId);
        }, delay);
    };

    window.ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };
};

// --- State Management and UI Updates ---
window.actionQueue = [];

// Queued actions are absolute snapshots (scores, clock times, whole state),
// so replaying an old one would overwrite newer changes from other officials.
// Only replay actions from a short blip; drop anything older or from another game.
window.ACTION_QUEUE_MAX_AGE_MS = 15000;

window.flushActionQueue = () => {
    const now = Date.now();
    while (window.actionQueue.length > 0 && window.ws && window.ws.readyState === WebSocket.OPEN) {
        const queued = window.actionQueue.shift();
        if (queued.gameId !== window.lastGameId || now - queued.queuedAt > window.ACTION_QUEUE_MAX_AGE_MS) {
            console.warn(`Dropping stale queued action: ${queued.type}`);
            continue;
        }
        window.ws.send(JSON.stringify({ type: queued.type, payload: queued.payload }));
    }
};

window.sendAction = (type, payload = {}) => {
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
        window.ws.send(JSON.stringify({ type, payload }));
    } else {
        console.warn(`WS not open — queuing action: ${type}`);
        window.actionQueue.push({ type, payload, gameId: window.lastGameId, queuedAt: Date.now() });
        window.showConnectionBanner();
    }
};

window.showConnectionBanner = () => {
    const banner = document.getElementById('ws-reconnect-banner');
    if (banner) banner.classList.remove('hidden');
};

window.hideConnectionBanner = () => {
    const banner = document.getElementById('ws-reconnect-banner');
    if (banner) banner.classList.add('hidden');
};

// Reconnect immediately when the device gets its network back,
// instead of waiting for the next backoff timer.
window.addEventListener('online', () => {
    if (window.lastGameId && !window.ws) {
        console.log('Network back online - reconnecting now');
        clearTimeout(window.reconnectTimer);
        window.isReconnecting = false;
        window.reconnectAttempts = 0;
        window.connectWebSocket(window.lastGameId);
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        const pathParts = window.location.pathname.split('/');
        const currentGameId = pathParts.length > 2 && pathParts[1] === 'game' ? pathParts[2].split('?')[0] : null;
        console.log('Page became visible - game ID:', currentGameId);
        if (!window.isReconnecting && (!window.ws || window.ws.readyState === WebSocket.CLOSED)) {
            console.log('WebSocket closed, reconnecting...');
            window.reconnectAttempts = 0;
            setTimeout(() => {
                window.connectWebSocket(currentGameId);
            }, 1000);
        } else if (window.ws && window.ws.readyState === WebSocket.OPEN) {
            window.ws.send(JSON.stringify({ type: 'REQUEST_STATE' }));
        }
    }
});