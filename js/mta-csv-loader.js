/**
 * CSV Data Loader for MTA Subway Stations
 * Processes real MTA data from CSV file
 */

// Store for processed MTA data
let mtaStationsData = [];
let mtaLinesData = {};
let mtaLinesColors = {
    // Official MTA colors
    '1': '#EE352E', '2': '#EE352E', '3': '#EE352E',
    '4': '#00933C', '5': '#00933C', '6': '#00933C', '6X': '#00933C',
    '7': '#B933AD', '7X': '#B933AD',
    'A': '#0039A6', 'C': '#0039A6', 'E': '#0039A6',
    'B': '#FF6319', 'D': '#FF6319', 'F': '#FF6319', 'M': '#FF6319',
    'G': '#6CBE45',
    'J': '#996633', 'Z': '#996633',
    'L': '#A7A9AC',
    'N': '#FCCC0A', 'Q': '#FCCC0A', 'R': '#FCCC0A', 'W': '#FCCC0A',
    'S': '#808183', 'SI': '#808183', 'SIR': '#2E5AA0'
};

/**
 * Parse CSV text into array of objects
 */
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim()); // Push the last value
        
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            data.push(row);
        }
    }
    
    return data;
}

/**
 * Process MTA CSV data into usable format
 */
function processMTAData(csvData) {
    const stations = [];
    const lineRoutes = {};
    
    csvData.forEach(row => {
        // Skip rows with invalid coordinates
        const lat = parseFloat(row['GTFS Latitude']);
        const lng = parseFloat(row['GTFS Longitude']);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        // Extract routes (lines) for this station
        const daytimeRoutes = row['Daytime Routes'] ? row['Daytime Routes'].split(' ').filter(r => r.trim() !== '') : [];
        
        // Create station object
        const station = {
            name: row['Stop Name'],
            lat: lat,
            lng: lng,
            lines: daytimeRoutes,
            borough: row['Borough'],
            structure: row['Structure'],
            ada: row['ADA'] === '1',
            complex: row['Complex ID']
        };
        
        stations.push(station);
        
        // Group stations by line for route creation
        daytimeRoutes.forEach(line => {
            if (!lineRoutes[line]) {
                lineRoutes[line] = [];
            }
            lineRoutes[line].push({
                lat: lat,
                lng: lng,
                name: row['Stop Name'],
                order: parseInt(row['Station ID']) || 0
            });
        });
    });
    
    // Sort stations by line order and create simplified routes
    Object.keys(lineRoutes).forEach(line => {
        lineRoutes[line].sort((a, b) => a.order - b.order);
        // Keep only coordinates for route drawing
        lineRoutes[line] = lineRoutes[line].map(station => [station.lat, station.lng]);
    });
    
    return { stations, lineRoutes };
}

/**
 * Load MTA data from CSV file
 */
async function loadMTAData() {
    try {
        console.log('Loading MTA subway data...');
        const response = await fetch('MTA_Subway_Stations_20250817.csv');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        const csvData = parseCSV(csvText);
        
        console.log(`Parsed ${csvData.length} station records from CSV`);
        
        const processed = processMTAData(csvData);
        mtaStationsData = processed.stations;
        mtaLinesData = processed.lineRoutes;
        
        console.log(`Processed ${mtaStationsData.length} unique stations and ${Object.keys(mtaLinesData).length} lines`);
        
        return { stations: mtaStationsData, lines: mtaLinesData, colors: mtaLinesColors };
        
    } catch (error) {
        console.error('Error loading MTA data:', error);
        
        // Fallback to original hardcoded data
        console.log('Falling back to hardcoded subway data');
        return {
            stations: SUBWAY_STATIONS,
            lines: SUBWAY_LINES,
            colors: SUBWAY_COLORS
        };
    }
}

/**
 * Get unique stations (remove duplicates by complex/name)
 */
function getUniqueStations(stations) {
    const complexGroups = new Map();
    
    // Group stations by complex ID
    stations.forEach(station => {
        const complexId = station.complex;
        if (!complexGroups.has(complexId)) {
            complexGroups.set(complexId, []);
        }
        complexGroups.get(complexId).push(station);
    });
    
    const unique = [];
    
    // For each complex, merge stations with same complex ID
    complexGroups.forEach(stationsInComplex => {
        if (stationsInComplex.length === 1) {
            // Single station in complex, use as-is
            unique.push(stationsInComplex[0]);
        } else {
            // Multiple stations in complex, merge them
            const baseStation = stationsInComplex[0];
            const allLines = new Set();
            let hasADA = false;
            
            // Collect all unique lines and ADA status
            stationsInComplex.forEach(station => {
                station.lines.forEach(line => allLines.add(line));
                if (station.ada) hasADA = true;
            });
            
            // Create merged station
            const mergedStation = {
                ...baseStation,
                lines: Array.from(allLines).sort(),
                ada: hasADA
            };
            
            unique.push(mergedStation);
        }
    });
    
    return unique;
}

/**
 * Filter stations by borough
 */
function filterStationsByBorough(stations, boroughs = ['M', 'Bk', 'Q', 'Bx']) {
    return stations.filter(station => boroughs.includes(station.borough));
}

/**
 * Get stations near a location
 */
function getNearbyStationsFromMTA(lat, lng, maxDistance = 1000, maxResults = 5) {
    const results = [];
    
    mtaStationsData.forEach(station => {
        // Simple distance calculation (approximate)
        const latDiff = Math.abs(station.lat - lat);
        const lngDiff = Math.abs(station.lng - lng);
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000; // Rough conversion to meters
        
        if (distance <= maxDistance) {
            results.push({
                station: station,
                distance: distance
            });
        }
    });
    
    return results
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxResults);
}
