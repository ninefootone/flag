document.addEventListener('DOMContentLoaded', () => {
    // --- Modal Toggle Logic ---
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
            searchInput.value = '';
            renderPenaltiesList(penaltiesData);
        });
    }

    // --- Google Sheet URLs ---
    const SHEET_URLS = {
        flag: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLx1lsciNI7CiAUoLH-8g7DxgsZZhrLuq-SYUcTW-vIXTegPRT6UHF4FAoRKOGqug0nSa3FjU7zfzG/pub?gid=962305796&output=csv',
        contact: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLx1lsciNI7CiAUoLH-8g7DxgsZZhrLuq-SYUcTW-vIXTegPRT6UHF4FAoRKOGqug0nSa3FjU7zfzG/pub?gid=1263276403&single=true&output=csv',
    };

    // --- State ---
    const penaltiesListContainer = document.getElementById('penalties-list');
    const noResultsMessage = document.getElementById('no-results');
    let penaltiesData = [];
    let currentType = localStorage.getItem('whistle_penalty_type') || 'flag';

    // --- CSV Parser ---
    const parseCSV = (csvText) => {
        const lines = csvText.split('\n');
        if (lines.length === 0) return [];
        const headers = lines[0].replace(/"/g, '').replace(/\r/g, '').split(',');
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const values = line.split(',');
            const rowData = {};
            headers.forEach((header, index) => {
                const cleanHeader = header.trim();
                let value = (values[index] || '').replace(/"/g, '').replace(/\r/g, '').trim();
                if (cleanHeader === 'yards' && !isNaN(value) && value !== '') {
                    value = Number(value);
                }
                rowData[cleanHeader] = value;
            });
            data.push(rowData);
        }
        return data;
    };

    // --- Effect helper ---
    const getPenaltyEffect = (penalty) => {
        if (penalty.automaticFirstDown && String(penalty.automaticFirstDown).toLowerCase() === 'true') return "Automatic 1st Down";
        if (penalty.lossOfDown && String(penalty.lossOfDown).toLowerCase() === 'true') return "Loss of Down";
        if (penalty.lossOfTimeout && String(penalty.lossOfTimeout).toLowerCase() === 'true') return "Loss of Timeout";
        return "-";
    };

    // --- Type toggle ---
    const createToggle = () => {
        const existing = document.getElementById('penalty-type-toggle');
        if (existing) existing.remove();

        const toggle = document.createElement('div');
        toggle.id = 'penalty-type-toggle';
        toggle.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;';
        const activeStyle = 'flex:1;padding:8px;border-radius:500px;cursor:pointer;font-weight:700;background-color:var(--primary-color);color:var(--button-text);border:1px solid var(--primary-color);';
        const inactiveStyle = 'flex:1;padding:8px;border-radius:500px;cursor:pointer;font-weight:700;background-color:var(--background-color);color:var(--primary-color);border:1px solid var(--primary-color);';
        toggle.innerHTML = `
            <button id="penalty-flag-btn" style="${currentType === 'flag' ? activeStyle : inactiveStyle}">Flag</button>
            <button id="penalty-contact-btn" style="${currentType === 'contact' ? activeStyle : inactiveStyle}">Contact</button>
        `;
        searchInput.parentNode.insertBefore(toggle, searchInput);

        document.getElementById('penalty-flag-btn').addEventListener('click', () => switchType('flag'));
        document.getElementById('penalty-contact-btn').addEventListener('click', () => switchType('contact'));
    };

    const switchType = async (type) => {
        currentType = type;
        localStorage.setItem('whistle_penalty_type', type);
        createToggle();
        searchInput.value = '';
        penaltiesListContainer.innerHTML = '<p style="color:#999;padding:16px;">Loading...</p>';
        await loadPenalties();
    };

    // --- Render ---
    const renderPenaltiesList = (list) => {
        penaltiesListContainer.innerHTML = '';
        noResultsMessage.style.display = 'none';

        if (list.length === 0) {
            noResultsMessage.style.display = 'block';
            return;
        }

        penaltiesListContainer.innerHTML = `
            <div class="penalty-header-row">
                <div class="col-name">Penalty</div>
                <div class="col-description">Description</div>
                <div class="col-yards">Yards</div>
                <div class="col-enforced">Enforced From</div>
                <div class="col-effect">Effect</div>
            </div>
        `;

        list.forEach(penalty => {
            const effectText = getPenaltyEffect(penalty);
            const item = document.createElement('div');
            item.className = 'penalty-item-grid';
            item.innerHTML = `
                <div class="col-name penalty-name">${penalty.name}</div>
                <div class="col-description penalty-description">${penalty.description || '-'}</div>
                <div class="col-yards penalty-yards">${penalty.yards}</div>
                <div class="col-enforced penalty-enforced">${penalty.enforcedFrom || '-'}</div>
                <div class="col-effect penalty-effect">${effectText}</div>
            `;
            penaltiesListContainer.appendChild(item);
        });
    };

    // --- Filter ---
    const filterPenalties = () => {
        const query = searchInput.value.toLowerCase().trim();
        const filteredList = penaltiesData.filter(penalty => {
            const name = penalty.name ? penalty.name.toLowerCase() : '';
            const description = penalty.description ? penalty.description.toLowerCase() : '';
            const enforcedFrom = penalty.enforcedFrom ? penalty.enforcedFrom.toLowerCase() : '';
            const keywords = penalty.keywords ? penalty.keywords.toLowerCase() : '';
            return (
                name.includes(query) ||
                description.includes(query) ||
                String(penalty.yards).toLowerCase().includes(query) ||
                enforcedFrom.includes(query) ||
                getPenaltyEffect(penalty).toLowerCase().includes(query) ||
                keywords.includes(query)
            );
        });
        renderPenaltiesList(filteredList);
    };

    // --- Load ---
    const loadPenalties = async () => {
        try {
            const response = await fetch(SHEET_URLS[currentType]);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const csvText = await response.text();
            penaltiesData = parseCSV(csvText);
            renderPenaltiesList(penaltiesData);
        } catch (error) {
            console.error("Could not load penalty data:", error);
            penaltiesListContainer.innerHTML = '<p class="error-message">Error loading penalty data.</p>';
        }
    };

    searchInput.addEventListener('input', filterPenalties);

    // Initialise
    createToggle();
    loadPenalties();
});
