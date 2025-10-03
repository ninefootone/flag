document.addEventListener('DOMContentLoaded', () => {
    // --- New Modal Toggle Logic ---
    const penaltyLookupBtn = document.getElementById('penalty-lookup-btn');
    const penaltyModal = document.getElementById('penalty-lookup-modal');
    const closeModalBtn = document.getElementById('close-penalty-modal-btn');
    const searchInput = document.getElementById('penalty-search');

    if (penaltyLookupBtn) {
        penaltyLookupBtn.addEventListener('click', () => {
            penaltyModal.classList.remove('hidden');
            searchInput.focus();
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            penaltyModal.classList.add('hidden');
            searchInput.value = ''; // Clear search when closing
            renderPenaltiesList(penaltiesData); // Reset to full list
        });
    }
    // -----------------------------


    // --- Existing Penalty Lookup Logic (Modified) ---
    const penaltiesListContainer = document.getElementById('penalties-list');
    const noResultsMessage = document.getElementById('no-results');
    let penaltiesData = []; // Store the fetched data

    /**
     * Helper to get the descriptive effect string based on the booleans.
     * Updated to return '-' when no specific effect applies.
     */
    const getPenaltyEffect = (penalty) => {
        if (penalty.automaticFirstDown) return "Automatic 1st Down";
        if (penalty.lossOfDown) return "Loss of Down";
        if (penalty.lossOfTimeout) return "Loss of Timeout";
        return "-"; // Changed from "None"
    }

    /**
     * Renders the list of penalties based on the provided array.
     */
    const renderPenaltiesList = (list) => {
        penaltiesListContainer.innerHTML = ''; 
        noResultsMessage.style.display = 'none';

        if (list.length === 0) {
            noResultsMessage.style.display = 'block';
            return;
        }

        // Add a header row for the structured format
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
            // Removed hasEffect check as the tick is no longer needed

            const item = document.createElement('div');
            item.className = 'penalty-item-grid'; 
            
            item.innerHTML = `
                <div class="col-name penalty-name">${penalty.name}</div>
                <div class="col-yards penalty-yards">${penalty.yards}</div>
                <div class="col-enforced penalty-enforced">${penalty.enforcedFrom}</div>
                <div class="col-effect penalty-effect">
                    ${effectText}
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
            const response = await fetch('/penalties.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            penaltiesData = await response.json();
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