import L from "leaflet";

L.Control.FitToView = L.Control.extend({
    options: {
        // topright, topleft, bottomleft, bottomright
        position: 'topright'
    },
    initialize: function (bounds) {
        this._bounds = bounds;
    },
    onAdd: function (map) {
        let container = L.DomUtil.create('div', 'leaflet-bar');
        L.DomEvent.disableClickPropagation(container);
        this._currentZoom = L.DomUtil.create('a', 'current-zoom', container);
        this.updateMapZoom(this._map.getZoom());
        this._map.on('zoomend', this.onMapZoomEnd, this);

        this._link = L.DomUtil.create('a', 'fit-to-view', container);
        this._link.href = '#';
        this._link.title = "Fit image to screen";

        this._maxZoom = L.DomUtil.create('a', 'one-to-one-view', container);
        this._maxZoom.href = '#';
        this._maxZoom.title = "Display with scan resolution (1 pixel image = 1 pixel to screen)";

        L.DomEvent
            .on(this._link, 'click', L.DomEvent.stopPropagation)
            .on(this._link, 'click', L.DomEvent.preventDefault)
            .on(this._link, 'click', this.fitMap, this);

        L.DomEvent
            .on(this._maxZoom, 'click', L.DomEvent.stopPropagation)
            .on(this._maxZoom, 'click', L.DomEvent.preventDefault)
            .on(this._maxZoom, 'click', this.originalSize, this);

        return container;
    },
    onRemove: function (map) {
        L.DomEvent.removeListener(this._link, 'click', this.fitMap, this);
        L.DomEvent.removeListener(this._maxZoom, 'click', this.originalSize, this);
        map.off('zoomend', this.onMapZoomEnd, this);
    },

    fitMap: function () {
        this._map.fitBounds(this._bounds);
    },

    originalSize: function () {
        this._map.setZoom(this._map.options.maxZoom-Math.sqrt(5), {animate: true});
    },
    updateMapZoom: function (zoom) {
        if(typeof(zoom) === "undefined") {
            zoom = ""
        } else {
            //todo convert zoom to % value
        }
        // console.log("zoooom",zoom);
        // console.log("zoom log2",Math.pow(2,this._map.options.maxZoom));
        if((zoom-this._map.options.maxZoom+Math.sqrt(5))<0){
          this._currentZoom.innerHTML = "1:"+(Math.pow(2,Math.abs(zoom-this._map.options.maxZoom+Math.sqrt(5))).toFixed(0));
        }
        else {
          this._currentZoom.innerHTML = (Math.pow(2,Math.abs(zoom-this._map.options.maxZoom+Math.sqrt(5))).toFixed(0))+":1";
        }
    },
    onMapZoomEnd: function (e) {
        this.updateMapZoom(this._map.getZoom());
    }
});

L.control.fitToView = function (bounds) {
    return new L.Control.FitToView(bounds);
};
