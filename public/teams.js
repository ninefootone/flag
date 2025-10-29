const teamsDataVersion = '0.2.77'; 

// Set up an empty array to hold the team data.
const TEAM_LIST = []; 

// *** NEW WORKING URL: CSV Export Format ***
// This format is highly reliable and bypasses the gviz API issues.
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQy4lkQeSqjCi7OY_vGstrVQDX-uSpOZcaWHW_IYmOLDcLqwPs7lBlvSfLTw40WLwPf1clfSF6zJkvA/pub?output=csv&gid=1701665579';

// Path for the placeholder image to be used if a logo is missing or data fails to load.
const DEFAULT_LOGO_PATH = '/assets/logos/whistle-team-fallback.webp';

/**
 * Fetches data from the Google Sheet (via CSV export) and converts it into a structured array.
 * @returns {Promise<Array>} A promise that resolves with the array of team objects.
 */
const loadTeamData = () => {
    const maxRetries = 3;
    let currentRetry = 0;

    // Helper function to parse the CSV text
    const parseCSV = (csvText) => {
        const rows = csvText.trim().split('\n');
        // Split the first row to get headers and strip quotes
        const headers = rows[0].split(',').map(header => header.trim().replace(/"/g, ''));
        
        const data = [];
        
        // Iterate over data rows (starting from index 1)
        for (let i = 1; i < rows.length; i++) {
            // Simple split won't work perfectly with commas in data, but is usually fine for Google Sheets
            // If you encounter issues with team names containing commas, a dedicated CSV parser is needed.
            const values = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Basic split that handles quoted commas

            const team = {};
            values.forEach((value, index) => {
                const cleanValue = value.trim().replace(/"/g, ''); // Remove quotes
                if (headers[index]) {
                    team[headers[index]] = cleanValue;
                }
            });
            
            // Skip empty rows
            if (team[headers[0]]) {
                team['Final Logo Path'] = team['Team Logo'] || DEFAULT_LOGO_PATH;
                data.push(team);
            }
        }
        return data;
    };

    const attemptFetch = () => {
        return fetch(GOOGLE_SHEET_URL)
            .then(response => {
                // If this is a redirect (e.g., to login), it will likely fail here if permissions aren't perfect.
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}. Check your Google Sheet sharing permissions one last time.`);
                }
                // We use response.text() to get the raw CSV data
                return response.text(); 
            })
            .then(csvText => {
                // Parse the CSV into the TEAM_LIST array
                const teamData = parseCSV(csvText);
                TEAM_LIST.length = 0; // Clear the array
                TEAM_LIST.push(...teamData);
                
                console.log(`Team Loader: Successfully loaded ${TEAM_LIST.length} teams.`);
                return TEAM_LIST;
            })
            .catch(error => {
                console.error(`Team Loader: Attempt ${currentRetry + 1} failed.`, error.message);
                if (currentRetry < maxRetries) {
                    currentRetry++;
                    const delay = Math.pow(2, currentRetry) * 1000;
                    console.log(`Team Loader: Retrying in ${delay / 1000} seconds...`);
                    return new Promise(resolve => setTimeout(resolve, delay)).then(attemptFetch);
                } else {
                    console.error("Team Loader: Failed to fetch team data after maximum retries.");
                    return []; 
                }
            });
    };
    
    return attemptFetch();
};

window.loadTeamData = loadTeamData;
// loadTeamData(); // Remove the immediate call if you are calling it from script.js initializeTeamData