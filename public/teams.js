// Set up an empty array to hold the team data.
// This variable will be globally accessible by script.js after the data is fetched.
const TEAM_LIST = []; 

// Add a version variable here
const teamsDataVersion = '0.2.76'; 
console.log(`Team Data Loader - Version: ${teamsDataVersion}`);

// This URL is structured to route the Google Sheet request through a CORS proxy service.
const GOOGLE_SHEET_URL = 'https://corsproxy.io/?https://docs.google.com/spreadsheets/d/e/2PACX-1vQy4lkQeSqjCi7OY_vGstrVQDX-uSpOZcaWHW_IYmOLDcLqwPs7lBlvSfLTw40WLwPf1clfSF6zJkvA/gviz/tq%3Ftqx%3Dout%3Ajson%26gid%3D1701665579';

// Path for the placeholder image to be used if a logo is missing or data fails to load.
const DEFAULT_LOGO_PATH = '/assets/logos/whistle-team-fallback.webp';

/**
 * Fetches data from the Google Sheet and converts it into a structured array.
 * This function will be called immediately on script load.
 * @returns {Promise<Array>} A promise that resolves with the array of team objects.
 */
const loadTeamData = () => {
    // Add a simple delay/retry mechanism to handle transient network issues
    const maxRetries = 3;
    let currentRetry = 0;

    const attemptFetch = () => {
        return fetch(GOOGLE_SHEET_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(text => {
                // Google's response is wrapper text, so we need to extract the JSON part.
                const jsonMatch = text.match(/google.visualization.Query.setResponse\((.*?)\);/);

                if (!jsonMatch || jsonMatch.length < 2) {
                    throw new Error("Could not parse Google Sheets JSON wrapper.");
                }

                const data = JSON.parse(jsonMatch[1]);
                
                // Extract column headers (keys). Headers MUST be in the first row.
                const headers = data.table.cols.map(col => col.label).filter(label => label);

                if (headers.length === 0) {
                    throw new Error("No headers found in Google Sheet data. Ensure the first row is populated.");
                }

                // Convert rows to an array of objects
                data.table.rows.forEach(row => {
                    const team = {};
                    row.c.forEach((cell, index) => {
                        // Use the header as the key and the cell value as the property value
                        if (headers[index]) {
                            // cell.v holds the value. If it's null, use an empty string.
                            team[headers[index]] = (cell && cell.v !== null) ? cell.v : '';
                        }
                    });
                    
                    // Add the logo path, defaulting to the fallback if the 'Team Logo' column is empty
                    team['Final Logo Path'] = team['Team Logo'] || DEFAULT_LOGO_PATH;
                    
                    // Push the structured object to the global list
                    TEAM_LIST.push(team);
                });

                console.log(`Team Loader: Successfully loaded ${TEAM_LIST.length} teams.`);
                return TEAM_LIST;
            })
            .catch(error => {
                console.error(`Team Loader: Attempt ${currentRetry + 1} failed.`, error.message);
                if (currentRetry < maxRetries) {
                    currentRetry++;
                    const delay = Math.pow(2, currentRetry) * 1000; // Exponential backoff
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

// Expose the function globally so script.js can wait for it if necessary
window.loadTeamData = loadTeamData;

// Immediately call the function to start loading the data
loadTeamData();