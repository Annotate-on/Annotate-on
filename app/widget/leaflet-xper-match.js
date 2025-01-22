import L from "leaflet";
import React, { Component } from 'react';
import i18next from "i18next";
import { getImageDetectAnnotations } from '../utils/imageDetectService';
import {
    ee,
    EVENT_CREATE_IMAGE_DETECT_ANNOTATION,
    EVENT_GOTO_ANNOTATION,
    EVENT_XPER_MATCH_RESOURCE
} from "../utils/library";

L.Control.XperMatch = L.Control.extend({
    options: {
        position: 'topleft',
        picture: null
    },
    initialize: function (options) {
        L.Util.setOptions(this, options);
    },
    onAdd: function (map) {
        const { t } = i18next;
        let container = L.DomUtil.create('div', 'leaflet-bar');
        L.DomEvent.disableClickPropagation(container);
        this._link = L.DomUtil.create('a', 'xper-match', container);
        this._link.href = '#';
        this._link.title = t('annotate.editor.btn_tooltip_xper-match');
        L.DomEvent
            .on(this._link, 'click', L.DomEvent.stopPropagation)
            .on(this._link, 'click', L.DomEvent.preventDefault)
            .on(this._link, 'click', () => this._callXperMatch(), this);
        return container;
    },

    onRemove: function (map) {
        L.DomEvent.removeListener(this._link, 'click', () => this._callXperMatch(), this);
    },

    _callXperMatch: function (event) {
        const { t } = i18next;
        console.log("Xper Annotation Detect = ", this.options.picture);
        ee.emit(EVENT_XPER_MATCH_RESOURCE, this.options.picture);
    }
});

L.XperMatch = function (picture_url) {
    return new L.Control.XperMatch(picture_url);
};
