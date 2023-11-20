
/**
 * @class L.Draw.Polygon
 * @aka Draw.Polygon
 * @inherits L.Draw.Polyline
 */
L.Draw.PolygonOfInterest = L.Draw.Polygon.extend({
    statics: {
        TYPE: 'polygonOfInterest'
    },

    // Poly: L.Polygon,

    options: {
        showArea: false,
        showLength: false,
        shapeOptions: {
            stroke: true,
            color: '#3388ff',
            weight: 4,
            opacity: 0.5,
            fill: true,
            fillColor: null, //same as color by default
            fillOpacity: 0.2,
            clickable: true
        },
        // Whether to use the metric measurement system (truthy) or not (falsy).
        // Also defines the units to use for the metric system as an array of
        // strings (e.g. `['ha', 'm']`).
        metric: true,
        feet: true, // When not metric, to use feet instead of yards for display.
        nautic: false, // When not metric, not feet use nautic mile for display
        // Defines the precision for each type of unit (e.g. {km: 2, ft: 0}
        precision: {}
    },

    // @method initialize(): void
    initialize: function (map, options) {
        L.Draw.Polygon.prototype.initialize.call(this, map, options);

        // Save the type so super can fire, need to do this as cannot do this.TYPE :(
        this.type = L.Draw.PolygonOfInterest.TYPE;
    },

});

L.polygonOfInterest = function polygonOfInterest(map, options) {
    return new L.Polygon(map, options);
};
