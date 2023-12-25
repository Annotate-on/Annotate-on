import L from "leaflet";
import React, { Component } from 'react';
import i18next from "i18next";
import { getImageDetectAnnotations } from '../utils/imageDetectService';
import {createAnnotationRectangular} from '../actions/app';

L.Control.ImageDetectService = L.Control.extend({
    options: {
        position: 'topleft',
        picture: null
    },
    initialize: function (options) {
        L.Util.setOptions(this, options);
    },
    onAdd: function (map) {
        const { t } = i18next;
        let picture_url = '';
        if (this.options.picture.erecolnatMetadata.mediaurl) {
            picture_url = this.options.picture.erecolnatMetadata.mediaurl;
        }
        let container = L.DomUtil.create('div', 'leaflet-bar');
        L.DomEvent.disableClickPropagation(container);
        this._link = L.DomUtil.create('a', 'image-detect', container);
        this._link.href = '#';
        this._link.title = t('annotate.editor.btn_tooltip_image_detect_service');
        L.DomEvent
            .on(this._link, 'click', L.DomEvent.stopPropagation)
            .on(this._link, 'click', L.DomEvent.preventDefault)
            .on(this._link, 'click', () => this._callImageDetect(picture_url), this); // Use an arrow function here

        return container;
    },
    onRemove: function (map) {
        L.DomEvent.removeListener(this._link, 'click', () => this._callImageDetect(picture_url), this);
    },

    _callImageDetect: function (picture_url) {
        getImageDetectAnnotations(picture_url, (result) => {
            console.log('response from image detect:', result);

            ///// TODO create annotations from result
/*            createAnnotationRectangular('5e74c583a3c7eb9460d0e281f9d5bef0fb6066f8',{
                    "x": 200,
                    "y": 200
                },
                {
                    "x": 500,
                    "y": 500
                },'123',false)*/
       });
    },
});

L.ImageDetectService = function (picture_url) {
    return new L.Control.ImageDetectService(picture_url);
};
