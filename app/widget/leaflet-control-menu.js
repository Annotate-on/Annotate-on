import L from "leaflet";

/**
 * Adds settings for leaflet widget.
 */
L.Control.RecolnatControlMenu = L.Control.extend({
    defaultColor: '#ff0000',
    options: {
        position: 'topleft'
    },
    initialize: function (options) {
        L.Util.setOptions(this, options);
    },
    onAdd: function (map) {
        this.container = L.DomUtil.create('div', 'leaflet-bar leaflet-recolnat-control-menu');
        L.DomEvent.disableClickPropagation(this.container);
        this._link = L.DomUtil.create('a', 'recolnat-control-menu', this.container);
        this._link.href = '#';
        this._link.title = 'Switch "fast measurement" mode';

        this.repeat = this.options.defaultValue;
        if (this.options.defaultValue === true) {
            L.DomUtil.addClass(this._link, 'enabled');
        }

        L.DomEvent
            .on(this._link, 'click', L.DomEvent.stopPropagation)
            .on(this._link, 'click', L.DomEvent.preventDefault)
            .on(this._link, 'click', this._toggle, this);

        return this.container;
    },
    onRemove: function (map) {
        L.DomEvent.removeListener(this._link, 'click', this._toggle, this);
    },
    _toggle: function () {
        if (this.repeat)
            L.DomUtil.removeClass(this._link, 'enabled');
        else
            L.DomUtil.addClass(this._link, 'enabled');

        this.repeat = !this.repeat;

        if ('repeatModeHandler' in this.options) {
            this.options.repeatModeHandler(this.repeat);
        }
    }
});

L.recolnatControlMenu = function (options) {
    return new L.Control.RecolnatControlMenu(options);
};
