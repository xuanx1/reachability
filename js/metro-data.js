/**
 * NYC Subway Lines and Stations Data
 * Simplified representation of major subway lines and key stations
 */

// NYC Subway line colors (official MTA colors)
const SUBWAY_COLORS = {
    '1': '#EE352E', // Broadway-Seventh Avenue Local
    '2': '#EE352E', // Seventh Avenue Express
    '3': '#EE352E', // Seventh Avenue Express
    '4': '#00933C', // Lexington Avenue Express
    '5': '#00933C', // Lexington Avenue Express
    '6': '#00933C', // Lexington Avenue Local
    '7': '#B933AD', // Flushing Local
    'A': '#0039A6', // Eighth Avenue Express
    'B': '#FF6319', // Sixth Avenue Express
    'C': '#0039A6', // Eighth Avenue Local
    'D': '#FF6319', // Sixth Avenue Express
    'E': '#0039A6', // Eighth Avenue Local
    'F': '#FF6319', // Queens Boulevard Express
    'G': '#6CBE45', // Brooklyn-Queens Crosstown
    'J': '#996633', // Nassau Street Express
    'L': '#A7A9AC', // 14th Street-Canarsie Local
    'M': '#FF6319', // Sixth Avenue Local
    'N': '#FCCC0A', // Broadway Express
    'Q': '#FCCC0A', // Broadway Express
    'R': '#FCCC0A', // Broadway Local
    'W': '#FCCC0A', // Broadway Local
    'Z': '#996633', // Nassau Street Express
    'S': '#808183', // Shuttle services
    'SIR': '#2E5AA0' // Staten Island Railway (blue)
};

// Major subway stations with coordinates and lines
const SUBWAY_STATIONS = [
    // Manhattan - Midtown
    { name: "Times Square-42nd St", lat: 40.7580, lng: -73.9855, lines: ['1', '2', '3', '7', 'N', 'Q', 'R', 'W', 'S'] },
    { name: "Grand Central-42nd St", lat: 40.7527, lng: -73.9772, lines: ['4', '5', '6', '7', 'S'] },
    { name: "Penn Station-34th St", lat: 40.7505, lng: -73.9934, lines: ['1', '2', '3', 'A', 'C', 'E'] },
    { name: "Union Square-14th St", lat: 40.7359, lng: -73.9911, lines: ['4', '5', '6', 'L', 'N', 'Q', 'R', 'W'] },
    { name: "42nd St-Port Authority", lat: 40.7570, lng: -73.9899, lines: ['A', 'C', 'E', '7', 'N', 'Q', 'R', 'W', 'S'] },
    
    // Manhattan - Downtown
    { name: "14th St-Union Sq", lat: 40.7359, lng: -73.9911, lines: ['4', '5', '6', 'L', 'N', 'Q', 'R', 'W'] },
    { name: "Canal St", lat: 40.7190, lng: -74.0059, lines: ['4', '5', '6', 'J', 'N', 'Q', 'R', 'W', 'Z'] },
    { name: "City Hall", lat: 40.7131, lng: -74.0097, lines: ['4', '5', '6'] },
    { name: "Fulton St", lat: 40.7104, lng: -74.0067, lines: ['2', '3', '4', '5', 'A', 'C', 'J', 'Z'] },
    { name: "World Trade Center", lat: 40.7126, lng: -74.0099, lines: ['E'] },
    { name: "Wall St", lat: 40.7074, lng: -74.0113, lines: ['4', '5'] },
    
    // Manhattan - Upper East/West Side
    { name: "59th St-Columbus Circle", lat: 40.7681, lng: -73.9819, lines: ['1', 'A', 'B', 'C', 'D'] },
    { name: "86th St", lat: 40.7794, lng: -73.9756, lines: ['4', '5', '6'] },
    { name: "96th St", lat: 40.7851, lng: -73.9720, lines: ['4', '5', '6'] },
    { name: "125th St", lat: 40.8076, lng: -73.9482, lines: ['4', '5', '6'] },
    
    // Brooklyn
    { name: "Atlantic Ave-Barclays Ctr", lat: 40.6840, lng: -73.9767, lines: ['2', '3', '4', '5', 'B', 'D', 'N', 'Q', 'R', 'W'] },
    { name: "Prospect Park", lat: 40.6616, lng: -73.9621, lines: ['B', 'Q'] },
    { name: "Coney Island-Stillwell Ave", lat: 40.5775, lng: -73.9814, lines: ['D', 'F', 'N', 'Q'] },
    { name: "Bay Ridge-95th St", lat: 40.6167, lng: -74.0306, lines: ['R'] },
    
    // Queens
    { name: "Queensboro Plaza", lat: 40.7509, lng: -73.9401, lines: ['7', 'N', 'W'] },
    { name: "Jackson Heights-Roosevelt Ave", lat: 40.7461, lng: -73.8914, lines: ['7', 'E', 'F', 'M', 'R'] },
    { name: "Flushing-Main St", lat: 40.7596, lng: -73.8303, lines: ['7'] },
    { name: "Jamaica Center", lat: 40.7021, lng: -73.8098, lines: ['E', 'J', 'Z'] },
    
    // Bronx
    { name: "Yankee Stadium-161st St", lat: 40.8276, lng: -73.9259, lines: ['4', '6', 'B', 'D'] },
    { name: "Fordham Rd", lat: 40.8619, lng: -73.9012, lines: ['4', '6'] },
    { name: "Pelham Bay Park", lat: 40.8526, lng: -73.8280, lines: ['6'] }
];

// Simplified subway line routes (key points for drawing lines)
const SUBWAY_LINES = {
    '1': [
        [40.7580, -73.9855], // Times Square
        [40.7359, -73.9911], // Union Square
        [40.7190, -74.0059], // Canal St
        [40.7131, -74.0097], // City Hall
        [40.7104, -74.0067]  // Fulton St
    ],
    '4': [
        [40.8526, -73.8280], // Pelham Bay Park
        [40.8276, -73.9259], // Yankee Stadium
        [40.8076, -73.9482], // 125th St
        [40.7851, -73.9720], // 96th St
        [40.7794, -73.9756], // 86th St
        [40.7527, -73.9772], // Grand Central
        [40.7359, -73.9911], // Union Square
        [40.7131, -74.0097], // City Hall
        [40.6840, -73.9767]  // Atlantic Ave
    ],
    '6': [
        [40.8526, -73.8280], // Pelham Bay Park
        [40.8619, -73.9012], // Fordham Rd
        [40.8276, -73.9259], // Yankee Stadium
        [40.8076, -73.9482], // 125th St
        [40.7851, -73.9720], // 96th St
        [40.7794, -73.9756], // 86th St
        [40.7527, -73.9772], // Grand Central
        [40.7359, -73.9911], // Union Square
        [40.7190, -74.0059], // Canal St
        [40.6840, -73.9767]  // Atlantic Ave
    ],
    '7': [
        [40.7596, -73.8303], // Flushing-Main St
        [40.7461, -73.8914], // Jackson Heights
        [40.7509, -73.9401], // Queensboro Plaza
        [40.7527, -73.9772], // Grand Central
        [40.7580, -73.9855]  // Times Square
    ],
    'A': [
        [40.7570, -73.9899], // Port Authority
        [40.7681, -73.9819], // Columbus Circle
        [40.7580, -73.9855], // Times Square
        [40.7359, -73.9911], // Union Square
        [40.7104, -74.0067], // Fulton St
        [40.6840, -73.9767]  // Atlantic Ave
    ],
    'B': [
        [40.8276, -73.9259], // Yankee Stadium
        [40.7681, -73.9819], // Columbus Circle
        [40.7570, -73.9899], // Port Authority
        [40.7359, -73.9911], // Union Square
        [40.6840, -73.9767], // Atlantic Ave
        [40.6616, -73.9621]  // Prospect Park
    ],
    'D': [
        [40.8276, -73.9259], // Yankee Stadium
        [40.7681, -73.9819], // Columbus Circle
        [40.7570, -73.9899], // Port Authority
        [40.7359, -73.9911], // Union Square
        [40.6840, -73.9767], // Atlantic Ave
        [40.5775, -73.9814]  // Coney Island
    ],
    'F': [
        [40.7461, -73.8914], // Jackson Heights
        [40.7509, -73.9401], // Queensboro Plaza
        [40.7359, -73.9911], // Union Square
        [40.6840, -73.9767], // Atlantic Ave
        [40.5775, -73.9814]  // Coney Island
    ],
    'L': [
        [40.7461, -73.8914], // Eastern terminus (approx)
        [40.7359, -73.9911], // Union Square
        [40.7359, -74.0059]  // Western terminus (approx)
    ],
    'N': [
        [40.7509, -73.9401], // Queensboro Plaza
        [40.7580, -73.9855], // Times Square
        [40.7359, -73.9911], // Union Square
        [40.7190, -74.0059], // Canal St
        [40.6840, -73.9767], // Atlantic Ave
        [40.5775, -73.9814]  // Coney Island
    ],
    'Q': [
        [40.7509, -73.9401], // Queensboro Plaza
        [40.7580, -73.9855], // Times Square
        [40.7359, -73.9911], // Union Square
        [40.7190, -74.0059], // Canal St
        [40.6840, -73.9767], // Atlantic Ave
        [40.5775, -73.9814]  // Coney Island
    ],
    'R': [
        [40.7461, -73.8914], // Jackson Heights
        [40.7509, -73.9401], // Queensboro Plaza
        [40.7580, -73.9855], // Times Square
        [40.7359, -73.9911], // Union Square
        [40.7190, -74.0059], // Canal St
        [40.6840, -73.9767], // Atlantic Ave
        [40.6167, -74.0306]  // Bay Ridge
    ]
};

// Metro system configuration
const METRO_CONFIG = {
    stationRadius: 2,
    stationWeight: 2,
    stationColor: '#ffffff',
    stationFillOpacity: 0.9,
    lineWeight: 3,
    lineOpacity: 0.8,
    zIndexOffset: 1000,
    showLabels: true,
    labelMinZoom: 13
};
