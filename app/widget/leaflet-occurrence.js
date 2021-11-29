import {Path, Util, LatLngBounds, LineUtil, LatLng, latLng as toLatLng, Bounds, Point} from 'leaflet';

/**
 * Change drawing of occurrence annotation.
 */
L.SVG.include({
    _updateOccurrence: function (layer) {
        const parts = layer._parts;
        let str = '';

        for(let p = 0, plen = parts.length; p < plen; p++) {
            const points = parts[p];
            for (let i = 0, len = points.length; i < len; i++) {
                const point = points[i];
                str += `M ${point.x} ${point.y} L${point.x-20} ${point.y-20} `
            }
        }

        this._setPath(layer, str);
    }
});

L.Occurrence = Path.extend({

    // @section
    // @aka Occurrence options
    options: {
        // @option smoothFactor: Number = 1.0
        // How much to simplify the polyline on each zoom level. More means
        // better performance and smoother look, and less means more accurate representation.
        smoothFactor: 1.0,

        // @option noClip: Boolean = false
        // Disable polyline clipping.
        noClip: false
    },

    initialize: function (latlngs, options) {
        Util.setOptions(this, options);
        this._setLatLngs(latlngs);
    },

    // @method getLatLngs(): LatLng[]
    // Returns an array of the points in the path, or nested arrays of points in case of multi-polyline.
    getLatLngs: function () {
        return this._latlngs;
    },

    // @method setLatLngs(latlngs: LatLng[]): this
    // Replaces all the points in the polyline with the given array of geographical points.
    setLatLngs: function (latlngs) {
        this._setLatLngs(latlngs);
        return this.redraw();
    },

    // @method isEmpty(): Boolean
    // Returns `true` if the Occurrence has no LatLngs.
    isEmpty: function () {
        return !this._latlngs.length;
    },

    // @method closestLayerPoint(p: Point): Point
    // Returns the point closest to `p` on the Occurrence.
    closestLayerPoint: function (p) {
        var minDistance = Infinity,
            minPoint = null,
            closest = LineUtil._sqClosestPointOnSegment,
            p1, p2;

        for (var j = 0, jLen = this._parts.length; j < jLen; j++) {
            var points = this._parts[j];

            for (var i = 1, len = points.length; i < len; i++) {
                p1 = points[i - 1];
                p2 = points[i];

                var sqDist = closest(p, p1, p2, true);

                if (sqDist < minDistance) {
                    minDistance = sqDist;
                    minPoint = closest(p, p1, p2);
                }
            }
        }
        if (minPoint) {
            minPoint.distance = Math.sqrt(minDistance);
        }
        return minPoint;
    },

    // @method getCenter(): LatLng
    // Returns the center ([centroid](http://en.wikipedia.org/wiki/Centroid)) of the polyline.
    getCenter: function () {
        // throws error when not yet added to map as this center calculation requires projected coordinates
        if (!this._map) {
            throw new Error('Must add layer to map before using getCenter()');
        }

        var i, halfDist, segDist, dist, p1, p2, ratio,
            points = this._rings[0],
            len = points.length;

        if (!len) { return null; }

        // polyline centroid algorithm; only uses the first ring if there are multiple

        for (i = 0, halfDist = 0; i < len - 1; i++) {
            halfDist += points[i].distanceTo(points[i + 1]) / 2;
        }

        // The line is so small in the current view that all points are on the same pixel.
        if (halfDist === 0) {
            return this._map.layerPointToLatLng(points[0]);
        }

        for (i = 0, dist = 0; i < len - 1; i++) {
            p1 = points[i];
            p2 = points[i + 1];
            segDist = p1.distanceTo(p2);
            dist += segDist;

            if (dist > halfDist) {
                ratio = (dist - halfDist) / segDist;
                return this._map.layerPointToLatLng([
                    p2.x - ratio * (p2.x - p1.x),
                    p2.y - ratio * (p2.y - p1.y)
                ]);
            }
        }
    },

    // @method getBounds(): LatLngBounds
    // Returns the `LatLngBounds` of the path.
    getBounds: function () {
        return this._bounds;
    },

    // @method addLatLng(latlng: LatLng, latlngs? LatLng[]): this
    // Adds a given point to the polyline. By default, adds to the first ring of
    // the polyline in case of a multi-polyline, but can be overridden by passing
    // a specific ring as a LatLng array (that you can earlier access with [`getLatLngs`](#polyline-getlatlngs)).
    addLatLng: function (latlng, latlngs) {
        latlngs = latlngs || this._defaultShape();
        latlng = toLatLng(latlng);
        latlngs.push(latlng);
        this._bounds.extend(latlng);
        return this.redraw();
    },

    _setLatLngs: function (latlngs) {
        this._bounds = new LatLngBounds();
        this._latlngs = this._convertLatLngs(latlngs);
    },

    _defaultShape: function () {
        return LineUtil.isFlat(this._latlngs) ? this._latlngs : this._latlngs[0];
    },

    // recursively convert latlngs input into actual LatLng instances; calculate bounds along the way
    _convertLatLngs: function (latlngs) {
        var result = [],
            flat = LineUtil.isFlat(latlngs);

        for (var i = 0, len = latlngs.length; i < len; i++) {
            if (flat) {
                result[i] = toLatLng(latlngs[i]);
                this._bounds.extend(result[i]);
            } else {
                result[i] = this._convertLatLngs(latlngs[i]);
            }
        }

        return result;
    },

    _project: function () {
        var pxBounds = new Bounds();
        this._rings = [];
        this._projectLatlngs(this._latlngs, this._rings, pxBounds);

        var w = this._clickTolerance(),
            p = new Point(w, w);

        if (this._bounds.isValid() && pxBounds.isValid()) {
            pxBounds.min._subtract(p);
            pxBounds.max._add(p);
            this._pxBounds = pxBounds;
        }
    },

    // recursively turns latlngs into a set of rings with projected coordinates
    _projectLatlngs: function (latlngs, result, projectedBounds) {
        var flat = latlngs[0] instanceof LatLng,
            len = latlngs.length,
            i, ring;

        if (flat) {
            ring = [];
            for (i = 0; i < len; i++) {
                ring[i] = this._map.latLngToLayerPoint(latlngs[i]);
                projectedBounds.extend(ring[i]);
            }
            result.push(ring);
        } else {
            for (i = 0; i < len; i++) {
                this._projectLatlngs(latlngs[i], result, projectedBounds);
            }
        }
    },

    // clip polyline by renderer bounds so that we have less to render for performance
    _clipPoints: function () {
        var bounds = this._renderer._bounds;

        this._parts = [];
        if (!this._pxBounds || !this._pxBounds.intersects(bounds)) {
            return;
        }

        if (this.options.noClip) {
            this._parts = this._rings;
            return;
        }

        var parts = this._parts,
            i, j, k, len, len2, segment, points;

        for (i = 0, k = 0, len = this._rings.length; i < len; i++) {
            points = this._rings[i];

            for (j = 0, len2 = points.length; j < len2 - 1; j++) {
                segment = LineUtil.clipSegment(points[j], points[j + 1], bounds, j, true);

                if (!segment) { continue; }

                parts[k] = parts[k] || [];
                parts[k].push(segment[0]);

                // if segment goes out of screen, or it's the last one, it's the end of the line part
                if ((segment[1] !== points[j + 1]) || (j === len2 - 2)) {
                    parts[k].push(segment[1]);
                    k++;
                }
            }
        }
    },

    // simplify each clipped part of the polyline for performance
    _simplifyPoints: function () {
        var parts = this._parts,
            tolerance = this.options.smoothFactor;

        for (var i = 0, len = parts.length; i < len; i++) {
            parts[i] = LineUtil.simplify(parts[i], tolerance);
        }
    },

    _update: function () {
        if (!this._map) { return; }

        this._clipPoints();
        this._simplifyPoints();
        this._updatePath();
    },

    _updatePath: function () {
        // this._renderer._updatePoly(this);
        this._renderer._updateOccurrence(this);
    },

    // Needed by the `Canvas` renderer for interactivity
    _containsPoint: function (p, closed) {
        var i, j, k, len, len2, part,
            w = this._clickTolerance();

        if (!this._pxBounds || !this._pxBounds.contains(p)) { return false; }

        // hit detection for polylines
        for (i = 0, len = this._parts.length; i < len; i++) {
            part = this._parts[i];

            for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
                if (!closed && (j === 0)) { continue; }

                if (LineUtil.pointToSegmentDistance(p, part[k], part[j]) <= w) {
                    return true;
                }
            }
        }
        return false;
    }
});

// @factory L.polyline(latlngs: LatLng[], options?: Occurrence options)
// Instantiates a polyline object given an array of geographical points and
// optionally an options object. You can create a `Occurrence` object with
// multiple separate lines (`MultiPolyline`) by passing an array of arrays
// of geographic points.
L.occurrence = function occurrence(latlngs, options) {
    return new L.Occurrence(latlngs, options);
};


/**
 * @class L.Draw.Occurrence
 * @aka Draw.Occurrence
 * @inherits L.Draw.Feature
 */
L.Draw.Occurrence = L.Draw.Feature.extend({
    statics: {
        TYPE: 'occurrence'
    },

    Occurrence: L.Occurrence,
    coords: [],
    options: {
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
    },

    initialize: function (map, options) {
        // Save the type so super can fire, need to do this as cannot do this.TYPE :(
        this.type = L.Draw.Occurrence.TYPE;
        L.Draw.Feature.prototype.initialize.call(this, map, options);
    },

    addHooks: function () {
        L.Draw.Feature.prototype.addHooks.call(this);
        if (this._map) {
            this.coords = [];
            this._markers = [];
            this._markerGroup = new L.LayerGroup();
            this._map.addLayer(this._markerGroup);


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
                .on('mousedown', this._onMouseDown, this)
                .on('mousemove', this._onMouseMove, this) // Necessary to prevent 0.8 stutter
                .on('mouseup', this._onMouseUp, this) // Necessary for 0.8 compatibility
                .addTo(this._map);

            this._map
                .on('mousemove', this._onMouseMove, this)
                .on('mouseup', this._onMouseUp, this);
        }
    },

    removeHooks: function () {
        L.Draw.Feature.prototype.removeHooks.call(this);
        this._map.removeLayer(this._markerGroup);
        delete this._markerGroup;
        delete this._markers;

        this._mouseMarker
            .off('mousedown', this._onMouseDown, this)
            .off('mouseup', this._onMouseUp, this)
            .off('mousemove', this._onMouseMove, this);
        this._map.removeLayer(this._mouseMarker);
        delete this._mouseMarker;

        this._map
            .off('mousemove', this._onMouseMove, this)
            .off('mouseup', this._onMouseUp, this);
    },

    _createPoint(clientX, clientY, e) {
        if (this._mouseDownOrigin) {
            let dragCheckDistance = L.point(clientX, clientY)
                .distanceTo(this._mouseDownOrigin);
            if (Math.abs(dragCheckDistance) < 9 * (window.devicePixelRatio || 1)) {
                this.coords.push(e.latlng);
                this._markers.push(this._createMarker(e.latlng));
            }
        }
        this._mouseDownOrigin = null;
    },

    _onMouseDown: function (e) {
        this._mouseDownOrigin = L.point(e.originalEvent.clientX, e.originalEvent.clientY);
    },

    _onMouseUp: function (e) {
        let originalEvent = e.originalEvent;
        let clientX = originalEvent.clientX;
        let clientY = originalEvent.clientY;
        this._createPoint.call(this, clientX, clientY, e);
    },

    _onMouseMove: function (e) {
        let newPos = this._map.mouseEventToLayerPoint(e.originalEvent);
        let latlng = this._map.layerPointToLatLng(newPos);
        this._mouseMarker.setLatLng(latlng);
        L.DomEvent.preventDefault(e.originalEvent);
    },

    _createMarker: function (latlng) {
        let marker = new L.Marker(latlng, {
            icon: this.options.icon,
            zIndexOffset: this.options.zIndexOffset * 2
        });

        this._markerGroup.addLayer(marker);
        return marker;
    },

    // @method completeShape(): void
    // Closes the polyline between the first and last points
    completeShape: function () {
        if (this.coords.length < 1) {
            return;
        }

        this._fireCreatedEvent();
        this.disable();

        if (this.options.repeatMode) {
            this.enable();
        }
    },

    _fireCreatedEvent: function () {
        let occurrence = new this.Occurrence({}, this.options.shapeOptions);
        occurrence.vertices = this.coords;
        L.Draw.Feature.prototype._fireCreatedEvent.call(this, occurrence);
    }
});


/**
 * @class L.Edit.Occurrence
 * @aka L.Edit.Poly
 * @aka Edit.Poly
 */
L.Edit.Occurrence = L.Handler.extend({
    // @method initialize(): void
    initialize: function (poly) {
        this.latlngs = [poly._latlngs];
        if (poly._holes) {
            this.latlngs = this.latlngs.concat(poly._holes);
        }

        // poly.setLatLngs([])
        this._poly = poly;

        this._poly.on('revert-edited', this._updateLatLngs, this);
    },

    // Compatibility method to normalize Poly* objects
    // between 0.7.x and 1.0+
    _defaultShape: function () {
        if (!L.Occurrence._flat) {
            return this._poly._latlngs;
        }
        return L.Occurrence._flat(this._poly._latlngs) ? this._poly._latlngs : this._poly._latlngs[0];
    },

    _eachVertexHandler: function (callback) {
        for (var i = 0; i < this._verticesHandlers.length; i++) {
            callback(this._verticesHandlers[i]);
        }
    },

    // @method addHooks(): void
    // Add listener hooks to this handler
    addHooks: function () {
        this._initHandlers();
        this._eachVertexHandler(function (handler) {
            handler.addHooks();
        });
    },

    // @method removeHooks(): void
    // Remove listener hooks from this handler
    removeHooks: function () {
        this._eachVertexHandler(function (handler) {
            handler.removeHooks();
        });
    },

    // @method updateMarkers(): void
    // Fire an update for each vertex handler
    updateMarkers: function () {
        this._eachVertexHandler(function (handler) {
            handler.updateMarkers();
        });
    },

    _initHandlers: function () {
        this._verticesHandlers = [];
        for (var i = 0; i < this.latlngs.length; i++) {
            this._verticesHandlers.push(new L.Edit.OccurrenceEdit(this._poly, this.latlngs[i], this._poly.options.poly));
        }
    },

    _updateLatLngs: function (e) {
        this.latlngs = [e.layer._latlngs];
        if (e.layer._holes) {
            this.latlngs = this.latlngs.concat(e.layer._holes);
        }
    }

});

L.Occurrence.addInitHook(function () {
    if (L.Edit.Occurrence) {
        this.editing = new L.Edit.Occurrence(this);

        if (this.options.editable) {
            this.editing.enable();
        }
    }
});

/**
 * @class L.Edit.OccurrenceEdit
 * @aka Edit.OccurrenceEdit
 */
L.Edit.OccurrenceEdit = L.Handler.extend({
    options: {
        icon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className: 'leaflet-div-icon leaflet-editing-icon'
        }),
        touchIcon: new L.DivIcon({
            iconSize: new L.Point(20, 20),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
        }),
        drawError: {
            color: '#b00b00',
            timeout: 1000
        }
    },

    // @method intialize(): void
    initialize: function (poly, latlngs, options) {
        // if touch, switch to touch icon
        if (L.Browser.touch) {
            this.options.icon = this.options.touchIcon;
        }
        this._poly = poly;
        this._poly.coords = [];

        if (options && options.drawError) {
            options.drawError = L.Util.extend({}, this.options.drawError, options.drawError);
        }

        this._latlngs = latlngs;

        L.setOptions(this, options);
    },

    // Compatibility method to normalize Poly* objects
    // between 0.7.x and 1.0+
    _defaultShape: function () {
        if (!L.Occurrence._flat) {
            return this._latlngs;
        }
        return L.Occurrence._flat(this._latlngs) ? this._latlngs : this._latlngs[0];
    },

    // @method addHooks(): void
    // Add listener hooks to this handler.
    addHooks: function () {
        var poly = this._poly;
        var path = poly._path;

        if (!(poly instanceof L.Polygon)) {
            poly.options.fill = false;
            if (poly.options.editing) {
                poly.options.editing.fill = false;
            }
        }

        if (path) {
            if (poly.options.editing.className) {
                if (poly.options.original.className) {
                    poly.options.original.className.split(' ').forEach(function (className) {
                        L.DomUtil.removeClass(path, className);
                    });
                }
                poly.options.editing.className.split(' ').forEach(function (className) {
                    L.DomUtil.addClass(path, className);
                });
            }
        }

        poly.setStyle(poly.options.editing);

        if (this._poly._map) {
            this._map = this._poly._map; // Set map

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
                .on('mousedown', this._onMouseDown, this)
                .on('mousemove', this._onMouseMove, this) // Necessary to prevent 0.8 stutter
                .on('mouseup', this._onMouseUp, this) // Necessary for 0.8 compatibility
                .addTo(this._map);

            this._map
                .on('mousemove', this._onMouseMove, this)
                .on('mouseup', this._onMouseUp, this);

            if (!this._markerGroup) {
                this._initMarkers();
            }
            this._poly._map.addLayer(this._markerGroup);
        }
    },

    _onMouseMove: function (e) {
        let newPos = this._map.mouseEventToLayerPoint(e.originalEvent);
        let latlng = this._map.layerPointToLatLng(newPos);
        this._mouseMarker.setLatLng(latlng);
        L.DomEvent.preventDefault(e.originalEvent);
    },

    _createPoint(clientX, clientY, e) {
        if (this._mouseDownOrigin) {
            let dragCheckDistance = L.point(clientX, clientY)
                .distanceTo(this._mouseDownOrigin);
            if (Math.abs(dragCheckDistance) < 9 * (window.devicePixelRatio || 1)) {
                this._poly.coords.push(e.latlng);
                this._markers.push(this._createMarker(e.latlng));
            }
        }
        this._mouseDownOrigin = null;
    },

    _onMouseDown: function (e) {
        this._mouseDownOrigin = L.point(e.originalEvent.clientX, e.originalEvent.clientY);
    },

    _onMouseUp: function (e) {
        let originalEvent = e.originalEvent;
        let clientX = originalEvent.clientX;
        let clientY = originalEvent.clientY;
        this._createPoint.call(this, clientX, clientY, e);
    },

    // @method removeHooks(): void
    // Remove listener hooks from this handler.
    removeHooks: function () {
        var poly = this._poly;
        var path = poly._path;

        if (path) {
            if (poly.options.editing.className) {
                poly.options.editing.className.split(' ').forEach(function (className) {
                    L.DomUtil.removeClass(path, className);
                });
                if (poly.options.original.className) {
                    poly.options.original.className.split(' ').forEach(function (className) {
                        L.DomUtil.addClass(path, className);
                    });
                }
            }
        }

        this._mouseMarker
            .off('mousedown', this._onMouseDown, this)
            .off('mouseup', this._onMouseUp, this)
            .off('mousemove', this._onMouseMove, this);
        this._map.removeLayer(this._mouseMarker);
        delete this._mouseMarker;

        this._map
            .off('mousemove', this._onMouseMove, this)
            .off('mouseup', this._onMouseUp, this);

        poly.setStyle(poly.options.original);

        if (poly._map) {
            poly._map.removeLayer(this._markerGroup);
            delete this._markerGroup;
            delete this._markers;
        }
    },

    // @method updateMarkers(): void
    // Clear markers and update their location
    updateMarkers: function () {
        this._markerGroup.clearLayers();
        this._initMarkers();
    },

    _initMarkers: function () {
        if (!this._markerGroup) {
            this._markerGroup = new L.LayerGroup();
        }
        this._markers = [];
        this._latlngs = [];
    },

    _createMarker: function (latlng, index) {
        // Extending L.Marker in TouchEvents.js to include touch.
        // var marker = new L.Marker.Touch(latlng, {
        //     draggable: true,
        //     icon: this.options.icon,
        // });

        let marker = new L.Marker(latlng, {
            icon: this.options.icon,
            zIndexOffset: this.options.zIndexOffset * 2
        });

        marker._origLatLng = latlng;
        marker._index = index;

        marker
            .on('dragstart', this._onMarkerDragStart, this)
            .on('drag', this._onMarkerDrag, this)
            .on('dragend', this._fireEdit, this)
            .on('touchmove', this._onTouchMove, this)
            .on('touchend', this._fireEdit, this)
            .on('MSPointerMove', this._onTouchMove, this)
            .on('MSPointerUp', this._fireEdit, this);

        this._markerGroup.addLayer(marker);

        return marker;
    },

    _onMarkerDragStart: function () {
        this._poly.fire('editstart');
    },

    _spliceLatLngs: function () {
        var latlngs = this._defaultShape();
        var removed = [].splice.apply(latlngs, arguments);
        this._poly._convertLatLngs(latlngs, true);
        this._poly.redraw();
        return removed;
    },

    _removeMarker: function (marker) {
        var i = marker._index;

        this._markerGroup.removeLayer(marker);
        this._markers.splice(i, 1);
        this._spliceLatLngs(i, 1);
        this._updateIndexes(i, -1);

        marker
            .off('dragstart', this._onMarkerDragStart, this)
            .off('drag', this._onMarkerDrag, this)
            .off('dragend', this._fireEdit, this)
            .off('touchmove', this._onMarkerDrag, this)
            .off('touchend', this._fireEdit, this)
            .off('click', this._onMarkerClick, this)
            .off('MSPointerMove', this._onTouchMove, this)
            .off('MSPointerUp', this._fireEdit, this);
    },

    _fireEdit: function () {
        this._poly.edited = true;
        this._poly.fire('edit');
        this._poly._map.fire(L.Draw.Event.EDITVERTEX, {layers: this._markerGroup, poly: this._poly});
    },

    _onMarkerDrag: function (e) {
        var marker = e.target;
        var poly = this._poly;

        L.extend(marker._origLatLng, marker._latlng);

        if (marker._middleLeft) {
            marker._middleLeft.setLatLng(this._getMiddleLatLng(marker._prev, marker));
        }
        if (marker._middleRight) {
            marker._middleRight.setLatLng(this._getMiddleLatLng(marker, marker._next));
        }

        if (poly.options.poly) {
            var tooltip = poly._map._editTooltip; // Access the tooltip

            // If we don't allow intersections and the polygon intersects
            if (!poly.options.poly.allowIntersection && poly.intersects()) {

                var originalColor = poly.options.color;
                poly.setStyle({color: this.options.drawError.color});

                // Manually trigger 'dragend' behavior on marker we are about to remove
                // WORKAROUND: introduced in 1.0.0-rc2, may be related to #4484
                if (L.version.indexOf('0.7') !== 0) {
                    marker.dragging._draggable._onUp(e);
                }
                this._onMarkerClick(e); // Remove violating marker
                // FIXME: Reset the marker to it's original position (instead of remove)

                if (tooltip) {
                    tooltip.updateContent({
                        text: L.drawLocal.draw.handlers.polyline.error
                    });
                }

                // Reset everything back to normal after a second
                setTimeout(function () {
                    poly.setStyle({color: originalColor});
                    if (tooltip) {
                        tooltip.updateContent({
                            text: L.drawLocal.edit.handlers.edit.tooltip.text,
                            subtext: L.drawLocal.edit.handlers.edit.tooltip.subtext
                        });
                    }
                }, 1000);
            }
        }
        //refresh the bounds when draging
        this._poly._bounds._southWest = L.latLng(Infinity, Infinity);
        this._poly._bounds._northEast = L.latLng(-Infinity, -Infinity);
        var latlngs = this._poly.getLatLngs();
        this._poly._convertLatLngs(latlngs, true);
        this._poly.redraw();
        this._poly.fire('editdrag');
    },

    _onMarkerClick: function (e) {

        var minPoints = L.Polygon && (this._poly instanceof L.Polygon) ? 4 : 3,
            marker = e.target;

        // If removing this point would create an invalid polyline/polygon don't remove
        if (this._defaultShape().length < minPoints) {
            return;
        }

        // remove the marker
        this._removeMarker(marker);

        // update prev/next links of adjacent markers
        this._updatePrevNext(marker._prev, marker._next);

        // remove ghost markers near the removed marker
        if (marker._middleLeft) {
            this._markerGroup.removeLayer(marker._middleLeft);
        }
        if (marker._middleRight) {
            this._markerGroup.removeLayer(marker._middleRight);
        }

        // create a ghost marker in place of the removed one
        if (marker._prev && marker._next) {
            this._createMiddleMarker(marker._prev, marker._next);

        } else if (!marker._prev) {
            marker._next._middleLeft = null;

        } else if (!marker._next) {
            marker._prev._middleRight = null;
        }

        this._fireEdit();
    },

    _onContextMenu: function (e) {
        var marker = e.target;
        var poly = this._poly;
        this._poly._map.fire(L.Draw.Event.MARKERCONTEXT, {marker: marker, layers: this._markerGroup, poly: this._poly});
        L.DomEvent.stopPropagation;
    },

    _onTouchMove: function (e) {

        var layerPoint = this._map.mouseEventToLayerPoint(e.originalEvent.touches[0]),
            latlng = this._map.layerPointToLatLng(layerPoint),
            marker = e.target;

        L.extend(marker._origLatLng, latlng);

        if (marker._middleLeft) {
            marker._middleLeft.setLatLng(this._getMiddleLatLng(marker._prev, marker));
        }
        if (marker._middleRight) {
            marker._middleRight.setLatLng(this._getMiddleLatLng(marker, marker._next));
        }

        this._poly.redraw();
        this.updateMarkers();
    },

    _updateIndexes: function (index, delta) {
        this._markerGroup.eachLayer(function (marker) {
            if (marker._index > index) {
                marker._index += delta;
            }
        });
    },

    _createMiddleMarker: function (marker1, marker2) {
        var latlng = this._getMiddleLatLng(marker1, marker2),
            marker = this._createMarker(latlng),
            onClick,
            onDragStart,
            onDragEnd;

        marker.setOpacity(0.6);

        marker1._middleRight = marker2._middleLeft = marker;

        onDragStart = function () {
            marker.off('touchmove', onDragStart, this);
            var i = marker2._index;

            marker._index = i;

            marker
                .off('click', onClick, this)
                .on('click', this._onMarkerClick, this);

            latlng.lat = marker.getLatLng().lat;
            latlng.lng = marker.getLatLng().lng;
            this._spliceLatLngs(i, 0, latlng);
            this._markers.splice(i, 0, marker);

            marker.setOpacity(1);

            this._updateIndexes(i, 1);
            marker2._index++;
            this._updatePrevNext(marker1, marker);
            this._updatePrevNext(marker, marker2);

            this._poly.fire('editstart');
        };

        onDragEnd = function () {
            marker.off('dragstart', onDragStart, this);
            marker.off('dragend', onDragEnd, this);
            marker.off('touchmove', onDragStart, this);

            this._createMiddleMarker(marker1, marker);
            this._createMiddleMarker(marker, marker2);
        };

        onClick = function () {
            onDragStart.call(this);
            onDragEnd.call(this);
            this._fireEdit();
        };

        marker
            .on('click', onClick, this)
            .on('dragstart', onDragStart, this)
            .on('dragend', onDragEnd, this)
            .on('touchmove', onDragStart, this);

        this._markerGroup.addLayer(marker);
    },

    _updatePrevNext: function (marker1, marker2) {
        if (marker1) {
            marker1._next = marker2;
        }
        if (marker2) {
            marker2._prev = marker1;
        }
    },

    _getMiddleLatLng: function (marker1, marker2) {
        var map = this._poly._map,
            p1 = map.project(marker1.getLatLng()),
            p2 = map.project(marker2.getLatLng());

        return map.unproject(p1._add(p2)._divideBy(2));
    }
});