//-----------------------------------------------------------------------------------------------------------------------

import L from "leaflet";

/*Adds new shape types to the options */
L.DrawToolbar.include({
    getModeHandlers: function (map) {
        return [
            {
                enabled: this.options.simpleline,
                handler: new L.Draw.SimpleLine(map, this.options.simpleline),
                title: L.drawLocal.draw.toolbar.buttons.simpleline
            },
            {
                enabled: this.options.polyline,
                handler: new L.Draw.Polyline(map, this.options.polyline),
                title: L.drawLocal.draw.toolbar.buttons.polyline
            },
            {
                enabled: this.options.polygon,
                handler: new L.Draw.Polygon(map, this.options.polygon),
                title: L.drawLocal.draw.toolbar.buttons.polygon
            },
            {
                enabled: this.options.angle,
                handler: new L.Draw.Angle(map, this.options.angle),
                title: L.drawLocal.draw.toolbar.buttons.angle
            },
            {
                enabled: this.options.occurrence,
                handler: new L.Draw.Occurrence(map, this.options.occurrence),
                title: L.drawLocal.draw.toolbar.buttons.occurrence
            },
            {
                enabled: this.options.circle,
                handler: new L.Draw.Circle(map, this.options.circle),
                title: L.drawLocal.draw.toolbar.buttons.circle
            },
            {
                enabled: this.options.marker,
                handler: new L.Draw.Marker(map, this.options.marker),
                title: L.drawLocal.draw.toolbar.buttons.marker
            },
            {
                enabled: this.options.rectangle,
                handler: new L.Draw.Rectangle(map, this.options.rectangle),
                title: L.drawLocal.draw.toolbar.buttons.rectangle
            },
            {
                enabled: this.options.colorPicker,
                handler: new L.Draw.ColorPicker(map, this.options.colorPicker),
                title: L.drawLocal.draw.toolbar.buttons.colorPicker
            },
            {
                enabled: this.options.ratio,
                handler: new L.Draw.Ratio(map, this.options.ratio),
                title: L.drawLocal.draw.toolbar.buttons.ratio
            },
            {
                enabled: this.options.transcription,
                handler: new L.Draw.Transcription(map, this.options.transcription),
                title: L.drawLocal.draw.toolbar.buttons.transcription
            },
            {
                enabled: this.options.categorical,
                handler: new L.Draw.Categorical(map, this.options.categorical),
                title: L.drawLocal.draw.toolbar.buttons.categorical
            },
            {
                enabled: this.options.richtext,
                handler: new L.Draw.RichText(map, this.options.richtext),
                title: L.drawLocal.draw.toolbar.buttons.richtext
            },
            {
                enabled: this.options.cartel,
                handler: new L.Draw.Cartel(map, this.options.cartel),
                title: L.drawLocal.draw.toolbar.buttons.cartel
            }
        ];
    }
});
//-----------------------------------------------------------------------------------------------------------------------
/**
 * @class L.Edit.PolyVerticesEdit
 * @aka Edit.PolyVerticesEdit
 */
L.Edit.PolyVerticesEdit.include({
    _initMarkers: function () {
        if (!this._markerGroup) {
            this._markerGroup = new L.LayerGroup();
        }
        this._markers = [];

        let latlngs = this._defaultShape(),
            i, j, len, marker;

        for (i = 0, len = latlngs.length; i < len; i++) {
            marker = this._createMarker(latlngs[i], i);
            marker.on('click', this._onMarkerClick, this);
            marker.on('contextmenu', this._onContextMenu, this);
            this._markers.push(marker);
        }

        let markerLeft, markerRight;

        for (i = 0, j = len - 1; i < len; j = i++) {
            if (i === 0 && !(L.Polygon && (this._poly instanceof L.Polygon))) {
                continue;
            }

            markerLeft = this._markers[j];
            markerRight = this._markers[i];

            if(this._poly.annotationType !== 'angle' && this._poly.annotationType !== 'simple-line')
                this._createMiddleMarker(markerLeft, markerRight);
            this._updatePrevNext(markerLeft, markerRight);
        }
    }

});
