import i18next from "i18next";
import styled from "styled-components";
import MOZAIC from "./pictures/mozaic_icon.svg";
import LIST from "./pictures/list_icon.svg";
import classnames from "classnames";
import MAP from "./pictures/map-location-dot-solid.svg";
import TIMELINE_WHITE from "./pictures/clock-regular-white.svg"
import React, {Component} from 'react';
import {
    ee,
    EVENT_HIGHLIGHT_ANNOTATION,
    EVENT_HIGHLIGHT_ANNOTATION_ON_LEAFLET,
    EVENT_SELECT_TAB
} from "../utils/library";
import TimelineWidget from "./TimelineWidget";
import moment from "moment";

const _Root = styled.div`
  width: 100%;
  height: 100%;
`;

const _TimelinePlaceholder = styled.div`
    width: 100%;
`;

export default class TimelineView extends Component {

    constructor(props) {
        super(props);
        this.state = {
        }
    }

    componentDidMount() {
        this._doFindItemsWithDating();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.resources !== prevProps.resources) {
            this._doFindItemsWithDating();
        }
    }

    _doFindItemsWithDating = () => {
        let dataItems = [];
        for (const resource of this.props.resources) {
            const annotations = this._mergeAnnotations(this.props, resource.sha1)
            if(annotations) {
                annotations.filter(annotation => {
                    if(annotation.coverage && annotation.coverage.temporal) {
                        if(annotation.coverage.temporal.start) {
                            let startMomentDateTimeSec = moment(annotation.coverage.temporal.start, 'YYYY-MM-DDTHH:mm:ss', false);
                            let startDate = startMomentDateTimeSec.toDate();
                            let endDate = annotation.coverage.temporal.end ? moment(annotation.coverage.temporal.start, 'YYYY-MM-DDTHH:mm:ss', false) : null;
                            const startDateValue = annotation.coverage.temporal.start.replace("T", " ");
                            const endDateValue = annotation.coverage.temporal.end.replace("T", " ");
                            const dataItem = {
                                startDate: startDate,
                                startDateValue: startDateValue,
                                endDate: endDate,
                                endDateValue:endDateValue,
                                period: annotation.coverage.temporal.period,
                                annotation: annotation,
                                resource: resource
                            }
                            dataItems.push(dataItem);
                        }
                    }
                });
            }
        }
        let results = [];
        if(dataItems) {
            let sortedDataItems = dataItems.sort(
                (objA, objB) => Number(objA.startDate) - Number(objB.startDate),
            );
            results = sortedDataItems.map(dataItem => {
                const periodLabel = dataItem.period ? `${dataItem.period} : ` : '';
                const endLabel = dataItem.endDateValue ? ` / ${dataItem.endDateValue}` : '';
                return {
                    title: `${periodLabel}${dataItem.startDateValue}${endLabel}`,
                    cardTitle: `${dataItem.annotation.title}`,
                    cardSubtitle: `${dataItem.resource.file_basename}`,
                    cardDetailedText: `${dataItem.annotation.value ? dataItem.annotation.value : ''}${dataItem.annotation.value_in_mm ? dataItem.annotation.value_in_mm : ''}${dataItem.annotation.value_in_deg ? dataItem.annotation.value_in_deg : ''}`,
                    media: {
                        type: "IMAGE",
                        source: {
                            url: `${dataItem.resource.thumbnail}`
                        }
                    },
                    resource: dataItem.resource.sha1,
                    annotation: dataItem.annotation.id,
                    type: dataItem.annotation.annotationType,
                }
            })
        }
        this.setState({
            items: results
        });
    }

    _mergeAnnotations = (props, resourceId) => {
        return [
            ...(props.annotationsChronothematique && props.annotationsChronothematique[resourceId] || []),
            ...(props.eventAnnotations && props.eventAnnotations[resourceId] || []),
            ...(props.annotationsPointsOfInterest && props.annotationsPointsOfInterest[resourceId] || []),
            ...(props.annotationsMeasuresLinear && props.annotationsMeasuresLinear[resourceId] || []),
            ...(props.annotationsRectangular && props.annotationsRectangular[resourceId] || []),
            ...(props.annotationsPolygon && props.annotationsPolygon[resourceId] || []),
            ...(props.annotationsAngle && props.annotationsAngle[resourceId] || []),
            ...(props.annotationsOccurrence && props.annotationsOccurrence[resourceId] || []),
            ...(props.annotationsColorPicker && props.annotationsColorPicker[resourceId] || []),
            ...(props.annotationsRatio && props.annotationsRatio[resourceId] || []),
            ...(props.annotationsTranscription && props.annotationsTranscription[resourceId] || []),
            ...(props.annotationsCategorical && props.annotationsCategorical[resourceId] || []),
            ...(props.annotationsRichtext && props.annotationsRichtext[resourceId] || [])
        ];
    };

    _onOpenResource = (picId, annotationId, type) => {
        this.props.setPictureInSelection(picId, this.props.tabName);
        setTimeout(() => {
            ee.emit(EVENT_SELECT_TAB, 'image');
        }, 100)
        setTimeout(() => {
            ee.emit(EVENT_HIGHLIGHT_ANNOTATION, annotationId , true);
            ee.emit(EVENT_HIGHLIGHT_ANNOTATION_ON_LEAFLET, annotationId , type);
        }, 100)
    }

    render() {
        const { t } = i18next;
        return (
            <_Root>
                <div className="lib-actions">
                    <div className="switch-view">
                        <div title={t('library.switch_to_mozaic_view_tooltip')} className="mozaic-view"
                             onClick={this.props.openMozaicView}>
                            <img alt="mozaic view" src={MOZAIC}/>
                        </div>
                        <div title={t('library.mozaic_view.switch_to_list_view_tooltip')} className="list-view"
                             onClick={this.props.openListView}>
                            <img alt="list view" src={LIST}/>
                        </div>
                        <div title={t('library.map-view.switch_to_map_view_tooltip')} className="map-view"
                             onClick={this.props.openMapView}>
                            <img alt="map view" src={MAP}/>
                        </div>
                        <div className={classnames("timeline-view", "selected-view")}>
                            <img alt="map view" src={TIMELINE_WHITE}/>
                        </div>
                    </div>
                </div>
                    <_TimelinePlaceholder>
                        <TimelineWidget
                            items={this.state.items}
                            onOpenResource={this._onOpenResource}
                        ></TimelineWidget>
                    </_TimelinePlaceholder>
            </_Root>
        );
    }
}
