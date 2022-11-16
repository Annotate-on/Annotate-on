import React, {Component} from 'react';
import i18next from "i18next";
import styled from "styled-components";
import moment from "moment";


import {Chrono} from "react-chrono";
let fileSaver = require('file-saver');

import MOZAIC from "./pictures/mozaic_icon.svg";
import SIMPLE_LINE from "./pictures/simple-line.svg";
import POLYLINE from "./pictures/polyline.svg";
import POLYGON from "./pictures/polygon.svg";
import CATEGORICAL from "./pictures/categorical.svg";
import RICHTEXT from "./pictures/richtext.svg";
import OCCURRENCE from "./pictures/occurrence.svg";
import TRANSCRIPTION from "./pictures/transcription.svg";
import ANGLE from "./pictures/angle.svg";
import POI from "./pictures/poi.svg";
import RECTANGLE from "./pictures/rectangle.svg";
import COLOR_PICKER from "./pictures/color_picker.svg";
import SVGtoPDF from "svg-to-pdfkit/source";

import {
    ANNOTATION_ANGLE,
    ANNOTATION_CATEGORICAL, ANNOTATION_COLORPICKER, ANNOTATION_MARKER, ANNOTATION_OCCURRENCE,
    ANNOTATION_POLYGON,
    ANNOTATION_POLYLINE, ANNOTATION_RECTANGLE,
    ANNOTATION_RICHTEXT,
    ANNOTATION_SIMPLELINE, ANNOTATION_TRANSCRIPTION
} from "../constants/constants";
import {Button} from "reactstrap";
const PDFDocument = require('pdfkit');
const blobStream = require('blob-stream');

export default class TimelineWidget extends Component {

    constructor(props, context) {
        super(props, context);
        this.state = {}
    }

    _getIconForAnnotationType(type) {
        if (type === ANNOTATION_SIMPLELINE) return SIMPLE_LINE;
        if (type === ANNOTATION_POLYLINE) return POLYLINE;
        if (type === ANNOTATION_POLYGON) return POLYGON;
        if (type === ANNOTATION_RECTANGLE) return RECTANGLE;
        if (type === ANNOTATION_RICHTEXT) return RICHTEXT;
        if (type === ANNOTATION_CATEGORICAL) return CATEGORICAL;
        if (type === ANNOTATION_OCCURRENCE) return OCCURRENCE;
        if (type === ANNOTATION_TRANSCRIPTION) return TRANSCRIPTION;
        if (type === ANNOTATION_ANGLE) return ANGLE;
        if (type === ANNOTATION_MARKER) return POI;
        if (type === ANNOTATION_COLORPICKER) return COLOR_PICKER;
        return MOZAIC
    }

    _doExportPdf = (annotation) => {

        if(!this.props.items) return;
        const doc = new PDFDocument({font: 'Helvetica',  autoFirstPage: false});
        const cardPerPage = 5;
        const cardHeight = 160;
        for (let i = 0; i < this.props.items.length; i++) {
            let item = this.props.items[i];
            let indexInPage = i % cardPerPage;
            if(indexInPage == 0) {
                doc.addPage({
                    margins: {
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0
                    }
                })
                doc.lineWidth(2);
                doc.lineCap('butt')
                    .strokeColor('#0f52ba')
                    .moveTo(200, 10)
                    .lineTo(200, 785)
                    .stroke();
            }
            doc.fontSize(8);
            doc.text(item.title, 20, indexInPage * cardHeight + cardHeight/2 - 4, {width:165, align: 'right'})
            doc.circle(200, indexInPage * cardHeight + cardHeight/2, 10).fill('#FFFFFF');

            let icon = this._getIconForAnnotationType(item.type)
            const data = icon.split(',');
            const decoded = window.atob(data[1]);
            SVGtoPDF(doc, decoded, 194, indexInPage * cardHeight + cardHeight/2 - 7, {height: 25});

            // doc.lineWidth(1);
            // doc.rect(220, i * cardHeight, 300, (indexInPage+1) * cardHeight).strokeColor('#eeeeee').stroke();

            doc.fill('#000000');
            doc.image(item.media.source.url, 240, indexInPage * cardHeight + 10, {height: 100})
            doc.text(item.cardSubtitle, 240, indexInPage * cardHeight + 115)
            doc.text(item.cardTitle, 240, indexInPage * cardHeight + 125)
            doc.text(item.cardDetailedText, 240, indexInPage * cardHeight + 135)
        }
        doc.end();
        const stream = doc.pipe(blobStream());
        stream.on('finish', function() {
            const blob = this.toBlob();
            fileSaver.saveAs(blob, 'timeline.pdf');
        });
    }

    render() {
        const {t} = i18next;
        return (

            <div className="timeline-widget">
                <div className="leaflet-bar leaflet-recolnat-print leaflet-control" title={t('library.timeline-view.btn_tooltip.export_timeline_in_pdf_format')}>
                    <Button color="link" href={"#"} className="recolnat-print"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                this._doExportPdf()
                            }}>
                    </Button>
                </div>

                {this.props.items &&
                            <Chrono
                                items={this.props.items} mode="VERTICAL_ALTERNATING" scrollable allowDynamicUpdate
                                enableOutline
                                cardWidth="350"
                                onItemSelected={e => {
                                    // console.log("selected", e)
                                }}
                            >
                                <div className="chrono-icons">
                                    {this.props.items.map((item, index) => {
                                        return <img key={index} src={this._getIconForAnnotationType(item.type)}
                                                    alt="image1"/>
                                    })}
                                </div>
                                {this.props.items.map((item, index) => {
                                    return <div className="card-details-container" key={index}>
                                        <p>{item.cardDetailedText}</p>
                                        <i className="fa fa-external-link pointer" aria-hidden="true" title={t('library.map-view.popup_open_in_annotation_editor')}
                                           onClick={() => {
                                               if (this.props.onOpenResource) {
                                                   this.props.onOpenResource(item.resource, item.annotation, item.type);
                                               }
                                           }}
                                        />
                                    </div>

                                })}
                            </Chrono>
                }
            </div>
        );
    }

}
