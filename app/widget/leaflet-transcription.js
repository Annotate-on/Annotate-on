import {Path, Util, LatLngBounds, LineUtil, LatLng, latLng as toLatLng, Bounds, Point, Polygon, Rectangle, latLng as toLatLngBounds, SVG} from 'leaflet';
import {stamp} from "leaflet/dist/leaflet-src.esm";
import * as DomUtil from "leaflet/src/dom/DomUtil";
import {ANNOTATION_TRANSCRIPTION} from "../constants/constants";

/**
 * Change drawing of occurrence annotation.
 */
L.SVG.include({
    // _addPath: function (layer) {
    //     console.log('Add my path', layer)
    //     if (!this._rootGroup) { this._initContainer(); }
    //
    //     if(layer.annotationType === ANNOTATION_TRANSCRIPTION) {
    //         const textNode = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    //         textNode.setAttribute('x', layer._parts[0][1].x);
    //         textNode.setAttribute('y', layer._parts[0][1].y);
    //         textNode.setAttribute('class', 'small');
    //         textNode.textContent = 'Test text';
    //         layer._transcriptionText = textNode;
    //         this._rootGroup.appendChild(textNode);
    //
    //         layer._path.setAttribute('class', 'small');
    //     }
    //
    //     this._rootGroup.appendChild(layer._path);
    //     layer.addInteractiveTarget(layer._path);
    // },
    //
    // _removePath: function (layer) {
    //     if(layer.annotationType === ANNOTATION_TRANSCRIPTION && layer._transcriptionText) {
    //         DomUtil.remove(layer._transcriptionText);
    //     }
    //
    //     DomUtil.remove(layer._path);
    //     layer.removeInteractiveTarget(layer._path);
    //     delete this._layers[stamp(layer)];
    // },
    //
    // _updateTranscription: function (layer, closed) {
    //     // if(layer._transcriptionText && layer._parts[0]) {
    //     //     layer._transcriptionText.setAttribute('x', layer._parts[0][1].x);
    //     //     layer._transcriptionText.setAttribute('y', layer._parts[0][1].y);
    //     // }
    //
    //     this._setPath(layer, SVG.pointsToPath(layer._parts, closed));
    // },
});

L.Transcription = Rectangle.extend({
    // _updatePath: function () {
    //     this._renderer._updateTranscription(this, true);
    // },
});

// @factory L.transcription(latLngBounds: LatLngBounds, options?: Polyline options)
L.transcription = function transcription(latlngs, options) {
    return new L.Transcription(latlngs, options);
};

L.Draw.Transcription = L.Draw.SimpleShape.extend({
    statics: {
        TYPE: 'transcription'
    },
    options: {
        shapeOptions: {
            stroke: true,
            color: '#3388ff',
            weight: 4,
            opacity: 0.1,
            fill: false,
            fillColor: null, //same as color by default
            fillOpacity: 0.1,
            showArea: true,
            clickable: true
        },
        metric: true // Whether to use the metric measurement system or imperial
    },

    // @method initialize(): void
    initialize: function (map, options) {
        // Save the type so super can fire, need to do this as cannot do this.TYPE :(
        this.type = L.Draw.Transcription.TYPE;

        this._initialLabelText = L.drawLocal.draw.handlers.transcription.tooltip.start;

        L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
    },

    _drawShape: function (latlng) {
        if (!this._shape) {
            this._shape = new L.Transcription(new L.LatLngBounds(this._startLatLng, latlng), this.options.shapeOptions);
            this._map.addLayer(this._shape);
        } else {
            this._shape.setBounds(new L.LatLngBounds(this._startLatLng, latlng));
        }
    },

    _fireCreatedEvent: function () {
        var transcription = new L.Transcription(this._shape.getBounds(), this.options.shapeOptions);
        L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, transcription);
    }
});

function _hasAncestor(el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls)) {
        ;
    }
    return el;
}