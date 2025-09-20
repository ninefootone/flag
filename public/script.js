document.addEventListener('DOMContentLoaded', () => {
    // WebSocket connection to the server
    const ws = new WebSocket(`wss://${location.host}`);

    // State object to hold all game data
    let gameState = {
        date: '',
        location: '',
        team1Name: 'Home Team',
        team2Name: 'Away Team',
        scores: { team1: 0, team2: 0 },
        timeoutsUsed: { '1': 0, '2': 0 },
        gameTimeLeft: 1200, // 20 minutes in seconds
        playTimeLeft: 40,
        currentDown: 1,
        halfDuration: 1200,
        playClockDuration: 40,
        timeoutsPerHalf: 2,
        actionLog: [],
        scoreLogHTML: '',
        timeoutLogHTML: ''
    };

    // DOM Elements
    const settingsForm = document.getElementById('settings-form');
    const gameInterface = document.getElementById('game-interface');
    const startGameBtn = document.getElementById('start-game-btn');
    const dateField = document.getElementById('date-field');
    const locationField = document.getElementById('location-field');
    const team1NameInput = document.getElementById('team1-name');
    const team2NameInput = document.getElementById('team2-name');
    const halfDurationInput = document.getElementById('half-duration');
    const playClockDurationInput = document.getElementById('play-clock-duration');
    const timeoutsPerHalfInput = document.getElementById('timeouts-per-half');
    const team1NameDisplay = document.getElementById('team1-name-display');
    const team2NameDisplay = document.getElementById('team2-name-display');
    const gameDateDisplay = document.getElementById('game-date');
    const gameLocationDisplay = document = document.getElementById('game-location');
    const team1ScoreDisplay = document.getElementById('team1-score-display');
    const team2ScoreDisplay = document.getElementById('team2-score-display');
    const team1TimeoutsDisplay = document.getElementById('team1-timeouts');
    const team2TimeoutsDisplay = document.getElementById('team2-timeouts');
    const gameClockDisplay = document.getElementById('game-clock-display');
    const playClockDisplay = document.getElementById('play-clock-display');
    const scoreLogList = document.getElementById('score-log');
    const timeoutLogList = document.getElementById('timeout-log');
    const downButtons = document.querySelectorAll('.down-btn');
    const autoAdvanceCheckbox = document.getElementById('auto-advance-play-clock');
    const scoreButtons = document.querySelectorAll('.score-buttons button');
    const useTimeoutBtns = document.querySelectorAll('.use-timeout-btn');
    const gameClockToggleBtn = document.getElementById('game-clock-toggle');
    const gameClockResetBtn = document.getElementById('game-clock-reset');
    const playClockToggleBtn = document.getElementById('play-clock-toggle');
    const playClockResetBtn = document.getElementById('play-clock-reset');

    // Timer variables
    let gameClockInterval;
    let playClockInterval;

    // --- WebSocket Event Handlers ---

    // Connection opened
    ws.onopen = () => {
        console.log('Connected to the WebSocket server!');
    };

    // Listen for messages from the server
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Received from server:', message);

        // Update the local game state with the received data
        gameState = { ...gameState, ...message };

        // Update the UI to reflect the new state
        updateUI();
    };

    // Connection closed
    ws.onclose = () => {
        console.log('Disconnected from the WebSocket server.');
    };

    // Error handler
    ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };

    // --- State Management and UI Updates ---

    // Function to send the entire game state to the server
    const broadcastState = () => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(gameState));
        }
    };

    // New function to toggle the UI
    const toggleInterface = () => {
        // If the game has started (a team name is set), show the game interface
        if (gameState.team1Name !== 'Home Team' || gameState.team2Name !== 'Away Team') {
            settingsForm.classList.add('hidden');
            gameInterface.classList.remove('hidden');
        } else {
            // Otherwise, show the setup form
            settingsForm.classList.remove('hidden');
            gameInterface.classList.add('hidden');
        }
    };

    // Function to update the entire UI based on the local gameState
    const updateUI = () => {
        // First, check if we should be on the game or setup screen
        toggleInterface();
        
        gameDateDisplay.textContent = gameState.date;
        gameLocationDisplay.textContent = gameState.location;
        team1NameDisplay.textContent = gameState.team1Name;
        team2NameDisplay.textContent = gameState.team2Name;
        team1ScoreDisplay.textContent = gameState.scores.team1;
        team2ScoreDisplay.textContent = gameState.scores.team2;
        team1TimeoutsDisplay.textContent = gameState.timeoutsPerHalf - gameState.timeoutsUsed['1'];
        team2TimeoutsDisplay.textContent = gameState.timeoutsPerHalf - gameState.timeoutsUsed['2'];
        gameClockDisplay.textContent = formatTime(gameState.gameTimeLeft);
        playClockDisplay.textContent = gameState.playTimeLeft;
        
        // Update logs and down tracker
        scoreLogList.innerHTML = gameState.scoreLogHTML;
        timeoutLogList.innerHTML = gameState.timeoutLogHTML;
        updateDownDisplay();
    };

    // --- Game Logic Functions (local, then broadcast) ---

    // Helper function to format time
    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Game Clock Functions
    const startGameClock = () => {
        if (!gameClockInterval) {
            gameClockInterval = setInterval(() => {
                if (gameState.gameTimeLeft > 0) {
                    gameState.gameTimeLeft--;
                    broadcastState();
                } else {
                    stopGameClock();
                    alert('Half is over!');
                }
            }, 1000);
            gameClockToggleBtn.textContent = 'Stop';
        }
    };
    const stopGameClock = () => {
        clearInterval(gameClockInterval);
        gameClockInterval = null;
        gameClockToggleBtn.textContent = 'Start';
    };
    const resetGameClock = () => {
        stopGameClock();
        gameState.gameTimeLeft = gameState.halfDuration;
        gameState.timeoutsUsed = { '1': 0, '2': 0 };
        broadcastState();
    };
    const toggleGameClock = () => {
        if (gameClockInterval) {
            stopGameClock();
        } else {
            startGameClock();
        }
    };

    // Play Clock Functions
    const startPlayClock = () => {
        if (autoAdvanceCheckbox.checked) {
            gameState.currentDown = (gameState.currentDown % 4) + 1;
            broadcastState();
        }
        if (!playClockInterval) {
            playClockInterval = setInterval(() => {
                if (gameState.playTimeLeft > 0) {
                    gameState.playTimeLeft--;
                    broadcastState();
                } else {
                    stopPlayClock();
                    alert('Play clock expired!');
                }
            }, 1000);
            playClockToggleBtn.textContent = 'Stop';
        }
    };
    const stopPlayClock = () => {
        clearInterval(playClockInterval);
        playClockInterval = null;
        playClockToggleBtn.textContent = 'Start';
    };
    const resetPlayClock = () => {
            stopPlayClock();
            gameState.playTimeLeft = gameState.playClockDuration;
            broadcastState();
    };
    const togglePlayClock = () => {
        if (playClockInterval) {
            stopPlayClock();
        } else {
            startPlayClock();
        }
    };

    // Log Functions
    const addScoreLogEntry = (event) => {
        const teamName = event.team === '1' ? gameState.team1Name : gameState.team2Name;
        gameState.scoreLogHTML = `<li>[${formatTime(gameState.gameTimeLeft)}] ${teamName} scored a ${event.scoreType} for ${event.points} points.</li>` + gameState.scoreLogHTML;
    };

    const addTimeoutLogEntry = (event) => {
        const teamName = event.team === '1' ? gameState.team1Name : gameState.team2Name;
        gameState.timeoutLogHTML = `<li>[${formatTime(gameState.gameTimeLeft)}] ${teamName} called a timeout.</li>` + gameState.timeoutLogHTML;
    };

    // Undo Function
    const undoLastAction = () => {
        // NOTE: This feature will need to be refactored on the server-side to work reliably
        alert('Undo functionality is not yet implemented in the real-time version.');
    };

    // Down Tracker Functions
    const updateDownDisplay = () => {
        downButtons.forEach(btn => {
            if (parseInt(btn.dataset.down) === gameState.currentDown) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    };

    // --- Event Listeners ---

    startGameBtn.addEventListener('click', () => {
        gameState.date = dateField.value || 'N/A';
        gameState.location = locationField.value || 'N/A';
        gameState.team1Name = team1NameInput.value || 'Home Team';
        gameState.team2Name = team2NameInput.value || 'Away Team';
        gameState.halfDuration = parseInt(halfDurationInput.value, 10) * 60;
        gameState.playClockDuration = parseInt(playClockDurationInput.value, 10);
        gameState.timeoutsPerHalf = parseInt(timeoutsPerHalfInput.value, 10);
        
        gameState.scores = { team1: 0, team2: 0 };
        gameState.timeoutsUsed = { '1': 0, '2': 0 };
        gameState.gameTimeLeft = gameState.halfDuration;
        gameState.playTimeLeft = gameState.playClockDuration;
        gameState.currentDown = 1;
        gameState.actionLog = [];
        gameState.scoreLogHTML = '';
        gameState.timeoutLogHTML = '';
        
        broadcastState();
    });

    scoreButtons.forEach(button => {
        button.addEventListener('click', () => {
            const team = button.dataset.team;
            const scoreToAdd = parseInt(button.dataset.score, 10);
            const scoreLabel = button.dataset.label;
            
            if (team === '1') {
                gameState.scores.team1 += scoreToAdd;
            } else {
                gameState.scores.team2 += scoreToAdd;
            }

            addScoreLogEntry({ team: team, scoreType: scoreLabel, points: scoreToAdd });
            broadcastState();
        });
    });

    useTimeoutBtns.forEach(button => {
        button.addEventListener('click', () => {
            const team = button.dataset.team;
            if (gameState.timeoutsUsed[team] < gameState.timeoutsPerHalf) {
                gameState.timeoutsUsed[team]++;
                addTimeoutLogEntry({ team: team });
                stopGameClock();
                broadcastState();
            } else {
                alert('No timeouts left for this team.');
            }
        });
    });

    downButtons.forEach(button => {
        button.addEventListener('click', () => {
            gameState.currentDown = parseInt(button.dataset.down);
            broadcastState();
        });
    });

    // Timer Event Listeners
    gameClockToggleBtn.addEventListener('click', toggleGameClock);
    gameClockResetBtn.addEventListener('click', resetGameClock);
    playClockToggleBtn.addEventListener('click', togglePlayClock);
    playClockResetBtn.addEventListener('click', resetPlayClock);
});