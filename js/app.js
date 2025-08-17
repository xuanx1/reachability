/**
 * NYC Manhattan Reachability Map Application
 * Uses Leaflet.js and OpenRouteService API for isochrone analysis
 */

// API Keys for OpenRouteService (primary and backup)
const ORS_API_KEY = '5b3ce3597851110001cf6248c9f85cae50384963b985be5b9d179444';
const ORS_BACKUP_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImNlZjQ1YzI0YmQ0ODRmNmY5NjdiOGI4M2VjNTE3NjAzIiwiaCI6Im11cm11cjY0In0=';

// Array of API keys for fallback
const API_KEYS = [ORS_API_KEY, ORS_BACKUP_API_KEY];
let currentKeyIndex = 0;

// Function to get current API key
function getCurrentApiKey() {
    return API_KEYS[currentKeyIndex];
}

// Function to try next API key when current one fails
function tryNextApiKey() {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    console.log(`Switching to backup API key (index: ${currentKeyIndex})`);
    return getCurrentApiKey();
}

// Enhanced fetch function with API key fallback
async function fetchWithApiKeyFallback(url, options = {}) {
    let attempts = 0;
    const maxAttempts = API_KEYS.length;
    
    while (attempts < maxAttempts) {
        try {
            const response = await fetch(url, options);
            
            // If response is successful, return it
            if (response.ok) {
                return response;
            }
            
            // If it's an auth/key error (401, 403), try next key
            if (response.status === 401 || response.status === 403) {
                console.warn(`API key failed with status ${response.status}, trying backup key...`);
                tryNextApiKey();
                // Update the URL with the new API key
                url = url.replace(/api_key=[^&]+/, `api_key=${getCurrentApiKey()}`);
                attempts++;
                continue;
            }
            
            // For other errors, return the response as-is
            return response;
            
        } catch (error) {
            console.error(`Network error with API key ${currentKeyIndex}:`, error);
            
            // Try next key on network errors too
            if (attempts < maxAttempts - 1) {
                tryNextApiKey();
                url = url.replace(/api_key=[^&]+/, `api_key=${getCurrentApiKey()}`);
                attempts++;
                continue;
            }
            
            // If all keys failed, throw the error
            throw error;
        }
    }
    
    throw new Error('All API keys failed');
}

// Function to reinitialize reachability control with new API key
function reinitializeReachabilityControl() {
    if (reachabilityControl && map) {
        console.log('Reinitializing reachability control with new API key...');
        
        // Remove existing control
        map.removeControl(reachabilityControl);
        
        // Switch to next API key
        tryNextApiKey();
        
        // Create new control with updated API key
        reachabilityControl = L.control.reachability({
            apiKey: getCurrentApiKey(),
            
            // Hide the plugin's built-in UI completely
            collapsed: true,
            
            // Style functions
            styleFn: styleIsolines,
            mouseOverFn: highlightIsolines,
            mouseOutFn: resetIsolines,
            clickFn: clickIsolines,
            markerFn: isolinesOrigin,
            
            // Hide all button content by setting to empty
            expandButtonContent: '',
            collapseButtonContent: '',
            drawButtonContent: '',
            deleteButtonContent: '',
            exportButtonContent: '',
            distanceButtonContent: '',
            timeButtonContent: '',
            travelModeButton1Content: '',
            travelModeButton2Content: '',
            travelModeButton3Content: '',
            travelModeButton4Content: '',
            
            // Hide button style classes
            expandButtonStyleClass: 'reachability-control-hide',
            collapseButtonStyleClass: 'reachability-control-hide',
            drawButtonStyleClass: 'reachability-control-hide',
            deleteButtonStyleClass: 'reachability-control-hide',
            exportButtonStyleClass: 'reachability-control-hide',
            distanceButtonStyleClass: 'reachability-control-hide',
            timeButtonStyleClass: 'reachability-control-hide',
            travelModeButton1StyleClass: 'reachability-control-hide',
            travelModeButton2StyleClass: 'reachability-control-hide',
            travelModeButton3StyleClass: 'reachability-control-hide',
            travelModeButton4StyleClass: 'reachability-control-hide',
            
            // Travel mode profiles to match our button data-mode values
            travelModeProfile1: 'driving-car',
            travelModeProfile2: 'cycling-regular', 
            travelModeProfile3: 'foot-walking',
            travelModeProfile4: 'wheelchair',
            travelModeDefault: 'foot-walking',
            
            // Range type default (time or distance)
            rangeTypeDefault: 'time',
            
            // Default settings - 15 minute walk with intervals
            rangeControlTimeDefault: 15,
            rangeControlTimeMax: 30,
            rangeControlTimeInterval: 5,
            rangeControlDistanceDefault: 1,
            rangeControlDistanceMax: 5,
            rangeControlDistanceInterval: 0.5,
            
            pane: 'popupPane',
            position: 'bottomright'
        }).addTo(map);
        
        // Enable intervals by default in the reinitialized reachability plugin
        setTimeout(() => {
            if (reachabilityControl && reachabilityControl._showInterval) {
                reachabilityControl._showInterval.checked = true;
                console.log('Intervals enabled by default in reinitialized reachability plugin');
            }
        }, 100);
        
        console.log(`Reachability control reinitialized with API key index: ${currentKeyIndex}`);
        return true;
    }
    return false;
}

// Function to immediately switch to backup API key (useful when quota is exceeded)
function switchToBackupApiKey() {
    console.log('Manually switching to backup API key due to quota exceeded...');
    return reinitializeReachabilityControl();
}


// NYC coordinates
const NYC_CENTER = [40.7580, -73.9855]; // Times Square area

// NYC bounds (covers all boroughs)
const NYC_BOUNDS = L.latLngBounds(
    [40.495, -74.255], // Southwest (Staten Island)
    [40.915, -73.700]  // Northeast (Bronx/Queens)
);

// Global variables
let map;
let reachabilityControl;
let currentTravelMode = 'foot-walking';
let analysisCount = 0;

// Metro system variables
let metroLinesGroup;
let metroStationsGroup;
let metroLayersVisible = true;
let mtaData = null; // Store loaded MTA data

/**
 * Example function to style the isoline polygons when they are returned from the API call
 */
function styleIsolines(feature) {
    var style = {};
    
    switch (feature.properties['Travel mode']) {
        case 'Driving':
            style = { fillColor: '#ff7800', color: '#ff7800', weight: 3, fillOpacity: 0.3 };
            break;
        case 'Cycling':
            style = { fillColor: '#00ff00', color: '#00ff00', weight: 3, fillOpacity: 0.3 };
            break;
        case 'Walking':
            style = { fillColor: '#0073d4', color: '#0073d4', weight: 3, fillOpacity: 0.3 };
            break;
        case 'Wheelchair':
            style = { fillColor: '#ff0000', color: '#ff0000', weight: 3, fillOpacity: 0.3 };
            break;
        default:
            style = { fillColor: '#0073d4', color: '#0073d4', weight: 3, fillOpacity: 0.3 };
    }
    
    return style;
}

/**
 * Example function to highlight an isoline when the user hovers over it
 */
function highlightIsolines(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 5,
        fillOpacity: 0.5
    });
    
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

/**
 * Example function to reset the highlighting of an isoline when the user moves the mouse away from it
 */
function resetIsolines(e) {
    var layer = e.target;
    reachabilityControl.isolinesGroup.resetStyle(layer);
}

/**
 * Function to display reachability information in a styled popup when user clicks on an isoline
 */
function clickIsolines(e) {
    var layer = e.target;
    var props = layer.feature.properties;
    
    // Parse area value and convert from square meters to square kilometers if needed
    let areaValue = props['Area'] || 0;
    let areaUnits = props['Area units'] || '';
    
    console.log('Original area value:', areaValue, 'units:', areaUnits);
    
    // Handle area conversion more robustly
    if (typeof areaValue === 'string') {
        areaValue = parseFloat(areaValue.replace(/[^\d.]/g, ''));
    }
    
    if (typeof areaValue === 'number' && !isNaN(areaValue)) {
        // If area is in square meters (very large numbers), convert to km²
        if (areaValue > 10000 || areaUnits.toLowerCase().includes('meter')) {
            areaValue = (areaValue / 1000000).toFixed(2);
            areaUnits = 'km²';
        } else if (areaValue > 100) {
            // Still quite large, likely meters
            areaValue = (areaValue / 1000000).toFixed(2);
            areaUnits = 'km²';
        } else {
            // Already reasonable size, format to 2 decimal places
            areaValue = areaValue.toFixed(2);
            if (!areaUnits) areaUnits = 'km²';
        }
    }
    
    console.log('Converted area value:', areaValue, 'units:', areaUnits);
    
    // Format reach factor with explanation
    let reachFactorHtml = '';
    if (props.hasOwnProperty('Reach factor')) {
        const factor = parseFloat(props['Reach factor']);
        let explanation = '';
        if (factor >= 0.9) {
            explanation = ' (Excellent accessibility)';
        } else if (factor >= 0.7) {
            explanation = ' (Good accessibility)';
        } else if (factor >= 0.5) {
            explanation = ' (Moderate accessibility)';
        } else {
            explanation = ' (Limited accessibility)';
        }
        reachFactorHtml = `<p><strong>Reach Factor:</strong> ${props['Reach factor']}${explanation}</p>`;
    }
    
    // Create styled popup content matching subway popup design
    var popupContent = `
        <h4>Reachability Analysis</h4>
        <p><strong>Travel Mode:</strong> ${props['Travel mode']}</p>
        <p><strong>Range:</strong> 0 - ${props['Range']} ${props['Range units']}</p>
        <p><strong>Area:</strong> ${areaValue} ${areaUnits}</p>
        <p><strong>Population:</strong> ${props['Population'] || 'N/A'}</p>
        ${reachFactorHtml}
    `;
    
    layer.bindPopup(popupContent).openPopup();
}

/**
 * Example function to create a custom marker at the origin of the isoline groups
 */
function isolinesOrigin(latLng, travelMode, rangeType) {
    return L.circleMarker(latLng, { radius: 4, weight: 2, color: '#0073d4', fillColor: '#fff', fillOpacity: 1 });
}

/**
 * Initialize the map and controls
 */
function initMap() {
    // Create map centered on NYC
    map = L.map('map', {
        center: NYC_CENTER,
        zoom: 11,
        minZoom: 11,
        maxBounds: NYC_BOUNDS,
        maxBoundsViscosity: 0.8,
        zoomControl: false
    });

    // Add minimal light tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Initialize reachability control
    reachabilityControl = L.control.reachability({
        apiKey: getCurrentApiKey(),
        
        // Hide the plugin's built-in UI completely
        collapsed: true,
        
        // Style functions
        styleFn: styleIsolines,
        mouseOverFn: highlightIsolines,
        mouseOutFn: resetIsolines,
        clickFn: clickIsolines,
        markerFn: isolinesOrigin,
        
        // Hide all button content by setting to empty
        expandButtonContent: '',
        collapseButtonContent: '',
        drawButtonContent: '',
        deleteButtonContent: '',
        exportButtonContent: '',
        distanceButtonContent: '',
        timeButtonContent: '',
        travelModeButton1Content: '',
        travelModeButton2Content: '',
        travelModeButton3Content: '',
        travelModeButton4Content: '',
        
        // Hide button style classes
        expandButtonStyleClass: 'reachability-control-hide',
        collapseButtonStyleClass: 'reachability-control-hide',
        drawButtonStyleClass: 'reachability-control-hide',
        deleteButtonStyleClass: 'reachability-control-hide',
        exportButtonStyleClass: 'reachability-control-hide',
        distanceButtonStyleClass: 'reachability-control-hide',
        timeButtonStyleClass: 'reachability-control-hide',
        travelModeButton1StyleClass: 'reachability-control-hide',
        travelModeButton2StyleClass: 'reachability-control-hide',
        travelModeButton3StyleClass: 'reachability-control-hide',
        travelModeButton4StyleClass: 'reachability-control-hide',
        
        // Travel mode profiles to match our button data-mode values
        travelModeProfile1: 'driving-car',
        travelModeProfile2: 'cycling-regular', 
        travelModeProfile3: 'foot-walking',
        travelModeProfile4: 'wheelchair',
        travelModeDefault: 'foot-walking',
        
        // Range type default (time or distance)
        rangeTypeDefault: 'time',
        
        // Default settings - 15 minute walk with intervals
        rangeControlTimeDefault: 15,
        rangeControlTimeMax: 30,
        rangeControlTimeInterval: 5,
        rangeControlDistanceDefault: 1,
        rangeControlDistanceMax: 5,
        rangeControlDistanceInterval: 0.5,
        
        pane: 'popupPane',
        position: 'bottomright'
    }).addTo(map);

    // Enable intervals by default in the reachability plugin
    setTimeout(() => {
        if (reachabilityControl && reachabilityControl._showInterval) {
            reachabilityControl._showInterval.checked = true;
            console.log('Intervals enabled by default in reachability plugin');
        }
    }, 100);

    // Listen for reachability plugin errors and automatically switch API keys
    map.on('reachability:error', function(e) {
        console.warn('Reachability API error detected, attempting to switch to backup key...');
        
        // Add a small delay to prevent rapid switching
        setTimeout(() => {
            if (reinitializeReachabilityControl()) {
                console.log('Successfully switched to backup API key');
                // Show user-friendly message
                alert('Switched to backup API service. You can continue using the reachability analysis.');
            } else {
                console.error('Failed to reinitialize reachability control');
                alert('API service temporarily unavailable. Please try again later.');
            }
        }, 1000);
    });

    // Also listen for no_data events which might indicate API issues
    map.on('reachability:no_data', function(e) {
        console.warn('Reachability no_data event - this might indicate API quota or key issues');
    });

    // Proactively switch to backup key since primary key quota is exceeded
    setTimeout(() => {
        console.log('Proactively switching to backup API key to avoid quota issues...');
        switchToBackupApiKey();
    }, 2000);

    // Listen for popup events (simplified)
    map.on('popupopen', function(e) {
        console.log('Popup opened');
    });

    // Set up event listener to deactivate plot button after any isochrone is displayed
    map.on('reachability:displayed', function() {
        // After any reachability analysis is displayed, deactivate plot button
        setTimeout(() => {
            if (reachabilityControl && reachabilityControl._drawMode && reachabilityControl._toggleDraw) {
                reachabilityControl._toggleDraw(); // Disable draw mode
                updateDrawButtonState(); // Update button visual state
                console.log('Reachability analysis displayed, plot button deactivated');
            }
        }, 500); // Small delay to ensure isochrone is fully rendered
    });

    // Disable draw mode by default (plot deactivated by default)
    // Use setTimeout to ensure reachability control is fully initialized
    setTimeout(() => {
        if (reachabilityControl) {
            // Force draw mode to be disabled
            if (reachabilityControl._drawMode) {
                reachabilityControl._toggleDraw();
                console.log('Draw mode was enabled, now disabled');
            } else {
                console.log('Draw mode was already disabled');
            }
            
            // Update button state to reflect disabled draw mode
            updateDrawButtonState();
        }
    }, 100);

    // Load NYC borough boundaries and create mask
    loadNYCBoroughMask();

    // Initialize metro system
    initializeMetroSystem();

    // Initialize UI event handlers
    initializeEventHandlers();
    
    // Initialize the range dropdown with time options (default)
    updateRangeDropdown('time');
    
    // Final check to ensure draw mode is disabled after all initialization
    setTimeout(() => {
        if (reachabilityControl) {
            // Force disable draw mode one more time after everything is loaded
            if (reachabilityControl._drawMode) {
                reachabilityControl._toggleDraw();
                console.log('Final check: Draw mode was enabled, now disabled');
            }
            updateDrawButtonState();
            console.log('Final draw mode state:', reachabilityControl._drawMode);
        }
    }, 500);
    
    console.log('Map initialized successfully');
}

/**
 * Load NYC borough boundaries GeoJSON and create mask for areas outside NYC
 */
async function loadNYCBoroughMask() {
    try {
        // Fetch the GeoJSON file
        const response = await fetch('NYC_Borough_Boundary_5648926780594355063.geojson');
        const boroughData = await response.json();
        
        // Create world bounds for the outer mask
        const worldBounds = [
            [90, -180],   // North-West corner
            [90, 180],    // North-East corner
            [-90, 180],   // South-East corner
            [-90, -180],  // South-West corner
            [90, -180]    // Close the polygon
        ];
        
        // Collect all NYC boundary coordinates as holes in the world polygon
        let nycHoles = [];
        
        boroughData.features.forEach(feature => {
            if (feature.geometry.type === 'Polygon') {
                // For polygon, take the outer ring (first array)
                const coords = feature.geometry.coordinates[0];
                const latLngs = coords.map(coord => [coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]
                nycHoles.push(latLngs);
            } else if (feature.geometry.type === 'MultiPolygon') {
                // For multipolygon, take all outer rings
                feature.geometry.coordinates.forEach(polygon => {
                    const coords = polygon[0];
                    const latLngs = coords.map(coord => [coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]
                    nycHoles.push(latLngs);
                });
            }
        });
        
        // Add subtle glowing border around NYC
        nycHoles.forEach(boundary => {
            L.polygon([boundary], {
                color: '#667eea',
                fillColor: 'transparent',
                fillOpacity: 0,
                weight: 3,
                opacity: 0.6,
                interactive: false,
                className: 'nyc-border-glow'
            }).addTo(map);
        });
        
        console.log('NYC borough mask loaded successfully');
        
    } catch (error) {
        console.error('Error loading NYC borough boundaries:', error);
        // Fallback to simple mask if GeoJSON fails to load
        createSimpleFallbackMask();
    }
}

/**
 * Fallback simple mask if GeoJSON loading fails
 */
function createSimpleFallbackMask() {
    console.log('Using fallback border only');
    
    // Simple NYC boundary as fallback
    const simpleBoundary = [
        [40.4774, -74.2591], [40.9908, -74.2591], 
        [40.9908, -73.7000], [40.4774, -73.7000], [40.4774, -74.2591]
    ];
    
    // Add border highlight for fallback boundary (no mask)
    L.polygon([simpleBoundary], {
        color: '#667eea',
        fillColor: 'transparent',
        fillOpacity: 0,
        weight: 3,
        opacity: 0.6,
        interactive: false,
        className: 'nyc-border-glow'
    }).addTo(map);
}

/**
 * Initialize all event handlers for the UI
 */
function initializeEventHandlers() {
    // Travel mode buttons - this is the key synchronization
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const mode = this.dataset.mode; // This gets foot-walking, cycling-regular, driving-car, wheelchair
            selectTravelMode(mode);
            
            // Update active button
            modeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Analysis type buttons - properly linked to plugin functions
    const analysisButtons = document.querySelectorAll('.analysis-btn');
    analysisButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.dataset.type;
            console.log('Analysis button clicked:', type);
            
            // Call the actual plugin functions
            if (reachabilityControl) {
                if (type === 'time') {
                    reachabilityControl._setRangeByTime();
                    console.log('Called _setRangeByTime');
                } else {
                    reachabilityControl._setRangeByDistance();
                    console.log('Called _setRangeByDistance');
                }
                console.log(`Analysis type set to: ${type}`);
                
                // Update our dropdown
                updateRangeDropdown(type);
            }
            
            // Update active button
            analysisButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Range selection - properly linked to plugin
    const rangeSelect = document.getElementById('range-value');
    rangeSelect.addEventListener('change', function() {
        const value = parseFloat(this.value);
        const isDistance = reachabilityControl && reachabilityControl._rangeIsDistance;
        
        console.log(`Range selected: ${value} ${isDistance ? 'km' : 'minutes'}`);
        
        // Update the plugin's internal range controls
        if (reachabilityControl) {
            if (isDistance && reachabilityControl._rangeDistanceList) {
                // Update distance range
                reachabilityControl._rangeDistanceList.value = value;
                const event = new Event('change');
                reachabilityControl._rangeDistanceList.dispatchEvent(event);
            } else if (!isDistance && reachabilityControl._rangeTimeList) {
                // Update time range
                reachabilityControl._rangeTimeList.value = value;
                const event = new Event('change');
                reachabilityControl._rangeTimeList.dispatchEvent(event);
            }
        }
    });

    // Action buttons
    document.querySelector('.draw-btn').addEventListener('click', toggleDrawMode);
    document.querySelector('.clear-btn').addEventListener('click', clearAllAnalyses);
    document.querySelector('.export-btn').addEventListener('click', exportGeoJSON);
    
    // Subway toggle checkbox
    document.getElementById('subway-toggle').addEventListener('change', toggleMetroLayers);
    
    // Metro toggle button (if exists for backward compatibility)
    const metroToggleBtn = document.querySelector('.metro-toggle-btn');
    if (metroToggleBtn) {
        metroToggleBtn.addEventListener('click', toggleMetroLayers);
    }

    // Location input buttons
    document.querySelector('.search-btn').addEventListener('click', searchLocation);
    document.querySelector('.coords-btn').addEventListener('click', plotFromInput);
    
    // Location input - allow Enter key to search
    const locationInput = document.getElementById('location-input');
    locationInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchLocation();
        }
    });
    
    // Location input - allow Escape key to close dropdown
    locationInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideLocationDropdown();
        }
    });

    // Show intervals checkbox - properly linked to plugin
    const showIntervalsCheckbox = document.getElementById('show-intervals');
    showIntervalsCheckbox.addEventListener('change', function() {
        console.log(`Show intervals: ${this.checked}`);
        
        // Update the plugin's internal show intervals checkbox
        if (reachabilityControl && reachabilityControl._showInterval) {
            reachabilityControl._showInterval.checked = this.checked;
            
            // Trigger the change event on the plugin's checkbox
            const event = new Event('change');
            reachabilityControl._showInterval.dispatchEvent(event);
        }
    });

    // Initialize default example on first load
    function initializeDefaultExample() {
        console.log('Initializing default example...');
        
        // Enable intervals by default - multiple approaches for reliability
        const showIntervalsCheckbox = document.getElementById('show-intervals');
        if (showIntervalsCheckbox) {
            showIntervalsCheckbox.checked = true;
            // Trigger the change event to sync with plugin
            const event = new Event('change');
            showIntervalsCheckbox.dispatchEvent(event);
            console.log('UI intervals checkbox enabled and change event triggered');
        }
        
        // Additional fallback: Enable intervals in the reachability plugin directly
        setTimeout(() => {
            if (reachabilityControl && reachabilityControl._showInterval) {
                reachabilityControl._showInterval.checked = true;
                // Trigger the change event on the plugin's checkbox too
                const pluginEvent = new Event('change');
                reachabilityControl._showInterval.dispatchEvent(pluginEvent);
                console.log('Plugin intervals checkbox force-enabled with change event');
            }
        }, 500);

        // Set travel mode to walking and update UI
        selectTravelMode('foot-walking');
        const walkingBtn = document.querySelector('[data-mode="foot-walking"]');
        if (walkingBtn) {
            document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            walkingBtn.classList.add('active');
        }
        
        // Set travel time to 15 minutes
        const rangeSelect = document.getElementById('range-value');
        rangeSelect.value = '15';
        if (reachabilityControl && reachabilityControl._rangeTime) {
            reachabilityControl._rangeTime.value = '15';
        }

        // Plot default location: 136 Ave C
        setTimeout(() => {
            console.log('Plotting default location...');
            const locationInput = document.getElementById('location-input');
            locationInput.value = '136 Ave C, New York, NY';
            plotFromInput();
            
            // Set plot button as active since we just created a plot
            setTimeout(() => {
                const drawBtn = document.querySelector('.draw-btn');
                if (drawBtn) {
                    drawBtn.classList.add('active');
                }
                
                // After startup example is drawn, deactivate plot button
                setTimeout(() => {
                    if (reachabilityControl && reachabilityControl._drawMode && reachabilityControl._toggleDraw) {
                        reachabilityControl._toggleDraw(); // Disable draw mode
                        updateDrawButtonState(); // Update button visual state
                        console.log('Startup example completed, plot button deactivated');
                    }
                }, 1000); // Additional delay to ensure isochrone is fully rendered
            }, 500); // Small delay to ensure plot is completed
        }, 1000); // Delay to ensure plugin is fully initialized
    }

    // Call initialization after everything is set up
    setTimeout(initializeDefaultExample, 1500);

    // Listen for reachability events
    map.on('reachability:displayed', function() {
        updateStatistics();
        updateDrawButtonState(); // Update button state when analysis is displayed
    });
    map.on('reachability:delete', function() {
        updateStatistics();
        updateDrawButtonState(); // Update button state when analysis is deleted
    });
    
    // Error handling
    map.on('reachability:error', function () {
        alert('Unfortunately there has been an error calling the API.\nMore details are available in the console.');
    });

    map.on('reachability:no_data', function () {
        alert('Unfortunately no data was received from the API.');
    });
}

/**
 * Select travel mode and sync with reachability control
 * This is the critical function that synchronizes the travel modes
 */
function selectTravelMode(mode) {
    currentTravelMode = mode;
    
    // This directly passes the API profile name to the reachability control
    if (reachabilityControl && reachabilityControl._toggleTravelMode) {
        reachabilityControl._toggleTravelMode(mode);
        console.log(`Travel mode set to: ${mode}`);
    }
    
    // Update legend visibility
    updateLegendDisplay(mode);
}

/**
 * Update legend display based on current travel mode
 */
function updateLegendDisplay(mode) {
    const legendItems = document.querySelectorAll('.legend-item');
    legendItems.forEach(item => {
        const span = item.querySelector('span');
        if (span) {
            const modeText = span.textContent.toLowerCase();
            
            // Always keep subway stations legend active
            if (modeText === 'subway stations') {
                item.style.opacity = '1';
                return;
            }
            
            const isActive = mode.includes(modeText) || 
                           (mode === 'foot-walking' && modeText === 'walking') ||
                           (mode === 'cycling-regular' && modeText === 'cycling') ||
                           (mode === 'driving-car' && modeText === 'driving');
            
            item.style.opacity = isActive ? '1' : '0.3';
        }
    });
}

/**
 * Select analysis type (time/distance) - properly calls plugin functions
 */
function selectAnalysisType(type) {
    if (reachabilityControl) {
        if (type === 'time') {
            reachabilityControl._setRangeByTime();
            updateRangeDropdown('time');
        } else {
            reachabilityControl._setRangeByDistance();
            updateRangeDropdown('distance');
        }
        console.log(`Analysis type set to: ${type}`);
    }
}

/**
 * Update the range dropdown options based on analysis type
 */
function updateRangeDropdown(type) {
    const rangeSelect = document.getElementById('range-value');
    const rangeLabel = rangeSelect.previousElementSibling;
    
    // Clear existing options
    rangeSelect.innerHTML = '';
    
    if (type === 'time') {
        rangeLabel.textContent = 'Time Range (minutes):';
        
        // Use the same logic as the plugin for time ranges
        const timeMax = 30;
        const timeInterval = 5;
        for (let i = timeInterval; i <= timeMax; i += timeInterval) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i} min`;
            if (i === 10) option.selected = true; // Default to 10 minutes
            rangeSelect.appendChild(option);
        }
    } else {
        rangeLabel.textContent = 'Distance Range (km):';
        
        // Use the same logic as the plugin for distance ranges
        const distanceMax = 5;
        const distanceInterval = 0.5;
        const decimalPlaces = Math.max(
            countDecimalPlaces(distanceMax), 
            countDecimalPlaces(distanceInterval)
        );
        
        for (let i = distanceInterval; i <= distanceMax; i += distanceInterval) {
            // Fix floating point precision issues like the plugin does
            if (String(i).length > i.toFixed(decimalPlaces).length) {
                i = parseFloat(i.toFixed(decimalPlaces));
            }
            
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i} km`;
            if (i === 1) option.selected = true; // Default to 1 km
            rangeSelect.appendChild(option);
        }
    }
}

/**
 * Helper function to count decimal places (same as plugin's _decimalPlaces)
 */
function countDecimalPlaces(value) {
    if (Math.floor(value) === value) return 0;
    return value.toString().split(".")[1].length || 0;
}

/**
 * Update interval settings
 */
function updateIntervalSettings(showIntervals) {
    if (reachabilityControl && reachabilityControl._toggleIntervals) {
        reachabilityControl._toggleIntervals(showIntervals);
        console.log(`Show intervals: ${showIntervals}`);
    }
}

/**
 * Toggle draw mode
 */
/**
 * Update the visual state of the draw button to match the plugin state
 */
function updateDrawButtonState() {
    const drawBtn = document.querySelector('.draw-btn');
    if (reachabilityControl && drawBtn) {
        if (reachabilityControl._drawMode) {
            drawBtn.classList.add('active');
        } else {
            drawBtn.classList.remove('active');
        }
    }
}

function toggleDrawMode() {
    const drawBtn = document.querySelector('.draw-btn');
    
    if (reachabilityControl && reachabilityControl._toggleDraw) {
        reachabilityControl._toggleDraw();
        
        // Sync the visual state with the plugin's actual state
        if (reachabilityControl._drawMode) {
            drawBtn.classList.add('active');
        } else {
            drawBtn.classList.remove('active');
        }
        
        console.log('Draw mode toggled, active:', reachabilityControl._drawMode);
    }
}

/**
 * Clear all analyses
 */
function clearAllAnalyses() {
    if (reachabilityControl && reachabilityControl._toggleDelete) {
        reachabilityControl._toggleDelete();
        analysisCount = 0;
        updateStatistics();
        
        // Reset draw button state when clearing
        const drawBtn = document.querySelector('.draw-btn');
        drawBtn.classList.remove('active');
        
        console.log('Clear mode toggled');
    }
}

/**
 * Export to GeoJSON
 */
function exportGeoJSON() {
    if (reachabilityControl && reachabilityControl._exportGeoJSON) {
        reachabilityControl._exportGeoJSON();
        console.log('GeoJSON export initiated');
    } else {
        alert('Export function not available.');
    }
}

/**
 * Update statistics display
 */
function updateStatistics() {
    if (reachabilityControl && reachabilityControl.isolinesGroup) {
        // Get the number of analysis groups (layers)
        const layerCount = reachabilityControl.isolinesGroup.getLayers().length;
        document.getElementById('analysis-count').textContent = layerCount;
        
        // Calculate total area by getting GeoJSON and summing areas
        let totalArea = 0;
        if (layerCount > 0) {
            try {
                const geoJSON = reachabilityControl.isolinesGroup.toGeoJSON();
                if (geoJSON && geoJSON.features) {
                    geoJSON.features.forEach(feature => {
                        if (feature.properties && feature.properties.Area) {
                            // Area is likely in m², convert to km²
                            const areaInM2 = parseFloat(feature.properties.Area);
                            if (!isNaN(areaInM2)) {
                                // Convert m² to km² (divide by 1,000,000)
                                totalArea += areaInM2 / 1000000;
                            }
                        }
                    });
                }
            } catch (error) {
                console.log('Error calculating total area:', error);
            }
        }
        
        // Display total area in km²
        document.getElementById('total-area').textContent = `${totalArea.toFixed(2)} km²`;
    } else {
        // Fallback if plugin not ready
        document.getElementById('analysis-count').textContent = '0';
        document.getElementById('total-area').textContent = '0 km²';
    }
}

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing map...');
    initMap();
    
    console.log('NYC Manhattan Reachability Map loaded successfully');
});

// Search for a location using geocoding
async function searchLocation() {
    const input = document.getElementById('location-input');
    const dropdown = document.getElementById('location-dropdown');
    const query = input.value.trim();
    
    if (!query) {
        alert('Please enter a location to search for.');
        return;
    }
    
    // Hide dropdown initially
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    
    try {
        // Try to parse as coordinates first (lat,lng or lng,lat)
        const coords = parseCoordinates(query);
        if (coords) {
            // For coordinates, show a single item in dropdown instead of plotting immediately
            showCoordinateDropdown(coords.lat, coords.lng, query);
            return;
        }
        
        // If not coordinates, use geocoding service
        const response = await fetch(
            `https://api.openrouteservice.org/geocode/search?api_key=${getCurrentApiKey()}&text=${encodeURIComponent(query)}&boundary.rect.min_lon=-74.0479&boundary.rect.min_lat=40.6892&boundary.rect.max_lon=-73.9067&boundary.rect.max_lat=40.8820&size=8`
        );
        
        if (!response.ok) {
            throw new Error('Geocoding service unavailable');
        }
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            // Show dropdown with multiple results
            showLocationDropdown(data.features);
        } else {
            alert('Location not found. Please try a different search term or use coordinates.');
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        alert('Error searching for location. Please try again or use coordinates.');
    }
}

// Show dropdown for coordinate input
async function showCoordinateDropdown(lat, lng, originalQuery) {
    const dropdown = document.getElementById('location-dropdown');
    dropdown.innerHTML = '';
    
    try {
        // Try to get a proper location name via reverse geocoding
        const response = await fetch(
            `https://api.openrouteservice.org/geocode/reverse?api_key=${getCurrentApiKey()}&point.lon=${lng}&point.lat=${lat}&size=1`
        );
        
        let locationName = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        let locationAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                locationName = feature.properties.label || feature.properties.name || locationName;
                locationAddress = feature.properties.label || locationAddress;
            }
        }
        
        // Create dropdown item for the coordinate
        const item = document.createElement('div');
        item.className = 'location-dropdown-item';
        item.setAttribute('data-lat', lat);
        item.setAttribute('data-lng', lng);
        item.setAttribute('data-name', locationName);
        
        // Create name and address elements
        const nameDiv = document.createElement('div');
        nameDiv.className = 'location-name';
        nameDiv.textContent = locationName;
        
        const addressDiv = document.createElement('div');
        addressDiv.className = 'location-address';
        addressDiv.textContent = locationAddress;
        
        item.appendChild(nameDiv);
        item.appendChild(addressDiv);
        
        // Add click handler
        item.addEventListener('click', function() {
            const itemLat = parseFloat(this.getAttribute('data-lat'));
            const itemLng = parseFloat(this.getAttribute('data-lng'));
            const itemName = this.getAttribute('data-name');
            
            plotLocation(itemLat, itemLng, itemName);
            hideLocationDropdown();
        });
        
        dropdown.appendChild(item);
        
    } catch (error) {
        console.log('Reverse geocoding failed for dropdown:', error);
        
        // Fallback: create dropdown item with coordinates
        const item = document.createElement('div');
        item.className = 'location-dropdown-item';
        item.setAttribute('data-lat', lat);
        item.setAttribute('data-lng', lng);
        item.setAttribute('data-name', originalQuery);
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'location-name';
        nameDiv.textContent = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        
        const addressDiv = document.createElement('div');
        addressDiv.className = 'location-address';
        addressDiv.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        item.appendChild(nameDiv);
        item.appendChild(addressDiv);
        
        item.addEventListener('click', function() {
            plotLocation(lat, lng, originalQuery);
            hideLocationDropdown();
        });
        
        dropdown.appendChild(item);
    }
    
    // Show dropdown
    dropdown.style.display = 'block';
    
    // Add click outside handler to close dropdown
    setTimeout(() => {
        document.addEventListener('click', handleDropdownClickOutside);
    }, 100);
}

// Show dropdown with location search results
function showLocationDropdown(features) {
    const dropdown = document.getElementById('location-dropdown');
    dropdown.innerHTML = '';
    
    features.forEach((feature, index) => {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;
        
        const item = document.createElement('div');
        item.className = 'location-dropdown-item';
        item.setAttribute('data-lat', lat);
        item.setAttribute('data-lng', lng);
        item.setAttribute('data-name', props.label || props.name || 'Unknown location');
        
        // Create name and address elements
        const nameDiv = document.createElement('div');
        nameDiv.className = 'location-name';
        nameDiv.textContent = props.name || props.label || 'Unknown location';
        
        const addressDiv = document.createElement('div');
        addressDiv.className = 'location-address';
        addressDiv.textContent = props.label || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        item.appendChild(nameDiv);
        item.appendChild(addressDiv);
        
        // Add click handler
        item.addEventListener('click', function() {
            const itemLat = parseFloat(this.getAttribute('data-lat'));
            const itemLng = parseFloat(this.getAttribute('data-lng'));
            const itemName = this.getAttribute('data-name');
            
            plotLocation(itemLat, itemLng, itemName);
            hideLocationDropdown();
        });
        
        dropdown.appendChild(item);
    });
    
    // Show dropdown
    dropdown.style.display = 'block';
    
    // Add click outside handler to close dropdown
    setTimeout(() => {
        document.addEventListener('click', handleDropdownClickOutside);
    }, 100);
}

// Hide the location dropdown
function hideLocationDropdown() {
    const dropdown = document.getElementById('location-dropdown');
    dropdown.style.display = 'none';
    document.removeEventListener('click', handleDropdownClickOutside);
}

// Handle clicks outside the dropdown
function handleDropdownClickOutside(event) {
    const dropdown = document.getElementById('location-dropdown');
    const input = document.getElementById('location-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (!dropdown.contains(event.target) && 
        !input.contains(event.target) && 
        !searchBtn.contains(event.target)) {
        hideLocationDropdown();
    }
}

// Plot location from direct input (coordinates or search if not coordinates)
function plotFromInput() {
    const input = document.getElementById('location-input');
    const query = input.value.trim();
    
    if (!query) {
        alert('Please enter coordinates (latitude, longitude) or a location name.');
        return;
    }
    
    // Hide any open dropdown first
    hideLocationDropdown();
    
    // Try to parse as coordinates first
    const coords = parseCoordinates(query);
    if (coords) {
        // Try to reverse geocode coordinates to get a proper location name
        reverseGeocodeAndPlot(coords.lat, coords.lng, query);
    } else {
        // If not coordinates, treat it as a search and plot the first result
        searchAndPlotFirst(query);
    }
}

// Reverse geocode coordinates to get location name, then plot
async function reverseGeocodeAndPlot(lat, lng, originalQuery) {
    try {
        // Try reverse geocoding to get a proper location name
        const response = await fetch(
            `https://api.openrouteservice.org/geocode/reverse?api_key=${getCurrentApiKey()}&point.lon=${lng}&point.lat=${lat}&size=1`
        );
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                const locationName = feature.properties.label || feature.properties.name || originalQuery;
                plotLocation(lat, lng, locationName);
                return;
            }
        }
    } catch (error) {
        console.log('Reverse geocoding failed:', error);
    }
    
    // If reverse geocoding fails, use original query or fallback name
    const fallbackName = originalQuery.includes(',') ? 
        `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}` : 
        originalQuery;
    plotLocation(lat, lng, fallbackName);
}

// Search for a location and plot the first result directly
async function searchAndPlotFirst(query) {
    try {
        // Use geocoding service
        const response = await fetch(
            `https://api.openrouteservice.org/geocode/search?api_key=${getCurrentApiKey()}&text=${encodeURIComponent(query)}&boundary.rect.min_lon=-74.0479&boundary.rect.min_lat=40.6892&boundary.rect.max_lon=-73.9067&boundary.rect.max_lat=40.8820&size=1`
        );
        
        if (!response.ok) {
            throw new Error('Geocoding service unavailable');
        }
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const [lng, lat] = feature.geometry.coordinates;
            const name = feature.properties.label || query;
            
            plotLocation(lat, lng, name);
        } else {
            alert('Location not found. Please try coordinates like: 40.7589, -73.9851');
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        alert('Error finding location. Please try coordinates like: 40.7589, -73.9851');
    }
}

// Parse coordinate string in various formats
function parseCoordinates(input) {
    // Remove extra whitespace and normalize
    const cleaned = input.replace(/\s+/g, ' ').trim();
    
    // Try different coordinate formats
    const patterns = [
        // Standard lat,lng format
        /^(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)$/,
        // With degree symbols
        /^(-?\d+\.?\d*)°?\s*,?\s*(-?\d+\.?\d*)°?$/,
        // With N/S E/W indicators
        /^(\d+\.?\d*)\s*[NS]\s*,?\s*(\d+\.?\d*)\s*[EW]$/i
    ];
    
    for (const pattern of patterns) {
        const match = cleaned.match(pattern);
        if (match) {
            let lat = parseFloat(match[1]);
            let lng = parseFloat(match[2]);
            
            // Handle N/S E/W indicators
            if (/[SW]/i.test(cleaned)) {
                if (cleaned.toLowerCase().includes('s')) lat = -lat;
                if (cleaned.toLowerCase().includes('w')) lng = -lng;
            }
            
            // Validate coordinate ranges
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return { lat, lng };
            }
        }
    }
    
    return null;
}

// Plot a location on the map and run reachability analysis
function plotLocation(lat, lng, name) {
    // Check if coordinates are within NYC area
    if (lat < 40.4774 || lat > 40.9176 || lng < -74.2591 || lng > -73.7004) {
        const proceed = confirm(`The location "${name}" appears to be outside the NYC area. Plot anyway?`);
        if (!proceed) return;
    }
    
    // Clear existing marker if any
    if (window.currentLocationMarker) {
        map.removeLayer(window.currentLocationMarker);
    }
    
    // Create marker with enhanced popup
    const nearestStationsInfo = showNearestStationsInfo(lat, lng);
    const popupContent = `
        <div class="location-popup">
            <h4>${name}</h4>
            <p><strong>Coordinates:</strong><br/>${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
            <div style="margin-top: 8px;">${nearestStationsInfo}</div>
        </div>
    `;
    
    window.currentLocationMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'location-marker',
            html: '<div style="background: #ff4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(map);
    
    // Bind popup to marker
    window.currentLocationMarker.bindPopup(popupContent);
    
    // Pan to location
    map.setView([lat, lng], Math.max(map.getZoom(), 14));
    
    // Run reachability analysis exactly like map click does
    if (reachabilityControl) {
        const latLngObj = L.latLng(lat, lng);
        console.log('Triggering reachability analysis at:', latLngObj);
        
        // Ensure draw mode is active first (like clicking the draw button)
        if (!reachabilityControl._drawMode) {
            reachabilityControl._activateDraw();
        }
        
        // Create a proper click event like the map does
        const clickEvent = {
            latlng: latLngObj,
            originalEvent: { target: map.getContainer() }
        };
        
        // Call the same function that map clicks call
        reachabilityControl._registerDrawRequest(clickEvent);
    }
    
    // Update input field with location name instead of coordinates
    const input = document.getElementById('location-input');
    input.value = name;
    
    console.log(`Plotted location: ${name} at ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
}

/**
 * Error handling for API failures
 */
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
});

// Export functions for debugging
window.debugFunctions = {
    selectTravelMode,
    selectAnalysisType,
    clearAllAnalyses,
    exportGeoJSON,
    updateStatistics,
    searchLocation,
    showCoordinateDropdown,
    showLocationDropdown,
    hideLocationDropdown,
    plotFromInput,
    searchAndPlotFirst,
    reverseGeocodeAndPlot,
    parseCoordinates,
    plotLocation,
    toggleMetroLayers,
    initializeMetroSystem,
    loadMTAData,
    drawSubwayLinesFromMTA,
    drawSubwayStationsFromMTA
};

/**
 * Initialize the NYC Metro System visualization
 */
async function initializeMetroSystem() {
    try {
        console.log('=== STARTING METRO SYSTEM INITIALIZATION ===');
        console.log('METRO_CONFIG available:', typeof METRO_CONFIG !== 'undefined' ? 'YES' : 'NO');
        console.log('SUBWAY_COLORS available:', typeof SUBWAY_COLORS !== 'undefined' ? 'YES' : 'NO');
        console.log('SUBWAY_LINE_ROUTES available:', typeof SUBWAY_LINE_ROUTES !== 'undefined' ? 'YES' : 'NO');
        console.log('loadMTAData available:', typeof loadMTAData !== 'undefined' ? 'YES' : 'NO');
        
        console.log('Initializing metro system with MTA CSV data...');
        
        // Load MTA data from CSV
        console.log('About to call loadMTAData()...');
        mtaData = await loadMTAData();
        console.log('MTA data loaded:', mtaData ? 'SUCCESS' : 'FAILED');
        if (mtaData) {
            console.log('MTA data structure:', {
                stations: mtaData.stations ? mtaData.stations.length : 'NO STATIONS',
                lines: mtaData.lines ? Object.keys(mtaData.lines).length : 'NO LINES',
                colors: mtaData.colors ? Object.keys(mtaData.colors).length : 'NO COLORS'
            });
        }
        
        // Create layer groups for metro lines and stations with proper z-index ordering
        metroLinesGroup = L.layerGroup().addTo(map);
        metroStationsGroup = L.layerGroup().addTo(map);
        
        // Set z-index on the layer groups to ensure stations appear above lines
        metroLinesGroup.getPane = function() { return map.getPane('overlayPane'); };
        metroStationsGroup.getPane = function() { return map.getPane('overlayPane'); };
        
        // Create custom panes for proper z-index control
        if (!map.getPane('metro-lines')) {
            map.createPane('metro-lines');
            map.getPane('metro-lines').style.zIndex = METRO_CONFIG.zIndexOffset - 200; // Lines behind stations
        }
        if (!map.getPane('metro-stations')) {
            map.createPane('metro-stations');
            map.getPane('metro-stations').style.zIndex = METRO_CONFIG.zIndexOffset + 300; // Stations on top
        }
        if (!map.getPane('wheelchair-icons')) {
            map.createPane('wheelchair-icons');
            map.getPane('wheelchair-icons').style.zIndex = METRO_CONFIG.zIndexOffset + 400; // Wheelchair icons on top of stations
        }
        
        // Ensure popups appear above everything by adjusting the popup pane z-index
        map.getPane('popupPane').style.zIndex = METRO_CONFIG.zIndexOffset + 500;
        
        // Remove and re-add layer groups with custom panes
        map.removeLayer(metroLinesGroup);
        map.removeLayer(metroStationsGroup);
        metroLinesGroup = L.layerGroup({pane: 'metro-lines'}).addTo(map);
        metroStationsGroup = L.layerGroup({pane: 'metro-stations'}).addTo(map);
        
        // Draw subway lines using MTA data  
        drawSubwayLinesFromMTA();
        
        // Draw subway stations using MTA data
        drawSubwayStationsFromMTA();
        
        console.log('Metro system initialized with', mtaData.stations.length, 'stations (lines disabled)');
        
    } catch (error) {
        console.error('Error initializing metro system:', error);
        
        // Fallback to original hardcoded initialization
        metroLinesGroup = L.layerGroup().addTo(map);
        metroStationsGroup = L.layerGroup().addTo(map);
        
        // Set z-index on the layer groups to ensure stations appear above lines
        metroLinesGroup.getPane = function() { return map.getPane('overlayPane'); };
        metroStationsGroup.getPane = function() { return map.getPane('overlayPane'); };
        
        // Create custom panes for proper z-index control
        if (!map.getPane('metro-lines')) {
            map.createPane('metro-lines');
            map.getPane('metro-lines').style.zIndex = METRO_CONFIG.zIndexOffset - 200; // Lines behind stations
        }
        if (!map.getPane('metro-stations')) {
            map.createPane('metro-stations');
            map.getPane('metro-stations').style.zIndex = METRO_CONFIG.zIndexOffset + 300; // Stations on top
        }
        if (!map.getPane('wheelchair-icons')) {
            map.createPane('wheelchair-icons');
            map.getPane('wheelchair-icons').style.zIndex = METRO_CONFIG.zIndexOffset + 400; // Wheelchair icons on top of stations
        }
        
        // Ensure popups appear above everything by adjusting the popup pane z-index
        map.getPane('popupPane').style.zIndex = METRO_CONFIG.zIndexOffset + 500;
        
        // Remove and re-add layer groups with custom panes
        map.removeLayer(metroLinesGroup);
        map.removeLayer(metroStationsGroup);
        metroLinesGroup = L.layerGroup({pane: 'metro-lines'}).addTo(map);
        metroStationsGroup = L.layerGroup({pane: 'metro-stations'}).addTo(map);
        drawSubwayLines();
        drawSubwayStations();
    }
}

/**
 * Draw subway lines using GeoJSON data from mta-lines.geojson
 */
async function drawSubwayLinesFromMTA() {
    console.log('Loading subway lines from GeoJSON...');
    
    try {
        // Clear existing lines
        metroLinesGroup.clearLayers();
        
        // Load GeoJSON data
        const response = await fetch('./mta-lines.geojson');
        if (!response.ok) {
            throw new Error(`Failed to load GeoJSON: ${response.status}`);
        }
        
        const geojsonData = await response.json();
        console.log('GeoJSON loaded, processing features...');
        
        // Process each subway line feature
        geojsonData.features.forEach(feature => {
            const properties = feature.properties;
            const geometry = feature.geometry;
            
            if (geometry.type === 'MultiLineString') {
                const lineId = properties.rt_symbol || properties.name || 'Unknown';
                const color = SUBWAY_COLORS[lineId] || '#666666';
                
                console.log(`Processing line: ${lineId} with color: ${color}`);
                
                // Extract coordinates from MultiLineString
                const coordinates = geometry.coordinates.map(lineString => 
                    lineString.map(coord => [coord[1], coord[0]]) // Convert [lng, lat] to [lat, lng]
                );
                
                // Create polylines for each segment
                coordinates.forEach((coordsArray, index) => {
                    const polyline = L.polyline(coordsArray, {
                        color: color,
                        weight: map.getZoom() <= 12 ? 2 : 3,
                        opacity: 0.8,
                        pane: 'metro-lines',
                        className: 'subway-line',
                        lineId: lineId
                    });
                    
                    // Hover effects disabled for subway lines
                    /*
                    polyline.on('mouseover', function(e) {
                        const layer = e.target;
                        layer.setStyle({
                            weight: map.getZoom() <= 12 ? 4 : 5,
                            opacity: 1
                        });
                    });
                    
                    polyline.on('mouseout', function(e) {
                        const layer = e.target;
                        layer.setStyle({
                            weight: map.getZoom() <= 12 ? 2 : 3,
                            opacity: 0.8
                        });
                    });
                    */
                    
                    metroLinesGroup.addLayer(polyline);
                });
            }
        });
        
        console.log(`Subway lines drawn successfully from GeoJSON: ${geojsonData.features.length} features processed`);
        
    } catch (error) {
        console.error('Error loading subway lines from GeoJSON:', error);
        // Fallback to hardcoded routes if available
        if (typeof SUBWAY_LINE_ROUTES !== 'undefined') {
            console.log('Falling back to hardcoded routes...');
            drawSubwayLinesFromHardcodedData();
        }
    }
}

/**
 * Fallback function using hardcoded subway routes
 */
function drawSubwayLinesFromHardcodedData() {
    if (!mtaData || !mtaData.lines) {
        console.log('No MTA line data available for fallback');
        return;
    }

    console.log('Drawing subway lines from hardcoded data (fallback)...');
    
    // Clear existing lines
    metroLinesGroup.clearLayers();
    
    // Use the detailed geographic routes from subway-routes.js
    Object.keys(SUBWAY_LINE_ROUTES).forEach(lineId => {
        if (mtaData.lines[lineId]) {
            const route = SUBWAY_LINE_ROUTES[lineId];
            const color = SUBWAY_COLORS[lineId] || '#666666';
            
            // Create polyline for the route
            const polyline = L.polyline(route, {
                color: color,
                weight: map.getZoom() <= 12 ? 1 : 2,
                opacity: 0.8,
                pane: 'metro-lines',
                className: 'subway-line',
                lineId: lineId
            });
            
            // Hover effects disabled for subway lines
            /*
            polyline.on('mouseover', function(e) {
                const layer = e.target;
                layer.setStyle({
                    weight: map.getZoom() <= 12 ? 3 : 4,
                    opacity: 1
                });
            });
            
            polyline.on('mouseout', function(e) {
                const layer = e.target;
                layer.setStyle({
                    weight: map.getZoom() <= 12 ? 1 : 2,
                    opacity: 0.8
                });
            });
            */
            
            metroLinesGroup.addLayer(polyline);
        }
    });
    
    console.log('Subway lines drawn successfully from hardcoded data');
}

/**
 * Draw subway lines using hardcoded data (fallback)
 */
function drawSubwayLines() {
    // Lines are disabled - only showing stations
    console.log('Subway lines disabled (fallback) - showing stations only');
    return;
}

/**
 * Draw subway lines using GeoJSON data
 */
async function drawSubwayLinesFromGeoJSON() {
    try {
        console.log('Loading MTA subway lines from GeoJSON...');
        
        // Load the GeoJSON file
        const response = await fetch('mta-lines.geojson');
        if (!response.ok) {
            throw new Error('GeoJSON file not found or empty');
        }
        
        const geojsonData = await response.json();
        
        if (!geojsonData.features || geojsonData.features.length === 0) {
            throw new Error('No features found in GeoJSON');
        }
        
        // Add GeoJSON layer to map with dynamic styling based on zoom
        const subwayLinesLayer = L.geoJSON(geojsonData, {
            pane: 'metro-lines', // Assign to lines pane
            style: function(feature) {
                // Get line color from properties or default colors
                const lineId = feature.properties.rt_symbol || feature.properties.route_id || feature.properties.line || feature.properties.name;
                const lineColor = getLineColor(lineId);
                
                // Dynamic line weight based on zoom level
                const currentZoom = map.getZoom();
                const lineWeight = currentZoom >= 14 ? 2 : 1; // 2px when zoomed in, 1px when zoomed out
                
                return {
                    color: lineColor,
                    weight: lineWeight,
                    opacity: 0.8
                };
            },
            onEachFeature: function(feature, layer) {
                // Add hover effect like stations
                layer.on('mouseover', function() {
                    this.setStyle({
                        weight: 3,
                        opacity: 1
                    });
                });
                
                layer.on('mouseout', function() {
                    const currentZoom = map.getZoom();
                    const lineWeight = currentZoom >= 14 ? 2 : 1;
                    this.setStyle({
                        weight: lineWeight,
                        opacity: 0.8
                    });
                });
            }
        });
        
        // Add layer to map
        subwayLinesLayer.addTo(metroLinesGroup);
        
        // Store reference for zoom updates
        if (!window.subwayLinesLayer) {
            window.subwayLinesLayer = subwayLinesLayer;
        }
        
        console.log('MTA subway lines loaded from GeoJSON successfully');
        
    } catch (error) {
        console.warn('Failed to load subway lines from GeoJSON:', error);
        console.log('Falling back to hardcoded line data...');
        drawSubwayLines(); // Fallback to existing method
    }
}

/**
 * Get line color based on route ID
 */
function getLineColor(routeId) {
    if (!routeId) return '#808183';
    
    // Clean up route ID (remove spaces, convert to uppercase)
    const cleanRouteId = routeId.toString().trim().toUpperCase();
    
    // Check both SUBWAY_COLORS and mtaData.colors
    return SUBWAY_COLORS[cleanRouteId] || 
           (mtaData && mtaData.colors ? mtaData.colors[cleanRouteId] : null) ||
           '#808183'; // Default gray
}

/**
 * Draw subway stations using MTA CSV data
 */
function drawSubwayStationsFromMTA() {
    if (!mtaData || !mtaData.stations) {
        console.warn('No MTA station data available, falling back to hardcoded data');
        drawSubwayStations();
        return;
    }
    
    // Get unique stations to avoid duplicates
    const uniqueStations = getUniqueStations(mtaData.stations);
    console.log('Processing stations by borough:');
    const boroughCounts = {};
    uniqueStations.forEach(station => {
        boroughCounts[station.borough] = (boroughCounts[station.borough] || 0) + 1;
    });
    console.log('Borough station counts:', boroughCounts);
    
    uniqueStations.forEach(station => {
        // Skip stations with invalid coordinates
        if (!station.lat || !station.lng || isNaN(station.lat) || isNaN(station.lng)) return;
        
        // All stations use blue color
        const stationColor = '#0073d4'; // Blue color for all stations
        
        // Create station marker with blue color (dynamic sizing based on zoom)
        const baseRadius = map.getZoom() >= 14 ? 4 : METRO_CONFIG.stationRadius;
        const marker = L.circleMarker([station.lat, station.lng], {
            radius: baseRadius + 1, // Slightly larger for better visibility
            weight: METRO_CONFIG.stationWeight,
            color: '#ffffff', // White border for contrast
            fillColor: stationColor, // Blue fill for all stations
            fillOpacity: 0.9, // Slightly more opaque
            pane: 'metro-stations' // Assign to stations pane for proper z-index
        });
        
        // Add wheelchair icon for ADA accessible stations
        if (station.ada) {
            const wheelchairIcon = L.divIcon({
                html: '<div style="color: white; font-size: 10px; text-align: center; line-height: 12px; font-weight: bold;">♿</div>',
                className: 'wheelchair-icon',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            });
            
            const wheelchairMarker = L.marker([station.lat, station.lng], {
                icon: wheelchairIcon,
                pane: 'wheelchair-icons',
                interactive: false // Disable all mouse interactions for wheelchair markers
            });
            
            metroStationsGroup.addLayer(wheelchairMarker);
        }
        
        // Create popup content with station information
        const linesHtml = station.lines.map(line => {
            const color = mtaData.colors[line] || '#808183';
            return `<span style="background-color: ${color}; color: white; padding: 2px 6px; margin: 1px; border-radius: 3px; font-weight: bold;">${line}</span>`;
        }).join(' ');
        
        const adaStatus = station.ada ? '<span style="color: green;">♿ ADA Accessible</span>' : '<span style="color: #999;">Not ADA Accessible</span>';
        
        const popupContent = `
            <h4>${station.name}</h4>
            <p><strong>Borough:</strong> ${getBoroughName(station.borough)}</p>
            <p><strong>Lines:</strong><br/>${linesHtml}</p>
            <p><strong>Structure:</strong> ${station.structure}</p>
            <p><strong>Accessibility:</strong><br/>${adaStatus}</p>
            <p><strong>Coordinates:</strong><br/>${station.lat.toFixed(4)}, ${station.lng.toFixed(4)}</p>
            <button onclick="plotLocation(${station.lat}, ${station.lng}, '${station.name}')" 
                    style="background: #0073d4; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                Analyze from here
            </button>
        `;
        
        marker.bindPopup(popupContent);
        
        // No labels - clean visualization
        
        metroStationsGroup.addLayer(marker);
    });
    
    // Add zoom event listener to update station sizes
    map.on('zoomend', updateStationSizes);
}

/**
 * Draw subway stations using hardcoded data (fallback)
 */
function drawSubwayStations() {
    console.log('Using fallback subway station data');
    
    SUBWAY_STATIONS.forEach(station => {
        // Determine station color based on primary line
        let stationColor = METRO_CONFIG.stationColor; // Default white
        if (station.lines && station.lines.length > 0) {
            // Use the color of the first line as the primary color
            stationColor = SUBWAY_COLORS[station.lines[0]] || METRO_CONFIG.stationColor;
        }
        
        // Create station marker with line color
        // Create station marker with line color (dynamic sizing based on zoom)
        const baseRadius = map.getZoom() >= 14 ? 4 : METRO_CONFIG.stationRadius;
        const marker = L.circleMarker([station.lat, station.lng], {
            radius: baseRadius + 1,
            weight: METRO_CONFIG.stationWeight,
            color: '#ffffff', // White border for contrast
            fillColor: stationColor, // Use line color as fill
            fillOpacity: 0.9,
            zIndexOffset: METRO_CONFIG.zIndexOffset + 100
        });
        
        // Create popup content with station information
        const linesHtml = station.lines.map(line => {
            const color = SUBWAY_COLORS[line] || '#808183';
            return `<span style="background-color: ${color}; color: white; padding: 2px 6px; margin: 1px; border-radius: 3px; font-weight: bold;">${line}</span>`;
        }).join(' ');
        
        const popupContent = `
            <h4>${station.name}</h4>
            <p><strong>Lines:</strong><br/>${linesHtml}</p>
            <p><strong>Coordinates:</strong><br/>${station.lat.toFixed(4)}, ${station.lng.toFixed(4)}</p>
            <button onclick="plotLocation(${station.lat}, ${station.lng}, '${station.name}')" 
                    style="background: #0073d4; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                Analyze from here
            </button>
        `;
        
        marker.bindPopup(popupContent);
        
        // No labels - clean visualization
        
        metroStationsGroup.addLayer(marker);
    });
    
    // Add zoom event listener to update station sizes
    map.on('zoomend', updateStationSizes);
}

/**
 * Update station sizes and line weights based on zoom level
 */
function updateStationSizes() {
    const currentZoom = map.getZoom();
    const newRadius = currentZoom >= 14 ? 4 : METRO_CONFIG.stationRadius;
    const newLineWeight = currentZoom >= 14 ? 2 : 1;
    
    // Update station sizes
    metroStationsGroup.eachLayer(function(layer) {
        if (layer instanceof L.CircleMarker) {
            layer.setRadius(newRadius + 1);
        }
    });
    
    // Update line weights in metroLinesGroup
    metroLinesGroup.eachLayer(function(layer) {
        if (layer.setStyle) {
            layer.setStyle({ weight: newLineWeight });
        }
    });
    
    // Update line weights in legacy subwayLinesLayer if it exists
    if (window.subwayLinesLayer) {
        window.subwayLinesLayer.eachLayer(function(layer) {
            if (layer.setStyle) {
                layer.setStyle({ weight: newLineWeight });
            }
        });
    }
}

/**
 * Convert borough code to full name
 */
function getBoroughName(code) {
    const boroughs = {
        'M': 'Manhattan',
        'Bk': 'Brooklyn', 
        'Q': 'Queens',
        'Bx': 'Bronx',
        'SI': 'Staten Island'
    };
    return boroughs[code] || code;
}

/**
 * Toggle metro layers visibility
 */
function toggleMetroLayers() {
    if (metroLayersVisible) {
        // Grey out stations and lines instead of removing them
        metroStationsGroup.eachLayer(function(layer) {
            if (layer.getElement) {
                layer.getElement().classList.add('inactive');
            } else if (layer._path) {
                layer._path.classList.add('inactive');
            }
        });
        
        metroLinesGroup.eachLayer(function(layer) {
            if (layer.getElement) {
                layer.getElement().classList.add('inactive');
            } else if (layer._path) {
                layer._path.classList.add('inactive');
            }
        });
        
        metroLayersVisible = false;
        
        // Update button text
        const toggleBtn = document.querySelector('.metro-toggle-btn');
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fa fa-train"></i><span>Show Stations</span>';
            toggleBtn.classList.remove('active');
        }
    } else {
        // Remove inactive class to restore normal appearance
        metroStationsGroup.eachLayer(function(layer) {
            if (layer.getElement) {
                layer.getElement().classList.remove('inactive');
            } else if (layer._path) {
                layer._path.classList.remove('inactive');
            }
        });
        
        metroLinesGroup.eachLayer(function(layer) {
            if (layer.getElement) {
                layer.getElement().classList.remove('inactive');
            } else if (layer._path) {
                layer._path.classList.remove('inactive');
            }
        });
        
        metroLayersVisible = true;
        
        // Update button text
        const toggleBtn = document.querySelector('.metro-toggle-btn');
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fa fa-train"></i><span>Hide Stations</span>';
            toggleBtn.classList.add('active');
        }
    }
}

/**
 * Get nearest subway stations to a given location
 */
function getNearestStations(lat, lng, maxDistance = 1000, maxResults = 5) {
    // Use MTA data if available, otherwise fall back to hardcoded data
    if (mtaData && mtaData.stations) {
        return getNearbyStationsFromMTA(lat, lng, maxDistance, maxResults);
    }
    
    // Fallback to original hardcoded data
    const results = [];
    
    SUBWAY_STATIONS.forEach(station => {
        const distance = map.distance([lat, lng], [station.lat, station.lng]);
        
        if (distance <= maxDistance) {
            results.push({
                station: station,
                distance: distance
            });
        }
    });
    
    // Sort by distance and return top results
    return results
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxResults);
}

/**
 * Show nearest stations info for a given location
 */
function showNearestStationsInfo(lat, lng) {
    const nearestStations = getNearestStations(lat, lng, 1000, 3);
    
    if (nearestStations.length === 0) {
        return "No subway stations within 1km";
    }
    
    let info = "<strong>Nearest Subway Stations:</strong><br/>";
    nearestStations.forEach((result, index) => {
        const station = result.station;
        const distance = Math.round(result.distance);
        const linesText = station.lines.join(', ');
        
        info += `${index + 1}. ${station.name} (${distance}m)<br/>`;
        info += `&nbsp;&nbsp;&nbsp;Lines: ${linesText}<br/>`;
    });
    
    return info;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
});
