document.addEventListener('DOMContentLoaded', () => {
    const appVersion = '0.1.92';
    console.log(`Referee App - Version: ${appVersion}`);
    const versionDisplay = document.querySelector('.version');
    if (versionDisplay) {
        versionDisplay.textContent = `v${appVersion}`;
    }

    // --- SECURITY ADDITIONS: Secure Map and Helper Functions ---
    // This map stores the secure, unguessable tokens for each role.
    const SECURE_ROLE_MAP = {
        // Original Role Name : Secure Token (must be unique)
        'clock': '4jk98d',
        'head-referee': 'a2c6g1',
        'scorer': 'h7y3l9',
        'coach': '5hd74h',
        // 'administrator' is not usually shared, but included for completeness if needed.
        'administrator': 'b3f5z2' 
    };

    // Finds the original role name (e.g., 'coach') by searching for its secure token (e.g., '5hd74h').
    // Falls back to the token itself if the token is not found (e.g., 'view-only').
    const getRoleFromToken = (token) => {
        return Object.keys(SECURE_ROLE_MAP).find(key => SECURE_ROLE_MAP[key] === token);
    };

    // Automatically set the date field to the current date
    const today = new Date();
    const formattedDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    document.getElementById('date-field').value = formattedDate;

    const urlParams = new URLSearchParams(window.location.search);

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
    const defenceLogList = document.getElementById('defence-log');
    const downButtons = document.querySelectorAll('.down-btn');
    const playClockOptions = document.querySelector('.play-clock-options');
    const autoAdvanceCheckbox = document.getElementById('auto-advance-play-clock');
    const scoreButtons = document.querySelectorAll('.score-buttons button');
    
    scoreButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // DEFENSIVE CHECK: If the button has the defence class, exit immediately.
            if (e.currentTarget.classList.contains('defence-stats-btn')) {
                return; 
            }

            // The rest of your score logic only runs if it's NOT a defence button
            const team = button.getAttribute('data-team');
            showScorePopup(team);
        });
    });
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
    const summaryDefenceLog = document.getElementById('summary-defence-log');
    const startNewGameFromSummaryBtn = document.getElementById('start-new-game-from-summary-btn');
    const downloadSummaryBtn = document.getElementById('download-summary-btn'); 
    const gameIdDisplay = document.getElementById('current-game-id');
    const shareLinkBtns = document.querySelectorAll('.share-link-btn');
    const shareFeedback = document.getElementById('share-feedback');
    const shareLinksSection = document.querySelector('.share-links-section');
    const teamNamesDatalist = document.getElementById('team-names-datalist'); 
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
    const penaltySearchInput = document.getElementById('penalty-search');
    const infoModalAdmin = document.getElementById('info-modal-admin');
    const infoModalRef = document.getElementById('info-modal-ref');
    const infoModalScorer = document.getElementById('info-modal-scorer');
    const infoModalClock = document.getElementById('info-modal-clock');
    const infoModalCoach = document.getElementById('info-modal-coach');

    const defenceButtons = document.querySelectorAll('.defence-buttons button');
    const defenceStatButtons = document.querySelectorAll('.defence-stats-btn');
    const defencePopup = document.getElementById('defence-popup');
    const defencePopupHeader = document.getElementById('defence-popup-header');
    const closeDefencePopupBtn = document.querySelector('#defence-cancel-popup-btn'); 
    const defenceTackleInput = document.getElementById('defence-tackle');
    const defenceTFLInput = document.getElementById('defence-tfl');
    const defenceSackInput = document.getElementById('defence-sack');
    const defenceIntInput = document.getElementById('defence-int');
    const logDefenceStatBtn = document.getElementById('log-defence-stat-btn');
    const defenceCancelPopupBtn = document.getElementById('defence-cancel-popup-btn');
    // const defenceLog = document.querySelector('#defence-log');

    let reconnectAttempts = 0;
    let pingInterval = null;   // NEW: For keeping the connection alive
    let allTeamNames = []; // Global array to store all loaded team names

    /**
    * Reverses the order of list items (li) in a given <ul> or <ol> element.
    */
    const reverseLogOrder = (ulElement) => {
        // Create an array from the live collection of children (li elements)
        const listItems = Array.from(ulElement.children);
    
        // Detach and re-append items in reverse order
        for (let i = listItems.length - 1; i >= 0; i--) {
            ulElement.appendChild(listItems[i]);
        }
    };


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
        ...defenceButtons,
        ...adjustButtons,
        ...useTimeoutBtns,
        undoBtn,
        endGameBtn,
        shareLinksSection,
        startNewGameFromSummaryBtn,
        infoBtn,
        penaltyLookupBtn,
        shareLinksBtn,
        fixedFooter,
        infoModalAdmin,
        infoModalRef,
        infoModalScorer,
        infoModalClock,
        infoModalCoach
    ];

    // Map roles to the specific controls they can use
    const rolePermissions = {
        'administrator': [gameClockToggleBtn, gameClockResetBtn, playClockOptions, playClockToggleBtn, playClockResetBtn, autoAdvanceCheckbox, ...downButtons, ...scoreButtons, ...defenceButtons, ...adjustButtons, ...useTimeoutBtns, undoBtn, endGameBtn, shareLinksSection, startNewGameFromSummaryBtn, infoBtn, penaltyLookupBtn, shareLinksBtn, fixedFooter, infoModalAdmin],
        'head-referee': [gameClockToggleBtn, gameClockResetBtn, playClockToggleBtn, playClockResetBtn, playClockOptions, autoAdvanceCheckbox, ...downButtons, ...useTimeoutBtns, fixedFooter, endGameBtn, undoBtn, infoBtn, penaltyLookupBtn, shareLinksBtn, infoModalRef],
        'scorer': [...scoreButtons, ...defenceButtons, ...adjustButtons, fixedFooter, undoBtn, infoBtn, infoModalScorer],
        'clock': [gameClockToggleBtn, gameClockResetBtn, playClockToggleBtn, playClockResetBtn, playClockOptions, autoAdvanceCheckbox, ...downButtons, fixedFooter, infoBtn, infoModalClock],
        'coach': [fixedFooter, infoBtn, infoModalCoach]
    };

    let userRole = 'administrator';
    roleInputs.forEach(input => {
        input.addEventListener('change', (event) => {
            userRole = event.target.value;
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('role', userRole);
            // history.replaceState(null, '', `?${urlParams.toString()}`);
            applyRolePermissions();
        });
    });

    let ws = null;
    let gameState = {};
    let tempScoreEvent = null;
    let twoMinuteWarningIssuedLocally = false;
    let actionHistory = [];

    // --- WebSocket Event Handlers ---
    const connectWebSocket = (gameId) => {
        ws = new WebSocket(`wss://${location.host}/game/${gameId}`);

        ws.onopen = () => {
            console.log(`Connected to the WebSocket server for game ${gameId}!`);
            reconnectAttempts = 0; // NEW: Reset counter on successful connection
            applyRolePermissions();

            if (pingInterval) clearInterval(pingInterval); // Clear any old interval
            pingInterval = setInterval(() => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                   // Send a lightweight, non-game-changing message (e.g., 'PING')
                    ws.send(JSON.stringify({ type: 'HEARTBEAT' })); 
                }
            }, 10000); // 10 seconds

        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('Received from server:', message);
            Object.assign(gameState, message);
            updateUI();
        };

        ws.onclose = () => {
            console.log(`Disconnected from the WebSocket server for game ${gameId}. Attempting reconnect...`);
            ws = null; // Ensure ws is nullified
        
            if (pingInterval) {
                clearInterval(pingInterval);
                pingInterval = null;
        }
            
            // Reconnection logic using exponential backoff (up to 5 attempts)
            if (reconnectAttempts < 5) {
                // Calculate delay: 1s, 2s, 4s, 8s, 15s (capped at 15s)
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 15000); 
                
                setTimeout(() => {
                    connectWebSocket(gameIdFromUrl);
                    updateUI();
                }, 150); // 150ms delay gives Safari time to stabilize
            } else {
                console.error("Maximum reconnect attempts reached. Please refresh.");
                // Since you cannot see the console, this is where the user would be stuck again.
                // We rely on the role permissions lock to still be active here.
            }
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
        const urlToken = urlParams.get('role');
        // Convert the secure token back to the friendly role name, falling back to 'administrator'
        userRole = getRoleFromToken(urlToken) || urlToken || 'administrator';

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
            summaryDefenceLog.innerHTML = gameState.defenceLogHTML;
            reverseLogOrder(summaryScoreLog);
            reverseLogOrder(summaryTimeoutLog);
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

        applyRolePermissions();

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

        // === START LOG PLACEHOLDER LOGIC ===

        // Score Log
        if (gameState.scoreLogHTML && gameState.scoreLogHTML.trim().length > 0) {
            scoreLogList.innerHTML = gameState.scoreLogHTML;
        } else {
            scoreLogList.innerHTML = '<li class="log-placeholder">No scores recorded yet.</li>';
        }

        // Timeout Log
        if (gameState.timeoutLogHTML && gameState.timeoutLogHTML.trim().length > 0) {
            timeoutLogList.innerHTML = gameState.timeoutLogHTML;
        } else {
            timeoutLogList.innerHTML = '<li class="log-placeholder">No timeouts taken yet.</li>';
        }

        // Defence Log
        if (gameState.defenceLogHTML && gameState.defenceLogHTML.trim().length > 0) {
            defenceLogList.innerHTML = gameState.defenceLogHTML;
        } else {
            defenceLogList.innerHTML = '<li class="log-placeholder">No defensive stats recorded yet.</li>';
        }

        // === END LOG PLACEHOLDER LOGIC ===

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
            twoMinuteWarningIssuedLocally = true;
        }

        // Update the Defence Log (Add this block)
        // if (defenceLogList) {
        //     defenceLogList.innerHTML = gameState.defenceLogHTML;
        // }
        // if (summaryDefenceLog) {
        //     summaryDefenceLog.innerHTML = gameState.defenceLogHTML;
        // }

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

        // --- WebSocket Connection Lock for Settings Form (iOS Fix) ---
        const settingsIsVisible = !settingsForm.classList.contains('hidden');
        const isConnected = ws && ws.readyState === WebSocket.OPEN;

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

    /**
    * Generates an HTML log entry marking the end of the half.
    */
    const getNewEndOfHalfLog = () => {
        // The game clock reset is triggered at the end of the half, 
        // so we use the full half duration as the elapsed time.
        const elapsedTime = gameState.halfDuration; 
    
        // Creates a distinctive log entry (using formatTime which is already available)
        const newLogEntry = `<li class="end-of-half-log">[${formatTime(elapsedTime)}] --- END OF HALF ---</li>`;
        return newLogEntry;
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

    let tempDefenceEvent = null; // Declare a variable to hold the temporary defence event details

    const showDefencePopup = (team) => {
        // Store the team for logging later (1 for home, 2 for away)
        tempDefenceEvent = { team };
    
        // Determine the team name for the header
        const teamName = team === '1' ? gameState.team1Name : gameState.team2Name;
    
        // Update the popup header text
        defencePopupHeader.textContent = `Log Defensive Stats for ${teamName}`;
    
        // Show the popup
        defencePopup.classList.remove('hidden');
    };

    const hideDefencePopup = () => {
        // Hide the popup
        defencePopup.classList.add('hidden');
    
        // Reset all input fields
        defenceTackleInput.value = '';
        defenceTFLInput.value = '';
        defenceSackInput.value = '';
        defenceIntInput.value = '';

        // Clear the temporary event object
        tempDefenceEvent = null;
    };

    /**
    * Logs the defensive stats entered in the popup for the selected team.
    * NOTE: Assumes 'gameState' and 'tempDefenceEvent' are globally available, 
    * along with the input constants (defenceTackleInput, etc.)
    */
    const logDefenceStats = () => {
        // Safety check for context
        if (!tempDefenceEvent || !tempDefenceEvent.team || !gameState) {
            console.error("Cannot log defensive stats: Missing team context or gameState.");
            return;
        }

        const team = tempDefenceEvent.team;
        const teamName = team === '1' ? gameState.team1Name : gameState.team2Name;
        const teamKey = `team${team}`;

        // Get and clean values from inputs (coercing non-numeric/empty values to 0)
        const tackles = parseInt(defenceTackleInput.value) || 0;
        const tfl = parseInt(defenceTFLInput.value) || 0;
        const sacks = parseInt(defenceSackInput.value) || 0;
        const interceptions = parseInt(defenceIntInput.value) || 0;

        // Check if any stats were actually entered
        if (tackles === 0 && tfl === 0 && sacks === 0 && interceptions === 0) {
            // If nothing was logged, just close the popup
            hideDefencePopup();
            return;
        }

        // --- 1. UPDATE GAME STATE (for persistence and tracking) ---
        // Initialize stats structure if it doesn't exist 
        if (!gameState.defenceStats) gameState.defenceStats = { team1: {}, team2: {} };
        if (!gameState.defenceStats[teamKey]) gameState.defenceStats[teamKey] = { tackles: 0, tfl: 0, sacks: 0, interceptions: 0 };

        gameState.defenceStats[teamKey].tackles += tackles;
        gameState.defenceStats[teamKey].tfl += tfl;
        gameState.defenceStats[teamKey].sacks += sacks;
        gameState.defenceStats[teamKey].interceptions += interceptions;

        // --- 2. CREATE LOG ENTRY (using defenceLog & summaryDefenceLog) ---
        // const timestamp = `Q${gameState.currentQuarter} ${gameState.currentTime}`; 
        const elapsedTime = gameState.halfDuration - gameState.gameTimeLeft;
        let logMessage = `${teamName}`;
        const stats = [];
        // Added logic for pluralization
        if (tackles > 0) stats.push(`#${tackles} TACKLE`); 
        if (tfl > 0) stats.push(`#${tfl} TFL`);
        if (sacks > 0) stats.push(`#${sacks} SACK`);
        if (interceptions > 0) stats.push(`#${interceptions} INT`);

        // Construct the full log message
        logMessage += `: ${stats.join(', ')}`; // Used colon for cleaner look

        const logEntryHTML = `<li class="log-entry log-defence log-team-${team}">[${formatTime(elapsedTime)}] ${logMessage}</li>`;

        // CRITICAL FIX: Save the new log entry to the game state string
        gameState.defenceLogHTML = logEntryHTML + gameState.defenceLogHTML;

        // --- 3. CLEAN UP & SYNC ---
        // Hide the popup and clear inputs
        hideDefencePopup();

        // FINAL CRITICAL FIX: Use the actual function to save/sync the game state
        // This sends the full updated gameState object to the server/sync mechanism
        sendAction('UPDATE_STATE', gameState);

        // CRITICAL FIX: Send the updated state to the server/other clients
        updateUI(); 
    };

    // --- Event Listeners ---
    const pathParts = window.location.pathname.split('/');
    const gameIdFromUrl = pathParts.length > 2 && pathParts[1] === 'game' ? pathParts[2].split('?')[0] : null;

    if (gameIdFromUrl) {
        gameLobby.classList.add('hidden');
        settingsForm.classList.remove('hidden');

        // ONLY continue if we successfully parsed a game ID
        if (gameIdFromUrl) {
            // 1. Instantly hide lobby and show settings (Visual change)
            gameLobby.classList.add('hidden');
            settingsForm.classList.remove('hidden');

            // 2. Apply the CRITICAL 150ms Safari delay
            setTimeout(() => {
                // 3. Connect the WebSocket and update UI AFTER the pause
                connectWebSocket(gameIdFromUrl);
                updateUI();
            }, 150);
        }

    } else {
        gameLobby.classList.remove('hidden');
        settingsForm.classList.add('hidden');
        gameInterface.classList.add('hidden');
    }

    startNewGameBtn.addEventListener('click', () => {

        const newGameId = Math.random().toString(36).substring(2, 8);
        history.replaceState(null, '', `/game/${newGameId}?role=${SECURE_ROLE_MAP[userRole] || userRole}`);

        gameLobby.classList.add('hidden');
        settingsForm.classList.remove('hidden');

        document.getElementById('game-id-text').textContent = newGameId;
        gameIdDisplay.classList.remove('hidden');

        connectWebSocket(newGameId);
    });

    joinGameBtn.addEventListener('click', () => {

        const gameId = gameIdInput.value.trim();
        if (gameId) {
            history.replaceState(null, '', `/game/${gameId}?role=${SECURE_ROLE_MAP[userRole] || userRole}`);

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

        // *** 1. Dynamic Time Calculation (Must be executed first!) ***
        const initialMinutes = parseInt(halfDurationInput.value, 10);
        // Calculate the time string (e.g., 12:00)
        const initialTimeString = `${String(initialMinutes).padStart(2, '0')}:00`;

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
            currentQuarter: 1,
            currentTime: initialTimeString,
            timeoutLogHTML: '',
            defenceLogHTML: '',
            twoMinuteWarningIssued: false
        };
        sendAction('UPDATE_STATE', newGameState);
    });

    coinTossBtn.addEventListener('click', (event) => { // CHANGED: Added (event)
        event.preventDefault(); // NEW: Stops potential form submission
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
    
        // 1. Generate the 'End of Half' log entry
        const endOfHalfLogEntry = getNewEndOfHalfLog();
    
        // 2. Prepend the new entry to the existing log HTML 
        //    (The game log is newest-first on the game interface, so we prepend/add to the start)
        const newScoreLogHTML = endOfHalfLogEntry + gameState.scoreLogHTML;

        // 3. Send the reset state PLUS the updated score log
        sendAction('UPDATE_STATE', {
            gameTimeLeft: gameState.halfDuration, // Resets the clock to the start time
            timeoutsUsed: { '1': 0, '2': 0 },     // Resets timeouts
            twoMinuteWarningIssued: false,
        
            // Include the new log content
            scoreLogHTML: newScoreLogHTML 
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

    // --- Defence Button Listeners ---
    defenceButtons.forEach((button, index) => {
        // Team '1' for the first button (Home), Team '2' for the second (Away)
        const team = (index + 1).toString(); 
    
        button.addEventListener('click', (e) => {
            e.stopImmediatePropagation();
            // This is the call that references and opens the popup
            showDefencePopup(team); 
        });
    });

    // --- Defence Popup Close Listener ---
    if (closeDefencePopupBtn) {
        closeDefencePopupBtn.addEventListener('click', hideDefencePopup);
    }

    // Optionally, listen for the 'Cancel' or 'Log' button within the defence popup
    // defenceCancelBtn.addEventListener('click', hideDefencePopup);
    // defenceLogBtn.addEventListener('click', logDefenceStats); // You'll need to write this function next!    

    // Listener for the main log button (uses logDefenceStatBtn)
    if (logDefenceStatBtn) {
        logDefenceStatBtn.addEventListener('click', logDefenceStats);
    }

    // --- NEW FUNCTION: updateShareLinks ---
    // Function to update the share links in the modal
    const updateShareLinks = () => {
        const shareContainer = document.querySelector('.share-links-section'); // Assumes this is the container
        if (!shareContainer) return;

        // Clear existing links
        shareContainer.innerHTML = '';

        // Add Share Buttons/Links for each role
        const roles = ['head-referee', 'clock', 'scorer', 'coach'];
        roles.forEach(role => {
            // Get the secure URL using the updated getShareUrl function
            const shareUrl = getShareUrl(role);
            
            // Create the link button
            const button = document.createElement('button');
            button.className = 'share-link-btn';
            button.dataset.role = role;
            // This displays the readable role name (e.g., "Coach Link")
            button.textContent = `${role.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')} Link`;
            button.title = shareUrl; // This shows the secure URL on hover

            shareContainer.appendChild(button);
        });
    };
    // ------------------------------------

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

/**
    * Gathers game data from gameState, formats it into a text file, and triggers a download.
    */
    const downloadGameSummary = () => {
        // Retrieve Game ID from the URL
        const pathParts = window.location.pathname.split('/');
        const gameId = pathParts.length > 2 && pathParts[1] === 'game' ? pathParts[2].split('?')[0] : 'N/A';
        
        // Ensure the date is available
        const formattedDate = document.getElementById('date-field').value;

        if (Object.keys(gameState).length === 0) {
            console.error("No game state to download. Game state object is empty.");
            return;
        }

        // Correctly destructure core properties (scores are nested)
        const { 
            date: gameDate, 
            location, 
            team1Name, 
            team2Name, 
            scores: { team1: team1Score, team2: team2Score }, 
        } = gameState;
        
        // --- CRITICAL FIX: Extract logs from the rendered DOM elements ---
        // Extract the logs (they are currently in LIFO order from the game screen)
        let scoreLogEntries = Array.from(summaryScoreLog.querySelectorAll('li'));
        let timeoutLogEntries = Array.from(summaryTimeoutLog.querySelectorAll('li'));
        let defenceLogEntries = Array.from(summaryDefenceLog.querySelectorAll('li'));

        // --- 1. Format the data into a text string ---
        let summaryText = `WHISTLE GAME SUMMARY\n`;
        summaryText += `====================================================\n\n`;
        summaryText += `Game ID: ${gameId || 'N/A'}\n`;
        summaryText += `Date: ${gameDate || formattedDate}\n`;
        summaryText += `Location: ${location || 'N/A'}\n\n`;
        summaryText += `FINAL SCORE\n`;
        summaryText += `----------------------------------------------------\n`;
        summaryText += `${team1Name || 'Home Team'}: ${team1Score || 0}\n`;
        summaryText += `${team2Name || 'Away Team'}: ${team2Score || 0}\n\n`;
    
        // --- 1.5. DEFENSIVE STATS TOTALS ---
        if (gameState.defenceStats) {
            
            const teams = ['team1', 'team2'];

            teams.forEach(teamKey => {
                const teamName = teamKey === 'team1' ? gameState.team1Name : gameState.team2Name;
                const stats = gameState.defenceStats[teamKey];
                
                if (stats && Object.values(stats).some(value => value > 0)) {
                    summaryText += `${teamName}:\n`;
                    // Build a single line of stats
                    const statLine = [];
                    if (stats.tackles > 0) statLine.push(`Tackles: ${stats.tackles}`);
                    if (stats.tfl > 0) statLine.push(`TFLs: ${stats.tfl}`);
                    if (stats.sacks > 0) statLine.push(`Sacks: ${stats.sacks}`);
                    if (stats.interceptions > 0) statLine.push(`INTs: ${stats.interceptions}`);

                    summaryText += `  ${statLine.join(' | ')}\n`;
                }
            });
        }

        // --- 2. Score Log ---
        // Use the length of the extracted DOM elements for the count.
        summaryText += `SCORING LOG (${scoreLogEntries.length} events)\n`;
        summaryText += `----------------------------------------------------\n`;
        if (scoreLogEntries.length > 0) {
            scoreLogEntries.forEach(li => {
                // Extract the clean text content, which is already formatted: [Time] Team X scored...
                summaryText += `${li.textContent.trim()}\n`;
            });
        } else {
            summaryText += `No scoring plays recorded.\n`;
        }

        // --- 3. Timeout Log ---
        // Use the length of the extracted DOM elements for the count.
        summaryText += `\nTIMEOUT LOG (${timeoutLogEntries.length} events)\n`;
        summaryText += `----------------------------------------------------\n`;
        if (timeoutLogEntries.length > 0) {
            timeoutLogEntries.forEach(li => {
                // Extract the clean text content, which is already formatted: [Time] Team X called a timeout.
                summaryText += `${li.textContent.trim()}\n`;
            });
        } else {
            summaryText += `No timeouts used.\n`;
        }

        // --- 4. Defensive Log ---
        summaryText += `\nDEFENSIVE LOG (${defenceLogEntries.length} events)\n`;
        summaryText += `----------------------------------------------------\n`;
        if (defenceLogEntries.length > 0) {
            defenceLogEntries.forEach(li => {
                // The single-line HTML structure ensures this simple trim works perfectly.
                summaryText += `${li.textContent.trim()}\n`;
            });
        } else {
            summaryText += `No defensive plays recorded.\n`;
        }

        // --- 5. Create and trigger download ---
        const team1Short = team1Name ? team1Name.replace(/\s/g, '_') : 'Home';
        const team2Short = team2Name ? team2Name.replace(/\s/g, '_') : 'Away';
        const filename = `${formattedDate}_${team1Short}_vs_${team2Short}_Summary.txt`;
    
        const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
    
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
    
        document.body.removeChild(a);
        URL.revokeObjectURL(url); 
    };

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
            
    // Explicitly blur the input element to remove focus
            if (penaltySearchInput) {
                penaltySearchInput.blur();
            }
        
        // Optionally, focus on the modal container itself if it has a tabindex
        // penaltyLookupModal.focus(); 

        });

    // Listener for the Info Modal
        infoBtn.addEventListener('click', () => {
            infoModal.style.display = 'block';
            penaltyLookupModal.style.display = 'none'; 
            shareModal.style.display = 'none'; // ADDED: Hide Share Modal
        });

    // --- NEW SHARE MODAL LISTENERS ---
        shareLinksBtn.addEventListener('click', () => {
            updateShareLinks(); // <-- NEW: Call to populate links with secure URLs
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
        return `${window.location.origin}/game/${gameId}?role=${SECURE_ROLE_MAP[role] || role}`;
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

// ...

    // Event listener for the new Download Summary button
    if (downloadSummaryBtn) {
        downloadSummaryBtn.addEventListener('click', downloadGameSummary);
    }

});