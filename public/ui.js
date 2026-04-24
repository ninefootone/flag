// --- State Management and UI Updates ---
window.updateUI = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlRoleParam = urlParams.get('role');

    let determinedRole = 'administrator';

    if (urlRoleParam) {
        // 1. Try to find a role by token (existing logic)
        const roleFromToken = window.getRoleFromToken(urlRoleParam);

        // 2. Check for token success OR check for explicit non-token role (e.g., 'stats')
        if (roleFromToken) {
            determinedRole = roleFromToken;
        } else if (window.SECURE_ROLE_MAP.hasOwnProperty(urlRoleParam)) {
            determinedRole = urlRoleParam;
        }
    }

    // Apply the determined role
    window.userRole = determinedRole;

    // 1. Clear any existing role classes
    document.body.className = document.body.className.replace(/\brole-[a-z-]+\b/g, '');

    // 2. Apply the new role class (e.g., 'role-stats')
    document.body.classList.add(`role-${window.userRole}`);

    const gameIdDisplay = document.getElementById('current-game-id');
    const gameLobby = document.getElementById('game-lobby');
    const settingsForm = document.getElementById('settings-form');
    const gameInterface = document.getElementById('game-interface');
    const gameSummary = document.getElementById('game-summary');
    const displayMode = document.getElementById('display-mode');
    const fixedFooter = document.getElementById('fixed-footer-links-container');
    const undoBtn = document.getElementById('undo-btn');
    const endGameBtn = document.getElementById('end-game-btn');

    const urlGameId = window.location.pathname.split('/').pop().split('?')[0];
    if (urlGameId && urlGameId !== 'game.html') {
        gameIdDisplay.classList.remove('hidden');
        document.getElementById('game-id-text').textContent = urlGameId;
    } else {
        gameIdDisplay.classList.add('hidden');
    }

    if (window.userRole === 'display') {
        gameLobby.classList.add('hidden');
        settingsForm.classList.add('hidden');
        gameInterface.classList.add('hidden');
        gameSummary.classList.add('hidden');
        if (displayMode) displayMode.classList.remove('hidden');
        if (fixedFooter) {
            fixedFooter.classList.remove('visible');
            fixedFooter.classList.add('hidden');
        }
    } else if (Object.keys(window.gameState).length > 0 && window.gameState.gameStarted && !window.gameState.gameEnded) {
        if (displayMode) displayMode.classList.add('hidden');
        gameLobby.classList.add('hidden');
        settingsForm.classList.add('hidden');
        gameInterface.classList.remove('hidden');
        gameSummary.classList.add('hidden');
        if (fixedFooter) {
            fixedFooter.classList.add('visible');
        }
        if (undoBtn) {
            undoBtn.classList.remove('hidden');
        }
        if (endGameBtn) {
            endGameBtn.classList.remove('hidden');
        }
    } else if (Object.keys(window.gameState).length > 0 && window.gameState.gameEnded) {
        if (displayMode) displayMode.classList.add('hidden');

        // Destroy the Coin Flip Modal animation
        if (typeof window.coinAnimation !== 'undefined' && window.coinAnimation && window.coinAnimation.destroy) {
            window.coinAnimation.destroy();
        }

        // Destroy the Lobby screen animation (if it was active)
        if (typeof window.lobbyCoinAnimation !== 'undefined' && window.lobbyCoinAnimation && window.lobbyCoinAnimation.destroy) {
            window.lobbyCoinAnimation.destroy();
        }

        setTimeout(() => {
            gameLobby.classList.add('hidden');
            settingsForm.classList.add('hidden');
            gameInterface.classList.add('hidden');
            gameSummary.classList.remove('hidden');

            // --- RESTORE LOGO LOOKUP AND INJECTION ---

            // Re-fetch the elements here to ensure they are not null (robustness)
            const summaryTeam1Logo = document.getElementById('summary-team1-logo');
            const summaryTeam2Logo = document.getElementById('summary-team2-logo');

            // Clean the name before lookup (Fixes previous issues)
            const team1NameClean = (window.gameState.team1Name || '').trim();
            const team2NameClean = (window.gameState.team2Name || '').trim();

            // Look up paths
            window.renderTeamLogo(summaryTeam1Logo, window.gameState.team1Name);
            window.renderTeamLogo(summaryTeam2Logo, window.gameState.team2Name);

            // --- END RESTORE ---

            const summaryTeam1Name = document.getElementById('summary-team1-name');
            const summaryTeam2Name = document.getElementById('summary-team2-name');
            const summaryTeam1Score = document.getElementById('summary-team1-score');
            const summaryTeam2Score = document.getElementById('summary-team2-score');
            const summaryScoreLog = document.getElementById('summary-score-log');
            const summaryTimeoutLog = document.getElementById('summary-timeout-log');
            const summaryDefenceLog = document.getElementById('summary-defence-log');

            summaryTeam1Name.textContent = window.gameState.team1Name;
            summaryTeam2Name.textContent = window.gameState.team2Name;
            summaryTeam1Score.textContent = window.gameState.scores.team1;
            summaryTeam2Score.textContent = window.gameState.scores.team2;
            summaryScoreLog.innerHTML = window.gameState.scoreLogHTML;
            summaryTimeoutLog.innerHTML = window.gameState.timeoutLogHTML;
            summaryDefenceLog.innerHTML = window.gameState.defenceLogHTML;

            // 1. Extract the logs from the DOM elements that were just populated
            const scoreLogEntries = Array.from(summaryScoreLog.querySelectorAll('li'));
            const defenceLogEntries = Array.from(summaryDefenceLog.querySelectorAll('li'));

            // 2. Aggregate the stats and store globally for rendering/download
            window.playerStats = window.aggregatePlayerStats(scoreLogEntries, defenceLogEntries);

            // 🚨 NEW: RENDER AGGREGATED STATS TO SCREEN 🚨
            if (window.playerStats) {
                // Update team names in the headers (assuming you defined these in Step 3 HTML)
                document.getElementById('team1-stats-header').textContent = window.gameState.team1Name;
                document.getElementById('team2-stats-header').textContent = window.gameState.team2Name;

                window.renderPlayerStats(window.playerStats.team1, 'team1');
                window.renderPlayerStats(window.playerStats.team2, 'team2');
            }

        }, 0);

        // --- START SUMMARY LOG PLACEHOLDER LOGIC ---

        const summaryScoreLogOuter = document.getElementById('summary-score-log');
        const summaryTimeoutLogOuter = document.getElementById('summary-timeout-log');
        const summaryDefenceLogOuter = document.getElementById('summary-defence-log');

        // Score Log
        if (window.gameState.scoreLogHTML && window.gameState.scoreLogHTML.trim().length > 0) {
            summaryScoreLogOuter.innerHTML = window.gameState.scoreLogHTML;
        } else {
            summaryScoreLogOuter.innerHTML = '<li class="log-placeholder">No scores logged.</li>';
        }

        // Timeout Log
        if (window.gameState.timeoutLogHTML && window.gameState.timeoutLogHTML.trim().length > 0) {
            summaryTimeoutLogOuter.innerHTML = window.gameState.timeoutLogHTML;
        } else {
            summaryTimeoutLogOuter.innerHTML = '<li class="log-placeholder">No timeouts logged.</li>';
        }

        // Defence Log
        if (window.gameState.defenceLogHTML && window.gameState.defenceLogHTML.trim().length > 0) {
            summaryDefenceLogOuter.innerHTML = window.gameState.defenceLogHTML;
        } else {
            summaryDefenceLogOuter.innerHTML = '<li class="log-placeholder">No defensive stats logged.</li>';
        }

        // --- END SUMMARY LOG PLACEHOLDER LOGIC ---

        window.reverseLogOrder(summaryScoreLogOuter);
        window.reverseLogOrder(summaryTimeoutLogOuter);
        window.reverseLogOrder(summaryDefenceLogOuter);
        if (fixedFooter) {
            fixedFooter.classList.add('hidden');
        }
    } else if (window.location.pathname.startsWith('/game/')) {
        if (displayMode) displayMode.classList.add('hidden');
        gameLobby.classList.add('hidden');
        settingsForm.classList.remove('hidden');
        gameInterface.classList.add('hidden');
        gameSummary.classList.add('hidden');
        if (fixedFooter) {
            fixedFooter.classList.add('visible');
        }
        if (undoBtn) {
            undoBtn.classList.add('hidden');
        }
        if (endGameBtn) {
            endGameBtn.classList.add('hidden');
        }
        if (fixedFooter) {
            fixedFooter.classList.remove('hidden');
        }
    } else {
        if (displayMode) displayMode.classList.add('hidden');
        gameLobby.classList.remove('hidden');
        settingsForm.classList.add('hidden');
        gameInterface.classList.add('hidden');
        gameSummary.classList.add('hidden');
        // if (fixedFooter) {
        //     fixedFooter.classList.add('visible');
        // }
    }

    window.applyRolePermissions();

    if (Object.keys(window.gameState).length === 0) {
        return;
    }

    const gameDateDisplay = document.getElementById('game-date');
    const gameLocationDisplay = document.getElementById('game-location');
    const team1NameDisplay = document.getElementById('team1-name-display');
    const team2NameDisplay = document.getElementById('team2-name-display');
    const team1ScoreDisplay = document.getElementById('team1-score-display');
    const team2ScoreDisplay = document.getElementById('team2-score-display');
    const team1TimeoutsDisplay = document.getElementById('team1-timeouts');
    const team2TimeoutsDisplay = document.getElementById('team2-timeouts');
    const gameClockDisplay = document.getElementById('game-clock-display');
    const playClockDisplay = document.getElementById('play-clock-display');
    const gamePeriodDisplay = document.getElementById('game-period-display');
    const scoreLogList = document.getElementById('score-log');
    const timeoutLogList = document.getElementById('timeout-log');
    const defenceLogList = document.getElementById('defence-log');
    const team1TimeoutLabel = document.getElementById('team1-timeout-label');
    const team2TimeoutLabel = document.getElementById('team2-timeout-label');

    gameDateDisplay.textContent = window.formatDisplayDate(window.gameState.date);
    gameLocationDisplay.textContent = (window.gameState.location || '').trim() ? `, ${(window.gameState.location || '').trim()}` : '';
    //gameLocationDisplay.textContent = window.gameState.location;
    team1NameDisplay.textContent = window.gameState.team1Name;
    team2NameDisplay.textContent = window.gameState.team2Name;
    team1ScoreDisplay.textContent = window.gameState.scores.team1;
    team2ScoreDisplay.textContent = window.gameState.scores.team2;
    team1TimeoutsDisplay.textContent = window.gameState.timeoutsPerHalf - window.gameState.timeoutsUsed['1'];
    team2TimeoutsDisplay.textContent = window.gameState.timeoutsPerHalf - window.gameState.timeoutsUsed['2'];
    gameClockDisplay.textContent = window.formatTime(window.gameState.gameTimeLeft);
    playClockDisplay.textContent = window.gameState.playTimeLeft;

    if (gamePeriodDisplay) {
        gamePeriodDisplay.textContent = window.getPeriodName(window.gameState.currentHalf);
    }

    // === START LOG PLACEHOLDER LOGIC ===

    // Score Log
    if (window.gameState.scoreLogHTML && window.gameState.scoreLogHTML.trim().length > 0) {
        scoreLogList.innerHTML = window.gameState.scoreLogHTML;
    } else {
        scoreLogList.innerHTML = '<li class="log-placeholder">No scores logged.</li>';
    }

    // Timeout Log
    if (window.gameState.timeoutLogHTML && window.gameState.timeoutLogHTML.trim().length > 0) {
        timeoutLogList.innerHTML = window.gameState.timeoutLogHTML;
    } else {
        timeoutLogList.innerHTML = '<li class="log-placeholder">No timeouts logged.</li>';
    }

    // Defence Log
    if (window.gameState.defenceLogHTML && window.gameState.defenceLogHTML.trim().length > 0) {
        defenceLogList.innerHTML = window.gameState.defenceLogHTML;
    } else {
        defenceLogList.innerHTML = '<li class="log-placeholder">No defensive stats logged.</li>';
    }

    // === END LOG PLACEHOLDER LOGIC ===

    window.updateDownDisplay();
    window.updateButtonLabels();
    team1TimeoutLabel.textContent = window.gameState.team1Name;
    team2TimeoutLabel.textContent = window.gameState.team2Name;

    // if (window.gameState.coinTossResult) {
    //     coinTossBtn.textContent = `${window.gameState.coinTossResult}`;
    //     coinTossBtn.textContent = `${window.gameState.coinTossResult}. Click to flip again.`;
    // } else {
        // Set the initial text if no toss has occurred
    //     coinTossBtn.textContent = 'Coin';
    // }

    if (window.gameState.gameTimeLeft === 120 && !window.twoMinuteWarningIssuedLocally) {
        gameClockDisplay.parentElement.classList.add('warning');
        const dmDiv = document.getElementById('display-mode');
        if (dmDiv && !dmDiv.classList.contains('hidden')) {
            dmDiv.classList.add('dm-clock-warning');
        }
        window.twoMinuteWarningIssuedLocally = true;
    }

    if (!window.gameState.gameClockRunning) {
        gameClockDisplay.parentElement.classList.remove('warning');
        const dmDiv = document.getElementById('display-mode');
        if (dmDiv) dmDiv.classList.remove('dm-clock-warning');
    }

    // Update the Defence Log (Add this block)
    // if (defenceLogList) {
    //     defenceLogList.innerHTML = window.gameState.defenceLogHTML;
    // }
    // if (summaryDefenceLog) {
    //     summaryDefenceLog.innerHTML = window.gameState.defenceLogHTML;
    // }

    window.dmPrevScores = window.dmPrevScores || { team1: null, team2: null };

    // === DISPLAY MODE LIVE DATA BINDING ===
    if (window.userRole === 'display') {
        const displayModeDiv = document.getElementById('display-mode');
        if (!displayModeDiv || displayModeDiv.classList.contains('hidden')) return;

        const ordinals = ['', '1st Down', '2nd Down', '3rd Down', '4th Down'];

        const dmGameClock     = document.getElementById('dm-game-clock');
        const dmPeriod        = document.getElementById('dm-period');
        const dmDown          = document.getElementById('dm-down');
        const dmPlayClock     = document.getElementById('dm-play-clock');
        const dmTeam1Name     = document.getElementById('dm-team1-name');
        const dmTeam2Name     = document.getElementById('dm-team2-name');
        const dmTeam1Score    = document.getElementById('dm-team1-score');
        const dmTeam2Score    = document.getElementById('dm-team2-score');
        const dmTeam1Timeouts = document.getElementById('dm-team1-timeouts');
        const dmTeam2Timeouts = document.getElementById('dm-team2-timeouts');

        if (dmGameClock)  dmGameClock.textContent  = window.formatTime(window.gameState.gameTimeLeft);
        if (dmPeriod)     dmPeriod.textContent     = window.getPeriodName(window.gameState.currentHalf);
        if (dmDown)       dmDown.textContent       = ordinals[window.gameState.currentDown] || '';
        if (dmPlayClock)  dmPlayClock.textContent  = window.gameState.playTimeLeft;
        if (dmTeam1Name)  dmTeam1Name.textContent  = window.gameState.team1Name;
        if (dmTeam2Name)  dmTeam2Name.textContent  = window.gameState.team2Name;
        if (dmTeam1Score) dmTeam1Score.textContent = window.gameState.scores.team1;
        if (dmTeam2Score) dmTeam2Score.textContent = window.gameState.scores.team2;

        const newTeam1 = window.gameState.scores.team1;
        const newTeam2 = window.gameState.scores.team2;
        const scoreChanged = (window.dmPrevScores.team1 !== null) &&
            (newTeam1 !== window.dmPrevScores.team1 || newTeam2 !== window.dmPrevScores.team2);

        if (scoreChanged) {
            const changedTeam = newTeam1 !== window.dmPrevScores.team1
                ? window.gameState.team1Name
                : window.gameState.team2Name;

            // Extract score type from the latest score log entry
            const scoreLog = document.getElementById('score-log');
            const lastEntry = scoreLog ? scoreLog.querySelector('li:first-child') : null;
            const entryText = lastEntry ? lastEntry.textContent : '';
            const typeMatch = entryText.match(/scored\s+a?\s*(Touchdown|PAT|2PT|Safety|Field Goal)/i);
            const scoreType = typeMatch ? typeMatch[1].toUpperCase() : 'SCORE';
            const displayType = scoreType === 'PAT' ? '+ 1' : scoreType === '2PT' ? '+ 2' : scoreType === 'SAFETY' ? 'SAFETY' : scoreType === 'FIELD GOAL' ? 'FIELD GOAL' : 'TOUCHDOWN';

            const notify = document.getElementById('dm-score-notify');
            const notifyTeam = document.getElementById('dm-score-notify-team');
            const notifyType = document.getElementById('dm-score-notify-type');
            if (notify && notifyTeam && notifyType) {
                notifyTeam.textContent = changedTeam;
                notifyType.textContent = displayType;
                notify.classList.remove('hidden');
                setTimeout(() => notify.classList.add('hidden'), 3000);
            }
        }

        window.dmPrevScores.team1 = newTeam1;
        window.dmPrevScores.team2 = newTeam2;

        const updateTimeoutDots = (container, teamKey) => {
            if (!container) return;
            const total = window.gameState.timeoutsPerHalf;
            const remaining = total - window.gameState.timeoutsUsed[teamKey];
            container.innerHTML = '';
            for (let i = 0; i < total; i++) {
                const dot = document.createElement('span');
                dot.className = 'dm-timeout-dot';
                if (i >= remaining) dot.style.opacity = '0.2';
                container.appendChild(dot);
            }
        };
        updateTimeoutDots(dmTeam1Timeouts, '1');
        updateTimeoutDots(dmTeam2Timeouts, '2');

        const dmPeriodEnd = document.getElementById('dm-period-end');
        const dmPeriodEndLabel = document.getElementById('dm-period-end-label');
        if (dmPeriodEnd && dmPeriodEndLabel) {
            const clockExpired = window.gameState.gameTimeLeft === 0 && !window.gameState.gameClockRunning;
            if (clockExpired) {
                const half = window.gameState.currentHalf;
                if (half === 1) {
                    dmPeriodEndLabel.textContent = 'HALF TIME';
                } else if (half === 2) {
                    dmPeriodEndLabel.textContent = 'FULL TIME';
                } else {
                    dmPeriodEndLabel.textContent = 'END OF OT ' + (half - 2);
                }
                dmPeriodEnd.classList.remove('hidden');
            } else {
                dmPeriodEnd.classList.add('hidden');
            }
        }

    }
    // === END DISPLAY MODE LIVE DATA BINDING ===

};

// Function to apply role-based permissions
window.applyRolePermissions = () => {
    window.allControls.forEach(control => {
        if (control) {
            control.classList.add('disabled');
        }
    });

    const controlsToEnable = window.rolePermissions[window.userRole] || [];
    controlsToEnable.forEach(control => {
        if (control) {
            control.classList.remove('disabled');
        }
    });

    // --- WebSocket Connection Lock for Settings Form (iOS Fix) ---
    const settingsForm = document.getElementById('settings-form');
    const startGameBtn = document.getElementById('start-game-btn');
    const coinTossBtn = document.getElementById('coin-toss-btn');
    const settingsIsVisible = !settingsForm.classList.contains('hidden');
    const isConnected = window.ws && window.ws.readyState === WebSocket.OPEN;

    if (settingsIsVisible && !isConnected) {
        // Disable the buttons if we are on the settings form but not connected
        startGameBtn.classList.add('disabled');
        coinTossBtn.classList.add('disabled');
    } else if (settingsIsVisible) {
        // Re-enable them if we are connected (This block will run after ws.onopen)
        startGameBtn.classList.remove('disabled');
        coinTossBtn.classList.remove('disabled');
    }

};
