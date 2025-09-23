document.addEventListener('DOMContentLoaded', () => {
    const appVersion = '2.0.1';
    console.log(`Referee App - Version: ${appVersion}`);
    const versionDisplay = document.querySelector('.version');
    if (versionDisplay) {
        versionDisplay.textContent = `v${appVersion}`;
    }

    // Automatically set the date field to the current date
    const today = new Date();
    const formattedDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    document.getElementById('date-field').value = formattedDate;

    // Element references
    const gameLobby = document.getElementById('game-lobby');
    const settingsForm = document.getElementById('settings-form');
    const gameInterface = document.getElementById('game-interface');
    const gameSummary = document.getElementById('game-summary');
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
    const summaryTeam1Name = document.getElementById('summary-team1-name');
    const summaryTeam2Name = document.getElementById('summary-team2-name');
    const summaryTeam1Score = document.getElementById('summary-team1-score');
    const summaryTeam2Score = document.getElementById('summary-team2-score');
    const summaryScoreLog = document.getElementById('summary-score-log');
    const summaryTimeoutLog = document.getElementById('summary-timeout-log');
    const startNewGameFromSummaryBtn = document.getElementById('start-new-game-from-summary-btn');
    const gameIdDisplay = document.getElementById('game-id-text');
    const shareGameBtn = document.getElementById('share-game-btn');

    // Collect all control elements into a single array for easy management
    const allControls = [
        gameClockToggleBtn,
        gameClockResetBtn,
        playClockToggleBtn,
        playClockResetBtn,
        autoAdvanceCheckbox,
        ...downButtons,
        ...scoreButtons,
        ...adjustButtons,
        ...useTimeoutBtns,
        undoBtn,
        endGameBtn
    ];

    // Map roles to the specific controls they can use
    const rolePermissions = {
        'administrator': allControls,
        'head-referee': allControls,
        'scorer': [...scoreButtons, ...adjustButtons, undoBtn],
        'clock': [gameClockToggleBtn, gameClockResetBtn, playClockToggleBtn, playClockResetBtn, autoAdvanceCheckbox, ...downButtons],
        'coach': [...useTimeoutBtns]
    };

    let userRole = 'administrator';
    roleInputs.forEach(input => {
        input.addEventListener('change', (event) => {
            userRole = event.target.value;
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('role', userRole);
            history.replaceState(null, '', `?${urlParams.toString()}`);
            applyRolePermissions();
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
            applyRolePermissions();
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
        const urlParams = new URLSearchParams(window.location.search);
        userRole = urlParams.get('role') || 'administrator';

        const urlGameId = window.location.pathname.split('/').pop().split('?')[0];
        if (urlGameId && urlGameId !== 'game.html') {
            gameIdDisplay.textContent = urlGameId;
            document.querySelector('.share-game-section').classList.remove('hidden');
        } else {
            document.querySelector('.share-game-section').classList.add('hidden');
        }

        if (Object.keys(gameState).length > 0 && gameState.gameStarted && !gameState.gameEnded) {
            gameLobby.classList.add('hidden');
            settingsForm.classList.add('hidden');
            gameInterface.classList.remove('hidden');
            gameSummary.classList.add('hidden');
        } else if (Object.keys(gameState).length > 0 && gameState.gameEnded) {
            gameLobby.classList.add('hidden');
            settingsForm.classList.add('hidden');
            gameInterface.classList.add('hidden');
            gameSummary.classList.remove('hidden');
            summaryTeam1Name.textContent = gameState.team1Name;
            summaryTeam2Name.textContent = gameState.team2Name;
            summaryTeam1Score.textContent = gameState.scores.team1;
            summaryTeam2Score.textContent = gameState.scores.team2;
            summaryScoreLog.innerHTML = gameState.scoreLogHTML;
            summaryTimeoutLog.innerHTML = gameState.timeoutLogHTML;
        } else if (window.location.pathname.startsWith('/game/')) {
            gameLobby.classList.add('hidden');
            gameInterface.classList.add('hidden');
            gameSummary.classList.add('hidden');
            settingsForm.classList.remove('hidden');
        } else {
            gameLobby.classList.remove('hidden');
            settingsForm.classList.add('hidden');
            gameInterface.classList.add('hidden');
            gameSummary.classList.add('hidden');
        }

        if (Object.keys(gameState).length > 0) {
            updateGameInfo(gameState);
            updateClocks(gameState);
            updateScores(gameState);
            updateTimeouts(gameState);
            updateGameLogs(gameState);
        }
    };

    const updateGameInfo = (state) => {
        team1NameDisplay.textContent = state.team1Name;
        team2NameDisplay.textContent = state.team2Name;
        gameDateDisplay.textContent = state.date;
        gameLocationDisplay.textContent = state.location;
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const updateClocks = (state) => {
        gameClockDisplay.textContent = formatTime(state.gameTimeLeft);
        playClockDisplay.textContent = formatTime(state.playTimeLeft);
        gameClockToggleBtn.textContent = state.gameClockRunning ? 'Stop' : 'Start';
        playClockToggleBtn.textContent = state.playClockRunning ? 'Stop' : 'Start';
    };

    const updateScores = (state) => {
        team1ScoreDisplay.textContent = state.scores.team1;
        team2ScoreDisplay.textContent = state.scores.team2;
    };

    const updateTimeouts = (state) => {
        const team1timeouts = state.timeoutsPerHalf - state.timeoutsUsed['1'];
        const team2timeouts = state.timeoutsPerHalf - state.timeoutsUsed['2'];
        team1TimeoutsDisplay.textContent = team1timeouts;
        team2TimeoutsDisplay.textContent = team2timeouts;
    };

    const updateGameLogs = (state) => {
        scoreLogList.innerHTML = state.scoreLogHTML;
        timeoutLogList.innerHTML = state.timeoutLogHTML;
    };

    const applyRolePermissions = () => {
        const controls = document.querySelectorAll('.game-clocks-section button, .game-clocks-section input, .main-controls button, .main-controls input, .action-buttons button');
        controls.forEach(control => {
            control.classList.add('disabled');
        });

        const allowedControls = rolePermissions[userRole] || [];
        allowedControls.forEach(control => {
            if (control) {
                control.classList.remove('disabled');
            }
        });
    };

    // --- Event Listeners ---
    startNewGameBtn.addEventListener('click', () => {
        history.pushState(null, '', `/game/${Date.now()}`);
        window.location.reload();
    });

    joinGameBtn.addEventListener('click', () => {
        const gameId = gameIdInput.value.trim();
        if (gameId) {
            history.pushState(null, '', `/game/${gameId}`);
            window.location.reload();
        } else {
            joinErrorMessage.classList.remove('hidden');
        }
    });

    startGameBtn.addEventListener('click', (event) => {
        event.preventDefault();
        const halfDuration = parseInt(halfDurationInput.value);
        const playClockDuration = parseInt(playClockDurationInput.value);
        const timeoutsPerHalf = parseInt(timeoutsPerHalfInput.value);
        const team1Name = team1NameInput.value.trim() || 'Home Team';
        const team2Name = team2NameInput.value.trim() || 'Away Team';
        const date = dateField.value;
        const location = locationField.value.trim();

        if (isNaN(halfDuration) || isNaN(playClockDuration) || isNaN(timeoutsPerHalf)) {
            alert('Please enter valid numbers for all game settings.');
            return;
        }

        const urlGameId = window.location.pathname.split('/').pop();
        sendAction('START_GAME', {
            gameId: urlGameId,
            halfDuration,
            playClockDuration,
            timeoutsPerHalf,
            team1Name,
            team2Name,
            date,
            location
        });
        // The server will broadcast the new state, and the UI will update
    });

    // New event listener for the share button
    shareGameBtn.addEventListener('click', async () => {
        const gameId = gameIdDisplay.textContent;
        const gameLink = `${window.location.origin}/game/${gameId}?role=${userRole}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Referee App Game Invite',
                    text: 'Join my game on the Referee App!',
                    url: gameLink
                });
                console.log('Successfully shared');
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback for browsers that don't support Web Share API
            navigator.clipboard.writeText(gameLink).then(() => {
                alert(`Game link copied to clipboard: ${gameLink}`);
            }).catch(err => {
                console.error('Could not copy text: ', err);
            });
        }
    });

    coinTossBtn.addEventListener('click', () => {
        const teams = [team1NameInput.value || 'Home Team', team2NameInput.value || 'Away Team'];
        const winner = teams[Math.floor(Math.random() * teams.length)];
        coinTossResultDisplay.textContent = `Coin Toss Winner: ${winner} gets the ball first!`;
        sendAction('UPDATE_STATE', { coinTossResult: winner });
    });

    // Score button event listeners
    scoreButtons.forEach(button => {
        button.addEventListener('click', () => {
            tempScoreEvent = {
                team: button.dataset.team,
                points: parseInt(button.dataset.score),
                scoreType: button.textContent.trim()
            };
            popupHeader.textContent = `Log a ${tempScoreEvent.scoreType} for ${tempScoreEvent.team === 'team1' ? team1NameInput.value : team2NameInput.value}`;
            scorePopup.classList.remove('hidden');
        });
    });

    logScoreBtn.addEventListener('click', () => {
        if (!tempScoreEvent) return;
        const qb = qbNumberInput.value.trim();
        const wr = wrNumberInput.value.trim();
        const rb = rbNumberInput.value.trim();
        const int = intNumberInput.value.trim();
        const safety = safetyNumberInput.value.trim();
        const playerNumbers = [qb, wr, rb, int, safety].filter(num => num !== '');

        sendAction('SCORE_UPDATE', {
            team: tempScoreEvent.team,
            points: tempScoreEvent.points,
            scoreType: tempScoreEvent.scoreType,
            playerNumbers: playerNumbers,
            gameTimeLeft: gameState.gameTimeLeft
        });
        scorePopup.classList.add('hidden');
        qbNumberInput.value = '';
        wrNumberInput.value = '';
        rbNumberInput.value = '';
        intNumberInput.value = '';
        safetyNumberInput.value = '';
        tempScoreEvent = null;
    });

    cancelPopupBtn.addEventListener('click', () => {
        scorePopup.classList.add('hidden');
        tempScoreEvent = null;
    });

    useTimeoutBtns.forEach(button => {
        button.addEventListener('click', () => {
            const team = button.id === 'team1-timeout-btn' ? 'team1' : 'team2';
            sendAction('TIMEOUT_USED', {
                team: team,
                timeoutsPerHalf: gameState.timeoutsPerHalf,
                gameTimeLeft: gameState.gameTimeLeft
            });
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
        sendAction('UPDATE_STATE', { gameTimeLeft: gameState.halfDuration });
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
    });

    startNewGameFromSummaryBtn.addEventListener('click', () => {
        history.pushState(null, '', '/');
        gameLobby.classList.remove('hidden');
        gameSummary.classList.add('hidden');
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