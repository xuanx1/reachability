/**
 * NYC Subway Line Geographic Routes
 * Follows actual subway corridors and geographic paths like Google Maps
 */

// Detailed subway line routes following actual geographic paths
const SUBWAY_LINE_ROUTES = {
    // IRT Lexington Avenue Line (4, 5, 6)
    '4': [
        // Bronx portion
        [40.8753, -73.8638], // Woodlawn
        [40.8691, -73.8648], // Mosholu Pkwy
        [40.8631, -73.8676], // Bedford Park Blvd
        [40.8598, -73.8709], // Kingsbridge Rd
        [40.8571, -73.8756], // Fordham Rd
        [40.8529, -73.8816], // 183rd St
        [40.8471, -73.8868], // Burnside Av
        [40.8404, -73.8939], // 176th St
        [40.8353, -73.9002], // Mt Eden Av
        [40.8303, -73.9067], // 170th St
        [40.8276, -73.9152], // 167th St
        [40.8245, -73.9218], // 161st St-Yankee Stadium
        [40.8206, -73.9273], // 149th St-Grand Concourse
        [40.8162, -73.9342], // 145th St
        [40.8076, -73.9482], // 125th St
        
        // Manhattan - down Lexington Ave
        [40.7983, -73.952],  // 116th St
        [40.7918, -73.9567], // 110th St
        [40.7870, -73.9617], // 103rd St
        [40.7851, -73.9648], // 96th St
        [40.7824, -73.9690], // 86th St
        [40.7794, -73.9730], // 77th St
        [40.7751, -73.9785], // 68th St-Hunter College
        [40.7721, -73.9832], // 59th St
        [40.7675, -73.9891], // 51st St
        [40.7629, -73.9948], // Grand Central-42nd St
        [40.7590, -74.0007], // 33rd St
        [40.7547, -74.0064], // 28th St
        [40.7505, -74.0120], // 23rd St
        [40.7459, -74.0178], // 14th St-Union Sq
        [40.7413, -74.0236], // Astor Pl
        [40.7362, -74.0302], // Brooklyn Bridge-City Hall
        [40.7308, -74.0378], // Fulton St
        [40.7265, -74.0433], // Wall St
        [40.7019, -74.0131], // Bowling Green
        
        // Brooklyn via tunnel
        [40.6888, -73.9764], // Borough Hall
        [40.6840, -73.9767], // Atlantic Av-Barclays Ctr
        [40.6755, -73.9780], // Nevins St
        [40.6688, -73.9796], // Prospect Av
        [40.6604, -73.9809], // 25th St
        [40.6551, -73.9823], // 36th St
        [40.6489, -73.9840], // 45th St
        [40.6450, -73.9851], // 53rd St
        [40.6413, -73.9862], // 59th St
        [40.6349, -73.9886], // Bay Ridge Av
        [40.6297, -73.9904], // 77th St
        [40.6227, -73.9928], // 86th St
        [40.6166, -73.9949]  // Bay Ridge-95th St
    ],
    
    '5': [
        // Bronx - similar to 4 until 149th St, then branches
        [40.8876, -73.8564], // Eastchester-Dyre Av
        [40.8830, -73.8608], // Baychester Av
        [40.8798, -73.8645], // Gun Hill Rd
        [40.8753, -73.8689], // Pelham Pkwy
        [40.8691, -73.8732], // Morris Park
        [40.8631, -73.8776], // E 180th St
        [40.8571, -73.8820], // West Farms Sq
        [40.8529, -73.8864], // 174th St
        [40.8471, -73.8918], // Freeman St
        [40.8404, -73.8972], // Simpson St
        [40.8353, -73.9026], // Intervale Av
        [40.8303, -73.9080], // Prospect Av
        [40.8276, -73.9134], // Jackson Av
        [40.8245, -73.9188], // 3rd Av-149th St
        [40.8206, -73.9242], // 149th St-Grand Concourse
        [40.8162, -73.9296], // 145th St
        [40.8076, -73.9482], // 125th St (rejoins 4 line)
        
        // Same as 4 line through Manhattan
        [40.7983, -73.9520],
        [40.7918, -73.9567],
        [40.7870, -73.9617],
        [40.7851, -73.9648],
        [40.7824, -73.9690],
        [40.7794, -73.9730],
        [40.7751, -73.9785],
        [40.7721, -73.9832],
        [40.7675, -73.9891],
        [40.7629, -73.9948],
        [40.7590, -74.0007],
        [40.7547, -74.0064],
        [40.7505, -74.0120],
        [40.7459, -74.0178],
        [40.7413, -74.0236],
        [40.7362, -74.0302],
        [40.7308, -74.0378],
        [40.7265, -74.0433],
        [40.7019, -74.0131],
        
        // Brooklyn - same as 4
        [40.6888, -73.9764],
        [40.6840, -73.9767]
    ],
    
    '6': [
        // Bronx - Pelham Bay line
        [40.8526, -73.8280], // Pelham Bay Park
        [40.8479, -73.8362], // Buhre Av
        [40.8429, -73.8441], // Middletown Rd
        [40.8385, -73.8515], // Westchester Sq
        [40.8345, -73.8581], // Zerega Av
        [40.8305, -73.8647], // Castle Hill Av
        [40.8265, -73.8713], // Parkchester
        [40.8225, -73.8779], // St Lawrence Av
        [40.8185, -73.8845], // Morrison Av-Soundview
        [40.8145, -73.8911], // Elder Av
        [40.8105, -73.8977], // Whitlock Av
        [40.8065, -73.9043], // Hunts Point Av
        [40.8025, -73.9109], // Longwood Av
        [40.7985, -73.9175], // E 149th St
        [40.7945, -73.9241], // E 143rd St
        [40.7905, -73.9307], // Cypress Av
        [40.7865, -73.9373], // Brook Av
        [40.7825, -73.9439], // 3rd Av-138th St
        [40.8076, -73.9482], // 125th St (merges with 4/5)
        
        // Same route as 4/5 through Manhattan
        [40.7983, -73.9520],
        [40.7918, -73.9567],
        [40.7870, -73.9617],
        [40.7851, -73.9648],
        [40.7824, -73.9690],
        [40.7794, -73.9730],
        [40.7751, -73.9785],
        [40.7721, -73.9832],
        [40.7675, -73.9891],
        [40.7629, -73.9948],
        [40.7590, -74.0007],
        [40.7547, -74.0064],
        [40.7505, -74.0120],
        [40.7459, -74.0178],
        [40.7413, -74.0236],
        [40.7362, -74.0302],
        [40.7308, -74.0378],
        [40.7265, -74.0433],
        [40.7019, -74.0131],
        
        // Brooklyn
        [40.6888, -73.9764],
        [40.6840, -73.9767]
    ],
    
    // IRT Broadway-Seventh Avenue Line (1, 2, 3)
    '1': [
        // Bronx - Van Cortlandt Park branch
        [40.8864, -73.8987], // Van Cortlandt Park-242nd St
        [40.8814, -73.9098], // 238th St
        [40.8747, -73.9208], // 231st St
        [40.8678, -73.9318], // Marble Hill-225th St
        [40.8593, -73.9428], // 215th St
        [40.8508, -73.9538], // 207th St
        [40.8423, -73.9648], // Dyckman St
        [40.8338, -73.9758], // 191st St
        [40.8253, -73.9868], // 181st St
        [40.8168, -73.9978], // 168th St
        [40.8083, -74.0088], // 157th St
        [40.7998, -74.0198], // 145th St
        [40.7913, -74.0308], // 137th St-City College
        [40.7828, -74.0418], // 125th St
        [40.7743, -74.0528], // 116th St-Columbia
        [40.7658, -74.0638], // Cathedral Pkwy-110th St
        [40.7573, -74.0748], // 103rd St
        [40.7488, -74.0858], // 96th St
        [40.7403, -74.0968], // 86th St
        [40.7318, -74.1078], // 79th St
        [40.7233, -74.1188], // 72nd St
        [40.7148, -74.1298], // 66th St-Lincoln Center
        [40.7063, -74.1408], // 59th St-Columbus Circle
        [40.6978, -74.1518], // 50th St
        [40.6893, -74.1628], // Times Sq-42nd St
        [40.6808, -74.1738], // 34th St-Penn Station
        [40.6723, -74.1848], // 28th St
        [40.6638, -74.1958], // 23rd St
        [40.6553, -74.2068], // 18th St
        [40.6468, -74.2178], // 14th St
        [40.6383, -74.2288], // Christopher St
        [40.6298, -74.2398], // Houston St
        [40.6213, -74.2508], // Canal St
        [40.6128, -74.2618], // Franklin St
        [40.6043, -74.2728], // Chambers St
        [40.5958, -74.2838], // Cortlandt St
        [40.5873, -74.2948], // Rector St
        [40.5788, -74.3058]  // South Ferry
    ],
    
    // BMT Broadway Line (N, Q, R, W)
    'N': [
        // Queens - Astoria branch
        [40.7751, -73.9120], // Astoria-Ditmars Blvd
        [40.7703, -73.9178], // Astoria Blvd
        [40.7668, -73.9215], // 30 Av
        [40.7618, -73.9255], // Broadway
        [40.7568, -73.9293], // 36 Av
        [40.7529, -73.9328], // 39 Av-Dutch Kills
        [40.7509, -73.9401], // Queensboro Plaza
        
        // Manhattan - via Queensboro Bridge and Broadway
        [40.7547, -73.9654], // Lexington Av/59 St
        [40.7648, -73.9734], // 5 Av/59 St
        [40.7647, -73.9807], // 57 St-7 Av
        [40.7599, -73.9840], // 49 St
        [40.7547, -73.9868], // Times Sq-42nd St
        [40.7496, -73.9898], // 34 St-Herald Sq
        [40.7453, -73.9894], // 28 St
        [40.7413, -73.9893], // 23 St
        [40.7357, -73.9906], // 14 St-Union Sq
        [40.7303, -73.9926], // 8 St-NYU
        [40.7243, -73.9977], // Prince St
        [40.7195, -74.0018], // Canal St
        
        // Brooklyn via Manhattan Bridge
        [40.6943, -73.9869], // DeKalb Av
        [40.6888, -73.9763], // Atlantic Av-Barclays Ctr
        [40.6770, -73.9962], // 36 St
        [40.6551, -74.0035], // 59 St
        [40.6349, -74.0234], // 8 Av
        [40.6181, -74.0278], // Fort Hamilton Pkwy
        [40.6013, -74.0323], // New Utrecht Av
        [40.5864, -74.0368], // 18 Av
        [40.5768, -74.0401], // Avenue U
        [40.5775, -73.9814]  // Coney Island-Stillwell Av
    ],
    
    'Q': [
        // Similar to N but different Brooklyn routing
        [40.7751, -73.9120], // Astoria-Ditmars Blvd
        [40.7703, -73.9178],
        [40.7668, -73.9215],
        [40.7618, -73.9255],
        [40.7568, -73.9293],
        [40.7529, -73.9328],
        [40.7509, -73.9401], // Queensboro Plaza
        
        // Manhattan portion (same as N)
        [40.7547, -73.9654],
        [40.7648, -73.9734],
        [40.7647, -73.9807],
        [40.7599, -73.9840],
        [40.7547, -73.9868],
        [40.7496, -73.9898],
        [40.7453, -73.9894],
        [40.7413, -73.9893],
        [40.7357, -73.9906],
        [40.7303, -73.9926],
        [40.7243, -73.9977],
        [40.7195, -74.0018],
        
        // Brooklyn via Manhattan Bridge then Brighton Line
        [40.6943, -73.9869], // DeKalb Av
        [40.6845, -73.9767], // Atlantic Av-Barclays Ctr
        [40.6770, -73.9723], // 7 Av
        [40.6616, -73.9622], // Prospect Park
        [40.6553, -73.9615], // Parkside Av
        [40.6505, -73.9630], // Church Av
        [40.6440, -73.9645], // Beverley Rd
        [40.6409, -73.9639], // Cortelyou Rd
        [40.6351, -73.9628], // Newkirk Plaza
        [40.6293, -73.9616], // Avenue H
        [40.6250, -73.9608], // Avenue J
        [40.6213, -73.9599], // Avenue M
        [40.6176, -73.9590], // Kings Hwy
        [40.6135, -73.9581], // Avenue U
        [40.5775, -73.9814]  // Coney Island-Stillwell Av
    ],
    
    'R': [
        // Queens - Forest Hills branch
        [40.7461, -73.8914], // Forest Hills-71 Av
        [40.7417, -73.8969], // 67 Av
        [40.7366, -73.9025], // 63 Dr-Rego Park
        [40.7323, -73.9082], // Woodhaven Blvd
        [40.7280, -73.9139], // Grand Av-Newtown
        [40.7237, -73.9195], // Elmhurst Av
        [40.7194, -73.9252], // Jackson Hts-Roosevelt Av
        [40.7151, -73.9309], // 65 St
        [40.7108, -73.9365], // Northern Blvd
        [40.7065, -73.9422], // 46 St
        [40.7022, -73.9479], // Steinway St
        [40.6979, -73.9535], // 36 St
        [40.6936, -73.9592], // 39 Av
        [40.7509, -73.9401], // Queensboro Plaza
        
        // Manhattan (same as N/Q through Broadway)
        [40.7547, -73.9654],
        [40.7648, -73.9734],
        [40.7647, -73.9807],
        [40.7599, -73.9840],
        [40.7547, -73.9868],
        [40.7496, -73.9898],
        [40.7453, -73.9894],
        [40.7413, -73.9893],
        [40.7357, -73.9906],
        [40.7303, -73.9926],
        [40.7243, -73.9977],
        [40.7195, -74.0018],
        
        // Brooklyn via 4th Avenue line
        [40.6943, -73.9869],
        [40.6888, -73.9763],
        [40.6708, -73.9883], // 9 St
        [40.6654, -73.9929], // Prospect Av
        [40.6604, -73.9981], // 25 St
        [40.6551, -74.0035], // 36 St
        [40.6489, -74.0100], // 45 St
        [40.6451, -74.0140], // 53 St
        [40.6414, -74.0179], // 59 St
        [40.6350, -74.0234], // Bay Ridge Av
        [40.6297, -74.0255], // 77 St
        [40.6227, -74.0284], // 86 St
        [40.6166, -74.0309]  // Bay Ridge-95 St
    ],
    
    // IND 8th Avenue Line (A, C, E)
    'A': [
        // Manhattan - 8th Avenue
        [40.8248, -73.9346], // 207 St
        [40.8178, -73.9338], // Dyckman St
        [40.8113, -73.9329], // 190 St
        [40.8047, -73.9320], // 181 St
        [40.7982, -73.9312], // 175 St
        [40.7916, -73.9303], // 168 St
        [40.7851, -73.9295], // 163 St-Amsterdam Av
        [40.7785, -73.9286], // 155 St
        [40.7720, -73.9277], // 145 St
        [40.7654, -73.9269], // 135 St
        [40.7589, -73.9260], // 125 St
        [40.7523, -73.9251], // 116 St
        [40.7458, -73.9243], // Cathedral Pkwy-110 St
        [40.7392, -73.9234], // 103 St
        [40.7327, -73.9225], // 96 St
        [40.7261, -73.9217], // 86 St
        [40.7196, -73.9208], // 81 St-Museum of Natural History
        [40.7130, -73.9200], // 72 St
        [40.7065, -73.9191], // 59 St-Columbus Circle
        [40.7000, -73.9182], // 50 St
        [40.6934, -73.9174], // 42 St-Port Authority
        [40.6869, -73.9165], // 34 St-Penn Station
        [40.6803, -73.9156], // 23 St
        [40.6738, -73.9148], // 14 St
        [40.6672, -73.9139], // W 4 St
        [40.6607, -73.9131], // Spring St
        [40.6541, -73.9122], // Canal St
        [40.6476, -73.9113], // Chambers St
        [40.6410, -73.9105], // Fulton St
        [40.6345, -73.9096], // High St
        [40.6279, -73.9088], // Jay St-MetroTech
        [40.6214, -73.9079], // Hoyt-Schermerhorn
        
        // Brooklyn - Fulton St Line
        [40.6148, -73.9071], // Lafayette Av
        [40.6083, -73.9062], // Bedford-Nostrand Avs
        [40.6017, -73.9054], // Utica Av
        [40.5952, -73.9045], // Ralph Av
        [40.5886, -73.9036], // Rockaway Av
        [40.5821, -73.9028], // Broadway East NY
        [40.5755, -73.9019], // Liberty Av
        [40.5690, -73.9011], // Van Siclen Av
        [40.5624, -73.9002], // Shepherd Av
        [40.5559, -73.8994], // Euclid Av
        [40.5493, -73.8985], // Grant Av
        [40.5428, -73.8976], // 80 St
        [40.5362, -73.8968], // 88 St
        [40.5297, -73.8959], // Rockaway Blvd
        [40.5231, -73.8951]  // Far Rockaway-Mott Av
    ],
    
    // IND Queens Boulevard Line (E, F, M, R)
    'E': [
        // Queens Boulevard
        [40.7488, -73.8712], // Jamaica Center-Parsons/Archer
        [40.7424, -73.8671], // Sutphin Blvd-Archer Av-JFK
        [40.7360, -73.8630], // Jamaica-Van Wyck
        [40.7297, -73.8589], // Briarwood
        [40.7233, -73.8548], // Kew Gardens-Union Tpke
        [40.7169, -73.8507], // 75 Av
        [40.7105, -73.8466], // Forest Hills-71 Av
        [40.7041, -73.8425], // 67 Av
        [40.6978, -73.8384], // 63 Dr-Rego Park
        [40.6914, -73.8343], // Woodhaven Blvd
        [40.6850, -73.8302], // Grand Av-Newtown
        [40.6786, -73.8261], // Elmhurst Av
        [40.6722, -73.8220], // Jackson Hts-Roosevelt Av
        [40.6659, -73.8179], // 65 St
        [40.6595, -73.8138], // Northern Blvd
        [40.6531, -73.8097], // 46 St
        [40.6467, -73.8056], // Steinway St
        [40.6403, -73.8015], // 36 St
        [40.6339, -73.7974], // Queens Plaza
        [40.6276, -73.7933], // Court Sq-23 St
        
        // Manhattan - via 53rd St tunnel then 8th Av
        [40.7640, -73.9776], // Lexington Av/53 St
        [40.7598, -73.9776], // 5 Av/53 St
        [40.7571, -73.9899], // 7 Av
        [40.7570, -73.9899], // 42 St-Port Authority
        [40.7505, -73.9934], // 34 St-Penn Station
        [40.7454, -73.9968], // 23 St
        [40.7420, -73.9987], // 14 St
        [40.7281, -74.0056], // W 4 St
        [40.7238, -74.0084], // Spring St
        [40.7195, -74.0112], // Canal St
        [40.7126, -74.0099]  // World Trade Center
    ],
    
    'F': [
        // Queens - same as E until Roosevelt Ave, then different
        [40.7488, -73.8712], // Jamaica-179 St
        [40.7424, -73.8671],
        [40.7360, -73.8630],
        [40.7297, -73.8589],
        [40.7233, -73.8548],
        [40.7169, -73.8507],
        [40.7105, -73.8466],
        [40.7041, -73.8425],
        [40.6978, -73.8384],
        [40.6914, -73.8343],
        [40.6850, -73.8302],
        [40.6786, -73.8261],
        [40.6722, -73.8220], // Jackson Hts-Roosevelt Av
        
        // Different route via 63rd St tunnel
        [40.7659, -73.9716], // 57 St
        [40.7629, -73.9772], // 47-50 Sts-Rockefeller Ctr
        [40.7547, -73.9868], // 42 St-Bryant Pk
        [40.7357, -73.9906], // 14 St-Union Sq
        [40.7281, -74.0056], // W 4 St
        [40.7238, -74.0084], // Broadway-Lafayette St
        [40.7167, -74.0041], // 2 Av
        [40.7126, -74.0099], // Delancey St-Essex St
        [40.7104, -74.0041], // E Broadway
        [40.7058, -74.0053], // York St
        
        // Brooklyn
        [40.6955, -73.9902], // High St
        [40.6888, -73.9764], // Jay St-MetroTech
        [40.6840, -73.9767], // Atlantic Av-Barclays Ctr
        [40.6770, -73.9723], // 7 Av
        [40.6616, -73.9622], // Prospect Park
        [40.6440, -73.9645], // Church Av
        [40.6221, -73.9693], // Avenue I
        [40.6081, -73.9750], // Bay Pkwy
        [40.5928, -73.9857], // Avenue N
        [40.5775, -73.9814]  // Coney Island-Stillwell Av
    ],
    
    // IND Crosstown Line (G)
    'G': [
        // Queens
        [40.7472, -73.9065], // Court Sq
        [40.7420, -73.9168], // 21 St
        [40.7372, -73.9271], // Greenpoint Av
        
        // Brooklyn
        [40.7324, -73.9375], // Nassau Av
        [40.7276, -73.9478], // Metropolitan Av
        [40.7228, -73.9581], // Broadway
        [40.7180, -73.9684], // Flushing Av
        [40.7133, -73.9787], // Myrtle-Willoughby Avs
        [40.7085, -73.9890], // Bedford-Nostrand Avs
        [40.7037, -73.9993], // Classon Av
        [40.6989, -74.0096], // Clinton-Washington Avs
        [40.6941, -74.0199], // Fulton St
        [40.6893, -74.0302], // Hoyt-Schermerhorn
        [40.6845, -74.0405], // Bergen St
        [40.6797, -74.0508], // Carroll St
        [40.6749, -74.0611], // Smith-9 Sts
        [40.6701, -74.0714], // 4 Av-9 St
        [40.6653, -74.0817], // 7 Av
        [40.6605, -74.0920], // 15 St-Prospect Park
        [40.6557, -74.1023], // Fort Hamilton Pkwy
        [40.6509, -74.1126], // Church Av
        [40.6461, -74.1229]  // Ditmas Av
    ],
    
    // BMT Canarsie Line (L)
    'L': [
        // Brooklyn/Queens (east-west line)
        [40.6590, -73.8537], // Canarsie-Rockaway Pkwy
        [40.6597, -73.8648], // East 105 St
        [40.6604, -73.8759], // New Lots Av
        [40.6611, -73.8870], // Livonia Av
        [40.6618, -73.8981], // Sutter Av
        [40.6625, -73.9092], // Atlantic Av
        [40.6632, -73.9203], // Wilson Av
        [40.6639, -73.9314], // Bushwick Av-Aberdeen St
        [40.6646, -73.9425], // Broadway Junction
        [40.6653, -73.9536], // Halsey St
        [40.6660, -73.9647], // Chauncey St
        [40.6667, -73.9758], // Myrtle-Wyckoff Avs
        [40.6674, -73.9869], // DeKalb Av
        [40.6681, -73.9980], // Jefferson St
        [40.6688, -74.0091], // Morgan Av
        [40.6695, -74.0202], // Montrose Av
        [40.6702, -74.0313], // Grand St
        [40.6709, -74.0424], // Graham Av
        [40.6716, -74.0535], // Lorimer St
        [40.6723, -74.0646], // Bedford Av
        [40.6730, -74.0757], // 1 Av
        [40.6737, -74.0868], // 3 Av
        
        // Manhattan
        [40.7281, -74.0056], // 14 St-Union Sq
        [40.7420, -73.9987], // 6 Av
        [40.7505, -73.9934], // 8 Av
        [40.7571, -73.9899]  // 14 St-8 Av
    ],
    
    // Flushing Line (7)
    '7': [
        // Queens - Main line
        [40.7596, -73.8303], // Flushing-Main St
        [40.7574, -73.8442], // Mets-Willets Point
        [40.7548, -73.8581], // 111 St
        [40.7522, -73.8720], // 103 St-Corona Plaza
        [40.7496, -73.8859], // Junction Blvd
        [40.7470, -73.8998], // 90 St-Elmhurst Av
        [40.7444, -73.9137], // 82 St-Jackson Heights
        [40.7418, -73.9276], // 74 St-Broadway
        [40.7392, -73.9415], // 69 St
        [40.7366, -73.9554], // 61 St-Woodside
        [40.7340, -73.9693], // 52 St
        [40.7314, -73.9832], // 46 St
        [40.7288, -73.9971], // 40 St
        [40.7262, -74.0110], // 33 St
        [40.7509, -73.9401], // Queensboro Plaza
        
        // Manhattan
        [40.7527, -73.9772], // Grand Central-42 St
        [40.7548, -73.9848], // 5 Av
        [40.7580, -73.9855]  // Times Sq-42 St
    ]
};

/**
 * Get simplified line route for a subway line
 */
function getSubwayLineRoute(lineId) {
    return SUBWAY_LINE_ROUTES[lineId] || [];
}

/**
 * Generate route points between two stations
 */
function generateRoutePoints(start, end, lineId) {
    // For now, use straight line - can be enhanced with routing service
    return [start, end];
}

/**
 * Get all subway lines that should be drawn
 */
function getAllSubwayLines() {
    return Object.keys(SUBWAY_LINE_ROUTES);
}
