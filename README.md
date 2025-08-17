# NYC Reachability Map

An interactive web application that visualizes reachability analysis (isochrones) for New York City using Leaflet.js and the OpenRouteService API. Users can click anywhere on the map to see how far they can travel within a specified time using different transportation modes.

![NYC Reachability Map](https://img.shields.io/badge/Status-Active-brightgreen.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

## ✨ Features

- 🗺️ **Interactive Map**: Click anywhere in NYC to analyze reachability
- 🚶 **Multiple Travel Modes**: Walking, cycling, driving, and wheelchair accessibility
- ⏱️ **Flexible Time Ranges**: 5 to 60-minute travel time analysis
- 🎨 **Visual Isochrones**: Color-coded areas showing reachable zones
- 📱 **Responsive Design**: Optimized for desktop and mobile devices
- 🔄 **Real-time Updates**: Drag markers to recalculate analysis instantly
- 🧩 **Reachability Plugin**: Custom Leaflet plugin for advanced isochrone functionality
- 🌍 **Borough Data**: Includes NYC borough boundary data for context

## Demo

The application provides both real API integration (with OpenRouteService) and mock data for demonstration purposes.

### Getting Started

1. **Clone or download** this repository
2. **Open `index.html`** in a web browser, or
3. **Serve locally** using a simple HTTP server (recommended):

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

4. Navigate to `http://localhost:8000` in your browser

### Using with Real API Data

To get real isochrone calculations instead of mock data:

1. Sign up for a free account at [OpenRouteService](https://openrouteservice.org/)
2. Get your API key
3. Replace `YOUR_API_KEY_HERE` in `js/app.js` with your actual API key

```javascript
const ORS_API_KEY = 'your_actual_api_key_here';
```

## How to Use

1. **Open the application** in your web browser
2. **Click anywhere** on the Manhattan map to place an analysis point
3. **Adjust settings** using the control panel:
   - Select travel time (5-30 minutes)
   - Choose transportation mode (walking, cycling, driving)
4. **View results**: The colored area shows where you can reach within the specified time
5. **Drag the marker** to update the analysis for a new location
6. **Click "Clear Analysis"** to remove all markers and isochrones

## Project Structure

```
reachability/
├── index.html              # Main HTML file
├── css/
│   └── style.css           # Styling and responsive design
├── js/
│   └── app.js              # Application logic and map functionality
├── .github/
│   └── copilot-instructions.md  # Development guidelines
└── README.md               # This file
```

## Technologies Used

- **[Leaflet.js](https://leafletjs.com/)** - Interactive maps library
- **[OpenStreetMap](https://www.openstreetmap.org/)** - Map tiles
- **[OpenRouteService](https://openrouteservice.org/)** - Isochrone calculations
- **Vanilla JavaScript** - No frameworks required
- **CSS3** - Modern styling and responsive design

## Map Configuration

The map is specifically configured for NYC Manhattan:

- **Center**: Times Square area (40.7829, -73.9654)
- **Bounds**: Limited to Manhattan for focused analysis
- **Zoom levels**: 13-18 for optimal detail
- **Base layer**: OpenStreetMap tiles

## API Integration

### OpenRouteService Integration

The application uses the OpenRouteService API for accurate isochrone calculations:

- **Endpoint**: `https://api.openrouteservice.org/v2/isochrones/`
- **Methods**: POST requests with location and time parameters
- **Rate limits**: Free tier allows 2000 requests per day
- **Travel modes**: Walking, cycling, driving

### Mock Data Fallback

When no API key is provided, the application shows simplified circular areas as approximations:

- **Walking**: ~3-4 km/h average speed
- **Cycling**: ~15-20 km/h average speed  
- **Driving**: ~30-50 km/h city speeds

## Customization

### Changing the Map Area

To adapt this for a different city, modify these constants in `js/app.js`:

```javascript
const NYC_CENTER = [latitude, longitude];  // New city center
const NYC_BOUNDS = [
    [sw_lat, sw_lng],  // Southwest corner
    [ne_lat, ne_lng]   // Northeast corner
];
```

### Adding New Travel Modes

Extend the travel mode options by:

1. Adding new options to the HTML select element
2. Updating the `getModeDisplayName()` function
3. Adjusting mock data calculations if needed

### Styling Changes

Modify `css/style.css` to customize:

- Color schemes for different time ranges
- Control panel appearance
- Map markers and popups
- Responsive breakpoints

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## Performance Notes

- **API calls** are debounced to prevent excessive requests
- **Mock data** calculations are lightweight for demonstration
- **Responsive design** ensures good performance on mobile devices

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Resources

- [Leaflet.js Documentation](https://leafletjs.com/reference.html)
- [OpenRouteService API Documentation](https://openrouteservice.org/dev/#/api-docs)
- [Isochrone Analysis Guide](https://wiki.openstreetmap.org/wiki/Isochrone)

## Support

For questions or issues:

1. Check the existing documentation
2. Review the browser console for error messages
3. Ensure your API key is valid (if using real data)
4. Verify your internet connection for map tiles and API calls
