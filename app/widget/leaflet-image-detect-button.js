import L from "leaflet";
import React, { Component } from 'react';
import i18next from "i18next";
import { getImageDetectAnnotations } from '../utils/imageDetectService';
import {ee, EVENT_CREATE_IMAGE_DETECT_ANNOTATION, EVENT_GOTO_ANNOTATION} from "../utils/library";
import {convertBoundingBoxToVertices} from "../utils/maths"
import {remote} from "electron";
import {loadMetadata} from "../utils/config";


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
        const { t } = i18next;
        let metadata;
        let imageUrl;
        if(!this.options.urlImageDetect){
            remote.dialog.showErrorBox(t('global.info'), t('annotate.editor.alert_not_active_image_detect_service'));
        }else{
            if(!this.options.picture.erecolnatMetadata){
                metadata = loadMetadata(this.options.picture.sha1);
                imageUrl = metadata.naturalScienceMetadata.reference
            }else{
                if(this.options.picture.erecolnatMetadata.mediaurl){
                    imageUrl = this.options.picture.erecolnatMetadata.mediaurl
                }
            }
        }
        if(!imageUrl){
            remote.dialog.showErrorBox(t('global.info'),t('annotate.editor.alert_recolnat_image_no_url'));
        }else{
            getImageDetectAnnotations(this.options.urlImageDetect.url_service, imageUrl, (result) => {
                if(result != null){
                    let counter = 0;
                    const resultArray = result.result || [];
                    const filteredResults = resultArray.filter(detection1 => detection1.confidence >= (this.options.urlImageDetect.confidence / 100));
                    filteredResults.forEach(detection => {
                        const { xmax, xmin, ymax, ymin } = detection;
                        const vertices = convertBoundingBoxToVertices(xmax, xmin, ymax, ymin);
                        const classId = detection.class;
                        const confidence = detection.confidence;
                        const name = detection.name;
                        // console.log(`Class: ${classLabel}, Confidence: ${confidence}, Name: ${name}, Vertices: ${vertices}`);
                        counter += 1;
                        ee.emit(EVENT_CREATE_IMAGE_DETECT_ANNOTATION, this.options.picture.sha1, vertices, confidence, name, classId, counter)
                    });
                    this.options.leafletImage._drawAnnotations();
                }
            });
        }

    },
});

L.ImageDetectService = function (picture_url) {
    return new L.Control.ImageDetectService(picture_url);
};
