document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('penalty-search');
    const penaltiesListContainer = document.getElementById('penalties-list');
    const noResultsMessage = document.getElementById('no-results');
    let penaltiesData = []; // Store the fetched data

    /**
     * Helper to get the descriptive effect string based on the booleans.
     */
    const getPenaltyEffect = (penalty) => {
        if (penalty.automaticFirstDown) return "Automatic 1st Down";
        if (penalty.lossOfDown) return "Loss of Down";
        if (penalty.repeatDown) return "Repeat Down (None)"; // When the only effect is repeating the down
        return "None";
    }

    /**
     * Renders the list of penalties based on the provided array.
     * @param {Array<Object>} list The array of penalty objects to display.
     */
    const renderPenaltiesList = (list) => {
        penaltiesListContainer.innerHTML = ''; 
        noResultsMessage.style.display = 'none';

        if (list.length === 0) {
            noResultsMessage.style.display = 'block';
            return;
        }

        // Add a header row for the new, structured format
        penaltiesListContainer.innerHTML = `
            <div class="penalty-header-row">
                <div class="col-name">Penalty</div>
                <div class="col-yards">Yards</div>
                <div class="col-enforced">Enforced From</div>
                <div class="col-effect">Effect</div>
            </div>
        `;

        list.forEach(penalty => {
            const effectText = getPenaltyEffect(penalty);
            const hasEffect = penalty.automaticFirstDown || penalty.lossOfDown || penalty.repeatDown;

            const item = document.createElement('div');
            item.className = 'penalty-item-grid'; // New class for grid layout
            
            // Build the row for the penalty
            item.innerHTML = `
                <div class="col-name penalty-name">${penalty.name}</div>
                <div class="col-yards penalty-yards">${penalty.yards}</div>
                <div class="col-enforced penalty-enforced">${penalty.enforcedFrom}</div>
                <div class="col-effect penalty-effect">
                    <span>${effectText}</span>
                    <span class="effect-tick">${hasEffect ? '✅' : '—'}</span>
                </div>
            `;
            penaltiesListContainer.appendChild(item);
        });
    };

    /**
     * Filters the main penalty list based on the search query.
     */
    const filterPenalties = () => {
        const query = searchInput.value.toLowerCase().trim();

        const filteredList = penaltiesData.filter(penalty => {
            // Search across all relevant text fields and keywords
            return (
                penalty.name.toLowerCase().includes(query) ||
                String(penalty.yards).toLowerCase().includes(query) ||
                penalty.enforcedFrom.toLowerCase().includes(query) ||
                getPenaltyEffect(penalty).toLowerCase().includes(query) ||
                penalty.keywords.toLowerCase().includes(query)
            );
        });

        renderPenaltiesList(filteredList);
    };

    /**
     * Loads penalty data from the JSON file.
     */
    const loadPenalties = async () => {
        try {
            // Fetch data from the new JSON file
            const response = await fetch('/penalties.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            penaltiesData = await response.json();
            console.log(`Successfully loaded ${penaltiesData.length} penalties.`);
            renderPenaltiesList(penaltiesData); // Render on load
        } catch (error) {
            console.error("Could not load penalty data:", error);
            penaltiesListContainer.innerHTML = '<p class="error-message">Error loading penalty data. Check `penalties.json`.</p>';
        }
    };

    // Event Listener for the search input
    searchInput.addEventListener('input', filterPenalties);

    // Load the data when the page loads
    loadPenalties();
});