import React, {Component} from 'react';
import i18next from "i18next";
import styled from "styled-components";
import moment from "moment";
import {Chrono} from "react-chrono";

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

import {
    ANNOTATION_ANGLE,
    ANNOTATION_CATEGORICAL, ANNOTATION_COLORPICKER, ANNOTATION_MARKER, ANNOTATION_OCCURRENCE,
    ANNOTATION_POLYGON,
    ANNOTATION_POLYLINE, ANNOTATION_RECTANGLE,
    ANNOTATION_RICHTEXT,
    ANNOTATION_SIMPLELINE, ANNOTATION_TRANSCRIPTION
} from "../constants/constants";
import {Button} from "reactstrap";

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

    render() {
        const {t} = i18next;
        return (
            <div className="timeline-widget">
                {this.props.items &&
                    <Chrono
                        items={this.props.items} mode="VERTICAL_ALTERNATING" scrollable allowDynamicUpdate enableOutline
                        cardWidth="350"
                        min
                        onItemSelected={e => {
                            console.log("selected", e)
                        }}
                    >
                        <div className="chrono-icons">
                            {this.props.items.map((item, index) => {
                                return <img key={index} src={this._getIconForAnnotationType(item.type)} alt="image1"/>
                            })}
                        </div>
                        {this.props.items.map((item, index) => {
                            return <Button color="link"  key={index} href={"#"} className="action" onClick={ e => {
                                console.log("open", item)
                                if(this.props.onOpenResource) {
                                    this.props.onOpenResource(item.resource, item.annotation, item.type);
                                }
                            }}>{t('library.map-view.popup_open_in_annotation_editor')}</Button>
                        })}
                    </Chrono>
                }
            </div>
        );
    }

}
