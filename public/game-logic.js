// --- Clock Helpers ---

window.formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

window.getPeriodName = (half) => {
    if (half === 1) return '1st Half';
    if (half === 2) return '2nd Half';
    if (half >= 3) return `OT ${half - 2}`; // OT 1 starts at half 3 (3 - 2 = 1)
    return 'Period';
};

// --- Log Entry Helpers ---

window.getNewScoreLog = (event, players = {}) => {
    const teamName = event.team === '1' ? window.gameState.team1Name : window.gameState.team2Name;

    // Use the stored time, then clear the variable
    const eventTime = window.actionTimeLeft !== null ? window.actionTimeLeft : window.gameState.gameTimeLeft;
    const elapsedTime = window.gameState.halfDuration - eventTime;
    window.actionTimeLeft = null; // Clear the stored time after use

    const halfText = window.getPeriodName(window.gameState.currentHalf);
    const fullTimestamp = `${halfText} [${window.formatTime(elapsedTime)}]`;

    let playerDetails = [];
    if (players.qb) { playerDetails.push(`QB #${players.qb}`); }
    if (players.wr) { playerDetails.push(`WR #${players.wr}`); }
    if (players.rb) { playerDetails.push(`RB #${players.rb}`); }
    if (players.int) { playerDetails.push(`INT #${players.int}`); }
    if (players.safety) { playerDetails.push(`Safety #${players.safety}`); }
    const playerString = playerDetails.length > 0 ? ` (${playerDetails.join(', ')})` : '';

    const newLogEntry = `<li><span class="log-time-stamp">${fullTimestamp} </span>${teamName} scored a ${event.scoreLabel} ${playerString}.</li>`;

    return newLogEntry + window.gameState.scoreLogHTML;
};

window.getNewTimeoutLog = (event) => {
    const teamName = event.team === '1' ? window.gameState.team1Name : window.gameState.team2Name;
    const elapsedTime = window.gameState.halfDuration - window.gameState.gameTimeLeft;
    const halfText = window.getPeriodName(window.gameState.currentHalf);
    const fullTimestamp = `${halfText} [${window.formatTime(elapsedTime)}]`;
    const newLogEntry = `<li>${fullTimestamp} ${teamName} called a timeout.</li>`;
    return newLogEntry + window.gameState.timeoutLogHTML;
};

/**
 * Generates an HTML log entry marking the end of the half.
 */
window.getNewEndOfHalfLog = () => {
    const newLogEntry = `<li class="end-of-half-log">--- END OF HALF ---</li>`;
    return newLogEntry;
};

// --- Down Tracker ---

window.updateDownDisplay = () => {
    const downButtons = document.querySelectorAll('.down-btn');
    downButtons.forEach(btn => {
        if (parseInt(btn.dataset.down) === window.gameState.currentDown) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
};

// --- Clock Handlers ---

window.handleGameClockToggle = () => {
    if (window.gameState.gameClockRunning) {
        window.sendAction('STOP_GAME_CLOCK');
        const gameClockDisplay = document.getElementById('game-clock-display');
        if (gameClockDisplay) gameClockDisplay.parentElement.classList.remove('warning');
    } else {
        window.sendAction('START_GAME_CLOCK');
    }
};

window.handleGameClockReset = () => {
    window.sendAction('STOP_GAME_CLOCK');
    const gameClockDisplay = document.getElementById('game-clock-display');
    if (gameClockDisplay) gameClockDisplay.parentElement.classList.remove('warning');
    window.twoMinuteWarningIssuedLocally = false;

    // Determine next period name
    const nextHalfValue = window.gameState.currentHalf + 1;
    let periodName = '';
    if (window.gameState.currentHalf === 1) {
        periodName = 'END OF 1ST HALF';
    } else if (window.gameState.currentHalf === 2) {
        periodName = 'END OF REGULATION';
    } else if (window.gameState.currentHalf >= 3) {
        const currentOT = window.gameState.currentHalf - 2;
        periodName = `END OF OVERTIME ${currentOT}`;
    } else {
        periodName = 'PERIOD BREAK';
    }

    const nextPeriodText = (nextHalfValue === 2) ? '2ND HALF' : `OVERTIME ${nextHalfValue - 2}`;
    const endOfPeriodLogEntry = `<li class="log-entry log-period-end">${periodName} --- STARTING ${nextPeriodText}</li>`;

    const newScoreLogHTML = endOfPeriodLogEntry + window.gameState.scoreLogHTML;
    window.gameState.scoreLogHTML = newScoreLogHTML;

    window.sendAction('UPDATE_STATE', {
        gameTimeLeft: window.gameState.halfDuration,
        timeoutsUsed: { '1': 0, '2': 0 },
        twoMinuteWarningIssued: false,
        currentHalf: nextHalfValue,
        gameEnded: false,
        scoreLogHTML: newScoreLogHTML
    });

    window.updateUI();
};

window.handlePlayClockToggle = () => {
    if (window.gameState.playClockRunning) {
        window.sendAction('STOP_PLAY_CLOCK');
    } else {
        const autoAdvanceCheckbox = document.getElementById('auto-advance-play-clock');
        if (autoAdvanceCheckbox && autoAdvanceCheckbox.checked) {
            const newDown = (window.gameState.currentDown % 4) + 1;
            window.sendAction('UPDATE_STATE', { currentDown: newDown });
        }
        window.sendAction('START_PLAY_CLOCK');
    }
};

window.handlePlayClockReset = () => {
    window.sendAction('STOP_PLAY_CLOCK');
    window.sendAction('UPDATE_STATE', { playTimeLeft: window.gameState.playClockDuration });
};

// --- Scoring ---

window.handleLogScore = () => {
    if (!window.tempScoreEvent) return;
    window.actionHistory.push({
        type: 'score',
        scores: { ...window.gameState.scores },
        scoreLogHTML: window.gameState.scoreLogHTML
    });

    const { team, scoreToAdd } = window.tempScoreEvent;
    const newScores = { ...window.gameState.scores };
    if (team === '1') {
        newScores.team1 += scoreToAdd;
    } else {
        newScores.team2 += scoreToAdd;
    }
    const players = {
        qb: document.getElementById('qb-number').value || '',
        wr: document.getElementById('wr-number').value || '',
        rb: document.getElementById('rb-number').value || '',
        int: document.getElementById('int-number').value || '',
        safety: document.getElementById('safety-number').value || ''
    };
    const newScoreLogHTML = window.getNewScoreLog(window.tempScoreEvent, players);
    window.sendAction('UPDATE_STATE', { scores: newScores, scoreLogHTML: newScoreLogHTML });
    window.hideScorePopup();
};

window.handleAdjustScore = (button) => {
    const team = button.dataset.team;
    const adjustment = button.dataset.adjust;
    const newScores = { ...window.gameState.scores };
    const scoreChange = (adjustment === '+' ? 1 : -1);
    if (team === '1') {
        newScores.team1 = Math.max(0, newScores.team1 + scoreChange);
    } else {
        newScores.team2 = Math.max(0, newScores.team2 + scoreChange);
    }
    window.sendAction('UPDATE_STATE', { scores: newScores });
};

// --- Timeout ---

window.handleUseTimeout = (button) => {
    const team = button.dataset.team;
    if (window.gameState.timeoutsUsed[team] < window.gameState.timeoutsPerHalf) {
        window.actionHistory.push({
            type: 'timeout',
            timeoutsUsed: { ...window.gameState.timeoutsUsed },
            timeoutLogHTML: window.gameState.timeoutLogHTML
        });
        const newTimeoutsUsed = { ...window.gameState.timeoutsUsed };
        newTimeoutsUsed[team]++;
        const newTimeoutLogHTML = window.getNewTimeoutLog({ team: team });
        window.sendAction('STOP_GAME_CLOCK');
        window.sendAction('UPDATE_STATE', { timeoutsUsed: newTimeoutsUsed, timeoutLogHTML: newTimeoutLogHTML });
    } else {
        alert('No timeouts left for this team.');
    }
};

// --- Down Tracker ---

window.handleDownSelect = (button) => {
    window.sendAction('UPDATE_STATE', { currentDown: parseInt(button.dataset.down) });
};

// --- Game End ---

window.handleEndGame = () => {
    setTimeout(() => {
        const confirmed = confirm('Are you sure you want to end the game? This action cannot be undone.');
        if (confirmed) {
            window.sendAction('END_GAME');
        }
    }, 100);
};

// --- Clock Display ---

window.updateButtonLabels = () => {
    const gameClockToggleBtn = document.getElementById('game-clock-toggle');
    const playClockToggleBtn = document.getElementById('play-clock-toggle');
    if (gameClockToggleBtn) gameClockToggleBtn.textContent = window.gameState.gameClockRunning ? 'Stop' : 'Start';
    if (playClockToggleBtn) playClockToggleBtn.textContent = window.gameState.playClockRunning ? 'Stop' : 'Start';
};
