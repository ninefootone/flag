document.addEventListener('DOMContentLoaded', () => {
    // Automatically set the date field to the current date
    const today = new Date();
    const formattedDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    document.getElementById('date-field').value = formattedDate;

    // Element references
    const gameLobby = document.getElementById('game-lobby');
    const settingsForm = document.getElementById('settings-form');
    const gameInterface = document.getElementById('game-interface');
    const startNewGameBtn = document.getElementById('start-new-game-btn');
    const joinGameBtn = document.getElementById('join-game-btn');
    const gameIdInput = document.getElementById('game-id-input');
    const joinErrorMessage = document.getElementById('join-error-message');
    const roleInputs = document.querySelectorAll('input[name="user-role"]');
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
    const adjustButtons = document.querySelectorAll('.adjust-btn');
    const endGameBtn = document.getElementById('end-game-btn');
    const undoBtn = document.getElementById('undo-btn');
    const team1TimeoutLabel = document.getElementById('team1-timeout-label');
    const team2TimeoutLabel = document.getElementById('team2-timeout-label');
    const scorePopup = document.getElementById('score-popup');
    const popupHeader = document.getElementById('popup-header');
    const qbNumberInput = document.getElementById('qb-number');
    const wrNumberInput = document.getElementById('wr-number');
    const rbNumberInput = document.getElementById('rb-number');
    const intNumberInput = document.getElementById('int-number');
    const safetyNumberInput = document.getElementById('safety-number');
    const logScoreBtn = document.getElementById('log-score-btn');
    const cancelPopupBtn = document.getElementById('cancel-popup-btn');
    const coinTossBtn = document.getElementById('coin-toss-btn');
    const coinTossResultDisplay = document.getElementById('coin-toss-result');
    
    // NEW: Add references to elements that need to be hidden/shown based on role
    const gameClockSection = document.getElementById('game-clock-section');
    const playClockSection = document.getElementById('play-clock-section');
    const downSection = document.getElementById('down-section');
    const scoreboardSection = document.getElementById('scoreboard-section');
    const adjustScoreSection = document.getElementById('adjust-score-section');
    const scoreButtonsSection = document.getElementById('score-buttons-section');
    const timeoutButtonsSection = document.getElementById('timeout-buttons-section');

    const gameIdDisplay = document.createElement('p');
    gameIdDisplay.id = 'current-game-id';
    gameIdDisplay.innerHTML = '<strong>Game ID:</strong> <span id="game-id-text"></span> (Share this with others to join)';
    gameIdDisplay.style.display = 'none';
    settingsForm.insertBefore(gameIdDisplay, settingsForm.querySelector('#settings-form-element'));

    let userRole = 'referee';
    roleInputs.forEach(input => {
        input.addEventListener('change', (event) => {
            userRole = event.target.value;
        });
    });

    let ws = null;
    let gameState = {};
    let tempScoreEvent = null;
    let twoMinuteWarningIssuedLocally = false;
    let actionHistory = [];
    const audio = new Audio('/assets/warning.mp3');

    // --- WebSocket Event Handlers ---
    const connectWebSocket = (gameId) => {
        ws = new WebSocket(`wss://${location.host}/game/${gameId}`);

        ws.onopen = () => {
            console.log(`Connected to the WebSocket server for game ${gameId}!`);
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('Received from server:', message);
            Object.assign(gameState, message);
            updateUI();
        };

        ws.onclose = () => {
            console.log('Disconnected from the WebSocket server.');
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };
    };

    // --- State Management and UI Updates ---
    const sendAction = (type, payload = {}) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type, payload }));
        }
    };

    const updateUI = () => {
        const urlGameId = window.location.pathname.split('/').pop().split('?')[0]; // NEW: get the game id from url without parameters
        if (urlGameId) {
            gameIdDisplay.style.display = 'block';
            document.getElementById('game-id-text').textContent = urlGameId;
        } else {
            gameIdDisplay.style.display = 'none';
        }

        // Correctly handle showing/hiding main sections based on state
        if (gameState.team1Name && gameState.team2Name && gameState.team1Name !== 'Home Team' && gameState.team2Name !== 'Away Team') {
            gameLobby.classList.add('hidden');
            settingsForm.classList.add('hidden');
            gameInterface.classList.remove('hidden');
        } else if (window.location.pathname.startsWith('/game/') && Object.keys(gameState).length > 0) {
            // A game ID exists in the URL, but the game has not been started with custom names.
            // This is the state for a new game or a joined game before the settings are saved.
            gameLobby.classList.add('hidden');
            settingsForm.classList.remove('hidden');
            gameInterface.classList.add('hidden');
        } else {
            // Default state: no game active and no game ID in URL.
            gameLobby.classList.remove('hidden');
            settingsForm.classList.add('hidden');
            gameInterface.classList.add('hidden');
        }

        if (Object.keys(gameState).length === 0) {
            return;
        }

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
        team1TimeoutLabel.textContent = gameState.team1Name;
        team2TimeoutLabel.textContent = gameState.team2Name;

        if (gameState.coinTossResult) {
            coinTossResultDisplay.textContent = `Result: The toss landed on ${gameState.coinTossResult}.`;
        }
        if (gameState.gameTimeLeft === 120 && !twoMinuteWarningIssuedLocally) {
            gameClockDisplay.parentElement.classList.add('warning');
            audio.play();
            twoMinuteWarningIssuedLocally = true;
        }
        
        // NEW: Apply permissions based on the user role
        applyRolePermissions();
    };

    // NEW: Function to apply role-based permissions
    const applyRolePermissions = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const role = urlParams.get('role') || 'referee'; // Default to referee if not specified
        
        // Hide all interactive sections by default, then show them based on role
        gameClockSection.classList.add('hidden');
        playClockSection.classList.add('hidden');
        downSection.classList.add('hidden');
        adjustScoreSection.classList.add('hidden');
        scoreButtonsSection.classList.add('hidden');
        timeoutButtonsSection.classList.add('hidden');
        
        if (role === 'referee') {
            gameClockSection.classList.remove('hidden');
            playClockSection.classList.remove('hidden');
            downSection.classList.remove('hidden');
            adjustScoreSection.classList.remove('hidden');
            scoreButtonsSection.classList.remove('hidden');
            timeoutButtonsSection.classList.remove('hidden');
        } else if (role === 'scorer') {
            adjustScoreSection.classList.remove('hidden');
            scoreButtonsSection.classList.remove('hidden');
        } else if (role === 'clock') {
            gameClockSection.classList.remove('hidden');
            playClockSection.classList.remove('hidden');
        }
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

    const getNewScoreLog = (event, players = {}) => {
        const teamName = event.team === '1' ? gameState.team1Name : gameState.team2Name;
        const elapsedTime = gameState.halfDuration - gameState.gameTimeLeft;
        let playerDetails = [];
        if (players.qb) { playerDetails.push(`QB #${players.qb}`); }
        if (players.wr) { playerDetails.push(`WR #${players.wr}`); }
        if (players.rb) { playerDetails.push(`RB #${players.rb}`); }
        if (players.int) { playerDetails.push(`INT #${players.int}`); }
        if (players.safety) { playerDetails.push(`Safety #${players.safety}`); }
        const playerString = playerDetails.length > 0 ? ` (${playerDetails.join(', ')})` : '';
        const newLogEntry = `<li>[${formatTime(elapsedTime)}] ${teamName} scored a ${event.scoreLabel} for ${event.scoreToAdd} points${playerString}.</li>`;
        return newLogEntry + gameState.scoreLogHTML;
    };

    const getNewTimeoutLog = (event) => {
        const teamName = event.team === '1' ? gameState.team1Name : gameState.team2Name;
        const elapsedTime = gameState.halfDuration - gameState.gameTimeLeft;
        const newLogEntry = `<li>[${formatTime(elapsedTime)}] ${teamName} called a timeout.</li>`;
        return newLogEntry + gameState.timeoutLogHTML;
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

    const showScorePopup = (team, scoreToAdd, scoreLabel) => {
        tempScoreEvent = { team, scoreToAdd, scoreLabel };
        const teamName = team === '1' ? gameState.team1Name : gameState.team2Name;
        popupHeader.textContent = `Log ${scoreLabel} for ${teamName}`;
        scorePopup.classList.remove('hidden');
    };

    const hideScorePopup = () => {
        scorePopup.classList.add('hidden');
        qbNumberInput.value = '';
        wrNumberInput.value = '';
        rbNumberInput.value = '';
        intNumberInput.value = '';
        safetyNumberInput.value = '';
        tempScoreEvent = null;
    };

    // --- Event Listeners ---
    const pathParts = window.location.pathname.split('/');
    const gameIdFromUrl = pathParts.length > 2 && pathParts[1] === 'game' ? pathParts[2].split('?')[0] : null; // NEW: handle url parameters

    if (gameIdFromUrl) {
        gameLobby.classList.add('hidden');
        settingsForm.classList.add('hidden');
        gameInterface.classList.remove('hidden');
        connectWebSocket(gameIdFromUrl);
    } else {
        gameLobby.classList.remove('hidden');
        settingsForm.classList.add('hidden');
        gameInterface.classList.add('hidden');
    }

    startNewGameBtn.addEventListener('click', () => {
        const newGameId = Math.random().toString(36).substring(2, 8);
        history.pushState(null, '', `/game/${newGameId}?role=${userRole}`); // NEW: add role to URL

        gameLobby.classList.add('hidden');
        settingsForm.classList.remove('hidden');

        document.getElementById('game-id-text').textContent = newGameId;
        gameIdDisplay.style.display = 'block';

        connectWebSocket(newGameId);
    });

    joinGameBtn.addEventListener('click', () => {
        const gameId = gameIdInput.value.trim();
        if (gameId) {
            history.pushState(null, '', `/game/${gameId}?role=${userRole}`); // NEW: add role to URL

            joinErrorMessage.classList.add('hidden');
            gameLobby.classList.add('hidden');
            gameInterface.classList.remove('hidden');
            connectWebSocket(gameId);
        } else {
            joinErrorMessage.classList.remove('hidden');
        }
    });

    startGameBtn.addEventListener('click', () => {
        if (!gameState.coinTossResult) {
            alert("Please complete the coin toss before starting the game.");
            return;
        }
        twoMinuteWarningIssuedLocally = false;
        gameClockDisplay.parentElement.classList.remove('warning');
        actionHistory = [];

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
            timeoutLogHTML: '',
            twoMinuteWarningIssued: false
        };
        sendAction('UPDATE_STATE', newGameState);
    });

    coinTossBtn.addEventListener('click', () => {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        sendAction('UPDATE_STATE', { coinTossResult: result });
    });

    scoreButtons.forEach(button => {
        button.addEventListener('click', () => {
            const team = button.dataset.team;
            const scoreToAdd = parseInt(button.dataset.score, 10);
            const scoreLabel = button.dataset.label;
            showScorePopup(team, scoreToAdd, scoreLabel);
        });
    });

    logScoreBtn.addEventListener('click', () => {
        if (!tempScoreEvent) return;
        actionHistory.push({
            type: 'score',
            scores: { ...gameState.scores },
            scoreLogHTML: gameState.scoreLogHTML
        });

        const { team, scoreToAdd } = tempScoreEvent;
        const newScores = { ...gameState.scores };
        if (team === '1') {
            newScores.team1 += scoreToAdd;
        } else {
            newScores.team2 += scoreToAdd;
        }
        const players = {
            qb: qbNumberInput.value || '',
            wr: wrNumberInput.value || '',
            rb: rbNumberInput.value || '',
            int: intNumberInput.value || '',
            safety: safetyNumberInput.value || ''
        };
        const newScoreLogHTML = getNewScoreLog(tempScoreEvent, players);
        sendAction('UPDATE_STATE', { scores: newScores, scoreLogHTML: newScoreLogHTML });
        hideScorePopup();
    });

    cancelPopupBtn.addEventListener('click', () => {
        hideScorePopup();
    });

    adjustButtons.forEach(button => {
        button.addEventListener('click', () => {
            const team = button.dataset.team;
            const adjustment = button.dataset.adjust;
            const newScores = { ...gameState.scores };
            if (team === '1') {
                newScores.team1 += (adjustment === '+' ? 1 : -1);
            } else {
                newScores.team2 += (adjustment === '+' ? 1 : -1);
            }
            sendAction('UPDATE_STATE', { scores: newScores });
        });
    });

    useTimeoutBtns.forEach(button => {
        button.addEventListener('click', () => {
            const team = button.dataset.team;
            if (gameState.timeoutsUsed[team] < gameState.timeoutsPerHalf) {
                actionHistory.push({
                    type: 'timeout',
                    timeoutsUsed: { ...gameState.timeoutsUsed },
                    timeoutLogHTML: gameState.timeoutLogHTML
                });
                const newTimeoutsUsed = { ...gameState.timeoutsUsed };
                newTimeoutsUsed[team]++;
                const newTimeoutLogHTML = getNewTimeoutLog({ team: team });
                sendAction('STOP_GAME_CLOCK');
                sendAction('UPDATE_STATE', { timeoutsUsed: newTimeoutsUsed, timeoutLogHTML: newTimeoutLogHTML });
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
            gameClockDisplay.parentElement.classList.remove('warning');
        } else {
            sendAction('START_GAME_CLOCK');
        }
    });

    gameClockResetBtn.addEventListener('click', () => {
        sendAction('STOP_GAME_CLOCK');
        gameClockDisplay.parentElement.classList.remove('warning');
        twoMinuteWarningIssuedLocally = false;
        sendAction('UPDATE_STATE', {
            gameTimeLeft: gameState.halfDuration,
            timeoutsUsed: { '1': 0, '2': 0 },
            twoMinuteWarningIssued: false
        });
    });

    playClockToggleBtn.addEventListener('click', () => {
        if (gameState.playClockRunning) {
            sendAction('STOP_PLAY_CLOCK');
        } else {
            if (autoAdvanceCheckbox.checked) {
                const newDown = (gameState.currentDown % 4) + 1;
                sendAction('UPDATE_STATE', { currentDown: newDown });
            }
            sendAction('START_PLAY_CLOCK');
        }
    });

    playClockResetBtn.addEventListener('click', () => {
        sendAction('STOP_PLAY_CLOCK');
        sendAction('UPDATE_STATE', { playTimeLeft: gameState.playClockDuration });
    });

    endGameBtn.addEventListener('click', () => {
        sendAction('END_GAME');
        // Return to the home screen and clear the URL.
        history.pushState(null, '', '/');
        gameLobby.classList.remove('hidden');
        settingsForm.classList.add('hidden');
        gameInterface.classList.add('hidden');
    });

    undoBtn.addEventListener('click', () => {
        if (actionHistory.length > 0) {
            const lastAction = actionHistory.pop();
            if (lastAction.type === 'score') {
                sendAction('UPDATE_STATE', {
                    scores: lastAction.scores,
                    scoreLogHTML: lastAction.scoreLogHTML
                });
            } else if (lastAction.type === 'timeout') {
                sendAction('UPDATE_STATE', {
                    timeoutsUsed: lastAction.timeoutsUsed,
                    timeoutLogHTML: lastAction.timeoutLogHTML
                });
            }
        } else {
            alert("No actions to undo.");
        }
    });
});