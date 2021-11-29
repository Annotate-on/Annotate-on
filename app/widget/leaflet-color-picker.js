import L from 'leaflet';

/**
 * @class L.Draw.Occurrence
 * @aka Draw.Occurrence
 * @inherits L.Draw.Feature
 */
L.Draw.ColorPicker = L.Draw.Marker.extend({
    statics: {
        TYPE: 'colorPicker'
    },

    ColorPicker: L.Marker,

    options: {
        stroke: true,
        color: '#ff0000',
        weight: 4,
        opacity: 1,
        fill: true,
        fillColor: null, //same as color by default
        fillOpacity: 0.2,
        clickable: true,
        icon: new L.DivIcon({
            iconSize: new L.Point(26, 26),
            className: 'leaflet-div-color-picker leaflet-editing-color-picker',
            iconAnchor: new L.Point(6, 20)
        }),
        touchIcon: new L.DivIcon({
            iconSize: new L.Point(20, 20),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
        }),
        zIndexOffset: 2000
    },

    initialize: function (map, options) {
        // Save the type so super can fire, need to do this as cannot do this.TYPE :(
        this.type = L.Draw.ColorPicker.TYPE;
        L.Draw.Feature.prototype.initialize.call(this, map, options);
    },

    addHooks: function () {
        console.log("Add hooks Color picker");
        L.Draw.Feature.prototype.addHooks.call(this);

        if (this._map) {
            if (!this._marker) {
                this._marker = L.marker(this._map.getCenter(), {
                    icon: L.divIcon({
                        className: 'leaflet-mouse-marker',
                        iconAnchor: [20, 20],
                        iconSize: [40, 40]
                    }),
                    opacity: 0,
                    zIndexOffset: this.options.zIndexOffset
                });
            }

            this._marker
                .on('mousemove', this._onMouseMoveCursor, this) // Necessary to prevent 0.8 stutter
                .addTo(this._map);
            this._map.on('mousemove', this._onMouseMoveCursor, this);

            let canvas = document.createElement("canvas");
            canvas.id = this._map.options.picture;
            canvas.width = 3;
            canvas.height = 3;

            this._context = canvas.getContext('2d');
            this._image = new Image();
            this._image.src = this._map.options.picture;
            this._image.onload = () => {
                this._map.on('click', this._pickColor, this);
            };
        }
    },

    _onMouseMoveCursor: function (e) {
        let newPos = this._map.mouseEventToLayerPoint(e.originalEvent);
        let latlng = this._map.layerPointToLatLng(newPos);
        // Update the mouse marker position
        this._marker.setLatLng(latlng);
        L.DomEvent.preventDefault(e.originalEvent);
    },

    removeHooks: function () {
        console.log("Remove hook Occurrence");
        L.Draw.Feature.prototype.removeHooks.call(this);
        this._map.off('click', this._pickColor, this)
            .off('mousemove', this._onMouseMoveCursor, this);
        this._marker.off('mousemove', this._onMouseMoveCursor, this);
        this._map.removeLayer(this._marker);
        delete this._context;
        delete this._image;
        delete this._marker;
    },

    _pickColor: function (e) {
        this._point = this._map.project(e.latlng, this._map.options.boundsZoomLevel).floor();
        this._context.drawImage(this._image, this._point.x, this._point.y, 1, 1, 0, 0, 1, 1);
        this._color = this._rgbToHex(this._context.getImageData(0, 0, 1, 1).data);
        console.log('Image data', this._color);
        this._fireCreatedEvent();
        this.disable();

        if (this.options.repeatMode) {
            this.enable();
        }
    },

    _fireCreatedEvent: function () {
        let colorPicker = new this.ColorPicker(this._marker.getLatLng(), this.options);
        colorPicker.color = this._color;
        colorPicker.point = this._point;
        console.log(colorPicker);
        L.Draw.Feature.prototype._fireCreatedEvent.call(this, colorPicker);
    },

    _rgbToHex: function (data) {
        const r = data[0], g = data[1], b = data[2];
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
});
