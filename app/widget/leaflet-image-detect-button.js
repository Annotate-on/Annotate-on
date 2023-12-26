import L from "leaflet";
import React, { Component } from 'react';
import i18next from "i18next";
import { getImageDetectAnnotations } from '../utils/imageDetectService';
import {createIMageDetectAnnotationRectangular} from '../actions/app';


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

            // TODO: Process 'result' and create annotations

            // Example: Create rectangular annotations
            // result.forEach(annotation => {
            //     const { x, y, width, height } = annotation.boundingBox;
            //     const vertices = [
            //         { x, y },
            //         { x: x + width, y },
            //         { x: x + width, y: y + height },
            //         { x, y: y + height },
            //     ];
            //
            //     // Assuming you have the pictureId and video parameters
            //     const pictureId = '5e74c583a3c7eb9460d0e281f9d5bef0fb6066f8';
            //     const video = false;
            //
            //     // Dispatch the action to create a rectangular annotation
                 createImageDetectAnnotationRectangular("pictureId", "vertices", "annotation.id", "");
            // });

        });
    },

});

L.ImageDetectService = function (picture_url) {
    return new L.Control.ImageDetectService(picture_url);
};
