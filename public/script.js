const appVersion = '0.4.23';
console.log(`Referee App - Version: ${appVersion}`);

/**
 * Clamps a numeric input's value between a minimum and maximum limit in real-time.
 * @param {HTMLInputElement} inputElement The input element to validate.
 * @param {number} min The minimum allowed value.
 * @param {number} max The maximum allowed value.
 */

// --- CRITICAL FIX: Explicitly assign to window for global access ---
window.TEAM_DATA_MAP = new Map(); 

// --- CRITICAL: Global Game State Initialization ---
window.gameState = {
    // ESSENTIALS for Logo Lookup and Display Logic
    team1Name: 'Team 1',
    team2Name: 'Team 2',
    scores: { team1: 0, team2: 0 },
    gameStarted: false, 
    timeoutsUsed: { '1': 0, '2': 0 },
    currentDown: 1,
    currentHalf: 1,
    timeoutLogHTML: '',
    defenceLogHTML: '',
};
    
/**
 * Loads team data and populates the global TEAM_DATA_MAP.
*/
const initializeTeamData = () => {
        // 1. Check for the loader function first
        if (typeof window.loadTeamData === 'function') {
            window.loadTeamData()
                .then(loadedList => {
                    // IMPORTANT: Use the result of the promise (loadedList) 
                    // instead of relying on the global window.TEAM_LIST
                    if (Array.isArray(loadedList) && loadedList.length > 0) {
                        TEAM_DATA_MAP.clear(); // Clear old data if any
                        loadedList.forEach(team => {
                            // Key: 'Team Name', Value: The entire team object
                            // Ensure 'Team Name' column header is correct in the sheet!
                            TEAM_DATA_MAP.set(team['Team Name'], team); 
                        });
                        console.log(`✅ Autocomplete initialized with ${TEAM_DATA_MAP.size} teams.`);
                        renderSummaryLogos();
                    } else {
                         console.error("Initialization error: Loaded team list is empty or invalid.");
                    }
                })
                .catch(error => {
                    console.error("❌ Initialization error: Could not load team data.", error);
                });
        } else {
            console.error("❌ Initialization error: teams.js or loadTeamData function not found. Check index.html script order.");
        }
    };

    // --- AUTOCORRECT / AUTOSUGGESTION LOGIC ---

    /**
     * Filters the team list and displays suggestions in the <ul> element, including the logo.
     * @param {HTMLInputElement} inputElement The text input field.
     * @param {HTMLUListElement} optionsList The suggestion list element.
    */
    const updateTeamSuggestions = (inputElement, optionsList) => {
        const filterText = inputElement.value.toLowerCase().trim();
        optionsList.innerHTML = '';
    
        if (filterText.length === 0) {
            optionsList.classList.add('hidden');
            return;
        }

        // Convert Map keys (Team Names) to an array and filter them
        const filteredNames = Array.from(TEAM_DATA_MAP.keys()).filter(name => 
            name.toLowerCase().includes(filterText)
        ).slice(0, 20); // Limit to 20 suggestions

        if (filteredNames.length > 0) {
            filteredNames.forEach(teamName => {
                const teamData = TEAM_DATA_MAP.get(teamName);
            
                if (teamData) {
                    const li = document.createElement('li');
                
                    // 1. Add the Logo Image
                    const img = document.createElement('img');
                    const teamLogoData = window.TEAM_DATA_MAP.get(teamName);
                    img.src = teamLogoData?.['Final Logo Path'] || window.DEFAULT_LOGO_PATH;
                    img.onerror = function() { this.onerror = null; this.src = window.DEFAULT_LOGO_PATH; };
                    img.alt = `${teamName} Logo`;
                    img.classList.add('team-logo-suggestion');
                    li.appendChild(img);

                    // 2. Add the Team Name Text
                    const span = document.createElement('span');
                    span.textContent = teamName;
                    li.appendChild(span);
                
                    // Set the click handler to select the team
                    li.addEventListener('click', () => {
                        inputElement.value = teamName;
                        optionsList.classList.add('hidden');
                    });
                
                    optionsList.appendChild(li);
                }
            });
            optionsList.classList.remove('hidden');
        } else {
            optionsList.classList.add('hidden');
        }
};

/**
 * Renders a team logo into a container element, with fallback.
 * @param {HTMLElement} element The container element to inject the logo into.
 * @param {string} teamName The team name to look up.
 */
const renderTeamLogo = window.renderTeamLogo = (element, teamName) => {
    if (!element) return;
    const teamNameClean = teamName.trim();
    const teamData = window.TEAM_DATA_MAP.get(teamNameClean);
    const logoPath = teamData?.['Final Logo Path'] || window.DEFAULT_LOGO_PATH;
    const fallbackPath = window.DEFAULT_LOGO_PATH;
    element.innerHTML = `<img src="${logoPath}" 
                             alt="${teamNameClean} Logo" 
                             class="summary-logo"
                             onerror="this.onerror=null; this.src='${fallbackPath}';">`;
};

const renderSummaryLogos = () => {
    if (typeof window.gameState === 'undefined' || !window.gameState.team1Name) return;
    renderTeamLogo(document.getElementById('summary-team1-logo'), window.gameState.team1Name);
    renderTeamLogo(document.getElementById('summary-team2-logo'), window.gameState.team2Name);
};

/**
 * Triggers short haptic (vibration) feedback if the browser supports the Vibration API.
 * @param {number} duration The duration of the vibration in milliseconds (default is 50ms).
 */
const triggerHapticFeedback = (duration = 50) => {
    // Check if the browser environment supports the Vibration API
    if ('vibrate' in navigator) {
        // Vibrate for the specified duration (50ms is a quick tap)
        navigator.vibrate(duration);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const versionDisplay = document.querySelector('.version');
    if (versionDisplay) {
        versionDisplay.textContent = `v${appVersion}`;
    }

    const gameLobby = document.getElementById('game-lobby');
    const gameInterface = document.getElementById('game-interface');
    const gameSummary = document.getElementById('game-summary');
    const gameApp = document.getElementById('game-app'); // ADD this one for completeness

    // --- 1. ELEMENT SELECTION (MUST be here) ---
    const team1NameInput = document.getElementById('team1-name');
    const team2NameInput = document.getElementById('team2-name');
    const team1OptionsList = document.getElementById('team1-options');
    const team2OptionsList = document.getElementById('team2-options');

    // --- 2. LISTENER ATTACHMENT AND KICKOFF (MUST follow immediately) ---
    // 1. Use 'input' event for real-time filtering as the user types
    if (team1NameInput && team1OptionsList) {
        team1NameInput.addEventListener('input', () => {
            updateTeamSuggestions(team1NameInput, team1OptionsList);
        });
    }

    if (team2NameInput && team2OptionsList) {
        team2NameInput.addEventListener('input', () => {
            updateTeamSuggestions(team2NameInput, team2OptionsList);
        });
    }

    // 2. Hide suggestions when focus leaves the input
    document.addEventListener('click', (event) => {
        if (team1OptionsList && !team1NameInput.contains(event.target) && !team1OptionsList.contains(event.target)) {
            team1OptionsList.classList.add('hidden');
        }
        if (team2OptionsList && !team2NameInput.contains(event.target) && !team2OptionsList.contains(event.target)) {
            team2OptionsList.classList.add('hidden');
        }
    });

    // 3. DATA KICKOFF (This must be the final line related to data)
    initializeTeamData(); 

        // Team submission modal
    const submitTeamBtn = document.getElementById('submit-team-btn');
    const submitTeamModal = document.getElementById('submit-team-modal');
    const submitTeamCancel = document.getElementById('submit-team-cancel');
    const submitTeamConfirm = document.getElementById('submit-team-confirm');
    const submitTeamError = document.getElementById('submit-team-error');
    const submitTeamSuccess = document.getElementById('submit-team-success');

    if (submitTeamBtn && submitTeamModal) {
      submitTeamBtn.addEventListener('click', () => {
        submitTeamModal.classList.remove('hidden');
        submitTeamError.style.display = 'none';
        submitTeamSuccess.style.display = 'none';
        document.getElementById('submit-team-name').value = '';
        document.getElementById('submit-team-league').value = '';
        document.getElementById('submit-team-logo').value = '';
      });
    }

    if (submitTeamCancel) {
      submitTeamCancel.addEventListener('click', () => {
        submitTeamModal.classList.add('hidden');
      });
    }

    if (submitTeamConfirm) {
      submitTeamConfirm.addEventListener('click', async () => {
        const teamName = document.getElementById('submit-team-name').value.trim();
        if (!teamName) {
          submitTeamError.textContent = 'Please enter a team name.';
          submitTeamError.style.display = 'block';
          return;
        }
        submitTeamConfirm.disabled = true;
        submitTeamConfirm.textContent = 'Submitting...';
        submitTeamError.style.display = 'none';
        try {
          const res = await fetch('/submit-team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teamName,
              league: document.getElementById('submit-team-league').value.trim(),
              logoUrl: document.getElementById('submit-team-logo').value.trim(),
            }),
          });
          if (!res.ok) throw new Error('Failed');
          submitTeamSuccess.style.display = 'block';
          setTimeout(() => submitTeamModal.classList.add('hidden'), 2500);
        } catch {
          submitTeamError.textContent = 'Something went wrong. Please try again.';
          submitTeamError.style.display = 'block';
        } finally {
          submitTeamConfirm.disabled = false;
          submitTeamConfirm.textContent = 'Submit Team';
        }
      });
    }

        // Feedback modal
    const feedbackBtn = document.getElementById('feedback-btn');
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackCancel = document.getElementById('feedback-cancel');
    const feedbackConfirm = document.getElementById('feedback-confirm');
    const feedbackError = document.getElementById('feedback-error');
    const feedbackSuccess = document.getElementById('feedback-success');

    if (feedbackBtn && feedbackModal) {
      feedbackBtn.addEventListener('click', () => {
        feedbackModal.classList.remove('hidden');
        feedbackError.style.display = 'none';
        feedbackSuccess.style.display = 'none';
        document.getElementById('feedback-message').value = '';
        document.getElementById('feedback-email').value = '';
      });
    }

    if (feedbackCancel) {
      feedbackCancel.addEventListener('click', () => {
        feedbackModal.classList.add('hidden');
      });
    }

    if (feedbackConfirm) {
      feedbackConfirm.addEventListener('click', async () => {
        const message = document.getElementById('feedback-message').value.trim();
        if (!message) {
          feedbackError.textContent = 'Please enter a message.';
          feedbackError.style.display = 'block';
          return;
        }
        feedbackConfirm.disabled = true;
        feedbackConfirm.textContent = 'Sending...';
        feedbackError.style.display = 'none';
        try {
          const res = await fetch('/submit-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              feedbackType: document.getElementById('feedback-type').value,
              message,
              email: document.getElementById('feedback-email').value.trim(),
            }),
          });
          if (!res.ok) throw new Error('Failed');
          feedbackSuccess.style.display = 'block';
          setTimeout(() => feedbackModal.classList.add('hidden'), 2500);
        } catch {
          feedbackError.textContent = 'Something went wrong. Please try again.';
          feedbackError.style.display = 'block';
        } finally {
          feedbackConfirm.disabled = false;
          feedbackConfirm.textContent = 'Send Feedback';
        }
      });
    }

    // --- END NEW TEAM LIST INTEGRATION LOGIC ---

    // ... (The rest of your existing DOMContentLoaded code continues here, e.g., security, WebSocket, etc.)

    // --- SECURITY ADDITIONS: Secure Map and Helper Functions ---
    // This map stores the secure, unguessable tokens for each role.
    const SECURE_ROLE_MAP = window.SECURE_ROLE_MAP = {
        // Original Role Name : Secure Token (must be unique)
        'clock': '4jk98d',
        'head-referee': 'a2c6g1',
        'scorer': 'h7y3l9',
        'coach': '5hd74h',
        'stats': null,
        // 'administrator' is not usually shared, but included for completeness if needed.
        'administrator': 'b3f5z2' 
    };

    // Finds the original role name (e.g., 'coach') by searching for its secure token (e.g., '5hd74h').
    // Falls back to the token itself if the token is not found (e.g., 'view-only').
    const getRoleFromToken = window.getRoleFromToken = (token) => {
        return Object.keys(SECURE_ROLE_MAP).find(key => SECURE_ROLE_MAP[key] === token);
    };

    // Automatically set the date field to the current date
    const today = new Date();
    const formattedDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    document.getElementById('date-field').value = formattedDate;

    // Global variable to store the Lottie animation object
    let coinAnimation = window.coinAnimation = null;

    // --- DOM ELEMENT REFERENCES ---// --- Core Lottie Initialization ---
    // This function runs once to set up the Lottie player inside the container
    const initCoinAnimation = () => {
        // ADD CRITICAL SAFETY CHECK
        if (typeof lottie === 'undefined') {
            console.warn("Lottie library is not yet loaded. Cannot initialize animation.");
            return; 
        }

        // Prevent re-initialization
        if (coinAnimation) return; 

        const coinAnimationArea = document.getElementById('coin-animation-area');

        coinAnimation = window.coinAnimation = lottie.loadAnimation({
            container: coinAnimationArea, // The DOM element to render the animation in
            renderer: 'svg', // Use 'svg' for best quality/scalability
            loop: true, // The animation should loop during the 'flip'
            autoplay: false, // Do NOT start playing immediately
            path: '/assets/coin-toss.json' // <--- **CRITICAL: CHANGE THIS TO YOUR JSON FILE PATH**
        });
    };
    
    const startCoinFlip = () => {
        // 1. Ensure animation is initialized
        if (!coinAnimation) {
            initCoinAnimation();
        }
    
        // 2. Reset state for the flip
        coinTossResultArea.classList.add('hidden');
        tossStartGameBtn.classList.add('hidden');
        tossRerunBtn.classList.add('hidden');
        coinAnimationArea.classList.remove('hidden'); // Show the container

        // 3. Start the Lottie animation
        coinAnimation.play(); 

        // 4. Generate the random result
        const result = Math.random() < 0.5 ? "Heads" : "Tails";

        // 5. Set a timer to wait for the "flip" animation to complete
        setTimeout(() => {
            // 6. Stop the Lottie animation and hide the container
            coinAnimation.stop(); 
            coinAnimationArea.classList.add('hidden'); 
        
            // 7. Display the result
            tossResultMessage.textContent = result;
            coinTossResultArea.classList.remove('hidden');
            tossStartGameBtn.classList.remove('hidden');
            tossRerunBtn.classList.remove('hidden');

            sendAction('UPDATE_STATE', { coinTossResult: result }); 

        }, COIN_FLIP_DURATION);
    };

    // Global variable for the lobby animation object
    let lobbyCoinAnimation = window.lobbyCoinAnimation = null;

    const initLobbyCoinAnimation = () => {
        // Safety check for the Lottie library, just like we did before
        if (typeof lottie === 'undefined' || lobbyCoinAnimation) return;

        if (lobbyCoinAnimationContainer) {
            lobbyCoinAnimation = window.lobbyCoinAnimation = lottie.loadAnimation({
                container: lobbyCoinAnimationContainer,
                renderer: 'svg',
                loop: true, // It should loop continuously
                autoplay: true, // It should start playing immediately
                path: '/assets/coin-toss-flat.json' // <--- **CRITICAL: SET YOUR LOBBY JSON FILE PATH HERE**
            });
        }
    };

    // --- Utility to close the modal and start the game ---
    const handleStartGameFromToss = () => {
        // 1. Hide the Coin Toss Modal
        coinTossModal.classList.add('hidden');
        
        // 2. Call the function that creates the state and swaps the screen
        initiateGameFromLobby();    
    };

    const urlParams = new URLSearchParams(window.location.search);

    // Element references
    const settingsForm = document.getElementById('settings-form');
    const startNewGameBtn = document.getElementById('start-new-game-btn');
    const startStatsViewBtn = document.getElementById('startStatsViewBtn');
    const joinGameBtn = document.getElementById('join-game-btn');
    const gameIdInput = document.getElementById('game-id-input');
    const joinErrorMessage = document.getElementById('join-error-message');
    const roleInputs = document.querySelectorAll('input[name="user-role"]');
    const startGameBtn = document.getElementById('start-game-btn');
    const dateField = document.getElementById('date-field');
    const locationField = document.getElementById('location-field');
    const settingsGrid = document.querySelectorAll('.settings-grid');
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
    const clockContainer = document.querySelectorAll('.clock-container');
    const gameClockDisplay = document.getElementById('game-clock-display');
    const playClockDisplay = document.getElementById('play-clock-display');
    const gamePeriodDisplay = document.getElementById('game-period-display');
    const scoreLogList = document.getElementById('score-log');
    const timeoutLogList = document.getElementById('timeout-log');
    const defenceLogList = document.getElementById('defence-log');
    const downButtonsSection = document.querySelectorAll('.down-buttons-section');
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
    const timeoutButtonsSection = document.querySelectorAll('.timeout-buttons-section');    
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
    const coinTossSection = document.querySelectorAll('.coin-toss-section');
    const coinTossModal = document.getElementById('coin-toss-modal');
    const coinAnimationArea = document.getElementById('coin-animation-area');
    const coinTossAnimation = document.getElementById('coin-toss-animation');
    const coinTossResultArea = document.getElementById('coin-toss-result-area');
    const tossResultMessage = document.getElementById('toss-result-message');
    const tossStartGameBtn = document.getElementById('toss-start-game-btn');
    const tossRerunBtn = document.getElementById('toss-rerun-btn');
    const closeCoinTossModalBtn = document.getElementById('close-coin-toss-modal-btn');
    const lobbyCoinAnimationContainer = document.getElementById('lobby-coin-animation');

    initCoinAnimation(); 
    initLobbyCoinAnimation();

    // const coinTossResultDisplay = document.getElementById('coin-toss-result');
    const summaryTeam1Logo = document.getElementById('summary-team1-logo');
    const summaryTeam2Logo = document.getElementById('summary-team2-logo');
    const summaryTeam1Name = document.getElementById('summary-team1-name');
    const summaryTeam2Name = document.getElementById('summary-team2-name');
    const summaryTeam1Score = document.getElementById('summary-team1-score');
    const summaryTeam2Score = document.getElementById('summary-team2-score');
    const summaryScoreLog = document.getElementById('summary-score-log');
    const timeoutLogContainer = document.querySelectorAll('.timeout-log-container');
    const summaryTimeoutLog = document.getElementById('summary-timeout-log');
    const summaryDefenceLog = document.getElementById('summary-defence-log');
    const startNewGameFromSummaryBtn = document.getElementById('start-new-game-from-summary-btn');
    const downloadSummaryBtn = document.getElementById('download-summary-btn'); 
    const gameIdDisplay = document.getElementById('current-game-id');
    const shareLinkBtns = document.querySelectorAll('.share-link-btn');
    const shareFeedback = document.getElementById('share-feedback');
    const shareLinksSection = document.querySelector('.share-links-section');
    const teamNamesDatalist = document.getElementById('team-names-datalist'); 
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
    const qrCodeContainer = document.getElementById('qr-code-container');
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
    const defencePBUInput = document.getElementById('defence-pbu');
    const logDefenceStatBtn = document.getElementById('log-defence-stat-btn');
    const defenceCancelPopupBtn = document.getElementById('defence-cancel-popup-btn');
    // const defenceLog = document.querySelector('#defence-log');

    // getPeriodName → moved to game-logic.js

    let allTeamNames = []; // Global array to store all loaded team names

    window.actionTimeLeft = null; // Stores the clock time (in seconds) when a score or defence action is initiated.
    
    /**
    * Reverses the order of list items (li) in a given <ul> or <ol> element.
    */
    const reverseLogOrder = window.reverseLogOrder = (ulElement) => {
        // Create an array from the live collection of children (li elements)
        const listItems = Array.from(ulElement.children);
    
        // Detach and re-append items in reverse order
        for (let i = listItems.length - 1; i >= 0; i--) {
            ulElement.appendChild(listItems[i]);
        }
    };

    // --- MODIFIED startCoinFlip() Function ---
    const COIN_FLIP_DURATION = 2000; 

// Limit input numbers

/* if (halfDurationInput) {
    halfDurationInput.addEventListener('input', () => {
        // Half Duration: Min 1, Max 60
        clampInput(halfDurationInput, 1, 60); 
    });
}

if (playClockDurationInput) {
    playClockDurationInput.addEventListener('input', () => {
        // Play Clock Duration: Min 0, Max 60
        clampInput(playClockDurationInput, 0, 60); 
    });
}

if (timeoutsPerHalfInput) {
    timeoutsPerHalfInput.addEventListener('input', () => {
        // Timeouts per Half: Min 0, Max 9
        clampInput(timeoutsPerHalfInput, 0, 9); 
    });
} */

    // Collect all control elements into a single array for easy management
    const allControls = window.allControls = [
        ...settingsGrid,
        halfDurationInput,
        playClockDurationInput,
        timeoutsPerHalfInput,
        timeoutLogList,
        summaryTimeoutLog,
        ...clockContainer,
        gameClockToggleBtn,
        gameClockResetBtn,
        playClockOptions,
        playClockToggleBtn,
        playClockResetBtn,
        autoAdvanceCheckbox,
        ...downButtonsSection,
        ...downButtons,
        ...scoreButtons,
        ...defenceButtons,
        ...adjustButtons,
        ...timeoutButtonsSection,
        ...useTimeoutBtns,
        ...timeoutLogContainer,
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
    const rolePermissions = window.rolePermissions = {
        'administrator': [...settingsGrid, halfDurationInput, playClockDurationInput, timeoutsPerHalfInput, timeoutLogList, summaryTimeoutLog, ...clockContainer, gameClockToggleBtn, gameClockResetBtn, playClockOptions, playClockToggleBtn, playClockResetBtn, autoAdvanceCheckbox, ...downButtonsSection, ...downButtons, ...scoreButtons, ...defenceButtons, ...adjustButtons, ...timeoutButtonsSection, ...useTimeoutBtns, ...timeoutLogContainer, undoBtn, endGameBtn, shareLinksSection, startNewGameFromSummaryBtn, infoBtn, penaltyLookupBtn, shareLinksBtn, fixedFooter, infoModalAdmin],
        'head-referee': [timeoutLogList, summaryTimeoutLog, ...clockContainer, gameClockToggleBtn, gameClockResetBtn, playClockToggleBtn, playClockResetBtn, playClockOptions, autoAdvanceCheckbox, ...downButtonsSection, ...downButtons, ...timeoutButtonsSection, ...useTimeoutBtns, fixedFooter, endGameBtn, ...timeoutLogContainer, undoBtn, infoBtn, penaltyLookupBtn, shareLinksBtn, infoModalRef],
        'scorer': [...clockContainer, ...scoreButtons, ...defenceButtons, ...adjustButtons, ...downButtonsSection, ...timeoutButtonsSection, fixedFooter, ...timeoutLogContainer, undoBtn, infoBtn, infoModalScorer],
        'clock': [...clockContainer, gameClockToggleBtn, gameClockResetBtn, playClockToggleBtn, playClockResetBtn, playClockOptions, autoAdvanceCheckbox, ...downButtonsSection, ...downButtons, ...timeoutButtonsSection, ...timeoutLogContainer, fixedFooter, infoBtn, infoModalClock],
        'coach': [...clockContainer, ...downButtonsSection, ...timeoutButtonsSection, ...timeoutLogContainer, fixedFooter, infoBtn, infoModalCoach],
        'stats': [...scoreButtons, ...defenceButtons, ...adjustButtons, fixedFooter, penaltyLookupBtn, endGameBtn, startNewGameFromSummaryBtn]
    };

    window.userRole = 'administrator';
    roleInputs.forEach(input => {
        input.addEventListener('change', (event) => {
            window.userRole = event.target.value;
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('role', window.userRole);
            // history.replaceState(null, '', `?${urlParams.toString()}`);
            window.applyRolePermissions();
        });
    });

    window.tempScoreEvent = null;
    window.twoMinuteWarningIssuedLocally = false;
    window.actionHistory = [];

    // --- State Management and UI Updates ---
    // updateUI and applyRolePermissions are defined in ui.js

    // New/Updated function to format date for display (e.g., "27 September 2025")
    const formatDisplayDate = window.formatDisplayDate = (dateString) => {
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
    // applyRolePermissions is defined in ui.js

    // updateButtonLabels → moved to game-logic.js

    // formatTime → moved to game-logic.js

    // --- NEW: QR CODE GENERATION FUNCTION ---
    const generateQRCode = (url) => {
        if (!qrCodeContainer) return;

        // 1. Clear previous content (CRITICAL: prevents multiple codes stacking up)
        qrCodeContainer.innerHTML = '';
        
        // 2. Generate the QR Code
        new QRCode(qrCodeContainer, {
            text: url,
            width: 200,
            height: 200,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        // 3. Show game code beneath QR
        const gameCodeText = document.getElementById('qr-game-code-text');
        if (gameCodeText) {
            const pathParts = url.split('/game/');
            const gameId = pathParts[1] ? pathParts[1].split('?')[0] : '';
            gameCodeText.textContent = gameId;
            document.getElementById('qr-game-code').style.display = 'block';
        }
    };

    // getNewScoreLog → moved to game-logic.js

    // getNewTimeoutLog → moved to game-logic.js

    // getNewEndOfHalfLog → moved to game-logic.js

    // updateDownDisplay → moved to game-logic.js

    const showScorePopup = (team, scoreToAdd, scoreLabel) => {
        window.tempScoreEvent = { team, scoreToAdd, scoreLabel };
        const teamName = team === '1' ? gameState.team1Name : gameState.team2Name;
        popupHeader.textContent = `Log ${scoreLabel} for ${teamName}`;
        scorePopup.classList.remove('hidden');
    };

    const hideScorePopup = window.hideScorePopup = () => {
        scorePopup.classList.add('hidden');
        qbNumberInput.value = '';
        wrNumberInput.value = '';
        rbNumberInput.value = '';
        intNumberInput.value = '';
        safetyNumberInput.value = '';
        const fgNumberInput = document.getElementById('fg-number');
        if (fgNumberInput) fgNumberInput.value = '';
        window.tempScoreEvent = null;
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
        defencePBUInput.value = '';

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

        // 🚀 NEW: Save the current state for undo functionality (must be first)
        // We use JSON.parse(JSON.stringify()) to create a deep copy of the object,
        // ensuring the history record isn't changed by subsequent actions.
        window.actionHistory.push({
            type: 'defence',
            defenceStats: JSON.parse(JSON.stringify(gameState.defenceStats || {team1: {}, team2: {}})), 
            defenceLogHTML: defenceLogList.innerHTML 
        });

        const team = tempDefenceEvent.team;
        const teamName = team === '1' ? gameState.team1Name : gameState.team2Name;
        const teamKey = `team${team}`;

        // Get and clean values from inputs (coercing non-numeric/empty values to 0)
        const tackles = parseInt(defenceTackleInput.value) || 0;
        const tfl = parseInt(defenceTFLInput.value) || 0;
        const sacks = parseInt(defenceSackInput.value) || 0;
        const interceptions = parseInt(defenceIntInput.value) || 0;
        const passbreakups = parseInt(defencePBUInput.value) || 0;

        // Check if any stats were actually entered
        if (tackles === 0 && tfl === 0 && sacks === 0 && interceptions === 0 && passbreakups === 0) {
            // If nothing was logged, just close the popup
            hideDefencePopup();
            return;
        }

        // --- 1. UPDATE GAME STATE (for persistence and tracking) ---
        // Initialize stats structure if it doesn't exist 
        if (!gameState.defenceStats) gameState.defenceStats = { team1: {}, team2: {} };
        if (!gameState.defenceStats[teamKey]) gameState.defenceStats[teamKey] = { tackles: 0, tfl: 0, sacks: 0, interceptions: 0, passbreakups: 0 };

        gameState.defenceStats[teamKey].tackles += tackles;
        gameState.defenceStats[teamKey].tfl += tfl;
        gameState.defenceStats[teamKey].sacks += sacks;
        gameState.defenceStats[teamKey].interceptions += interceptions;
        gameState.defenceStats[teamKey].passbreakups += passbreakups;

        // --- 2. CREATE LOG ENTRY (using defenceLog & summaryDefenceLog) ---
        // --- NEW: Use the stored time, then clear the variable ---
        const eventTime = actionTimeLeft !== null ? actionTimeLeft : gameState.gameTimeLeft;
        const elapsedTime = gameState.halfDuration - eventTime;
        actionTimeLeft = null; // Clear the stored time after use

        // 🚀 NEW: Determine the current half and create the full timestamp
        const halfText = getPeriodName(gameState.currentHalf); 
        const fullTimestamp = `${halfText} [${formatTime(elapsedTime)}]`;

        let logMessage = `${teamName}`;
        const stats = [];
        // Added logic for pluralization
        if (tackles > 0) stats.push(`#${tackles} TACKLE`); 
        if (tfl > 0) stats.push(`#${tfl} TFL`);
        if (sacks > 0) stats.push(`#${sacks} SACK`);
        if (interceptions > 0) stats.push(`#${interceptions} INT`);
        if (passbreakups > 0) stats.push(`#${passbreakups} PBU`);

        // Construct the full log message
        logMessage += `: ${stats.join(', ')}`; // Used colon for cleaner look

        const logEntryHTML = `<li class="log-entry log-defence log-team-${team}"><span class="log-time-stamp">${fullTimestamp} </span>${logMessage}</li>`;

        // CRITICAL FIX: Save the new log entry to the game state string
        gameState.defenceLogHTML = logEntryHTML + gameState.defenceLogHTML;

        // --- 3. CLEAN UP & SYNC ---
        // Hide the popup and clear inputs
        hideDefencePopup();

        // FINAL CRITICAL FIX: Use the actual function to save/sync the game state
        // This sends the full updated gameState object to the server/sync mechanism
        sendAction('UPDATE_STATE', gameState);

        // CRITICAL FIX: Send the updated state to the server/other clients
        window.updateUI();
    };

    // --- Event Listeners ---
    const pathParts = window.location.pathname.split('/');
    const gameIdFromUrl = window.gameIdFromUrl = pathParts.length > 2 && pathParts[1] === 'game' ? pathParts[2].split('?')[0] : null;

    if (gameIdFromUrl) {
        window.updateUI();
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
            }, 150);
        }

    } else {
        gameLobby.classList.remove('hidden');
        settingsForm.classList.add('hidden');
        gameInterface.classList.add('hidden');
    }

    startNewGameBtn.addEventListener('click', () => {

        const newGameId = Math.random().toString(36).substring(2, 8);
        history.replaceState(null, '', `/game/${newGameId}?role=${SECURE_ROLE_MAP[window.userRole] || window.userRole}`);

        gameLobby.classList.add('hidden');
        settingsForm.classList.remove('hidden');

        document.getElementById('game-id-text').textContent = newGameId;
        gameIdDisplay.classList.remove('hidden');

        connectWebSocket(newGameId);
    });

    if (startStatsViewBtn) startStatsViewBtn.addEventListener('click', () => {
        const newGameId = Math.random().toString(36).substring(2, 8);
    
        // CRITICAL: Sets the URL with the non-secure 'stats' role
        history.replaceState(null, '', `/game/${newGameId}?role=stats`);

        // UI Transition
        gameLobby.classList.add('hidden');
        settingsForm.classList.remove('hidden');

        document.getElementById('game-id-text').textContent = newGameId;
        gameIdDisplay.classList.remove('hidden');

        // Connects to WebSocket for data sharing
        connectWebSocket(newGameId);
    
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            startGameBtn.textContent = 'Track Game Stats'; // Change text only on Stats View entry
        }

        // 1. Set global variables
        window.userRole = 'stats'; 
    
        // 2. Apply the class to the body
        document.body.className = document.body.className.replace(/\brole-[a-z-]+\b/g, ''); // Clear existing roles
        document.body.classList.add(`role-stats`); 

        // 3. Manually trigger the full UI update and permission check
        window.updateUI();
    });

    joinGameBtn.addEventListener('click', () => {

        const gameId = gameIdInput.value.trim();
        if (gameId) {
            history.replaceState(null, '', `/game/${gameId}?role=${SECURE_ROLE_MAP[window.userRole] || window.userRole}`);

            joinErrorMessage.classList.add('hidden');
            gameLobby.classList.add('hidden');
            settingsForm.classList.remove('hidden');
            connectWebSocket(gameId);
        } else {
            joinErrorMessage.classList.remove('hidden');
        }
    });

    // --- NEW REUSABLE FUNCTION ---
    const initiateGameFromLobby = () => {
        // 1. SET DEFAULTS: If the input is empty, default to 'Team 1' / 'Team 2'
        const t1Name = team1NameInput.value.trim() || 'Team 1';
        const t2Name = team2NameInput.value.trim() || 'Team 2';

        // 2. RETAIN OTHER VALIDATION AND RESET (keep these lines if they exist)
        // if (!dateField.value || !locationField.value) { /* ... */ }
        // if (!gameState.coinTossResult) { /* ... */ }
        window.twoMinuteWarningIssuedLocally = false;
        gameClockDisplay.parentElement.classList.remove('warning');
        window.actionHistory = [];

        // *** 3. Dynamic Time Calculation & State Creation ***
        const initialMinutes = parseInt(halfDurationInput.value, 10);
        const initialTimeString = `${String(initialMinutes).padStart(2, '0')}:00`;

        window.gameState = {
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
            currentHalf: 1,
            timeoutLogHTML: '',
            defenceLogHTML: '',
            twoMinuteWarningIssued: false
        };
        
        // Use the global gameState object when sending the action
        sendAction('UPDATE_STATE', window.gameState);
    
        // 4. TRANSITION THE SCREEN (This is why it was returning to the lobby!)
        // Assuming your UI uses #game-lobby and #game-app
    
        if (gameLobby && gameApp) {
            gameLobby.classList.add('hidden'); // Hide the setup screen
            gameApp.classList.remove('hidden'); // Show the main game interface
        }
    };

    startGameBtn.addEventListener('click', (event) => {
        event.preventDefault(); 
        initiateGameFromLobby(); // Calls the reusable function
    });

    // --- EVENT LISTENERS FOR NEW COIN TOSS MODAL ---
    
    // 1. Existing Coin Toss Button: Open modal and start the flip automatically
    if (coinTossBtn) {
        coinTossBtn.addEventListener('click', () => {
            // Note: If you don't have a 'hidden' class, you may use 'style.display = "block"'
            coinTossModal.classList.remove('hidden'); 
            startCoinFlip(); 
        });
    }

    // 2. Rerun Button: Just close the modal and start the flip again
    if (tossRerunBtn) {
        tossRerunBtn.addEventListener('click', () => {
            startCoinFlip(); // Reruns the flip animation and logic
        });
    }

    // 3. Start Game Button: Close modal and transition to the main game
    if (tossStartGameBtn) {
        tossStartGameBtn.addEventListener('click', handleStartGameFromToss);
    }

    scoreButtons.forEach(button => {
        button.addEventListener('click', () => {
            const team = button.dataset.team;
            const scoreToAdd = parseInt(button.dataset.score, 10);
            const scoreLabel = button.dataset.label;
            actionTimeLeft = gameState.gameTimeLeft;
            showScorePopup(team, scoreToAdd, scoreLabel);
        });
    });

    logScoreBtn.addEventListener('click', () => {
        window.handleLogScore();
    });

    cancelPopupBtn.addEventListener('click', () => {
        hideScorePopup();
    });

    // adjustButtons.forEach(button => {
    //     button.addEventListener('click', () => {
    //         const team = button.dataset.team;
    //         const adjustment = button.dataset.adjust;
    //         const newScores = { ...gameState.scores };
    //         if (team === '1') {
    //             newScores.team1 += (adjustment === '+' ? 1 : -1);
    //         } else {
    //             newScores.team2 += (adjustment === '+' ? 1 : -1);
    //         }
    //         sendAction('UPDATE_STATE', { scores: newScores });
    //     });
    // });

    adjustButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.handleAdjustScore(button);
        });
    });

    useTimeoutBtns.forEach(button => {
        button.addEventListener('click', () => {
            window.handleUseTimeout(button);
        });
    });

    downButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.handleDownSelect(button);
        });
    });

    gameClockToggleBtn.addEventListener('click', () => {
        triggerHapticFeedback(60);
        window.handleGameClockToggle();
    });

    gameClockResetBtn.addEventListener('click', () => {
        window.handleGameClockReset();
    });

    playClockToggleBtn.addEventListener('click', () => {
        window.handlePlayClockToggle();
    });

    playClockResetBtn.addEventListener('click', () => {
        window.handlePlayClockReset();
    });

    // --- Defence Button Listeners ---
    defenceButtons.forEach((button, index) => {
        // Team '1' for the first button (Home), Team '2' for the second (Away)
        const team = (index + 1).toString(); 
    
        button.addEventListener('click', (e) => {
            e.stopImmediatePropagation();
            actionTimeLeft = gameState.gameTimeLeft;
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
        window.handleEndGame();
    });

    /**
     * Removes the time stamp from the beginning of a log entry string if the user role is 'stats'.
     * Assumes time stamp is formatted as [MM:SS] or similar bracketed time.
     */
    const stripTimeIfStatsView = (logText) => {
        if (window.userRole === 'stats') { // Check if the current user role is stats
            
            // 🚨 CRITICAL FIX: Removed the start-of-string anchor (^) for resiliency.
            // This pattern finds the first instance of anything inside brackets, 
            // plus any subsequent whitespace, and replaces it with nothing.
            const strippedText = logText.replace(/\[.*?\]\s*/, '');
            
            // Ensures any potential leading/trailing whitespace is cleaned up completely.
            return strippedText.trim(); 
        }
        return logText;
    };

    /**
     * Parses the score and defense logs to aggregate player-specific statistics.
     * Uses ultra-resilient regex patterns to handle various log formatting and extra text.
     */
    const aggregatePlayerStats = window.aggregatePlayerStats = (scoreLog, defenceLog) => {
        const aggregatedStats = {
            team1: { offence: {}, defence: {} },
            team2: { offence: {}, defence: {} }
        };

        const updateStat = (team, category, player, stat, count = 1) => {
            if (!aggregatedStats[team][category][player]) {
                aggregatedStats[team][category][player] = {};
            }
            aggregatedStats[team][category][player][stat] = (aggregatedStats[team][category][player][stat] || 0) + count;
        };

        // --- 1. PARSE SCORING LOG (Offence) ---
        scoreLog.forEach(entry => {
            // Replace ALL non-standard whitespace with a single standard space, and trim.
            const text = entry.textContent.replace(/\s+/g, ' ').trim(); 
            
            // Pattern 1: Get Score Type
            const coreActionMatch = text.match(/scored\s*(a)?\s*(Touchdown|PAT|2PT)\s*(.*)/i);
            if (!coreActionMatch) return;
            
            const scoreType = coreActionMatch[2]; 
            const playerInfo = coreActionMatch[3]; 

            // Pattern 2: Get Team Number
            const teamMatch = text.match(/Team\s*(\d+)/i);
            if (!teamMatch) return;
            const teamKey = 'team' + teamMatch[1]; 

            // Pattern 3: Get Player Roles (The most critical part)
            const passMatch = playerInfo.match(/\((QB\s*#\d+)\s*,\s*([A-Z]*\s*#\d+)\)/i);
            
            if (passMatch) {
                const [_, qbEntry, receiverEntry] = passMatch; 
                
                // Determine the base receiver role for correct terminology
                const baseReceiverRole = receiverEntry.trim().split(' ')[0]; 
                const isRB = baseReceiverRole === 'RB';
                
                let qbStatLabel;
                let receiverStatLabel;

                // 🚨 FIX: Use dynamic label determination for all score types 🚨
                if (scoreType === 'Touchdown') {
                    qbStatLabel = 'TD Passes';
                    receiverStatLabel = isRB ? 'TD Carries' : 'TD Receptions';
                } else if (scoreType === '2PT') {
                    qbStatLabel = '2PT Passes';
                    receiverStatLabel = isRB ? '2PT Carries' : '2PT Receptions';
                } else if (scoreType === 'PAT') {
                    qbStatLabel = 'PAT Passes';
                    receiverStatLabel = isRB ? 'PAT Carries' : 'PAT Receptions';
                } else {
                    return; 
                }

                // Apply the stats using the calculated labels
                updateStat(teamKey, 'offence', qbEntry, qbStatLabel);
                updateStat(teamKey, 'offence', receiverEntry, receiverStatLabel);
            } 
        });

        // --- 2. PARSE DEFENSIVE LOG (Defence) ---
        defenceLog.forEach(entry => {
            // Replace ALL non-standard whitespace with a single standard space, and trim.
            const text = entry.textContent.replace(/\s+/g, ' ').trim(); 

            // Finds Team X, then Player #Y, then Stat Type (PBU, TACKLE, etc.)
            const defMatch = text.match(/Team\s*(\d+).*?(#\d+)\s*(PBU|TACKLE|TFL|Sack|INT)/i);
            
            if (defMatch) {
                const teamNum = defMatch[1]; 
                const player = defMatch[2];  
                const stat = defMatch[3];  
                
                const teamKey = 'team' + teamNum;

                updateStat(teamKey, 'defence', player, stat);
            }
        });

        return aggregatedStats;
    };

    /**
     * Renders the aggregated player stats into the respective summary containers.
     * @param {object} stats - The aggregated stats for one team (e.g., playerStats.team1).
     * @param {string} teamKey - The key for the team ('team1' or 'team2').
     */
    const renderPlayerStats = window.renderPlayerStats = (stats, teamKey) => {
        // 1. Get the containers
        const offenceContainer = document.getElementById(`${teamKey}-offence-stats`);
        const defenceContainer = document.getElementById(`${teamKey}-defence-stats`);
        
        if (!offenceContainer || !defenceContainer) {
            console.error(`Rendering failed: Could not find stats containers for ${teamKey}.`);
            return;
        }

        // Helper to format stats into a string: "TD Passes: 3 | TD Receptions: 2"
        const formatPlayerStats = (playerStats) => {
            return Object.entries(playerStats)
                .map(([stat, count]) => `${stat}: ${count}`)
                .join(' | ');
        };

        // --- Render Offence ---
        let offenceHTML = '<h4>Offence</h4><ul class="stats-list">';
        const offencePlayers = Object.keys(stats.offence).sort();
        if (offencePlayers.length > 0) {
            offencePlayers.forEach(player => {
                offenceHTML += `<li>${player}: ${formatPlayerStats(stats.offence[player])}</li>`;
            });
        } else {
            offenceHTML += '<li>No offensive player stats recorded.</li>';
        }
        offenceHTML += '</ul>';
        offenceContainer.innerHTML = offenceHTML;

        // --- Render Defence ---
        let defenceHTML = '<h4>Defence</h4><ul class="stats-list">';
        const defencePlayers = Object.keys(stats.defence).sort();
        if (defencePlayers.length > 0) {
            defencePlayers.forEach(player => {
                defenceHTML += `<li>${player}: ${formatPlayerStats(stats.defence[player])}</li>`;
            });
        } else {
            defenceHTML += '<li>No defensive player stats recorded.</li>';
        }
        defenceHTML += '</ul>';
        defenceContainer.innerHTML = defenceHTML;
    };
    
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
        // if (gameState.defenceStats) {
            
        //    const teams = ['team1', 'team2'];
        //    let hasDefenceStats = false; // Flag to check if we should print the header

        //    let defenceSummaryText = "";

        //    teams.forEach(teamKey => {
        //        const teamName = teamKey === 'team1' ? gameState.team1Name : gameState.team2Name;
        //        const stats = gameState.defenceStats[teamKey];
                
        //        if (stats && Object.values(stats).some(value => value > 0)) {
        //            hasDefenceStats = true;
        //            defenceSummaryText += `${teamName}:\n`;
        //            // Build a single line of stats
        //            const statLine = [];
        //            if (stats.tackles > 0) statLine.push(`Tackles: ${stats.tackles}`);
        //            if (stats.tfl > 0) statLine.push(`TFLs: ${stats.tfl}`);
        //            if (stats.sacks > 0) statLine.push(`Sacks: ${stats.sacks}`);
        //            if (stats.interceptions > 0) statLine.push(`INTs: ${stats.interceptions}`);

        //            defenceSummaryText += `  ${statLine.join(' | ')}\n`;
        //        }
        //    });

        //    if (hasDefenceStats) {
        //         summaryText += `\nDEFENSIVE STATS TOTALS\n`;
        //         summaryText += `----------------------------------------------------\n`;
        //         summaryText += defenceSummaryText + `\n`;
        //    }
        // }
        // --- END DEFENSIVE STATS TOTALS ---

        // 🚨 NEW: AGGREGATED PLAYER STATS SECTION 🚨
        if (window.playerStats) {
            summaryText += `\nPLAYER STATS\n`;
            summaryText += `====================================================\n`;

            ['team1', 'team2'].forEach(teamKey => {
                const teamName = teamKey === 'team1' ? team1Name : team2Name;
                const stats = window.playerStats[teamKey];
                
                summaryText += `\n--- ${teamName} ---\n`;

                const renderDownloadStats = (category, categoryName) => {
                    // Helper to build the download text for a category (Offence/Defence)
                    summaryText += `  ${categoryName}:\n`;
                    
                    // Sort players by number/name
                    const players = Object.keys(stats[category]).sort(); 

                    if (players.length > 0) {
                        players.forEach(player => {
                            // Format the stats line: "TD Passes: 3 | TD Receptions: 2"
                            const statLine = Object.entries(stats[category][player])
                                .map(([stat, count]) => `${stat}: ${count}`)
                                .join(' | ');
                            summaryText += `  ${player}: ${statLine}\n`;
                        });
                    } else {
                        summaryText += `  No ${categoryName.toLowerCase()} player stats recorded.\n`;
                    }
                };

                // Render both Offence and Defence categories
                renderDownloadStats('offence', 'Offence');
                renderDownloadStats('defence', 'Defence');
            });
            summaryText += `\n`; // Add extra line break before next log section
        }
        // --- END AGGREGATED PLAYER STATS ---

        // --- 2. Score Log ---
        // Use the length of the extracted DOM elements for the count.
        summaryText += `\nSCORING LOG (${scoreLogEntries.length} events)\n`;
        summaryText += `----------------------------------------------------\n`;
        if (scoreLogEntries.length > 0) {
            scoreLogEntries.forEach(li => {
                // Extract the clean text content, which is already formatted: [Time] Team X scored...
                const entryText = stripTimeIfStatsView(li.textContent.trim());
                summaryText += `${entryText}\n`;
            });
        } else {
            summaryText += `No scoring plays recorded.\n`;
        }

        if (window.userRole !== 'stats') {
            // --- 3. Timeout Log ---
            // Use the length of the extracted DOM elements for the count.
            summaryText += `\nTIMEOUT LOG (${timeoutLogEntries.length} events)\n`;
            summaryText += `----------------------------------------------------\n`;
            if (timeoutLogEntries.length > 0) {
                timeoutLogEntries.forEach(li => {
                    // Extract the clean text content, which is already formatted: [Time] Team X called a timeout.
                    const entryText = stripTimeIfStatsView(li.textContent.trim());
                    summaryText += `${entryText}\n`;
                });
            } else {
                summaryText += `No timeouts used.\n`;
            }
        }

        // --- 4. Defensive Log ---
        summaryText += `\nDEFENSIVE LOG (${defenceLogEntries.length} events)\n`;
        summaryText += `----------------------------------------------------\n`;
        if (defenceLogEntries.length > 0) {
            defenceLogEntries.forEach(li => {
                // The single-line HTML structure ensures this simple trim works perfectly.
                const entryText = stripTimeIfStatsView(li.textContent.trim());
                summaryText += `${entryText}\n`;
            });
        } else {
            summaryText += `No defensive stats recorded.\n`;
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
        window.location.reload(true);
        gameLobby.classList.remove('hidden');
        gameSummary.classList.add('hidden');
    });

    undoBtn.addEventListener('click', () => {
        if (window.actionHistory.length > 0) {
            const lastAction = window.actionHistory.pop();
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
            } else if (lastAction.type === 'defence') { 
            sendAction('UPDATE_STATE', {
                defenceStats: lastAction.defenceStats,
                defenceLogHTML: lastAction.defenceLogHTML
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
            // NEW: Clear the QR code container
            if (qrCodeContainer) {
                qrCodeContainer.innerHTML = '';
            }
            // Ensure feedback is hidden too
            if (shareFeedback) {
                shareFeedback.classList.add('hidden');
            }

            updateShareLinks(); // <-- NEW: Call to populate links with secure URLs
            shareModal.style.display = 'block'; // Show Share Modal
            infoModal.style.display = 'none'; // Hide Info Modal
            penaltyLookupModal.style.display = 'none'; // Hide Penalty Modal
        });

        // Listener for closing the modals via their close buttons ('&times;')
        if (closeCoinTossModalBtn) {
            closeCoinTossModalBtn.addEventListener('click', () => {
            // 1. Close the modal
                coinTossModal.classList.add('hidden');

            // 2. Stop the Lottie animation and hide its container
                if (coinAnimation) {
                    coinAnimation.stop(); // Stops the Lottie playback
                }
        
            // Hide the container itself (we no longer hide the <img> tag)
                if (coinAnimationArea) { 
                    coinAnimationArea.classList.add('hidden');
                }
        
                // 3. Reset the rest of the UI (using robust null checks)
                if (coinTossResultArea) coinTossResultArea.classList.add('hidden');
                if (tossStartGameBtn) tossStartGameBtn.classList.add('hidden');
                if (tossRerunBtn) tossRerunBtn.classList.add('hidden');
            });
        }

        closePenaltyModalBtn.addEventListener('click', () => {
            penaltyLookupModal.style.display = 'none';
        });

        closeInfoModalBtn.addEventListener('click', () => {
            infoModal.style.display = 'none';
        });

    // ADDED: Listener for Share Modal Close Button
        closeShareModalBtn.addEventListener('click', () => {
            shareModal.style.display = 'none';

            // NEW: Clear the QR code container on close
            if (qrCodeContainer) {
                qrCodeContainer.innerHTML = '';
            }
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

            // CLEAR previous QR code and GENERATE the new one (NEW STEP)
            if (qrCodeContainer) {
                qrCodeContainer.innerHTML = ''; // Clear previous code
                generateQRCode(shareUrl); 
            }
            
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


// --- REVERTED SCROLL HANDLER: TARGETING THE SCROLLING CONTAINER ---
// 1. Get the scrolling element and the target clock element
const scrollingElement = document.querySelector('#game-interface');
const stickyTarget = document.querySelector('.game-clocks-section');

// 2. Attach the listener directly to the #game-interface element
if (scrollingElement && stickyTarget) {
    scrollingElement.addEventListener('scroll', function() {
        const scrollThreshold = 100;
        
        // 3. Measure the scroll position of the container itself
        const currentScrollPosition = scrollingElement.scrollTop; 

        if (currentScrollPosition > scrollThreshold) { 
            stickyTarget.classList.add('sticky-clock-active');
        } else {
            stickyTarget.classList.remove('sticky-clock-active');
        }
    });
}
// --- END SCROLL HANDLER ---

// --- FINAL FIX: LISTENING TO THE WINDOW/DOCUMENT SCROLL ---
// 1. Get the target clock element only
// const stickyTarget = document.querySelector('.game-clocks-section');

// 2. Attach the listener to the global window object
// if (stickyTarget) {
    // window.addEventListener('scroll', function() {
        // const scrollThreshold = 100;
        
        // 3. Measure the scroll position from the window (scrollY is most reliable)
        // const currentScrollPosition = window.scrollY; 

        // if (currentScrollPosition > scrollThreshold) { 
           //  stickyTarget.classList.add('sticky-clock-active');
            // Console log removed for final version, but left for visibility:
            // console.log('CLASS ADDED! SUCCESS. Scroll Top:', currentScrollPosition); 
        // } else {
           // stickyTarget.classList.remove('sticky-clock-active');
            // console.log('Class removed. Scroll Top:', currentScrollPosition);
        // }
    // });
// }
// --- END SCROLL HANDLER ---

});

