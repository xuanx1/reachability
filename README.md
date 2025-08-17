# NYC Reachability Map [Preview](https://xuanx1.github.io/reachability/)

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

## 📖 How to Use

1. **Open the application** in your web browser
2. **Click anywhere** on the NYC map to place an analysis point
3. **Configure analysis** using the reachability control panel:
   - Select travel time (5, 10, 15, 30, 45, 60 minutes)
   - Choose transportation mode (walking, cycling, driving, wheelchair)
   - Adjust settings as needed
4. **View results**: Colored isochrone areas show reachable zones within specified time
5. **Interactive features**:
   - Drag markers to update analysis location
   - Add multiple analysis points for comparison
   - Toggle layers on/off
   - Export results (if supported)
6. **Clear analysis**: Use control panel to remove markers and isochrones

## 📁 Project Structure

```
reachability/
├── index.html                           # Main application entry point
├── package.json                         # Node.js dependencies and scripts
├── README.md                           # This documentation
├── NYC_Borough_Boundary_5648926780594355063.geojson  # NYC boundary data
├── css/
│   ├── style.css                       # Main application styles
│   └── leaflet.reachability.css        # Reachability plugin styles
├── js/
│   ├── app.js                          # Main application logic
│   └── leaflet.reachability.js         # Custom Leaflet reachability plugin
└── .github/
    └── copilot-instructions.md         # Development guidelines for AI assistance
```

## 🛠️ Technologies Used

- **[Leaflet.js](https://leafletjs.com/) v1.9.4** - Interactive maps library
- **[OpenStreetMap](https://www.openstreetmap.org/)** - Map tiles and geographic data
- **[OpenRouteService API](https://openrouteservice.org/)** - Real-time isochrone calculations
- **[Font Awesome](https://fontawesome.com/)** - Icons for UI elements
- **Vanilla JavaScript (ES6+)** - No heavy frameworks, pure modern JavaScript
- **CSS3** - Modern styling with flexbox, grid, and responsive design
- **GeoJSON** - NYC borough boundary data for geographic context

## 🗺️ Map Configuration

The map is optimized for New York City with specific settings:

- **Center**: Times Square area (40.7580°N, 73.9855°W)
- **Coverage**: All NYC boroughs (Manhattan, Brooklyn, Queens, Bronx, Staten Island)
- **Zoom levels**: 10-18 for optimal detail across different scales
- **Bounds**: Restricted to NYC metropolitan area for focused analysis
- **Base layer**: OpenStreetMap with clear street-level detail

### Geographic Coverage
```javascript
const NYC_BOUNDS = L.latLngBounds(
    [40.495, -74.255], // Southwest (Staten Island)
    [40.915, -73.700]  // Northeast (Bronx/Queens)
);
```

## 🔌 API Integration

### OpenRouteService Integration

The application leverages the OpenRouteService API for accurate, real-world isochrone calculations:

- **Base URL**: `https://api.openrouteservice.org/v2/isochrones/`
- **Request method**: POST with JSON payload
- **Authentication**: API key in request headers
- **Response format**: GeoJSON with polygon features

#### Supported Travel Profiles
- `foot-walking` - Pedestrian routing
- `cycling-regular` - Standard bicycle routing  
- `driving-car` - Automobile routing
- `wheelchair` - Wheelchair-accessible routing

#### Rate Limits & Quotas
- **Free tier**: 2,000 requests/day, 40 requests/minute
- **Subscription tiers**: Higher limits available
- **Error handling**: Graceful fallback to mock data

### Fallback Mock Data

When API is unavailable or quota exceeded, the application provides mock circular isochrones:

#### Speed Assumptions
- **Walking**: 4.5 km/h (typical urban walking speed)
- **Cycling**: 16 km/h (casual cycling in city)  
- **Driving**: 25 km/h (NYC traffic-adjusted speed)
- **Wheelchair**: 3.5 km/h (accessibility-adjusted speed)

The mock data creates circular approximations based on these speeds and selected time ranges.

## ⚙️ Customization & Configuration

### Adapting for Different Cities

To modify this application for another city, update these key configurations in `js/app.js`:

```javascript
// Change the map center coordinates
const NYC_CENTER = [latitude, longitude];  // New city center

// Update the geographic bounds
const NYC_BOUNDS = L.latLngBounds(
    [sw_lat, sw_lng],  // Southwest corner
    [ne_lat, ne_lng]   // Northeast corner
);

// Modify initial zoom level if needed
const INITIAL_ZOOM = 12;  // Adjust based on city size
```

### Adding Custom Travel Modes

Extend transportation options by:

1. **Adding HTML options** in the travel mode selector
2. **Updating the API profile mapping**:
```javascript
const profileMapping = {
    'walking': 'foot-walking',
    'cycling': 'cycling-regular', 
    'driving': 'driving-car',
    'custom-mode': 'new-api-profile'  // Add new mode
};
```
3. **Updating styling functions** for visual consistency

### Time Range Customization

Modify available time intervals in the reachability control:

```javascript
const timeRanges = [5, 10, 15, 20, 30, 45, 60];  // Minutes
```

### Styling & Theming

Customize visual appearance in `css/style.css`:

- **Color schemes**: Update isochrone colors for different time ranges
- **Control panel**: Modify positioning, sizing, and styling
- **Markers**: Customize pin icons and popup styles
- **Responsive breakpoints**: Adjust mobile/tablet layouts

#### Isochrone Color Customization
```css
.isochrone-5min { fill: #ff0000; fill-opacity: 0.3; }
.isochrone-10min { fill: #ff8000; fill-opacity: 0.3; }
.isochrone-15min { fill: #ffff00; fill-opacity: 0.3; }
/* Add more time-based styles */
```

## 🌐 Browser Compatibility

**Fully Supported:**
- ✅ Chrome 60+ (Recommended)
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+ (Chromium-based)

**Partially Supported:**
- ⚠️ Internet Explorer 11 (Limited functionality)
- ⚠️ Older mobile browsers (Reduced features)

**Required Features:**
- ES6+ JavaScript support
- Fetch API for HTTP requests
- CSS Grid and Flexbox
- WebGL for smooth map rendering (optional but recommended)

## 🚀 Performance Optimization

### API Request Management
- **Debouncing**: API calls are debounced to prevent excessive requests during rapid interactions
- **Caching**: Recent results are cached to avoid duplicate requests
- **Error handling**: Graceful fallbacks when API limits are reached

### Rendering Optimization
- **Lazy loading**: Map tiles loaded on-demand
- **Efficient updates**: Only re-render affected map elements
- **Mobile optimization**: Touch-friendly controls and responsive design

### Best Practices
- Use the development server for testing (prevents CORS issues)
- Monitor API usage to stay within free tier limits
- Test on various screen sizes and devices

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup
1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a new branch for your feature
4. **Install** dependencies: `npm install`
5. **Start** the development server: `npm run dev`

### Contribution Guidelines
- Follow existing code style and conventions
- Add comments for complex functionality
- Test thoroughly across different browsers
- Update documentation for new features
- Keep commits focused and well-described

### Areas for Contribution
- 🐛 **Bug fixes**: Address any issues or edge cases
- ✨ **New features**: Additional travel modes, export functionality, etc.
- 🎨 **UI/UX improvements**: Better design, accessibility enhancements
- 📚 **Documentation**: Improve guides, add examples
- 🔧 **Performance**: Optimize rendering, reduce API calls
- 🌍 **Internationalization**: Add support for other languages

### Pull Request Process
1. Update the README if needed
2. Add/update tests for new functionality
3. Ensure all existing tests pass
4. Request review from maintainers

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses
- Leaflet.js: BSD 2-Clause License
- OpenStreetMap data: Open Database License (ODbL)
- Font Awesome: Font Awesome Free License

## 📚 Resources & Documentation

### Essential Reading
- 📖 [Leaflet.js Documentation](https://leafletjs.com/reference.html) - Complete API reference
- 🗺️ [OpenRouteService API Docs](https://openrouteservice.org/dev/#/api-docs) - Isochrone API guide
- 🔍 [Isochrone Analysis Guide](https://wiki.openstreetmap.org/wiki/Isochrone) - Theory and applications

### Additional Resources
- [GeoJSON Specification](https://geojson.org/) - Understanding geographic data format
- [Web Map Service Standards](https://www.ogc.org/standards/wms) - Mapping service protocols
- [OpenStreetMap Wiki](https://wiki.openstreetmap.org/) - Geographic data insights

### Related Projects
- [Leaflet.Control.Geocoder](https://github.com/perliedman/leaflet-control-geocoder) - Address search
- [Leaflet.heat](https://github.com/Leaflet/Leaflet.heat) - Heatmap visualization
- [Turf.js](https://turfjs.org/) - Geospatial analysis toolkit

## 🆘 Support & Troubleshooting

### Common Issues

#### Map Not Loading
- ✅ Verify internet connection for map tiles
- ✅ Check browser console for JavaScript errors
- ✅ Ensure you're serving the app via HTTP (not file://)
- ✅ Clear browser cache and reload

#### API Issues
- ✅ Verify API key is correctly set in `js/app.js`
- ✅ Check API quota limits on OpenRouteService dashboard
- ✅ Confirm API key has necessary permissions
- ✅ Monitor browser network tab for failed requests

#### Performance Issues
- ✅ Close unnecessary browser tabs
- ✅ Disable browser extensions that might interfere
- ✅ Use Chrome for best performance
- ✅ Check if your internet connection is stable

### Getting Help

1. **Check Documentation**: Review this README thoroughly
2. **Browser Console**: Look for error messages (F12 → Console)
3. **Network Tab**: Monitor API requests and responses
4. **GitHub Issues**: Search existing issues or create a new one
5. **Community Forums**: Leaflet.js and OpenStreetMap communities

### Debug Mode

Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'true');
location.reload();
```

### Reporting Bugs

When reporting issues, please include:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Console error messages
- Network request details (if API-related)

---

## 🏆 Acknowledgments

- **OpenRouteService** team for providing excellent isochrone API
- **Leaflet.js** community for the amazing mapping library
- **OpenStreetMap** contributors for comprehensive geographic data
- **NYC Open Data** for borough boundary information

**Built with ❤️ for urban planning and accessibility analysis**
