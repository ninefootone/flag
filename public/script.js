document.addEventListener('DOMContentLoaded', () => {
    const ws = new WebSocket(`wss://${location.host}`);

    let gameState = {
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
        playClockRunning: false
    };

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
    const gameLocationDisplay = document.getElementById('game-location');
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
    const manualScoreUpBtns = document.querySelectorAll('.manual-up');
    const manualScoreDownBtns = document.querySelectorAll('.manual-down');
    const undoBtn = document.getElementById('undo-btn');
    const coinTossBtn = document.getElementById('coin-toss-btn');


    // --- WebSocket Event Handlers ---
    ws.onopen = () => {
        console.log('Connected to the WebSocket server!');
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Received from server:', message);
        gameState = { ...gameState, ...message };
        updateUI();
    };

    ws.onclose = () => {
        console.log('Disconnected from the WebSocket server.');
    };

    ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };

    // --- State Management and UI Updates ---
    const sendAction = (type, payload = {}) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type, payload }));
        }
    };

    const toggleInterface = () => {
        if (gameState.team1Name !== 'Home Team' || gameState.team2Name !== 'Away Team') {
            settingsForm.classList.add('hidden');
            gameInterface.classList.remove('hidden');
        } else {
            settingsForm.classList.remove('hidden');
            gameInterface.classList.add('hidden');
        }
    };

    const updateUI = () => {
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
        
        scoreLogList.innerHTML = gameState.scoreLogHTML;
        timeoutLogList.innerHTML = gameState.timeoutLogHTML;
        updateDownDisplay();
        updateButtonLabels();
    };
    
    const updateButtonLabels = () => {
        gameClockToggleBtn.textContent = gameState.gameClockRunning ? 'Stop' : 'Start';
        playClockToggleBtn.textContent = gameState.playClockRunning ? 'Stop' : 'Start';
    };


    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const addScoreLogEntry = (event) => {
        const teamName = event.team === '1' ? gameState.team1Name : gameState.team2Name;
        const newLogEntry = `<li>[${formatTime(gameState.gameTimeLeft)}] ${teamName} scored a ${event.scoreType} for ${event.points} points.</li>`;
        
        const newScoreLogHTML = newLogEntry + gameState.scoreLogHTML;
        sendAction('UPDATE_STATE', { scoreLogHTML: newScoreLogHTML });
    };

    const addTimeoutLogEntry = (event) => {
        const teamName = event.team === '1' ? gameState.team1Name : gameState.team2Name;
        const newLogEntry = `<li>[${formatTime(gameState.gameTimeLeft)}] ${teamName} called a timeout.</li>`;
        
        const newTimeoutLogHTML = newLogEntry + gameState.timeoutLogHTML;
        sendAction('UPDATE_STATE', { timeoutLogHTML: newTimeoutLogHTML });
    };

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
        const newGameState = {
            date: dateField.value || 'N/A',
            location: locationField.value || 'N/A',
            team1Name: team1NameInput.value || 'Home Team',
            team2Name: team2NameInput.value || 'Away Team',
            halfDuration: parseInt(halfDurationInput.value, 10) * 60,
            playClockDuration: parseInt(playClockDurationInput.value, 10),
            timeoutsPerHalf: parseInt(timeoutsPerHalfInput.value, 10),
            scores: { team1: 0, team2: 0 },
            timeoutsUsed: { '1': 0, '2': 0 },
            gameTimeLeft: parseInt(halfDurationInput.value, 10) * 60,
            playTimeLeft: parseInt(playClockDurationInput.value, 10),
            currentDown: 1,
            scoreLogHTML: '',
            timeoutLogHTML: ''
        };
        sendAction('UPDATE_STATE', newGameState);
    });

    scoreButtons.forEach(button => {
        button.addEventListener('click', () => {
            const team = button.dataset.team;
            const scoreToAdd = parseInt(button.dataset.score, 10);
            const scoreLabel = button.dataset.label;
            
            const newScores = { ...gameState.scores };
            if (team === '1') {
                newScores.team1 += scoreToAdd;
            } else {
                newScores.team2 += scoreToAdd;
            }

            addScoreLogEntry({ team: team, scoreType: scoreLabel, points: scoreToAdd });
            sendAction('UPDATE_STATE', { scores: newScores });
        });
    });

    useTimeoutBtns.forEach(button => {
        button.addEventListener('click', () => {
            const team = button.dataset.team;
            if (gameState.timeoutsUsed[team] < gameState.timeoutsPerHalf) {
                const newTimeoutsUsed = { ...gameState.timeoutsUsed };
                newTimeoutsUsed[team]++;
                addTimeoutLogEntry({ team: team });
                sendAction('STOP_GAME_CLOCK');
                sendAction('UPDATE_STATE', { timeoutsUsed: newTimeoutsUsed });
            } else {
                alert('No timeouts left for this team.');
            }
        });
    });

    downButtons.forEach(button => {
        button.addEventListener('click', () => {
            sendAction('UPDATE_STATE', { currentDown: parseInt(button.dataset.down) });
        });
    });

    gameClockToggleBtn.addEventListener('click', () => {
        if (gameState.gameClockRunning) {
            sendAction('STOP_GAME_CLOCK');
        } else {
            sendAction('START_GAME_CLOCK');
        }
    });

    gameClockResetBtn.addEventListener('click', () => {
        sendAction('STOP_GAME_CLOCK');
        sendAction('UPDATE_STATE', { 
            gameTimeLeft: gameState.halfDuration, 
            timeoutsUsed: { '1': 0, '2': 0 } 
        });
    });

    playClockToggleBtn.addEventListener('click', () => {
        if (gameState.playClockRunning) {
            sendAction('STOP_PLAY_CLOCK');
        } else {
            sendAction('START_PLAY_CLOCK');
        }
    });

    playClockResetBtn.addEventListener('click', () => {
        sendAction('STOP_PLAY_CLOCK');
        sendAction('UPDATE_STATE', { playTimeLeft: gameState.playClockDuration });
    });

    manualScoreUpBtns.forEach(button => {
        button.addEventListener('click', () => {
            const team = button.dataset.team;
            const newScores = { ...gameState.scores };
            if (team === '1') {
                newScores.team1++;
            } else {
                newScores.team2++;
            }
            sendAction('UPDATE_STATE', { scores: newScores, scoreLogHTML: `<li>Manual Adjustment: The score was adjusted up for ${team === '1' ? gameState.team1Name : gameState.team2Name}.</li>` + gameState.scoreLogHTML });
        });
    });

    manualScoreDownBtns.forEach(button => {
        button.addEventListener('click', () => {
            const team = button.dataset.team;
            const newScores = { ...gameState.scores };
            if (team === '1') {
                newScores.team1--;
            } else {
                newScores.team2--;
            }
            sendAction('UPDATE_STATE', { scores: newScores, scoreLogHTML: `<li>Manual Adjustment: The score was adjusted down for ${team === '1' ? gameState.team1Name : gameState.team2Name}.</li>` + gameState.scoreLogHTML });
        });
    });
    
    undoBtn.addEventListener('click', () => {
        sendAction('UNDO');
    });

    coinTossBtn.addEventListener('click', () => {
        sendAction('COIN_TOSS');
    });
});