document.addEventListener('DOMContentLoaded', () => {
    const appVersion = '1.9';
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
    const gameIdDisplay = document.getElementById('current-game-id');
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
            gameIdDisplay.classList.remove('hidden');
            document.getElementById('game-id-text').textContent = urlGameId;
        } else {
            gameIdDisplay.classList.add('hidden');
        }

        if (gameState.gameStarted) {
            gameLobby.classList.add('hidden');
            settingsForm.classList.add('hidden'); // Ensure settings form is hidden
            gameInterface.classList.remove('hidden');
            updateButtonLabels();
            updateScores();
            updateTimeouts();
            updateDowns();
            updateClocks();
            updateLogs();
            if (gameState.date) gameDateDisplay.textContent = new Date(gameState.date).toLocaleDateString();
            if (gameState.location) gameLocationDisplay.textContent = gameState.location;
            if (gameState.team1Name) team1NameDisplay.textContent = gameState.team1Name;
            if (gameState.team2Name) team2NameDisplay.textContent = gameState.team2Name;
        } else {
            gameInterface.classList.add('hidden');
            gameLobby.classList.remove('hidden');
            if (urlGameId && urlGameId !== 'game.html' && urlGameId !== '') {
                // If a gameId is in the URL but the game hasn't started, show the lobby and fill the input.
                gameLobby.classList.remove('hidden');
                settingsForm.classList.add('hidden');
                gameIdInput.value = urlGameId;
            } else {
                gameLobby.classList.remove('hidden');
                settingsForm.classList.add('hidden');
            }
        }

        if (gameState.gameEnded) {
            gameInterface.classList.add('hidden');
            gameSummary.classList.remove('hidden');
            displaySummary();
        }

        applyRolePermissions();
    };

    const applyRolePermissions = () => {
        // Disable all controls initially
        allControls.forEach(control => {
            if (control) {
                control.classList.add('disabled');
            }
        });

        // Enable controls based on the user's role
        const controlsToEnable = rolePermissions[userRole] || [];
        controlsToEnable.forEach(control => {
            if (control) {
                control.classList.remove('disabled');
            }
        });

        // Disable timeout buttons if no timeouts are left
        if (gameState.timeoutsUsed && gameState.timeoutsPerHalf) {
            if (gameState.timeoutsUsed['1'] >= gameState.timeoutsPerHalf) {
                document.querySelector('.use-timeout-btn[data-team="1"]').classList.add('disabled');
            } else {
                document.querySelector('.use-timeout-btn[data-team="1"]').classList.remove('disabled');
            }

            if (gameState.timeoutsUsed['2'] >= gameState.timeoutsPerHalf) {
                document.querySelector('.use-timeout-btn[data-team="2"]').classList.add('disabled');
            } else {
                document.querySelector('.use-timeout-btn[data-team="2"]').classList.remove('disabled');
            }
        }
    };

    const updateButtonLabels = () => {
        gameClockToggleBtn.textContent = gameState.gameClockRunning ? 'Stop' : 'Start';
        playClockToggleBtn.textContent = gameState.playClockRunning ? 'Stop' : 'Start';
    };

    const updateScores = () => {
        team1ScoreDisplay.textContent = gameState.scores.team1;
        team2ScoreDisplay.textContent = gameState.scores.team2;
    };

    const updateTimeouts = () => {
        const totalTimeouts = gameState.timeoutsPerHalf;
        const timeoutsUsed1 = gameState.timeoutsUsed['1'];
        const timeoutsUsed2 = gameState.timeoutsUsed['2'];
        team1TimeoutsDisplay.textContent = `${totalTimeouts - timeoutsUsed1}/${totalTimeouts}`;
        team2TimeoutsDisplay.textContent = `${totalTimeouts - timeoutsUsed2}/${totalTimeouts}`;
    };

    const updateDowns = () => {
        downButtons.forEach(btn => {
            const downValue = parseInt(btn.dataset.down);
            if (downValue === gameState.currentDown) {
                btn.style.backgroundColor = 'red';
            } else {
                btn.style.backgroundColor = '';
            }
        });
    };

    const updateClocks = () => {
        gameClockDisplay.textContent = formatTime(gameState.gameTimeLeft);
        playClockDisplay.textContent = formatTime(gameState.playTimeLeft);

        // Two-minute warning logic
        if (gameState.gameTimeLeft <= 120 && !twoMinuteWarningIssuedLocally) {
            audio.play();
            twoMinuteWarningIssuedLocally = true;
            gameClockDisplay.parentElement.classList.add('warning');
            setTimeout(() => {
                gameClockDisplay.parentElement.classList.remove('warning');
            }, 5000);
        }
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

    const getNewTimeoutLog = (team) => {
        const teamName = team === '1' ? gameState.team1Name : gameState.team2Name;
        const elapsedTime = gameState.halfDuration - gameState.gameTimeLeft;
        const newLogEntry = `<li>[${formatTime(elapsedTime)}] ${teamName} used a timeout.</li>`;
        return newLogEntry + gameState.timeoutLogHTML;
    };

    const updateLogs = () => {
        scoreLogList.innerHTML = gameState.scoreLogHTML;
        timeoutLogList.innerHTML = gameState.timeoutLogHTML;
    };

    const displaySummary = () => {
        summaryTeam1Name.textContent = gameState.team1Name;
        summaryTeam2Name.textContent = gameState.team2Name;
        summaryTeam1Score.textContent = gameState.scores.team1;
        summaryTeam2Score.textContent = gameState.scores.team2;
        summaryScoreLog.innerHTML = gameState.scoreLogHTML;
        summaryTimeoutLog.innerHTML = gameState.timeoutLogHTML;
    };

    // --- User Actions ---
    startNewGameBtn.addEventListener('click', () => {
        history.pushState(null, '', '/game.html');
        gameLobby.classList.add('hidden');
        settingsForm.classList.remove('hidden');
        gameIdDisplay.classList.add('hidden');
    });

    joinGameBtn.addEventListener('click', () => {
        const gameId = gameIdInput.value.trim();
        if (gameId) {
            joinErrorMessage.classList.add('hidden');
            connectWebSocket(gameId);
            history.pushState(null, '', `/${gameId}`);
            gameLobby.classList.add('hidden');
        } else {
            joinErrorMessage.classList.remove('hidden');
        }
    });

    startGameBtn.addEventListener('click', () => {
        const team1Name = team1NameInput.value.trim();
        const team2Name = team2NameInput.value.trim();
        if (!team1Name || !team2Name) {
            alert("Please enter names for both teams.");
            return;
        }
        if (!gameState.coinTossResult) {
            alert("Please complete the coin toss before starting the game.");
            return;
        }
        twoMinuteWarningIssuedLocally = false;
        gameClockDisplay.parentElement.classList.remove('warning');
        actionHistory = [];
        const newGameState = {
            gameStarted: true,
            date: dateField.value || 'N/A',
            location: locationField.value || 'N/A',
            team1Name: team1Name,
            team2Name: team2Name,
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
            gameClockRunning: false,
            playClockRunning: false,
            gameEnded: false,
            coinTossResult: gameState.coinTossResult
        };

        const gameId = 'game-' + Math.random().toString(36).substr(2, 9);
        connectWebSocket(gameId);
        history.pushState(null, '', `/${gameId}`);

        // Immediately update UI to show the game interface
        settingsForm.classList.add('hidden');
        gameInterface.classList.remove('hidden');
        Object.assign(gameState, newGameState);
        updateUI();

        sendAction('START_GAME', newGameState);
    });

    coinTossBtn.addEventListener('click', () => {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        gameState.coinTossResult = result;
        coinTossResultDisplay.textContent = `It's ${result}!`;
        coinTossResultDisplay.classList.remove('hidden');
    });

    gameClockToggleBtn.addEventListener('click', () => {
        if (gameState.gameTimeLeft === 0) return;
        if (gameState.gameClockRunning) {
            sendAction('STOP_GAME_CLOCK');
            gameClockDisplay.parentElement.classList.remove('warning');
        } else {
            sendAction('START_GAME_CLOCK');
        }
    });

    gameClockResetBtn.addEventListener('click', () => {
        sendAction('STOP_GAME_CLOCK');
        sendAction('UPDATE_STATE', { gameTimeLeft: gameState.halfDuration, twoMinuteWarningIssued: false });
        gameClockDisplay.parentElement.classList.remove('warning');
    });

    playClockToggleBtn.addEventListener('click', () => {
        if (gameState.playTimeLeft === 0) return;
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

    downButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const newDown = parseInt(event.target.dataset.down, 10);
            sendAction('UPDATE_STATE', { currentDown: newDown, playTimeLeft: gameState.playClockDuration, playClockRunning: false });
        });
    });

    scoreButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const team = event.currentTarget.dataset.team;
            const scoreToAdd = parseInt(event.currentTarget.dataset.score, 10);
            const scoreLabel = event.currentTarget.dataset.label;
            tempScoreEvent = { team, scoreToAdd, scoreLabel };
            popupHeader.textContent = `Log ${scoreLabel} for ${team === '1' ? gameState.team1Name : gameState.team2Name}`;
            scorePopup.classList.remove('hidden');
        });
    });

    logScoreBtn.addEventListener('click', () => {
        const players = {
            qb: qbNumberInput.value,
            wr: wrNumberInput.value,
            rb: rbNumberInput.value,
            int: intNumberInput.value,
            safety: safetyNumberInput.value,
        };
        actionHistory.push({ type: 'score', scores: { ...gameState.scores }, scoreLogHTML: gameState.scoreLogHTML });
        sendAction('SCORE_CHANGE', { ...tempScoreEvent, players: players });
        scorePopup.classList.add('hidden');
        qbNumberInput.value = '';
        wrNumberInput.value = '';
        rbNumberInput.value = '';
        intNumberInput.value = '';
        safetyNumberInput.value = '';
    });

    cancelPopupBtn.addEventListener('click', () => {
        scorePopup.classList.add('hidden');
    });

    adjustButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const team = event.currentTarget.dataset.team;
            const adjustment = event.currentTarget.dataset.adjust === '+' ? 1 : -1;
            const newScore = gameState.scores[`team${team}`] + adjustment;
            actionHistory.push({ type: 'score', scores: { ...gameState.scores }, scoreLogHTML: gameState.scoreLogHTML });
            sendAction('UPDATE_STATE', { scores: { ...gameState.scores, [`team${team}`]: Math.max(0, newScore) } });
        });
    });

    useTimeoutBtns.forEach(button => {
        button.addEventListener('click', (event) => {
            const team = event.currentTarget.dataset.team;
            if (gameState.timeoutsUsed[team] < gameState.timeoutsPerHalf) {
                actionHistory.push({ type: 'timeout', timeoutsUsed: { ...gameState.timeoutsUsed }, timeoutLogHTML: gameState.timeoutLogHTML });
                sendAction('USE_TIMEOUT', { team });
            }
        });
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

    shareGameBtn.addEventListener('click', handleShare);

    function handleShare() {
        if (!gameState.gameId) {
            alert('Please start a game before sharing.');
            return;
        }

        const shareUrl = `${window.location.origin}/${gameState.gameId}?role=${userRole}`;
        const shareData = {
            title: `Join Game ${gameState.gameId}`,
            text: `Join the game as a ${userRole}:`,
            url: shareUrl,
        };

        if (navigator.share) {
            navigator.share(shareData)
                .then(() => console.log('Successfully shared'))
                .catch((error) => console.error('Error sharing:', error));
        } else {
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    alert('Game link copied to clipboard!');
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                });
        }
    }

    // Check URL for existing game ID on page load
    const pathSegments = window.location.pathname.split('/');
    const urlGameId = pathSegments[pathSegments.length - 1];
    if (urlGameId && urlGameId !== 'game.html') {
        connectWebSocket(urlGameId);
        gameLobby.classList.add('hidden');
    }
});