import L from 'leaflet';

/**
 * @class L.Draw.Angle
 * @aka Draw.Angle
 * @inherits L.Draw.Feature
 */
L.Draw.Angle = L.Draw.Feature.extend({
    statics: {
        TYPE: 'angle'
    },

    Angle: L.Polyline,

    options: {
        allowIntersection: true,
        repeatMode: false,
        drawError: {
            color: '#b00b00',
            timeout: 2500
        },
        icon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className: 'leaflet-div-icon leaflet-editing-icon'
        }),
        touchIcon: new L.DivIcon({
            iconSize: new L.Point(20, 20),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
        }),
        guidelineDistance: 20,
        maxGuideLineLength: 4000,
        shapeOptions: {
            stroke: true,
            color: '#3388ff',
            weight: 4,
            opacity: 0.5,
            fill: false,
            clickable: true
        },
        metric: true, // Whether to use the metric measurement system or imperial
        feet: true, // When not metric, to use feet instead of yards for display.
        nautic: false, // When not metric, not feet use nautic mile for display
        showLength: true, // Whether to display distance in the tooltip
        zIndexOffset: 2000, // This should be > than the highest z-index any map layers
        factor: 1, // To change distance calculation
        maxPoints: 3 // Once this number of points are placed, finish shape
    },

    // @method initialize(): void
    initialize: function (map, options) {
        // if touch, switch to touch icon
        if (L.Browser.touch) {
            this.options.icon = this.options.touchIcon;
        }

        // Need to set this here to ensure the correct message is used.
        this.options.drawError.message = L.drawLocal.draw.handlers.angle.error;

        // Merge default drawError options with custom options
        if (options && options.drawError) {
            options.drawError = L.Util.extend({}, this.options.drawError, options.drawError);
        }

        // Save the type so super can fire, need to do this as cannot do this.TYPE :(
        this.type = L.Draw.Angle.TYPE;

        L.Draw.Feature.prototype.initialize.call(this, map, options);
    },

    // @method addHooks(): void
    // Add listener hooks to this handler
    addHooks: function () {
        L.Draw.Feature.prototype.addHooks.call(this);
        if (this._map) {
            this._markers = [];

            this._markerGroup = new L.LayerGroup();
            this._map.addLayer(this._markerGroup);

            this._angle = new L.Polyline([], this.options.shapeOptions);

            this._tooltip.updateContent(this._getTooltipText());

            // Make a transparent marker that will used to catch click events. These click
            // events will create the vertices. We need to do this so we can ensure that
            // we can create vertices over other map layers (markers, vector layers). We
            // also do not want to trigger any click handlers of objects we are clicking on
            // while drawing.
            if (!this._mouseMarker) {
                this._mouseMarker = L.marker(this._map.getCenter(), {
                    icon: L.divIcon({
                        className: 'leaflet-mouse-marker',
                        iconAnchor: [20, 20],
                        iconSize: [40, 40]
                    }),
                    opacity: 0,
                    zIndexOffset: this.options.zIndexOffset
                });
            }

            this._mouseMarker
                .on('mouseout', this._onMouseOut, this)
                .on('mousemove', this._onMouseMove, this) // Necessary to prevent 0.8 stutter
                .on('mousedown', this._onMouseDown, this)
                .on('mouseup', this._onMouseUp, this) // Necessary for 0.8 compatibility
                .addTo(this._map);

            this._map
                .on('mouseup', this._onMouseUp, this) // Necessary for 0.7 compatibility
                .on('mousemove', this._onMouseMove, this)
                .on('zoomlevelschange', this._onZoomEnd, this)
                .on('touchstart', this._onTouch, this)
                .on('zoomend', this._onZoomEnd, this);

        }
    },

    // @method removeHooks(): void
    // Remove listener hooks from this handler.
    removeHooks: function () {
        L.Draw.Feature.prototype.removeHooks.call(this);

        this._clearHideErrorTimeout();

        this._cleanUpShape();

        // remove markers from map
        this._map.removeLayer(this._markerGroup);
        delete this._markerGroup;
        delete this._markers;

        this._map.removeLayer(this._angle);
        delete this._angle;

        this._mouseMarker
            .off('mousedown', this._onMouseDown, this)
            .off('mouseout', this._onMouseOut, this)
            .off('mouseup', this._onMouseUp, this)
            .off('mousemove', this._onMouseMove, this);
        this._map.removeLayer(this._mouseMarker);
        delete this._mouseMarker;

        // clean up DOM
        this._clearGuides();

        this._map
            .off('mouseup', this._onMouseUp, this)
            .off('mousemove', this._onMouseMove, this)
            .off('zoomlevelschange', this._onZoomEnd, this)
            .off('zoomend', this._onZoomEnd, this)
            .off('touchstart', this._onTouch, this)
            .off('click', this._onTouch, this);
    },

    // @method addVertex(): void
    // Add a vertex to the end of the polyline
    addVertex: function (latlng) {
        let markersLength = this._markers.length;
        // markersLength must be greater than or equal to 2 before intersections can occur
        if (markersLength >= 2 && !this.options.allowIntersection && this._angle.newLatLngIntersects(latlng)) {
            this._showErrorTooltip();
            return;
        }
        else if (this._errorShown) {
            this._hideErrorTooltip();
        }

        this._markers.push(this._createMarker(latlng));

        this._angle.addLatLng(latlng);

        if (this._angle.getLatLngs().length === 2) {
            this._map.addLayer(this._angle);
        }

        this._vertexChanged(latlng, true);
    },

    _finishShape: function () {
        let latlngs = this._angle._defaultShape ? this._angle._defaultShape() : this._angle.getLatLngs();
        let intersects = this._angle.newLatLngIntersects(latlngs[latlngs.length - 1]);

        if ((!this.options.allowIntersection && intersects) || !this._shapeIsValid()) {
            this._showErrorTooltip();
            return;
        }

        //Replace first and second vertex to draw correct angle.
        let first = latlngs[0];
        latlngs[0] = latlngs[1];
        latlngs[1] = first;

        this._fireCreatedEvent();
        this.disable();
        if (this.options.repeatMode) {
            this.enable();
        }
    },

    // Called to verify the shape is valid when the user tries to finish it
    // Return false if the shape is not valid
    _shapeIsValid: function () {
        return true;
    },

    _onZoomEnd: function () {
        if (this._markers !== null) {
            this._updateGuide();
        }
    },

    _onMouseMove: function (e) {
        let newPos = this._map.mouseEventToLayerPoint(e.originalEvent);
        let latlng = this._map.layerPointToLatLng(newPos);

        // Save latlng
        // should this be moved to _updateGuide() ?
        this._currentLatLng = latlng;

        this._updateTooltip(latlng);

        // Update the guide line
        this._updateGuide(newPos);

        // Update the mouse marker position
        this._mouseMarker.setLatLng(latlng);

        L.DomEvent.preventDefault(e.originalEvent);
    },

    _vertexChanged: function (latlng, added) {
        this._map.fire(L.Draw.Event.DRAWVERTEX, {layers: this._markerGroup});
        this._updateFinishHandler();

        this._updateRunningMeasure(latlng, added);

        this._clearGuides();

        this._updateTooltip();
    },

    _onMouseDown: function (e) {
        if (!this._clickHandled && !this._touchHandled && !this._disableMarkers) {
            this._onMouseMove(e);
            this._clickHandled = true;
            this._disableNewMarkers();
            let originalEvent = e.originalEvent;
            let clientX = originalEvent.clientX;
            let clientY = originalEvent.clientY;
            this._startPoint.call(this, clientX, clientY);
        }
    },

    _startPoint: function (clientX, clientY) {
        this._mouseDownOrigin = L.point(clientX, clientY);
    },

    _onMouseUp: function (e) {
        let originalEvent = e.originalEvent;
        let clientX = originalEvent.clientX;
        let clientY = originalEvent.clientY;
        this._endPoint.call(this, clientX, clientY, e);
        this._clickHandled = null;
    },

    _endPoint: function (clientX, clientY, e) {
        if (this._mouseDownOrigin) {
            let dragCheckDistance = L.point(clientX, clientY)
                .distanceTo(this._mouseDownOrigin);
            let lastPtDistance = this._calculateFinishDistance(e.latlng);
            if (this.options.maxPoints > 1 && this.options.maxPoints == this._markers.length + 1) {
                this.addVertex(e.latlng);
                this._finishShape();
            } else if (lastPtDistance < 10 && L.Browser.touch) {
                this._finishShape();
            } else if (Math.abs(dragCheckDistance) < 9 * (window.devicePixelRatio || 1)) {
                this.addVertex(e.latlng);
            }
            this._enableNewMarkers(); // after a short pause, enable new markers
        }
        this._mouseDownOrigin = null;
    },

    // ontouch prevented by clickHandled flag because some browsers fire both click/touch events,
    // causing unwanted behavior
    _onTouch: function (e) {
        let originalEvent = e.originalEvent;
        let clientX;
        let clientY;
        if (originalEvent.touches && originalEvent.touches[0] && !this._clickHandled && !this._touchHandled && !this._disableMarkers) {
            clientX = originalEvent.touches[0].clientX;
            clientY = originalEvent.touches[0].clientY;
            this._disableNewMarkers();
            this._touchHandled = true;
            this._startPoint.call(this, clientX, clientY);
            this._endPoint.call(this, clientX, clientY, e);
            this._touchHandled = null;
        }
        this._clickHandled = null;
    },

    _onMouseOut: function () {
        if (this._tooltip) {
            this._tooltip._onMouseOut.call(this._tooltip);
        }
    },

    // calculate if we are currently within close enough distance
    // of the closing point (first point for shapes, last point for lines)
    // this is semi-ugly code but the only reliable way i found to get the job done
    // note: calculating point.distanceTo between mouseDownOrigin and last marker did NOT work
    _calculateFinishDistance: function (potentialLatLng) {
        let lastPtDistance;
        if (this._markers.length > 0) {
            let finishMarker;
            if (this.type === L.Draw.Angle.TYPE) {
                finishMarker = this._markers[this._markers.length - 1];
            } else if (this.type === L.Draw.Polygon.TYPE) {
                finishMarker = this._markers[0];
            } else {
                return Infinity;
            }
            let lastMarkerPoint = this._map.latLngToContainerPoint(finishMarker.getLatLng()),
                potentialMarker = new L.Marker(potentialLatLng, {
                    icon: this.options.icon,
                    zIndexOffset: this.options.zIndexOffset * 2
                });
            let potentialMarkerPint = this._map.latLngToContainerPoint(potentialMarker.getLatLng());
            lastPtDistance = lastMarkerPoint.distanceTo(potentialMarkerPint);
        } else {
            lastPtDistance = Infinity;
        }
        return lastPtDistance;
    },

    _updateFinishHandler: function () {
        let markerCount = this._markers.length;
        // The last marker should have a click handler to close the polyline
        if (markerCount > 1) {
            this._markers[markerCount - 1].on('click', this._finishShape, this);
        }

        // Remove the old marker click handler (as only the last point should close the polyline)
        if (markerCount > 2) {
            this._markers[markerCount - 2].off('click', this._finishShape, this);
        }
    },

    _createMarker: function (latlng) {
        let marker = new L.Marker(latlng, {
            icon: this.options.icon,
            zIndexOffset: this.options.zIndexOffset * 2
        });

        this._markerGroup.addLayer(marker);

        return marker;
    },

    _updateGuide: function (newPos) {
        let markerCount = this._markers ? this._markers.length : 0;

        if (markerCount > 0) {
            newPos = newPos || this._map.latLngToLayerPoint(this._currentLatLng);

            // draw the guide line
            this._clearGuides();
            this._drawGuide(
                //Get always fist marker as a pivot point
                this._map.latLngToLayerPoint(this._markers[0].getLatLng()),
                newPos
            );
        }
    },

    _updateTooltip: function (latLng) {
        let text = this._getTooltipText();

        if (latLng) {
            this._tooltip.updatePosition(latLng);
        }

        if (!this._errorShown) {
            this._tooltip.updateContent(text);
        }
    },

    _drawGuide: function (pointA, pointB) {
        let length = Math.floor(Math.sqrt(Math.pow((pointB.x - pointA.x), 2) + Math.pow((pointB.y - pointA.y), 2))),
            guidelineDistance = this.options.guidelineDistance,
            maxGuideLineLength = this.options.maxGuideLineLength,
            // Only draw a guideline with a max length
            i = length > maxGuideLineLength ? length - maxGuideLineLength : guidelineDistance,
            fraction,
            dashPoint,
            dash;

        //create the guides container if we haven't yet
        if (!this._guidesContainer) {
            this._guidesContainer = L.DomUtil.create('div', 'leaflet-draw-guides', this._overlayPane);
        }

        //draw a dash every GuildeLineDistance
        for (; i < length; i += this.options.guidelineDistance) {
            //work out fraction along line we are
            fraction = i / length;

            //calculate new x,y point
            dashPoint = {
                x: Math.floor((pointA.x * (1 - fraction)) + (fraction * pointB.x)),
                y: Math.floor((pointA.y * (1 - fraction)) + (fraction * pointB.y))
            };

            //add guide dash to guide container
            dash = L.DomUtil.create('div', 'leaflet-draw-guide-dash', this._guidesContainer);
            dash.style.backgroundColor =
                !this._errorShown ? this.options.shapeOptions.color : this.options.drawError.color;

            L.DomUtil.setPosition(dash, dashPoint);
        }
    },

    _updateGuideColor: function (color) {
        if (this._guidesContainer) {
            for (let i = 0, l = this._guidesContainer.childNodes.length; i < l; i++) {
                this._guidesContainer.childNodes[i].style.backgroundColor = color;
            }
        }
    },

    // removes all child elements (guide dashes) from the guides container
    _clearGuides: function () {
        if (this._guidesContainer) {
            while (this._guidesContainer.firstChild) {
                this._guidesContainer.removeChild(this._guidesContainer.firstChild);
            }
        }
    },

    _getTooltipText: function () {
        let showLength = this.options.showLength,
            labelText, distanceStr;
        if (this._markers.length === 0) {
            labelText = {
                text: L.drawLocal.draw.handlers.angle.tooltip.start
            };
        } else {
            distanceStr = showLength ? this._getMeasurementString() : '';

            if (this._markers.length === 1) {
                labelText = {
                    text: L.drawLocal.draw.handlers.angle.tooltip.cont,
                    subtext: distanceStr
                };
            } else {
                labelText = {
                    text: L.drawLocal.draw.handlers.angle.tooltip.end,
                    subtext: distanceStr
                };
            }
        }
        return labelText;
    },

    _updateRunningMeasure: function (latlng, added) {
        let markersLength = this._markers.length,
            previousMarkerIndex, distance;

        if (this._markers.length === 1) {
            this._measurementRunningTotal = 0;
        } else {
            previousMarkerIndex = markersLength - (added ? 2 : 1);

            // Calculate the distance based on the version
            if (L.GeometryUtil.isVersion07x()) {
                distance = latlng.distanceTo(this._markers[previousMarkerIndex].getLatLng()) * (this.options.factor || 1);
            } else {
                distance = this._map.distance(latlng, this._markers[previousMarkerIndex].getLatLng()) * (this.options.factor || 1);
            }

            this._measurementRunningTotal += distance * (added ? 1 : -1);
        }
    },

    _getAngleInRadians: function (v1, center, v2) {
        let v1c = Math.sqrt(Math.pow(center.x - v1.x, 2) + Math.pow(center.y - v1.y, 2));
        let cv2 = Math.sqrt(Math.pow(center.x - v2.x, 2) + Math.pow(center.y - v2.y, 2));
        let v1v2 = Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));

        return (Math.acos((cv2 * cv2 + v1c * v1c - v1v2 * v1v2) / (2 * cv2 * v1c)) * 180 / Math.PI).toFixed(2);
    },

    // _getAngleInRadians: function(v1, center, v2, dpix, dpiy) {
    //     let v1c = Math.sqrt(Math.pow(25.4 * (center.x - v1.x) / dpix, 2) + Math.pow(25.4 * (center.y - v1.y) / dpiy, 2));
    //     let cv2 = Math.sqrt(Math.pow(25.4 * (center.x - v2.x) / dpix, 2) + Math.pow(25.4 * (center.y - v2.y) / dpiy, 2));
    //     let v1v2 = Math.sqrt(Math.pow(25.4 * (v2.x - v1.x) / dpix, 2) + Math.pow(25.4 * (v2.y - v1.y) / dpiy, 2));
    //
    //     return (Math.acos((cv2 * cv2 + v1c * v1c - v1v2 * v1v2) / (2 * cv2 * v1c))*180/Math.PI).toFixed(2);
    // },

    _getMeasurementString: function () {
        let value = '0';
        if (this._markers.length >= 2) {
            const center = this._map.project(this._markers[0].getLatLng(), this._map.options.maxZoom);
            const v1 = this._map.project(this._markers[1].getLatLng(), this._map.options.maxZoom);
            const v2 = this._map.project(this._currentLatLng, this._map.options.maxZoom);

            value = String(this._getAngleInRadians({x: Math.abs(v1.x), y: Math.abs(v1.y)},
                {x: Math.abs(center.x), y: Math.abs(center.y)},
                {x: Math.abs(v2.x), y: Math.abs(v2.y)}));
        }
        return value;
    },

    _showErrorTooltip: function () {
        this._errorShown = true;

        // Update tooltip
        this._tooltip
            .showAsError()
            .updateContent({text: this.options.drawError.message});

        // Update shape
        this._updateGuideColor(this.options.drawError.color);
        this._angle.setStyle({color: this.options.drawError.color});

        // Hide the error after 2 seconds
        this._clearHideErrorTimeout();
        this._hideErrorTimeout = setTimeout(L.Util.bind(this._hideErrorTooltip, this), this.options.drawError.timeout);
    },

    _hideErrorTooltip: function () {
        this._errorShown = false;

        this._clearHideErrorTimeout();

        // Revert tooltip
        this._tooltip
            .removeError()
            .updateContent(this._getTooltipText());

        // Revert shape
        this._updateGuideColor(this.options.shapeOptions.color);
        this._angle.setStyle({color: this.options.shapeOptions.color});
    },

    _clearHideErrorTimeout: function () {
        if (this._hideErrorTimeout) {
            clearTimeout(this._hideErrorTimeout);
            this._hideErrorTimeout = null;
        }
    },

    // disable new markers temporarily;
    // this is to prevent duplicated touch/click events in some browsers
    _disableNewMarkers: function () {
        this._disableMarkers = true;
    },

    // see _disableNewMarkers
    _enableNewMarkers: function () {
        setTimeout(function () {
            this._disableMarkers = false;
        }.bind(this), 50);
    },

    _cleanUpShape: function () {
        if (this._markers.length > 1) {
            this._markers[this._markers.length - 1].off('click', this._finishShape, this);
        }
    },

    _fireCreatedEvent: function () {
        let angle = new this.Angle(this._angle.getLatLngs(), this.options.shapeOptions);
        L.Draw.Feature.prototype._fireCreatedEvent.call(this, angle);
    }
});