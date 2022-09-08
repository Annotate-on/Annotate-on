import L from "leaflet";
import i18next from "i18next";

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
        const { t } = i18next;
        this.container = L.DomUtil.create('div', 'leaflet-bar leaflet-recolnat-control-menu');
        L.DomEvent.disableClickPropagation(this.container);
        this._link = L.DomUtil.create('a', 'recolnat-control-menu', this.container);
        this._link.href = '#';
        this._link.title = t('annotate.editor.btn_tooltip_fast_measurement');

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
