import L, {Rectangle} from 'leaflet';


L.RichText = Rectangle.extend({
    options: {
        textSize: 12
    },

    onAdd: function (map) {
        L.Rectangle.prototype.onAdd.call(this, map);
        this._textRedraw();
    },

    _textRedraw: function () {
        const text = this._text;
        if (text) {
            this.setText(null).setText(text);
        }
    },

    setText: function (annotationText) {
        this._text = annotationText;

        const id = 'rte-' + L.Util.stamp(this);
        const svg = this._map._renderer._container;

        if (!annotationText) {
            if (this._foreignObject && this._foreignObject.parentNode) {
                this._map._renderer._container.removeChild(this._foreignObject);

                /* delete the node, so it will not be removed a 2nd time if the layer is later removed from the map */
                delete this._foreignObject;
            }

            if (this._style && this._style.parentNode) {
                this._map._renderer._container.removeChild(this._style);
                delete this._style;
            }
            return this;
        }

        // const scaleFor = Math.log2(this._map.getZoom())/6;
        // const scaleFor = this._map.getZoom()/10;
        // console.log(scaleFor+' '+this._map.getZoom())
        // console.log(' Math.log2 '+  Math.log2(this._map.getZoom()));
        // console.log(' Math.pow '+  Math.pow(2,this._map.getZoom())/1000);

        const scale2 = Math.pow(2, this._map.getZoom()) / 1000;

        const text = annotationText.replace(/&nbsp;/g, ' ').replace(/<br>/g, '<br/>');
        const textHtml = `<div xmlns="http://www.w3.org/1999/xhtml"  style="font-size: ${(this.options.textSize * scale2)}pt;color:red;">${text}</div>`;

        const {width, height} = this._getWidthAndHeight();

        if (this.editing._enabled === undefined || this.editing._enabled !== true) {
            this._path.setAttribute('stroke', null);
        }

        this._style = L.SVG.create('style');
        this._style.textContent = `
        #${id} h1 {
            font-size: ${(this.options.textSize * scale2 * 2.5)}px;
        }
        #${id} h2 {
            font-size: ${(this.options.textSize * scale2 * 2)}px;
        }
        #${id} h3 {
            font-size: ${(this.options.textSize * scale2 * 1.5)}px;
        }`;
        svg.appendChild(this._style);

        this._foreignObject = L.SVG.create('foreignObject');
        this._foreignObject.setAttribute('id', id);
        this._foreignObject.setAttribute('width', width);
        this._foreignObject.setAttribute('height', height);
        this._foreignObject.innerHTML = textHtml;

        const center = this._map.latLngToLayerPoint(this.getCenter());
        center.x = center.x - width / 2;
        center.y = center.y - height / 2;
        L.DomUtil.setPosition(this._foreignObject, center);
        // L.DomUtil.setTransform(this._foreignObject, center, );
        svg.appendChild(this._foreignObject);
    },

    onRemove: function (map) {
        map = map || this._map;
        if (map && this._foreignObject && map._renderer._container)
            map._renderer._container.removeChild(this._foreignObject);
        if (map && this._style && map._renderer._container)
            map._renderer._container.removeChild(this._style);

            L.Rectangle.prototype.onRemove.call(this, this._map);
    },

    _getWidthAndHeight: function () {
        const vertices = this.getLatLngs()[0]
        const firstLL = vertices[0];
        const thirdLL = vertices[2];

        const first = this._map.latLngToLayerPoint(firstLL);
        const third = this._map.latLngToLayerPoint(thirdLL);

        return {
            width: Math.abs(third.x - first.x),
            height: Math.abs(third.y - first.y)
        }
    },

    _update: function () {
        if (!this._map) {
            return;
        }
        this._textRedraw();
        L.Rectangle.prototype._update.call(this, this._map);
    },

    setStyle: function (style) {
        console.log(style)
        if (style.highlight || style.edit) {
            L.Rectangle.prototype.setStyle.call(this, style);
        } else {
            L.Rectangle.prototype.setStyle.call(this, {...style, color: ''});
        }
    }
});

// L.Layer.include({
//     setText: function (text, options) {
//         if (typeof this.setText === 'function') {
//             console.log('Opa ovo je pozvano...')
//             this.setText(text, options);
//         }
//         return this;
//
//     }
// });

L.richtext = function richtext(latlngs, options) {
    return new L.RichText(latlngs, options);
};

/**
 * @class L.Draw.RichText
 * @aka Draw.RichText
 * @inherits L.Draw.SimpleShape
 */
L.Draw.RichText = L.Draw.SimpleShape.extend({
    statics: {
        TYPE: 'richtext'
    },

    options: {
        shapeOptions: {
            stroke: true,
            color: '#3388ff',
            weight: 4,
            opacity: 0.5,
            fill: true,
            fillColor: null, //same as color by default
            fillOpacity: 0.2,
            showArea: true,
            clickable: true
        },
        metric: true // Whether to use the metric measurement system or imperial
    },

    // @method initialize(): void
    initialize: function (map, options) {
        // Save the type so super can fire, need to do this as cannot do this.TYPE :(
        this.type = L.Draw.RichText.TYPE;

        this._initialLabelText = L.drawLocal.draw.handlers.richtext.tooltip.start;

        L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
    },

    // @method disable(): void
    disable: function () {
        if (!this._enabled) {
            return;
        }

        this._isCurrentlyTwoClickDrawing = false;
        L.Draw.SimpleShape.prototype.disable.call(this);
    },

    _onMouseUp: function (e) {
        if (!this._shape && !this._isCurrentlyTwoClickDrawing) {
            this._isCurrentlyTwoClickDrawing = true;
            return;
        }

        // Make sure closing click is on map
        if (this._isCurrentlyTwoClickDrawing && !_hasAncestor(e.target, 'leaflet-pane')) {
            return;
        }

        L.Draw.SimpleShape.prototype._onMouseUp.call(this);
    },

    _drawShape: function (latlng) {
        if (!this._shape) {
            this._shape = new L.RichText(new L.LatLngBounds(this._startLatLng, latlng), this.options.shapeOptions);
            this._map.addLayer(this._shape);
        } else {
            this._shape.setBounds(new L.LatLngBounds(this._startLatLng, latlng));
        }
    },

    _fireCreatedEvent: function () {
        var richtext = new L.RichText(this._shape.getBounds(), this.options.shapeOptions);
        L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, richtext);
    },

    _getTooltipText: function () {
        var tooltipText = L.Draw.SimpleShape.prototype._getTooltipText.call(this),
            shape = this._shape,
            showArea = this.options.showArea,
            latLngs, area, subtext;

        if (shape) {
            latLngs = this._shape._defaultShape ? this._shape._defaultShape() : this._shape.getLatLngs();
            area = L.GeometryUtil.geodesicArea(latLngs);
            subtext = showArea ? L.GeometryUtil.readableArea(area, this.options.metric) : '';
        }

        return {
            text: tooltipText.text,
            subtext: subtext
        };
    }
});

function _hasAncestor(el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls)) {
        ;
    }
    return el;
}
