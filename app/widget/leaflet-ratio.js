import L from 'leaflet';

/**
 * @class L.Draw.Ratio
 * @aka Draw.Ratio
 * @inherits L.Draw.Feature
 */
L.Draw.Ratio = L.Draw.Feature.extend({
    statics: {
        TYPE: 'ratio'
    },

    Ratio: L.Polyline,
    ratioLine1: null,
    ratioLine2: null,

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
        maxPoints: 4 // Once this number of points are placed, finish shape
    },

    initialize: function (map, options) {
        // Save the type so super can fire, need to do this as cannot do this.TYPE :(
        this.type = L.Draw.Ratio.TYPE;
        L.Draw.Feature.prototype.initialize.call(this, map, options);
    },

    enable: function () {
        L.Draw.Feature.prototype.enable.call(this);
        console.log('Enabled');

        this._map.eachLayer(layer => {
            if (layer.annotationType === 'simple-line') {
                layer.on('click', this._onAnnotationClick, this);
            }
        });
    },

    _onAnnotationClick: function (e) {
        console.log(e);
        if (e.target != null && this.ratioLine1 == null) {
            this.ratioLine1 = e.target;
            this._tooltip.updateContent({
                text: "Select second annotation"
            });
        } else if (e.target != null && this.ratioLine1.annotationId !== e.target.annotationId) {
            this.ratioLine2 = e.target;
            this._fireCreatedEvent();
            this.disable();
        }
    },

    _onMouseMove: function (e) {
        let newPos = this._map.mouseEventToLayerPoint(e.originalEvent);
        let latlng = this._map.layerPointToLatLng(newPos);

        // Save latlng
        // should this be moved to _updateGuide() ?
        this._currentLatLng = latlng;

        this._updateTooltip(latlng);

        L.DomEvent.preventDefault(e.originalEvent);
    },

    _updateTooltip: function (latLng) {
        if (latLng) {
            this._tooltip.updatePosition(latLng);
        }

        // TODO set this text to leaflet-override.js
        if (this.ratioLine1 == null) {
            this._tooltip.updateContent({
                text: "Select first annotation"
            });
        }
    },

    addHooks: function () {
        console.log("Add hooks Occurrence");
        // this._tooltip.updateContent(this._getTooltipText());
        L.Draw.Feature.prototype.addHooks.call(this);
        this._map.on('mousemove', this._onMouseMove, this);
    },

    removeHooks: function () {
        L.Draw.Feature.prototype.removeHooks.call(this);
        this._map.eachLayer(layer => {
            if (layer.annotationType === 'simple-line') {
                layer.off('click', this._onAnnotationClick, this);
            }
        });
        this._map.off('mousemove', this._onMouseMove, this);
        this.ratioLine1 = null;
        this.ratioLine2 = null;
    },

    _fireCreatedEvent: function () {
        let ratio = new this.Ratio({}, this.options.shapeOptions);
        ratio.line1 = this.ratioLine1._latlngs;
        ratio.line2 = this.ratioLine2._latlngs;
        ratio.line1Annotation = this.ratioLine1.annotationId;
        ratio.line2Annotation = this.ratioLine2.annotationId;
        L.Draw.Feature.prototype._fireCreatedEvent.call(this, ratio);
    }
});