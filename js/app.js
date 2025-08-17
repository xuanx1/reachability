/**
 * NYC Manhattan Reachability Map Application
 * Uses Leaflet.js and OpenRouteService API for isochrone analysis
 */

// API Key for OpenRouteService (demo key)
const ORS_API_KEY = '5b3ce3597851110001cf6248c9f85cae50384963b985be5b9d179444';

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
 * Example function to display information about an isoline in a popup when the user clicks on it
 */
function clickIsolines(e) {
    var layer = e.target;
    var props = layer.feature.properties;
    var popupContent = 'Mode of travel: ' + props['Travel mode'] + '<br />Range: 0 - ' + props['Range'] + ' ' + props['Range units'] + '<br />Area: ' + props['Area'] + ' ' + props['Area units'] + '<br />Population: ' + props['Population'];
    if (props.hasOwnProperty('Reach factor')) popupContent += '<br />Reach factor: ' + props['Reach factor'];
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
        apiKey: ORS_API_KEY,
        
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
        
        // Default settings
        rangeControlTimeDefault: 10,
        rangeControlTimeMax: 30,
        rangeControlTimeInterval: 5,
        rangeControlDistanceDefault: 1,
        rangeControlDistanceMax: 5,
        rangeControlDistanceInterval: 0.5,
        
        pane: 'popupPane',
        position: 'bottomright'
    }).addTo(map);

    // Load NYC borough boundaries and create mask
    loadNYCBoroughMask();

    // Initialize UI event handlers
    initializeEventHandlers();
    
    // Initialize the range dropdown with time options (default)
    updateRangeDropdown('time');
    
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
        
        // Enable intervals by default
        const showIntervalsCheckbox = document.getElementById('show-intervals');
        showIntervalsCheckbox.checked = true;
        if (reachabilityControl && reachabilityControl._showInterval) {
            reachabilityControl._showInterval.checked = true;
        }

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
            `https://api.openrouteservice.org/geocode/search?api_key=5b3ce3597851110001cf6248c9f85cae50384963b985be5b9d179444&text=${encodeURIComponent(query)}&boundary.rect.min_lon=-74.0479&boundary.rect.min_lat=40.6892&boundary.rect.max_lon=-73.9067&boundary.rect.max_lat=40.8820&size=8`
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
            `https://api.openrouteservice.org/geocode/reverse?api_key=5b3ce3597851110001cf6248c9f85cae50384963b985be5b9d179444&point.lon=${lng}&point.lat=${lat}&size=1`
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
            `https://api.openrouteservice.org/geocode/reverse?api_key=5b3ce3597851110001cf6248c9f85cae50384963b985be5b9d179444&point.lon=${lng}&point.lat=${lat}&size=1`
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
            `https://api.openrouteservice.org/geocode/search?api_key=5b3ce3597851110001cf6248c9f85cae50384963b985be5b9d179444&text=${encodeURIComponent(query)}&boundary.rect.min_lon=-74.0479&boundary.rect.min_lat=40.6892&boundary.rect.max_lon=-73.9067&boundary.rect.max_lat=40.8820&size=1`
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
    
    // Create marker
    window.currentLocationMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'location-marker',
            html: '<div style="background: #ff4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(map);
    
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
    plotLocation
};
