<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# NYC Manhattan Reachability Map Project

This is a web application that creates an interactive map showing reachability analysis (isochrones) centered on NYC Manhattan using Leaflet.js.

## Project Structure
- `index.html` - Main HTML file with map container and controls
- `css/style.css` - Styling for the map interface and controls
- `js/app.js` - JavaScript application logic for map initialization and reachability calculations

## Key Technologies
- **Leaflet.js** - Open-source JavaScript library for interactive maps
- **OpenRouteService API** - For real isochrone calculations (requires API key)
- **Vanilla JavaScript** - No frameworks, pure ES6+ JavaScript
- **CSS3** - Modern styling with flexbox and grid

## Development Guidelines
- Follow ES6+ JavaScript standards
- Use semantic HTML5 elements
- Implement responsive design principles
- Handle errors gracefully with user-friendly messages
- Comment complex logic for maintainability
- Use consistent naming conventions (camelCase for JS, kebab-case for CSS)

## API Integration
- The app is designed to work with OpenRouteService API for real isochrone data
- Fallback to mock data when no API key is provided
- Handle API rate limits and errors appropriately

## Map Features
- Centered on NYC Manhattan (Times Square area)
- Bounded to Manhattan area for focused analysis
- Click to place analysis points
- Drag markers to update analysis
- Multiple travel modes (walking, cycling, driving)
- Various time ranges (5-30 minutes)
- Visual isochrone representation with color coding
