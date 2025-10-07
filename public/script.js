document.addEventListener('DOMContentLoaded', () => {
    const appVersion = '0.0.80';
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
    const playClockOptions = document.querySelector('.play-clock-options');
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
    // const coinTossResultDisplay = document.getElementById('coin-toss-result');
    const summaryTeam1Name = document.getElementById('summary-team1-name');
    const summaryTeam2Name = document.getElementById('summary-team2-name');
    const summaryTeam1Score = document.getElementById('summary-team1-score');
    const summaryTeam2Score = document.getElementById('summary-team2-score');
    const summaryScoreLog = document.getElementById('summary-score-log');
    const summaryTimeoutLog = document.getElementById('summary-timeout-log');
    const startNewGameFromSummaryBtn = document.getElementById('start-new-game-from-summary-btn');
    const gameIdDisplay = document.getElementById('current-game-id');
    const shareLinkBtns = document.querySelectorAll('.share-link-btn');
    const shareFeedback = document.getElementById('share-feedback');
    const shareLinksSection = document.querySelector('.share-links-section');
    const teamNamesDatalist = document.getElementById('team-names'); 
    const team1OptionsList = document.getElementById('team1-options');
    const team2OptionsList = document.getElementById('team2-options');
    const fixedFooter = document.getElementById('fixed-footer-links-container');
    const infoBtn = document.getElementById('info-btn');
    const penaltyLookupBtn  = document.getElementById('penalty-lookup-btn');
    const penaltyLookupModal = document.getElementById('penalty-lookup-modal');
    const closePenaltyModalBtn = document.getElementById('close-penalty-modal-btn');
    const shareLinksBtn  = document.getElementById('share-links-btn');
    const infoModal = document.getElementById('info-modal');
    const closeInfoModalBtn = document.getElementById('close-info-modal-btn');
    const shareModal = document.getElementById('share-modal');
    const closeShareModalBtn = document.getElementById('close-share-modal-btn');

    // Team List Functions

let allTeamNames = []; // Global array to store all loaded team names

// --- Dropdown Logic ---

const fetchAndLoadTeamNames = async () => {
    try {
        // Fetch data from your JSON file
        const response = await fetch('/teams.json'); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
            // Store the list globally and sort it for a better user experience
            allTeamNames = data.sort((a, b) => a.localeCompare(b)); 
            console.log(`Successfully loaded ${allTeamNames.length} team names.`);
        } else {
            console.error("teams.json content is not an array.");
        }
    } catch (error) {
        console.error("Could not load team names:", error);
    }
};

// Function to filter and render the options list
const filterAndRenderOptions = (inputElement, optionsListElement) => {
    const filterText = inputElement.value.toLowerCase();
    optionsListElement.innerHTML = ''; // Clear current list
    
    // Filter the global array based on the input text
    const filteredTeams = allTeamNames.filter(team => 
        team.toLowerCase().includes(filterText)
    );
    
    if (filteredTeams.length > 0 && filterText.length > 0) {
        // Show filtered results if the user is typing
        filteredTeams.forEach(teamName => {
            const li = document.createElement('li');
            li.textContent = teamName;
            
            // Add a click handler to select the team
            li.addEventListener('click', (event) => {
                event.preventDefault(); // Stop any default form behavior
                inputElement.value = teamName; // Set the input value
                optionsListElement.classList.add('hidden'); // Hide the list
                inputElement.focus(); // Keep focus after selection
            });
            optionsListElement.appendChild(li);
        });
        optionsListElement.classList.remove('hidden'); // Show the list
    } else if (filterText.length === 0) {
        // If the input is empty (e.g., on focus), show *all* teams (Standard dropdown behavior)
        allTeamNames.forEach(teamName => {
            const li = document.createElement('li');
            li.textContent = teamName;
            li.addEventListener('click', (event) => {
                event.preventDefault(); 
                inputElement.value = teamName;
                optionsListElement.classList.add('hidden'); 
                inputElement.focus();
            });
            optionsListElement.appendChild(li);
        });
         optionsListElement.classList.remove('hidden');
    } else {
        // Hide if no results and they are typing
        optionsListElement.classList.add('hidden'); 
    }
};

// Function to attach all event listeners to a pair of input/list
const setupTeamDropdown = (inputElement, optionsListElement) => {
    
    // 1. Input event: Filter as the user types
    inputElement.addEventListener('input', () => {
        filterAndRenderOptions(inputElement, optionsListElement);
    });

    // 2. Focus event: Show all options if input is empty (like clicking a standard dropdown)
    inputElement.addEventListener('focus', () => {
        if (optionsListElement.classList.contains('hidden')) {
            filterAndRenderOptions(inputElement, optionsListElement); 
        }
    });

    // 3. Blur event: Hide the list when focus is lost
    inputElement.addEventListener('blur', () => {
        // Use a short timeout to allow the 'click' event on a list item to register before hiding
        setTimeout(() => {
            optionsListElement.classList.add('hidden');
        }, 150);
    });
};

// Setup both Home and Away team dropdowns
setupTeamDropdown(team1NameInput, team1OptionsList);
setupTeamDropdown(team2NameInput, team2OptionsList);

// Call the fetch function at the end of DOMContentLoaded
fetchAndLoadTeamNames(); 

    // End Team List Functions

    // Collect all control elements into a single array for easy management
    const allControls = [
        gameClockToggleBtn,
        gameClockResetBtn,
        playClockOptions,
        playClockToggleBtn,
        playClockResetBtn,
        autoAdvanceCheckbox,
        ...downButtons,
        ...scoreButtons,
        ...adjustButtons,
        ...useTimeoutBtns,
        undoBtn,
        endGameBtn,
        shareLinksSection,
        startNewGameFromSummaryBtn,
        infoBtn,
        penaltyLookupBtn,
        shareLinksBtn,
        fixedFooter
    ];

    // Map roles to the specific controls they can use
    const rolePermissions = {
        'administrator': allControls,
        'head-referee': [gameClockToggleBtn, gameClockResetBtn, playClockToggleBtn, playClockResetBtn, playClockOptions, autoAdvanceCheckbox, ...downButtons, ...useTimeoutBtns, fixedFooter, endGameBtn, undoBtn, infoBtn, penaltyLookupBtn, shareLinksBtn],
        'scorer': [...scoreButtons, ...adjustButtons, fixedFooter, undoBtn],
        'clock': [gameClockToggleBtn, gameClockResetBtn, playClockToggleBtn, playClockResetBtn, playClockOptions, autoAdvanceCheckbox, ...downButtons],
        'coach': []
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
    const audio = document.getElementById('warning-audio'); // NEW: Reference the HTML element
    const defaultAudio = document.getElementById('default-audio'); 
    let audioUnlocked = false; // NEW: Flag to ensure we only try to unlock once

    // Function to play the default audio when screens change
    const playDefaultAudio = () => {
        if (defaultAudio) {
            defaultAudio.currentTime = 0;
            defaultAudio.play().catch(e => console.log("Default audio playback blocked:", e));
        }
    };

    // Function to play the 2-minute warning audio
    const playWarningAudio = () => {
        if (audio) { // 'audio' is your existing 'warning-audio' element
            audio.currentTime = 0;
            audio.play().catch(e => console.log("Warning audio playback blocked:", e));
        }
    };

    // --- Audio Unlock Function for iOS/Safari ---
    const unlockAudio = () => {
        if (audioUnlocked) return; // Only run once
        
        // Attempt to play and immediately pause the audio on user interaction
        // This is a common workaround to bypass iOS/Safari's autoplay policy
        if (defaultAudio) {
            defaultAudio.play().then(() => {
                defaultAudio.pause();
                audioUnlocked = true;
                console.log("Audio playback successfully unlocked by user gesture.");
            }).catch(error => {
                // Audio might still fail if not a direct gesture, but we tried.
                console.error("Audio unlock failed:", error);
            });
        }
    };


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

        if (Object.keys(gameState).length > 0 && gameState.gameStarted && !gameState.gameEnded) {
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
            if (fixedFooter) {
                fixedFooter.classList.add('hidden'); 
            }
        } else if (window.location.pathname.startsWith('/game/')) {
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
            gameLobby.classList.remove('hidden');
            settingsForm.classList.add('hidden');
            gameInterface.classList.add('hidden');
            gameSummary.classList.add('hidden');
            // if (fixedFooter) {
            //     fixedFooter.classList.add('visible');
            // }
        }

        if (Object.keys(gameState).length === 0) {
            return;
        }

        gameDateDisplay.textContent = formatDisplayDate(gameState.date);
        gameLocationDisplay.textContent = gameState.location.trim() ? `, ${gameState.location.trim()}` : '';
        //gameLocationDisplay.textContent = gameState.location;
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
            coinTossBtn.textContent = `${gameState.coinTossResult}`;
        //    coinTossBtn.textContent = `${gameState.coinTossResult}. Click to flip again.`;
        } else {
            // Set the initial text if no toss has occurred
            coinTossBtn.textContent = 'Flip Coin';
        }

        if (gameState.gameTimeLeft === 120 && !twoMinuteWarningIssuedLocally) {
            gameClockDisplay.parentElement.classList.add('warning');
            if (audio) { // Check if audio element exists before trying to play
                audio.play();
            }
            twoMinuteWarningIssuedLocally = true;
        }

        applyRolePermissions();
    };

    // New/Updated function to format date for display (e.g., "27 September 2025")
    const formatDisplayDate = (dateString) => {
    // If the date is not set or is the 'N/A' default, return it as is.
    if (!dateString || dateString === 'N/A') return 'N/A';
    
    // 1. Create a Date object from the YYYY-MM-DD string.
    const dateObj = new Date(dateString + 'T00:00:00'); // Add time to ensure correct timezone parsing

    // Check if the date object is valid
    if (isNaN(dateObj)) {
        return dateString; // Return original string if the date is invalid
    }

    // 2. Define the options for the desired display format:
    // 'numeric' for the day number (27)
    // 'long' for the full month name (September)
    // 'numeric' for the four-digit year (2025)
    const options = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    };

    // 3. Use 'en-GB' (British English) locale to ensure the format is 
    // Day, then Month, then Year (e.g., 27 September 2025).
    return dateObj.toLocaleDateString('en-GB', options);
    };

    // Function to apply role-based permissions
    const applyRolePermissions = () => {
        allControls.forEach(control => {
            if (control) {
                control.classList.add('disabled');
            }
        });

        const controlsToEnable = rolePermissions[userRole] || [];
        controlsToEnable.forEach(control => {
            if (control) {
                control.classList.remove('disabled');
            }
        });
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
    const gameIdFromUrl = pathParts.length > 2 && pathParts[1] === 'game' ? pathParts[2].split('?')[0] : null;

    if (gameIdFromUrl) {
        gameLobby.classList.add('hidden');
        settingsForm.classList.remove('hidden');
        connectWebSocket(gameIdFromUrl);
    } else {
        gameLobby.classList.remove('hidden');
        settingsForm.classList.add('hidden');
        gameInterface.classList.add('hidden');
    }

    startNewGameBtn.addEventListener('click', () => {
        // NEW: Call the unlock function on the user's first click
        unlockAudio();

        const newGameId = Math.random().toString(36).substring(2, 8);
        history.pushState(null, '', `/game/${newGameId}?role=${userRole}`);

        gameLobby.classList.add('hidden');
        settingsForm.classList.remove('hidden');

        document.getElementById('game-id-text').textContent = newGameId;
        gameIdDisplay.classList.remove('hidden');

        connectWebSocket(newGameId);
    });

    joinGameBtn.addEventListener('click', () => {
        // NEW: Also call unlock on the join button for compatibility
        unlockAudio(); 

        const gameId = gameIdInput.value.trim();
        if (gameId) {
            history.pushState(null, '', `/game/${gameId}?role=${userRole}`);

            joinErrorMessage.classList.add('hidden');
            gameLobby.classList.add('hidden');
            settingsForm.classList.remove('hidden');
            connectWebSocket(gameId);
        } else {
            joinErrorMessage.classList.remove('hidden');
        }
    });

    startGameBtn.addEventListener('click', (event) => {
        event.preventDefault(); // Good practice to include this

        // 1. SET DEFAULTS: If the input is empty, default to 'Team 1' / 'Team 2'
        const t1Name = team1NameInput.value.trim() || 'Team 1';
        const t2Name = team2NameInput.value.trim() || 'Team 2';

        // 2. RETAIN OTHER VALIDATION (Date and Location)
        // if (!dateField.value || !locationField.value) {
        //     alert('Please fill in the Date and Location details.');
        //     return;
        // }

        // if (!gameState.coinTossResult) {
        //    alert("Please complete the coin toss before starting the game.");
        //    return;
        // }
        twoMinuteWarningIssuedLocally = false;
        gameClockDisplay.parentElement.classList.remove('warning');
        actionHistory = [];

        const newGameState = {
            gameStarted: true,
            date: dateField.value || 'N/A',
            location: locationField.value,
            team1Name: t1Name,
            team2Name: t2Name,
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

    // Event listener for the "End Game" button with confirmation
    endGameBtn.addEventListener('click', () => {
        // Show a confirmation dialog
        const confirmed = confirm('Are you sure you want to end the game? This action cannot be undone.');
        
        // Only proceed if the user clicked OK
        if (confirmed) {
            sendAction('END_GAME');
        }
        // If the user clicks Cancel, the action is ignored.
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

    // Listener for the Penalty Lookup Modal
        penaltyLookupBtn.addEventListener('click', () => {
            penaltyLookupModal.style.display = 'block';
            infoModal.style.display = 'none'; 
            shareModal.style.display = 'none'; // ADDED: Hide Share Modal
        });

    // Listener for the Info Modal
        infoBtn.addEventListener('click', () => {
            infoModal.style.display = 'block';
            penaltyLookupModal.style.display = 'none'; 
            shareModal.style.display = 'none'; // ADDED: Hide Share Modal
        });

    // --- NEW SHARE MODAL LISTENERS ---
        shareLinksBtn.addEventListener('click', () => {
            shareModal.style.display = 'block'; // Show Share Modal
            infoModal.style.display = 'none'; // Hide Info Modal
            penaltyLookupModal.style.display = 'none'; // Hide Penalty Modal
        });

    // Listener for closing the modals via their close buttons ('&times;')
        closePenaltyModalBtn.addEventListener('click', () => {
            penaltyLookupModal.style.display = 'none';
        });

        closeInfoModalBtn.addEventListener('click', () => {
            infoModal.style.display = 'none';
        });

    // ADDED: Listener for Share Modal Close Button
        closeShareModalBtn.addEventListener('click', () => {
            shareModal.style.display = 'none';
        });
    
    // Global click listener for closing modals by clicking the backdrop
        window.addEventListener('click', (event) => {
            if (event.target === infoModal) {
            infoModal.style.display = 'none';
        }
        if (event.target === penaltyLookupModal) { 
            penaltyLookupModal.style.display = 'none';
        }
    // ADDED: Global close check for Share Modal
        if (event.target === shareModal) { 
            shareModal.style.display = 'none';
        }
    });

    // --- New Share Link Logic ---
    const getShareUrl = (role) => {
        // Extracts the game ID from the current URL path.
        const gameId = window.location.pathname.split('/').pop().split('?')[0];
        // Uses window.location.origin (e.g., https://referee-app.onrender.com) for the base URL
        return `${window.location.origin}/game/${gameId}?role=${role}`;
    };

    const copyToClipboard = (text) => {
        if (!navigator.clipboard) {
            // Fallback for non-secure contexts or older browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";  // Prevents scrolling to bottom of page
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                return true;
            } catch (err) {
                console.error('Fallback: Unable to copy', err);
                return false;
            } finally {
                document.body.removeChild(textArea);
            }
        }
        // Use modern clipboard API (returns a Promise)
        return navigator.clipboard.writeText(text);
    };

    shareLinkBtns.forEach(button => {
        button.addEventListener('click', (event) => {
            const role = button.dataset.role;
            const shareUrl = getShareUrl(role);
            
            // Function to handle feedback display
            const showFeedback = (message, isError = false) => {
                shareFeedback.textContent = message;
                shareFeedback.classList.remove('hidden');
                shareFeedback.style.color = isError ? 'var(--error-color)' : 'var(--primary-color)';
                setTimeout(() => {
                    shareFeedback.classList.add('hidden');
                }, 2000);
            };

            // Try modern API first
            if (navigator.clipboard) {
                copyToClipboard(shareUrl)
                    .then(() => {
                        showFeedback(`${button.textContent} link copied!`);
                    })
                    .catch(() => {
                        showFeedback(`Error copying ${button.textContent} link.`, true);
                    });
            } else {
                 // Use fallback and check return value
                 const success = copyToClipboard(shareUrl);
                 if (success) {
                    showFeedback(`${button.textContent} link copied! (Fallback)`);
                 } else {
                    showFeedback(`Error copying ${button.textContent} link.`, true);
                 }
            }
        });
    });

    // --- New: Function to load and populate the searchable dropdown ---
    const loadTeamNames = async () => {
    try {
        // Assuming your team names are in a file named 'teams.json'
        const response = await fetch('/teams.json'); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const teamNames = await response.json();

        // Ensure the fetched data is an array
        if (Array.isArray(teamNames)) {
            // Clear existing options
            teamNamesDatalist.innerHTML = ''; 

            // Create and append a new <option> for each team name
            teamNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                teamNamesDatalist.appendChild(option);
            });
            console.log(`Successfully loaded ${teamNames.length} team names.`);
        } else {
            console.error("teams.json content is not an array.");
        }
    } catch (error) {
        console.error("Could not load team names:", error);
        // Fallback: Optionally add a few default names if loading fails
        // ['Default Team A', 'Default Team B'].forEach(...)
    }
    };

// ...

// At the very end of the document.addEventListener('DOMContentLoaded', () => { ... }); block:
// Call the new function to load the data when the page loads
loadTeamNames();



});