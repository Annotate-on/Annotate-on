import React from 'react';
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import {
    setPictureInSelection,
} from "../actions/app";
import TimelineView from "../components/TimelineView";

const mapStateToProps = state => {
    return {
        annotationsEventAnnotations: state.app.annotations_eventAnnotations,
        annotationsChronothematique: state.app.annotations_chronothematique,
        annotationsMeasuresLinear: state.app.annotations_measures_linear,
        annotationsRectangular: state.app.annotations_rectangular,
        annotationsPointsOfInterest: state.app.annotations_points_of_interest,
        annotationsPolygon: state.app.annotations_polygon,
        annotationsAngle: state.app.annotations_angle,
        annotationsOccurrence: state.app.annotations_occurrence,
        annotationsColorPicker: state.app.annotations_color_picker,
        annotationsRatio: state.app.annotations_ratio,
        annotationsTranscription: state.app.annotations_transcription,
        annotationsCategorical: state.app.annotations_categorical,
        annotationsRichtext: state.app.annotations_richtext,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        setPictureInSelection: (pictureId, tabName) => {
            dispatch(setPictureInSelection(pictureId, tabName));
        },
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(TimelineView));
