import L from "leaflet";
import lodash from 'lodash';
import JSZip from 'jszip';
import XLSX from 'xlsx';
import {formatDateForFileName} from "../utils/js";
import fs from 'fs';
import i18next from "i18next";

let fileSaver = require('file-saver');

const COLUMNS = [
    'ZOI Name',
    'Value'
];

L.Control.RecolnatZOIExport = L.Control.extend({
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
        const { t } = i18next;
        let container = L.DomUtil.create('div', 'leaflet-bar leaflet-recolnat-zoi-export');
        L.DomEvent.disableClickPropagation(container);
        this._link = L.DomUtil.create('a', 'recolnat-zoi-export', container);
        this._link.href = '#';
        this._link.title = t('annotate.editor.btn_tooltip_export_zoi_images');

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
        // let context = canvas.getContext('2d');
        let image = new Image();
        image.onload = () => {
            //Draw basic image

            const annotations = [...lodash.flattenDepth(Object.values(this.options.annotationsRectangular || []), 2)];

            // Zip all cropped areas
            let zip = new JSZip();
            let img = zip.folder("images");
            const csvData = [];

            Promise.all(annotations.map(annotation => {
                return new Promise(resolve => {
                    const value = '(X1:' + annotation.vertices[0].x.toFixed(0) + ' ,Y1:' + annotation.vertices[0].y.toFixed(0)
                        + '), (X2:' + annotation.vertices[1].x.toFixed(0) + ', Y2:' + annotation.vertices[1].y.toFixed(0)
                        + '), (X3:' + annotation.vertices[2].x.toFixed(0) + ', Y3:' + annotation.vertices[2].y.toFixed(0)
                        + '), (X4:' + annotation.vertices[3].x.toFixed(0) + ' ,Y4:' + annotation.vertices[3].y.toFixed(0) + ')';

                    csvData.push([annotation.title, value]);

                    this._cropImageAndSave(annotation, image).then(arrayBuffer => {
                        img.file(annotation.title + ".png", arrayBuffer);
                        resolve();
                    });
                });
            })).then(_ => {
                if (csvData.length > 0) {
                    const worksheet = XLSX.utils.aoa_to_sheet([COLUMNS, ...csvData]);
                    const stream = XLSX.stream.to_csv(worksheet);
                    let csvName = this.options.picture.file_basename;
                    const dotIndex = csvName.lastIndexOf('.');
                    if (dotIndex !== -1) {
                        csvName = csvName.substring(0, dotIndex);
                    }
                    zip.file(csvName + '.csv', stream);

                    zip.generateAsync({type: "blob"}).then(blob => {
                        const zipName = formatDateForFileName(new Date()) + '.zip';
                        fileSaver.saveAs(blob, zipName);
                    });
                }
            });
        };
        image.src = this.options.picture.file;
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
    },

    _cropImageAndSave: function (annotation, image) {
        const h = annotation.vertices[0].y - annotation.vertices[1].y;
        const w = annotation.vertices[2].x - annotation.vertices[1].x;

        let canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        let context = canvas.getContext('2d');
        context.drawImage(image, annotation.vertices[1].x, annotation.vertices[1].y, w, h, 0, 0, w, h);

        return new Promise((resolve, reject) => {
            try {
                canvas.toBlob((blob) => {
                    let reader = new FileReader();
                    reader.onload = () => {
                        resolve(new Buffer(reader.result));
                    };
                    reader.readAsArrayBuffer(blob);
                }, "image/png", .8);
            } catch (e) {
                reject();
            }
        });
    },

    _saveBlobToFile: function (blob, destination) {
        let reader = new FileReader();
        reader.onload = () => {
            fs.writeFile(destination, new Buffer(reader.result), (_) => {
                console.log("File " + destination + " is created.")
            });
        };
        reader.readAsArrayBuffer(blob);
    }
});

L.recolnatZOIExport = function (options) {
    return new L.Control.RecolnatZOIExport(options);
};
