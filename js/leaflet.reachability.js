/*
    Created:        2018-06-12 by James Austin - Trafford Data Lab
    Latest update:  2020-11-27
    Purpose:        Uses openrouteservice API to create isolines showing areas within reach of certain travel times based on different modes of travel or distance
    Dependencies:   Leaflet.js (external library), openrouteservice.org API (requires a key - free service available via registration)
    Licence:        https://github.com/traffordDataLab/leaflet.reachability/blob/master/LICENSE
    Attribution:    © openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors
    Notes:          Adapted for NYC Manhattan - Can be displayed in a collapsed or expanded state. Content for all GUI elements can be html or an icon etc.
*/

L.Control.Reachability = L.Control.extend({
    options: {
        // Leaflet positioning options
        position: 'topleft',
        pane: 'overlayPane',
        zIndexMouseMarker: 9000,

        // Main control settings and styling
        collapsed: true,
        controlContainerStyleClass: '',
        drawActiveMouseClass: 'leaflet-crosshair',

        // The containing div to hold the actual user interface controls
        settingsContainerStyleClass: 'reachability-control-settings-container',
        settingsButtonStyleClass: 'reachability-control-settings-button',
        activeStyleClass: 'reachability-control-active',
        errorStyleClass: 'reachability-control-error',

        // If collapsed == true a button is displayed to expand the control onclick/touch
        expandButtonContent: '&#x2609;',
        expandButtonStyleClass: 'reachability-control-expand-button',
        expandButtonTooltip: 'Show reachability options',

        // Collapse button displayed within the settings container if collapsed == true
        collapseButtonContent: '^',
        collapseButtonStyleClass: 'reachability-control-collapse-button',
        collapseButtonTooltip: 'Hide reachability options',

        // Draw isochrones button
        drawButtonContent: 'drw',
        drawButtonStyleClass: '',
        drawButtonTooltip: 'Draw reachability',

        // Delete button to remove any current isoline groups drawn on the map
        deleteButtonContent: 'del',
        deleteButtonStyleClass: '',
        deleteButtonTooltip: 'Delete reachability',

        // Export button to save reachability data as GeoJSON
        exportButtonContent: 'exp',
        exportButtonStyleClass: '',
        exportButtonTooltip: 'Export as GeoJSON',

        // Isoline calculation mode - either distance or time
        distanceButtonContent: 'dst',
        distanceButtonStyleClass: '',
        distanceButtonTooltip: 'Reachability based on distance',

        timeButtonContent: 'tme',
        timeButtonStyleClass: '',
        timeButtonTooltip: 'Reachability based on time',

        // Travel modes
        travelModeButton1Content: 'car',
        travelModeButton1StyleClass: '',
        travelModeButton1Tooltip: 'Travel mode: car',

        travelModeButton2Content: 'cyc',
        travelModeButton2StyleClass: '',
        travelModeButton2Tooltip: 'Travel mode: cycling',

        travelModeButton3Content: 'wlk',
        travelModeButton3StyleClass: '',
        travelModeButton3Tooltip: 'Travel mode: walking',

        travelModeButton4Content: 'wch',
        travelModeButton4StyleClass: '',
        travelModeButton4Tooltip: 'Travel mode: wheelchair',

        // Control for the range parameter
        rangeControlDistanceTitle: 'Dist.',
        rangeControlDistance: null,
        rangeControlDistanceMax: 3,
        rangeControlDistanceInterval: 0.5,
        rangeControlDistanceUnits: 'km',
        rangeControlDistanceDefault: 1,

        rangeControlTimeTitle: 'Time',
        rangeControlTime: null,
        rangeControlTimeMax: 30,
        rangeControlTimeInterval: 5,
        rangeControlTimeDefault: 10,

        rangeTypeDefault: 'time',
        rangeIntervalsLabel: 'Show intervals',

        // Travel mode profiles for openrouteservice API
        travelModeProfile1: 'driving-car',
        travelModeProfile2: 'cycling-regular',
        travelModeProfile3: 'foot-walking',
        travelModeProfile4: 'wheelchair',
        travelModeDefault: 'driving-car',

        // API settings
        apiKey: 'YOUR_API_KEY_HERE',
        smoothing: 5,
        attributes: '"area","reachfactor","total_pop"',

        // Isoline styling and interaction
        styleFn: null,
        mouseOverFn: null,
        mouseOutFn: null,
        clickFn: null,

        // Isoline origin marker styling and interaction
        showOriginMarker: true,
        markerFn: null,
        markerOverFn: null,
        markerOutFn: null,
        markerClickFn: null
    },

    onAdd: function (map) {
        // Initial settings
        this.version = '2.0.1';
        this._map = map;
        this._collapsed = this.options.collapsed;
        this._drawMode = false;
        this._deleteMode = false;
        this._rangeIsDistance = (this.options.rangeTypeDefault == 'distance') ? true : false;

        // Choose the travel mode button which is selected by default
        if (this.options.travelModeProfile1 == null) this.options.travelModeProfile1 = 'driving-car';
        this._travelMode = this.options.travelModeDefault;

        this.latestIsolines = null;
        this._drawRequestRegistered = false;
        this._mouseMarker = null;

        // Create the FeatureGroup to hold our isolines groups
        this.isolinesGroup = L.geoJSON(null, { 
            style: this.options.styleFn, 
            pane: this.options.pane, 
            attribution: '&copy; <a href="https://openrouteservice.org/" target="_blank">openrouteservice.org</a> by HeiGIT | Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors' 
        });

        // Main container for the control - this is added to the map in the Leaflet control pane
        this._container = L.DomUtil.create('div', 'leaflet-bar ' + this.options.controlContainerStyleClass);
        L.DomEvent.disableClickPropagation(this._container);

        // Create the components for the user interface
        this._createUI();

        // Fire event to inform that the control has been added to the map
        this._map.fire('reachability:control_added');

        // Leaflet draws the control on the map
        return this._container;
    },

    onRemove: function (map) {
        // clean up - remove any styles, event listeners, layers etc.
        this._deactivateDraw();
        this.isolinesGroup.removeFrom(this._map);
        this.isolinesGroup.clearLayers();

        // Fire event to inform that the control has been removed from the map
        this._map.fire('reachability:control_removed');
    },

    _decimalPlaces: function (n) {
        // Function to calculate the number of decimal places in a given number.
        n = String(n);
        return (n.indexOf('.') > -1) ? n.length-n.indexOf('.')-1 : 0;
    },

    _createUI: function () {
        // Container for the user interface controls
        this._uiContainer = L.DomUtil.create('div', this.options.settingsContainerStyleClass);
        this._container.appendChild(this._uiContainer);

        // Container for the action and mode buttons
        this._actionsAndModesContainer = L.DomUtil.create('div', 'reachability-control-settings-block-container', this._uiContainer);

        // Draw button - to create isolines
        this._drawControl = this._createButton('span', this.options.drawButtonContent, this.options.drawButtonTooltip, this.options.settingsButtonStyleClass + ' ' + this.options.drawButtonStyleClass, this._actionsAndModesContainer, this._toggleDraw);

        // Delete button - to remove isolines
        this._deleteControl = this._createButton('span', this.options.deleteButtonContent, this.options.deleteButtonTooltip, this.options.settingsButtonStyleClass + ' ' + this.options.deleteButtonStyleClass, this._actionsAndModesContainer, this._toggleDelete);

        // Export button - to save isolines as GeoJSON
        console.log('Creating export button...');
        this._exportControl = this._createButton('span', this.options.exportButtonContent, this.options.exportButtonTooltip, this.options.settingsButtonStyleClass + ' ' + this.options.exportButtonStyleClass, this._actionsAndModesContainer, this._exportGeoJSON);
        console.log('Export button created:', this._exportControl);

        // Distance setting button - to calculate isolines based on distance (isodistance)
        this._distanceControl = this._createButton('span', this.options.distanceButtonContent, this.options.distanceButtonTooltip, this.options.settingsButtonStyleClass + ' ' + this.options.distanceButtonStyleClass, this._actionsAndModesContainer, this._setRangeByDistance);

        // Time setting button - to calculate isolines based on time (isochrones)
        this._timeControl = this._createButton('span', this.options.timeButtonContent, this.options.timeButtonTooltip, this.options.settingsButtonStyleClass + ' ' + this.options.timeButtonStyleClass, this._actionsAndModesContainer, this._setRangeByTime);

        // Container for the travel mode buttons
        this._modesContainer = L.DomUtil.create('div', 'reachability-control-settings-block-container', this._uiContainer);

        // Travel mode buttons
        this._travelMode1Control = this._createButton('span', this.options.travelModeButton1Content, this.options.travelModeButton1Tooltip, this.options.settingsButtonStyleClass + ' ' + this.options.travelModeButton1StyleClass, this._modesContainer, this._setTravelMode1);

        this._travelMode2Control = (this.options.travelModeProfile2 != null) ? this._createButton('span', this.options.travelModeButton2Content, this.options.travelModeButton2Tooltip, this.options.settingsButtonStyleClass + ' ' + this.options.travelModeButton2StyleClass, this._modesContainer, this._setTravelMode2) : L.DomUtil.create('span', '');

        this._travelMode3Control = (this.options.travelModeProfile3 != null) ? this._createButton('span', this.options.travelModeButton3Content, this.options.travelModeButton3Tooltip, this.options.settingsButtonStyleClass + ' ' + this.options.travelModeButton3StyleClass, this._modesContainer, this._setTravelMode3) : L.DomUtil.create('span', '');

        this._travelMode4Control = (this.options.travelModeProfile4 != null) ? this._createButton('span', this.options.travelModeButton4Content, this.options.travelModeButton4Tooltip, this.options.settingsButtonStyleClass + ' ' + this.options.travelModeButton4StyleClass, this._modesContainer, this._setTravelMode4) : L.DomUtil.create('span', '');

        // Range controls
        this._createRangeControls();

        // Set initial states
        this._setInitialStates();

        // If collapsed, create expand/collapse buttons
        if (this._collapsed) {
            L.DomUtil.addClass(this._uiContainer, 'reachability-control-hide-content');

            this._expandButtonContainer = L.DomUtil.create('span', '');
            this._container.appendChild(this._expandButtonContainer);

            this._createButton('a', this.options.expandButtonContent, this.options.expandButtonTooltip, this.options.expandButtonStyleClass, this._expandButtonContainer, this._expand);

            this._createButton('span', this.options.collapseButtonContent, this.options.collapseButtonTooltip, this.options.collapseButtonStyleClass, this._uiContainer, this._collapse);
        }
    },

    _createRangeControls: function () {
        // Distance range title
        this._rangeDistanceTitle = L.DomUtil.create('span', 'reachability-control-range-title reachability-control-hide-content', this._uiContainer);
        this._rangeDistanceTitle.innerHTML = this.options.rangeControlDistanceTitle;

        // Distance range control
        this._rangeDistanceList = L.DomUtil.create('select', 'reachability-control-range-list reachability-control-hide-content', this._uiContainer);
        
        if (this.options.rangeControlDistance == null) {
            var decimalPlacesDistance = Math.max(this._decimalPlaces(this.options.rangeControlDistanceMax), this._decimalPlaces(this.options.rangeControlDistanceInterval));
            for (var i = this.options.rangeControlDistanceInterval; i <= this.options.rangeControlDistanceMax; i += this.options.rangeControlDistanceInterval) {
                if (String(i).length > i.toFixed(decimalPlacesDistance).length) i = parseFloat(i.toFixed(decimalPlacesDistance));
                var opt = L.DomUtil.create('option', '', this._rangeDistanceList);
                opt.setAttribute('value', i);
                opt.innerHTML = i + ' ' + this.options.rangeControlDistanceUnits;
            }
        } else {
            for (var i = 0; i < this.options.rangeControlDistance.length; i++) {
                var opt = L.DomUtil.create('option', '', this._rangeDistanceList);
                opt.setAttribute('value', this.options.rangeControlDistance[i]);
                opt.innerHTML = this.options.rangeControlDistance[i] + ' ' + this.options.rangeControlDistanceUnits;
            }
        }

        // Time range title
        this._rangeTimeTitle = L.DomUtil.create('span', 'reachability-control-range-title reachability-control-hide-content', this._uiContainer);
        this._rangeTimeTitle.innerHTML = this.options.rangeControlTimeTitle;

        // Time range control
        this._rangeTimeList = L.DomUtil.create('select', 'reachability-control-range-list reachability-control-hide-content', this._uiContainer);
        
        if (this.options.rangeControlTime == null) {
            for (var i = this.options.rangeControlTimeInterval; i <= this.options.rangeControlTimeMax; i += this.options.rangeControlTimeInterval) {
                var opt = L.DomUtil.create('option', '', this._rangeTimeList);
                opt.setAttribute('value', i);
                opt.innerHTML = i + ' min';
            }
        } else {
            for (var i = 0; i < this.options.rangeControlTime.length; i++) {
                var opt = L.DomUtil.create('option', '', this._rangeTimeList);
                opt.setAttribute('value', this.options.rangeControlTime[i]);
                opt.innerHTML = this.options.rangeControlTime[i] + ' min';
            }
        }

        // Show intervals checkbox
        this._showIntervalContainer = L.DomUtil.create('span', 'reachability-control-show-range-interval', this._uiContainer);
        this._showInterval = L.DomUtil.create('input', '', this._showIntervalContainer);
        this._showInterval.setAttribute('id', 'rangeInterval');
        this._showInterval.setAttribute('type', 'checkbox');
        this._showIntervalLabel = L.DomUtil.create('label', '', this._showIntervalContainer);
        this._showIntervalLabel.setAttribute('for', 'rangeInterval');
        this._showIntervalLabel.innerHTML = this.options.rangeIntervalsLabel;
    },

    _setInitialStates: function () {
        // Select the correct range type button and show the correct range list
        if (this._rangeIsDistance) {
            L.DomUtil.addClass(this._distanceControl, this.options.activeStyleClass);
            L.DomUtil.removeClass(this._rangeDistanceTitle, 'reachability-control-hide-content');
            L.DomUtil.removeClass(this._rangeDistanceList, 'reachability-control-hide-content');
        } else {
            L.DomUtil.addClass(this._timeControl, this.options.activeStyleClass);
            L.DomUtil.removeClass(this._rangeTimeTitle, 'reachability-control-hide-content');
            L.DomUtil.removeClass(this._rangeTimeList, 'reachability-control-hide-content');
        }

        // Select the correct travel mode button
        this._toggleTravelMode(null);

        // Set default values
        this._rangeDistanceList.value = this.options.rangeControlDistanceDefault;
        this._rangeTimeList.value = this.options.rangeControlTimeDefault;
    },

    _createButton: function (tag, html, title, className, container, fn) {
        var button = L.DomUtil.create(tag, className, container);
        button.innerHTML = html;
        button.title = title;
        if (tag === 'a') button.href = '#';

        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', title);

        L.DomEvent
            .on(button, 'mousedown touchstart dblclick', L.DomEvent.stopPropagation)
            .on(button, 'click', L.DomEvent.stop)
            .on(button, 'click', fn, this);

        return button;
    },

    _expand: function () {
        L.DomUtil.removeClass(this._uiContainer, 'reachability-control-hide-content');
        L.DomUtil.addClass(this._expandButtonContainer, 'reachability-control-hide-content');

        if (L.DomUtil.hasClass(this._container, this.options.activeStyleClass)) 
            L.DomUtil.removeClass(this._container, this.options.activeStyleClass);

        this._map.fire('reachability:control_expanded');
    },

    _collapse: function () {
        L.DomUtil.addClass(this._uiContainer, 'reachability-control-hide-content');
        L.DomUtil.removeClass(this._expandButtonContainer, 'reachability-control-hide-content');

        if ((this._drawMode || this._deleteMode) && !L.DomUtil.hasClass(this._container, this.options.activeStyleClass)) 
            L.DomUtil.addClass(this._container, this.options.activeStyleClass);

        this._map.fire('reachability:control_collapsed');
    },

    _toggleDraw: function () {
        console.log('_toggleDraw called, current drawMode:', this._drawMode);
        if (this._deleteMode) this._deactivateDelete();
        (this._drawMode) ? this._deactivateDraw() : this._activateDraw();
    },

    _toggleDelete: function () {
        if (this._drawMode) this._deactivateDraw();
        (this._deleteMode) ? this._deactivateDelete() : this._activateDelete();
    },

    _activateDraw: function () {
        console.log('_activateDraw called');
        this._drawMode = true;
        L.DomUtil.addClass(this._drawControl, this.options.activeStyleClass);

        if (this._deleteMode) this._deactivateDelete();

        this._drawRequestRegistered = false;

        if (!this._mouseMarker) {
            this._mouseMarker = L.marker(this._map.getCenter(), {
                icon: L.divIcon({
                    className: this.options.drawActiveMouseClass,
                    iconAnchor: [400, 400],
                    iconSize: [800, 800]
                }),
                opacity: 0,
                zIndexOffset: this.options.zIndexMouseMarker
            });
        }

        this._mouseMarker
            .on('mousemove', this._updatePointerMarkerPosition, this)
            .on('click', this._registerDrawRequest, this)
            .addTo(this._map);

        this._map
            .on('mousemove', this._updatePointerMarkerPosition, this)
            .on('mousedown', this._updatePointerMarkerPosition, this)
            .on('click', this._registerDrawRequest, this);

        this._map.fire('reachability:draw_activated');
    },

    _deactivateDraw: function () {
        this._drawMode = false;
        L.DomUtil.removeClass(this._drawControl, this.options.activeStyleClass);

        if (this._mouseMarker !== null) {
            this._mouseMarker
                .off('mousemove', this._updatePointerMarkerPosition, this)
                .off('click', this._registerDrawRequest, this)
                .removeFrom(this._map);
            this._mouseMarker = null;
        }

        this._map
            .off('mousemove', this._updatePointerMarkerPosition, this)
            .off('mousedown', this._updatePointerMarkerPosition, this)
            .off('click', this._registerDrawRequest, this);

        this._map.fire('reachability:draw_deactivated');
    },

    _exportGeoJSON: function () {
        console.log('Export button clicked!');
        if (!this.isolinesGroup || this.isolinesGroup.getLayers().length === 0) {
            alert('No reachability data to export. Please create some reachability areas first.');
            return;
        }

        try {
            // Convert the isolines group to GeoJSON
            var geoJSON = this.isolinesGroup.toGeoJSON();
            
            // Generate filename with city name, date, and time
            var now = new Date();
            var cityName = 'Manhattan'; // Default city name for NYC
            var dateStr = now.getFullYear() + '-' + 
                         String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(now.getDate()).padStart(2, '0');
            var timeStr = String(now.getHours()).padStart(2, '0') + '' + 
                         String(now.getMinutes()).padStart(2, '0') + '' + 
                         String(now.getSeconds()).padStart(2, '0');
            
            var filename = 'reachability_' + cityName + '_' + dateStr + '_' + timeStr + '.geojson';
            
            // Create and download the file
            var blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            
            var link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            console.log('Exported reachability data as:', filename);
            
            // Fire event to inform that export was successful
            this._map.fire('reachability:exported', { filename: filename, data: geoJSON });
            
        } catch (error) {
            console.error('Error exporting GeoJSON:', error);
            alert('Error exporting data. Please check the console for details.');
        }
    },

    _activateDelete: function () {
        var isolinesGroupNum = this.isolinesGroup.getLayers().length;

        if (isolinesGroupNum > 0) {
            if (isolinesGroupNum == 1) {
                this.isolinesGroup.clearLayers();
                this.isolinesGroup.removeFrom(this._map);
                this._map.fire('reachability:delete');
            } else {
                this._deleteMode = true;
                L.DomUtil.addClass(this._deleteControl, this.options.activeStyleClass);
                this._map.fire('reachability:delete_activated');
            }
        } else {
            this._showError(this._deleteControl);
        }
    },

    _deactivateDelete: function () {
        this._deleteMode = false;
        L.DomUtil.removeClass(this._deleteControl, this.options.activeStyleClass);

        if (L.DomUtil.hasClass(this._container, this.options.activeStyleClass)) 
            L.DomUtil.removeClass(this._container, this.options.activeStyleClass);

        this._map.fire('reachability:delete_deactivated');
    },

    _delete: function (e) {
        var parent = e.sourceTarget._eventParents;

        for (var key in parent) {
            if (parent.hasOwnProperty(key) && key != '<prototype>') 
                parent[key].removeFrom(this.isolinesGroup);
        }

        if (this.isolinesGroup.getLayers().length == 0) {
            this._deactivateDelete();
            this.isolinesGroup.removeFrom(this._map);
            this._map.fire('reachability:delete');
        }

        this._map.fire('reachability:delete');
    },

    _showError: function (control) {
        var css = this.options.errorStyleClass;
        L.DomUtil.addClass(control, css);
        setTimeout(function () {
            L.DomUtil.removeClass(control, css);
        }, 500);
    },

    _setRangeByDistance: function () {
        if (this._rangeIsDistance == false) {
            L.DomUtil.addClass(this._distanceControl, this.options.activeStyleClass);
            L.DomUtil.removeClass(this._timeControl, this.options.activeStyleClass);

            L.DomUtil.removeClass(this._rangeDistanceTitle, 'reachability-control-hide-content');
            L.DomUtil.addClass(this._rangeTimeTitle, 'reachability-control-hide-content');

            L.DomUtil.removeClass(this._rangeDistanceList, 'reachability-control-hide-content');
            L.DomUtil.addClass(this._rangeTimeList, 'reachability-control-hide-content');

            this._rangeIsDistance = true;
        }
    },

    _setRangeByTime: function () {
        if (this._rangeIsDistance) {
            L.DomUtil.addClass(this._timeControl, this.options.activeStyleClass);
            L.DomUtil.removeClass(this._distanceControl, this.options.activeStyleClass);

            L.DomUtil.removeClass(this._rangeTimeTitle, 'reachability-control-hide-content');
            L.DomUtil.addClass(this._rangeDistanceTitle, 'reachability-control-hide-content');

            L.DomUtil.removeClass(this._rangeTimeList, 'reachability-control-hide-content');
            L.DomUtil.addClass(this._rangeDistanceList, 'reachability-control-hide-content');

            this._rangeIsDistance = false;
        }
    },

    _setTravelMode1: function () { this._toggleTravelMode(this.options.travelModeProfile1); },
    _setTravelMode2: function () { this._toggleTravelMode(this.options.travelModeProfile2); },
    _setTravelMode3: function () { this._toggleTravelMode(this.options.travelModeProfile3); },
    _setTravelMode4: function () { this._toggleTravelMode(this.options.travelModeProfile4); },

    _toggleTravelMode: function (def_mode) {
        if (def_mode === null) {
            def_mode = this.options.travelModeDefault;
        }

        if (def_mode !== null) {
            switch (def_mode) {
                case this.options.travelModeProfile1:
                    L.DomUtil.addClass(this._travelMode1Control, this.options.activeStyleClass);
                    L.DomUtil.removeClass(this._travelMode2Control, this.options.activeStyleClass);
                    L.DomUtil.removeClass(this._travelMode3Control, this.options.activeStyleClass);
                    L.DomUtil.removeClass(this._travelMode4Control, this.options.activeStyleClass);
                    break;
                case this.options.travelModeProfile2:
                    L.DomUtil.removeClass(this._travelMode1Control, this.options.activeStyleClass);
                    L.DomUtil.addClass(this._travelMode2Control, this.options.activeStyleClass);
                    L.DomUtil.removeClass(this._travelMode3Control, this.options.activeStyleClass);
                    L.DomUtil.removeClass(this._travelMode4Control, this.options.activeStyleClass);
                    break;
                case this.options.travelModeProfile3:
                    L.DomUtil.removeClass(this._travelMode1Control, this.options.activeStyleClass);
                    L.DomUtil.removeClass(this._travelMode2Control, this.options.activeStyleClass);
                    L.DomUtil.addClass(this._travelMode3Control, this.options.activeStyleClass);
                    L.DomUtil.removeClass(this._travelMode4Control, this.options.activeStyleClass);
                    break;
                case this.options.travelModeProfile4:
                    L.DomUtil.removeClass(this._travelMode1Control, this.options.activeStyleClass);
                    L.DomUtil.removeClass(this._travelMode2Control, this.options.activeStyleClass);
                    L.DomUtil.removeClass(this._travelMode3Control, this.options.activeStyleClass);
                    L.DomUtil.addClass(this._travelMode4Control, this.options.activeStyleClass);
                    break;
                default:
                    L.DomUtil.addClass(this._travelMode1Control, this.options.activeStyleClass);
                    L.DomUtil.removeClass(this._travelMode2Control, this.options.activeStyleClass);
                    L.DomUtil.removeClass(this._travelMode3Control, this.options.activeStyleClass);
                    L.DomUtil.removeClass(this._travelMode4Control, this.options.activeStyleClass);
            }

            this._travelMode = def_mode;
        }
    },

    _updatePointerMarkerPosition: function (e) {
        var newPos = this._map.mouseEventToLayerPoint(e.originalEvent);
        var latlng = this._map.layerPointToLatLng(newPos);

        this._mouseMarker.setLatLng(latlng);
        L.DomEvent.stop(e.originalEvent);
    },

    _registerDrawRequest: function (e) {
        console.log('_registerDrawRequest called at:', e.latlng);
        L.DomEvent.stop(e.originalEvent);

        if (!this._drawRequestRegistered) {
            this._drawRequestRegistered = true;
            this._callApi(e.latlng);
        }
    },

    _handleError: function (obj) {
        if (window.console && window.console.log) {
            if (obj.message != null) window.console.log(obj.message);
            if (obj.requestResult != null) {
                window.console.log('Status:', obj.requestResult.status);
                window.console.log('Headers:', obj.requestResult.getAllResponseHeaders());
                window.console.log(obj.requestResult.response);
            }
        }

        if (obj.events != null && obj.events.length > 0) {
            for (var i = 0; i < obj.events.length; i++) {
                obj.context._map.fire('reachability:' + obj.events[i]);
            }
        }

        obj.context._showError(obj.context._drawControl);
        obj.context._deactivateDraw();
    },

    _callApi: function (latLng) {
        var context = this;

        // Use demo API key if none provided (same as trafforddatalab example)
        var apiKey = this.options.apiKey || '5b3ce3597851110001cf6248c9f85cae50384963b985be5b9d179444';
        
        // Only use mock data if explicitly set to placeholder
        if (this.options.apiKey === 'YOUR_API_KEY_HERE') {
            console.log('Using mock data for placeholder API key');
            this._showMockReachability(latLng);
            this._drawRequestRegistered = false;
            return;
        }

        console.log('Making API call with key:', apiKey.substring(0, 8) + '...');

        if (window.XMLHttpRequest) {
            var requestBody = '{"locations":[[' + latLng.lng + ',' + latLng.lat + ']],"attributes":[' + this.options.attributes + '],"smoothing":' + this.options.smoothing + ',';

            var arrRange = [];
            var optionsIndex = 0;

            if (this._rangeIsDistance) {
                if (this._showInterval.checked) {
                    do {
                        arrRange.push(this._rangeDistanceList[optionsIndex].value);
                        optionsIndex++;
                    } while (optionsIndex <= this._rangeDistanceList.selectedIndex);
                } else {
                    arrRange.push(this._rangeDistanceList.value);
                }
                requestBody += '"range_type":"distance","units":"' + this.options.rangeControlDistanceUnits + '"';
            } else {
                if (this._showInterval.checked) {
                    do {
                        arrRange.push(this._rangeTimeList[optionsIndex].value * 60);
                        optionsIndex++;
                    } while (optionsIndex <= this._rangeTimeList.selectedIndex);
                } else {
                    arrRange.push(this._rangeTimeList.value * 60);
                }
                requestBody += '"range_type":"time"';
            }

            requestBody += ',"range":[' + arrRange.toString() + ']}';

            var request = new XMLHttpRequest();
            request.open('POST', 'https://corsproxy.io/?' + encodeURIComponent('https://api.openrouteservice.org/v2/isochrones/' + this._travelMode));
            request.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');
            request.setRequestHeader('Authorization', apiKey);
            request.setRequestHeader('Content-Type', 'application/json; charset=utf-8');

            request.onreadystatechange = function () {
                if (this.readyState == 4) {
                    try {
                        if (this.status == 200) {
                            var data = JSON.parse(this.responseText);
                            
                            if (data.features && data.features.length > 0) {
                                context._processApiResponse(data, latLng);
                            } else {
                                context.latestIsolines = null;
                                context._handleError({
                                    message: 'Leaflet.reachability.js: API returned data but no GeoJSON layers.',
                                    requestResult: this,
                                    context: context,
                                    events: ['no_data']
                                });
                            }
                        } else {
                            context._handleError({
                                message: 'Leaflet.reachability.js error calling API, response was not successful.',
                                requestResult: this,
                                context: context,
                                events: ['error','no_data']
                            });
                        }

                        context._map.fire('reachability:api_call_end');
                        context._drawRequestRegistered = false;
                    } catch(e) {
                        context._handleError({
                            message: 'Leaflet.reachability.js unexpected error attempting to call API. Details: ' + e,
                            requestResult: null,
                            context: context,
                            events: ['error','no_data','api_call_end']
                        });
                    }
                }
            };

            this._map.fire('reachability:api_call_start');
            request.send(requestBody);
        } else {
            this._handleError({
                message: 'Leaflet.reachability.js error. Browser does not support XMLHttpRequest.',
                requestResult: null,
                context: this,
                events: ['error','no_data']
            });
        }
    },

    _processApiResponse: function (data, latLng) {
        // Process the response and add properties
        var rangeUnits = this._rangeIsDistance ? this.options.rangeControlDistanceUnits : 'min';
        var rangeControlDistanceUnits = this.options.rangeControlDistanceUnits;

        for (var i = 0; i < data.features.length; i++) {
            var props = data.features[i].properties;
            var range = this._rangeIsDistance ? props.value / 1000 : props.value / 60;

            var newProps = {
                'Travel mode': this._getTravelModeDisplayName(this._travelMode),
                'Range': L.Util.formatNum(range, 2),
                'Range units': rangeUnits,
                'Latitude': props.center[1],
                'Longitude': props.center[0]
            };

            if (props.hasOwnProperty('area')) {
                newProps['Area'] = L.Util.formatNum(props.area, 2);
                newProps['Area units'] = rangeControlDistanceUnits + '^2';
            }

            if (props.hasOwnProperty('total_pop')) newProps['Population'] = props.total_pop;
            if (props.hasOwnProperty('reachfactor')) newProps['Reach factor'] = props.reachfactor;

            data.features[i].properties = newProps;
        }

        this.latestIsolines = L.geoJSON(data, { 
            style: this.options.styleFn, 
            onEachFeature: this.options.onEachFeatureFn, 
            pane: this.options.pane 
        });

        var context = this;
        this.latestIsolines.eachLayer(function (layer) {
            layer.on({
                mouseover: (function (e) { if (context.options.mouseOverFn != null) context.options.mouseOverFn(e); }),
                mouseout: (function (e) { if (context.options.mouseOutFn != null) context.options.mouseOutFn(e); }),
                click: (function(e) {
                    if (context._deleteMode) {
                        L.DomEvent.stopPropagation(e);
                        context._delete(e);
                    } else {
                        if (context.options.clickFn != null) context.options.clickFn(e);
                    }
                })
            });
        });

        if (this.options.showOriginMarker) {
            var originMarker;
            if (this.options.markerFn != null) {
                originMarker = this.options.markerFn(latLng, this._travelMode, this._rangeIsDistance ? 'distance' : 'time');
            } else {
                originMarker = L.circleMarker(latLng, { radius: 3, weight: 0, fillColor: '#0073d4', fillOpacity: 1 });
            }

            originMarker.on({
                mouseover: (function (e) { if (context.options.markerOverFn != null) context.options.markerOverFn(e); }),
                mouseout: (function (e) { if (context.options.markerOutFn != null) context.options.markerOutFn(e); }),
                click: (function(e) {
                    if (context._deleteMode) {
                        L.DomEvent.stopPropagation(e);
                        context._delete(e);
                    } else {
                        if (context.options.markerClickFn != null) context.options.markerClickFn(e);
                    }
                })
            });

            originMarker.addTo(this.latestIsolines);
        }

        this.latestIsolines.addTo(this.isolinesGroup);

        if (!this._map.hasLayer(this.isolinesGroup)) this.isolinesGroup.addTo(this._map);

        this._map.fire('reachability:displayed');
    },

    _showMockReachability: function (latLng) {
        console.log('showMockReachability called with:', latLng);
        var travelTime = parseInt(this._rangeTimeList.value);
        var travelMode = this._travelMode;
        console.log('Travel time:', travelTime, 'Travel mode:', travelMode);

        var radius;
        switch (travelMode) {
            case 'foot-walking':
                radius = travelTime * 0.08;
                break;
            case 'cycling-regular':
                radius = travelTime * 0.25;
                break;
            case 'driving-car':
                radius = travelTime * 0.5;
                break;
            default:
                radius = travelTime * 0.15;
        }

        var mockData = {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                properties: {
                    value: travelTime * 60, // Convert minutes to seconds for consistency
                    center: [latLng.lng, latLng.lat]
                },
                geometry: this._createMockCircle(latLng, radius)
            }]
        };

        this._processApiResponse(mockData, latLng);
        console.log('Mock circle created with radius:', radius, 'km');
    },

    _createMockCircle: function (center, radiusKm) {
        var points = [];
        var numPoints = 32;
        var radiusDeg = radiusKm / 111.32; // Rough conversion from km to degrees

        for (var i = 0; i < numPoints; i++) {
            var angle = (i / numPoints) * 2 * Math.PI;
            var lat = center.lat + radiusDeg * Math.cos(angle);
            var lng = center.lng + radiusDeg * Math.sin(angle) / Math.cos(center.lat * Math.PI / 180);
            points.push([lng, lat]);
        }
        points.push(points[0]); // Close the polygon

        return {
            type: 'Polygon',
            coordinates: [points]
        };
    },

    _getTravelModeDisplayName: function (mode) {
        var modes = {
            'driving-car': 'Driving',
            'cycling-regular': 'Cycling',
            'foot-walking': 'Walking',
            'wheelchair': 'Wheelchair'
        };
        return modes[mode] || mode;
    }
});

L.control.reachability = function (options) {
    return new L.Control.Reachability(options);
};
