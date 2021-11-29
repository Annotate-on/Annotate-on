import L from 'leaflet';

/**
 * @class L.Draw.Cartel
 * @aka Draw.Cartel
 * @inherits L.Draw.Feature
 */
L.Draw.Cartel = L.Draw.Feature.extend({
    statics: {
        TYPE: 'cartel'
    },

    Cartel: L.Polyline,

    options: {
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
        this.type = L.Draw.Cartel.TYPE;
        L.Draw.Feature.prototype.initialize.call(this, map, options);
    },

    enable: function () {
        L.Handler.prototype.enable.call(this);
        this.fire('enabled', {handler: this.type});
        this._fireCreatedEvent();
        this.disable();
    },

    addHooks: function () {
    },

    removeHooks: function () {
    },

    _fireCreatedEvent: function () {
        let cartel = new this.Cartel({}, this.options.shapeOptions);
        L.Draw.Feature.prototype._fireCreatedEvent.call(this, cartel);
    }
});
