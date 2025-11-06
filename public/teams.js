const teamsDataVersion = '0.3.50'; 

// Use 'window' to explicitly declare TEAM_LIST as a global variable.
window.TEAM_LIST = []; 

// This format is highly reliable and bypasses the gviz API issues.
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQy4lkQeSqjCi7OY_vGstrVQDX-uSpOZcaWHW_IYmOLDcLqwPs7lBlvSfLTw40WLwPf1clfSF6zJkvA/pub?output=csv&gid=1701665579';

// Path for the placeholder image to be used if a logo is missing or data fails to load.
window.DEFAULT_LOGO_PATH = 'https://www.whistle-app.co.uk/assets/logos/whistle-team-fallback.webp';

/**
 * Aggressively cleans a string to be used as a file path or URL.
 * Removes extra quotes, whitespace, and carriage returns (\r).
 * @param {string} path The raw string value.
 * @returns {string} The cleaned path, or an empty string if null/undefined.
 */
const cleanPath = (path) => {
    if (typeof path !== 'string' || !path) return '';
    return path.trim().replace(/"/g, '').replace(/\r/g, '');
};

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
        
        // Use the cleanPath function on headers too, in case of weird characters
        const headers = rows[0].split(',').map(header => cleanPath(header));
        
        const data = [];
        
        for (let i = 1; i < rows.length; i++) {
            // Basic split that handles quoted commas (important for team names/data)
            const values = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
            
            const team = {};
            let isRowEmpty = true;

            values.forEach((value, index) => {
                // Apply the cleanPath logic to all data values
                const cleanValue = cleanPath(value);
                
                if (headers[index]) {
                    team[headers[index]] = cleanValue;
                    if (cleanValue !== '') {
                        isRowEmpty = false;
                    }
                }
            });
            
            // Skip completely empty rows
            if (!isRowEmpty) {
                const teamLogoPath = team['Team Logo'] || '';
                
                // Final check: if the cleaned logo path is an empty string, use the default.
                const finalLogoPath = teamLogoPath !== '' 
                    ? teamLogoPath 
                    : DEFAULT_LOGO_PATH;
                    
                team['Final Logo Path'] = finalLogoPath;
                data.push(team);
            }
        }
        return data;
    };

    const attemptFetch = () => {
        return fetch(GOOGLE_SHEET_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}.`);
                }
                return response.text(); 
            })
            .then(csvText => {
                const teamData = parseCSV(csvText);
                window.TEAM_LIST.length = 0;
                window.TEAM_LIST.push(...teamData);
                
                console.log(`Team Loader: Successfully loaded ${window.TEAM_LIST.length} teams.`);
                return window.TEAM_LIST;
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
                    // Return empty array on final failure to prevent script.js crash
                    return []; 
                }
            });
    };
    
    return attemptFetch();
};

window.loadTeamData = loadTeamData;