import L from "leaflet";
import i18next from "i18next";
import {
    ee,
    EVENT_CALL_IMAGE_DETECT_SERVICE,

} from "../utils/library";

L.Control.ImageDetectService = L.Control.extend({
    options: {
        position: 'topleft',
        picture: null,
        urlImageDetect: null
    },
    initialize: function (options) {
        L.Util.setOptions(this, options);
    },
    onAdd: function (map) {
        const { t } = i18next;
        let container = L.DomUtil.create('div', 'leaflet-bar');
        L.DomEvent.disableClickPropagation(container);
        this._link = L.DomUtil.create('a', 'image-detect', container);
        this._link.href = '#';
        this._link.title = t('annotate.editor.btn_tooltip_image_detect_service');
        L.DomEvent
            .on(this._link, 'click', L.DomEvent.stopPropagation)
            .on(this._link, 'click', L.DomEvent.preventDefault)
            .on(this._link, 'click', () => this._callImageDetect(), this);

        return container;
    },
    onRemove: function (map) {
        L.DomEvent.removeListener(this._link, 'click', () => this._callImageDetect(), this);
    },

    _callImageDetect: function (event) {
        ee.emit(EVENT_CALL_IMAGE_DETECT_SERVICE);
    },
});

L.ImageDetectService = function (picture_url) {
    return new L.Control.ImageDetectService(picture_url);
};
