import L from "leaflet";
import lodash from 'lodash';
import {
    ANNOTATION_ANGLE, ANNOTATION_CIRCLE_OF_INTEREST,
    ANNOTATION_MARKER,
    ANNOTATION_POLYGON,
    ANNOTATION_POLYLINE,
    ANNOTATION_RECTANGLE,
    ANNOTATION_RICHTEXT,
    ANNOTATION_SIMPLELINE,
    ANNOTATION_TRANSCRIPTION,
    ANNOTATION_POLYGON_OF_INTEREST
} from "../constants/constants";
import i18next from "i18next"

let fileSaver = require('file-saver');

L.Control.RecolnatPrint = L.Control.extend({
    defaultColor: '#ff0000',
    options: {
        position: 'bottomright',
        annotationsPointsOfInterest: null,
        annotationsMeasuresLinear: null,
        annotationsRectangular: null,
        annotationsPolygon: null,
        annotationsAngle: null,
        annotationsRichtext: null,
        annotationsCircleOfInterest: null,
        annotationsPolygonOfInterest: null,
        picture: null
    },
    initialize: function (options) {
        L.Util.setOptions(this, options);
    },
    onAdd: function (map) {
        const {t} = i18next;
        let container = L.DomUtil.create('div', 'leaflet-bar leaflet-recolnat-print');
        L.DomEvent.disableClickPropagation(container);
        this._link = L.DomUtil.create('a', 'recolnat-print', container);
        this._link.href = '#';
        this._link.title = t('annotate.editor.btn_tooltip_export_image_with_annotations');
        L.DomEvent
            .on(this._link, 'click', L.DomEvent.stopPropagation)
            .on(this._link, 'click', L.DomEvent.preventDefault)
            .on(this._link, 'click', this._printMap, this);

        return container;
    },
    onRemove: function (map) {
        L.DomEvent.removeListener(this._link, 'click', this._printMap, this);
    },

    _printMap: function () {
        //Draw image with all annotations to canvas and save it to file.
        let canvas = document.createElement("canvas");
        canvas.id = this.options.picture.sha1;
        canvas.width = this.options.picture.width;
        canvas.height = this.options.picture.height;

        let context = canvas.getContext('2d');
        let image = new Image();
        image.onload = () => {
            //Draw basic image
            context.drawImage(image, 0, 0, canvas.width, canvas.height);

            const annotations = [
                ...lodash.flattenDepth(Object.values(this.options.annotationsPointsOfInterest || []), 2)
                , ...lodash.flattenDepth(Object.values(this.options.annotationsMeasuresLinear || []), 2)
                , ...lodash.flattenDepth(Object.values(this.options.annotationsRectangular || []), 2)
                , ...lodash.flattenDepth(Object.values(this.options.annotationsPolygon || []), 2)
                , ...lodash.flattenDepth(Object.values(this.options.annotationsAngle || []), 2)
                , ...lodash.flattenDepth(Object.values(this.options.annotationsColorPicker || []), 2)
                , ...lodash.flattenDepth(Object.values(this.options.annotationsOccurrence || []), 2)
                , ...lodash.flattenDepth(Object.values(this.options.annotationsTranscription || []), 2)
                , ...lodash.flattenDepth(Object.values(this.options.annotationsRichtext || []), 2)
                , ...lodash.flattenDepth(Object.values(this.options.annotationsCircleOfInterest || []), 2)
                , ...lodash.flattenDepth(Object.values(this.options.annotationsPolygonOfInterest || []), 2)
            ];
            const pointer = require('../components/pictures/poi-marker.svg');
            const marker = new Image();
            marker.src = pointer;

            const markerWidth = canvas.width * .028, markerHeight = canvas.width * .032;
            context.lineWidth = canvas.width * .003;
            //Calculate font size
            const fontSize = (canvas.width * .016);
            // context.font = fontSize + 'px bold serif';
            context.font = fontSize + "px 'Helvetica Neue', Arial, Helvetica, sans-serif";

            const drawings = annotations.map(annotation => {
                return new Promise((resolve, reject) => {
                    switch (annotation.annotationType) {
                        case ANNOTATION_SIMPLELINE:
                        case ANNOTATION_POLYLINE: {
                            let path = new Path2D();
                            annotation.vertices.map((vertex, i) => {
                                if (i === 0)
                                    path.moveTo(vertex.x, vertex.y);
                                else
                                    path.lineTo(vertex.x, vertex.y);
                            });

                            context.strokeStyle = annotation.color || this.defaultColor;
                            context.fillStyle = annotation.color || this.defaultColor;
                            context.stroke(path);
                            resolve();
                        }
                            break;
                        case ANNOTATION_MARKER:
                            context.drawImage(marker, annotation.x - markerWidth / 2, annotation.y - markerHeight, markerWidth, markerHeight);
                            context.fillStyle = this.defaultColor;
                            context.strokeStyle = this.defaultColor;
                            context.fillText(annotation.title, annotation.x + markerWidth / 2, annotation.y + markerHeight / 2);
                            resolve();
                            break;
                        case ANNOTATION_RICHTEXT: {
                            const width = Math.ceil(Math.abs(annotation.vertices[2].x - annotation.vertices[1].x));
                            const height = Math.ceil(Math.abs(annotation.vertices[1].y - annotation.vertices[0].y));
                            const svgImage = new Image();
                            svgImage.onload = (e) => {
                                context.drawImage(e.target, annotation.vertices[1].x, annotation.vertices[1].y, width, height);
                                resolve();
                            };

                            // Remove characters that break xhtml
                            const html = annotation.value.replace(/&nbsp;/g, ' ').replace(/<br>/g, '<br/>');
                            const svg = `<svg xmlns="http://www.w3.org/2000/svg" style="font-size: ${(fontSize * 1.05)};color:red;" width="${width}" height="${height}">
                                        <foreignObject width="${width}" height="${height}"><div xmlns="http://www.w3.org/1999/xhtml">${html}</div></foreignObject></svg>`;

                            svgImage.src = `data:image/svg+xml;charset=UTF-8,` + svg;
                        }
                            break;
                        case ANNOTATION_RECTANGLE:
                        case ANNOTATION_TRANSCRIPTION:
                        case ANNOTATION_ANGLE:
                        case ANNOTATION_POLYGON_OF_INTEREST:
                        case ANNOTATION_POLYGON: {
                            let path = new Path2D();
                            annotation.vertices.map((vertex, i) => {
                                if (i === 0)
                                    path.moveTo(vertex.x, vertex.y);
                                else
                                    path.lineTo(vertex.x, vertex.y);
                            });
                            if (annotation.annotationType !== ANNOTATION_ANGLE)
                                path.closePath();

                            context.strokeStyle = annotation.color || this.defaultColor;

                            //Convert hex color to rgb and add alpha component to fill color.
                            const color = this._hexToRgb(annotation.color || this.defaultColor);
                            context.fillStyle = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ', 0.2)';

                            context.fill(path);
                            context.stroke(path);

                            if (annotation.annotationType === ANNOTATION_RECTANGLE || annotation.annotationType === ANNOTATION_TRANSCRIPTION) {
                                const x = annotation.vertices[0].x + ((annotation.vertices[2].x - annotation.vertices[0].x) / 2);
                                const y = annotation.vertices[0].y - ((annotation.vertices[0].y - annotation.vertices[2].y) / 2) + fontSize / 2;
                                context.textAlign = "center";
                                context.strokeStyle = '#ffffff';
                                context.fillStyle = '#ffffff';
                                context.fillText(annotation.title, x, y);
                            }

                            resolve();
                        }
                            break;
                        // TODO 16.11.2023 20:01 mseslija: implement this
                        // case ANNOTATION_CIRCLE_OF_INTEREST: {
                        //     const color = this._hexToRgb(annotation.color || this.defaultColor);
                        //     context.fillStyle = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ', 0.2)';
                        //     context.beginPath();
                        //     context.arc(annotation.x, annotation.y, annotation.r, 0, 2 * Math.PI);
                        //     context.stroke();
                        //     resolve();
                        // }
                        //     break;
                            // TODO 16.11.2023 21:23 mseslija: implement PLOI
                        default:
                            resolve();
                    }
                });
            });

            Promise.all(drawings).then(_ => {
                canvas.toBlob((blob) => {
                    fileSaver.saveAs(blob, this.options.picture.file_basename);
                }, "image/jpeg", .97);
            });


        };
        image.src = this.options.picture.file;
    },

    _sleepFor: function (sleepDuration) {
        const now = new Date().getTime();
        while (new Date().getTime() < now + sleepDuration) { /* do nothing */
        }
    },

    _hexToRgb: function (hex) {
        if (hex === '-1')
            hex = this.defaultColor;
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
});

L.recolnatPrint = function (options) {
    return new L.Control.RecolnatPrint(options);
};
