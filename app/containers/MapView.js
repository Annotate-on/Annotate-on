import React from 'react';
import {connect} from 'react-redux';
import {push} from "connected-react-router";
import {ee, EVENT_SELECT_TAB} from "../utils/library";
import {withTranslation} from "react-i18next";
import MapView from "../components/MapView";
import {
    addSubCategory,
    createCategory,
    createTag,
    openInNewTab,
    setPictureInSelection,
    tagPicture
} from "../actions/app";

const mapStateToProps = state => {
    return {
        openTabs : state.app.open_tabs,
        tags: state.app.tags,
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
        annotationsCircleOfInterest: state.app.annotations_circle_of_interest,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        },
        setPictureInSelection: (pictureId, tabName) => {
            dispatch(setPictureInSelection(pictureId, tabName));
        },
        createCategory: (category) => {
            dispatch(createCategory(category));
        },
        addSubCategory: (parentName , item , isCategory , parentId) => {
            dispatch(addSubCategory(parentName , item , isCategory , parentId));
        },
        openInNewTab: (tag) => {
            dispatch(openInNewTab(tag));
        },
        tagPicture: (pictureId, tagName) => {
            dispatch(tagPicture(pictureId, tagName));
        },
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(MapView));
