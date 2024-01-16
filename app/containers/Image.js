import {connect} from 'react-redux';
import Component from '../components/Image';
import {
    createAnnotationAngle,
    createAnnotationCategorical,
    createAnnotationChronoThematique,
    createAnnotationColorPicker,
    createAnnotationMeasurePolyline,
    createAnnotationOccurrence,
    createAnnotationPointOfInterest,
    createAnnotationPolygon,
    createAnnotationRatio,
    createAnnotationRectangular,
    createAnnotationRichtext,
    createAnnotationTranscription,
    createCartel,
    deleteAnnotationAngle,
    deleteAnnotationChronothematique,
    deleteAnnotationColorPicker,
    deleteAnnotationMeasureLinear,
    deleteAnnotationOccurrence,
    deleteAnnotationPointOfInterest,
    deleteAnnotationPolygon,
    deleteAnnotationRatio,
    deleteAnnotationRectangular,
    deleteAnnotationRichtext,
    deleteAnnotationTranscription,
    deleteCartel, deleteEventAnnotation,
    editAnnotation,
    firstPictureInSelection,
    lastPictureInSelection,
    nextPictureInSelection,
    nextTenPictureInSelection,
    previousPictureInSelection,
    previousTenPictureInSelection,
    saveLeafletSettings,
    updateTaxonomyValues,
    createAnnotationCircleOfInterest, deleteAnnotationCircleOfInterest,
    createAnnotationPolygonOfInterest, deleteAnnotationPolygonOfInterest,
    createImageDetectAnnotationRectangular
} from '../actions/app';
import {withTranslation} from "react-i18next";


const mapStateToProps = (state, ownProps) => {
    let taxonomyInstance = {};
    if (state.app.selectedTaxonomy) {
        taxonomyInstance = state.app.taxonomyInstance[state.app.selectedTaxonomy.id];
    }
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
        annotationsCircleOfInterest: state.app.annotations_circle_of_interest,
        annotationsPolygonOfInterest: state.app.annotations_polygon_of_interest,
        currentPictureIndexInSelection: state.app.open_tabs[ownProps.tabName].current_picture_index_in_selection,
        focusedAnnotation: state.app.focused_annotation,
        pictures: state.app.pictures,
        picturesSelection: state.app.open_tabs[ownProps.tabName].pictures_selection,
        tagsByPicture: state.app.tags_by_picture,
        picturesByCalibration: state.app.pictures_by_calibration,
        leafletPositionByPicture: state.app.leaflet_position_by_picture,
        tabData: state.app.open_tabs[ownProps.tabName],
        selectedTaxonomy: state.app.selectedTaxonomy,
        cartels: state.app.cartel_by_picture,
        repeatMode: state.app.leafletSettings.repeatMode,
        taxonomyInstance,
        projectName: state.app.selectedProjectName,
        selectedImageDetectModel: state.app.selectedImageDetectModel
    };
};

const mapDispatchToProps = dispatch => {
    return {
        createAnnotationChronoThematique: (videoId, startTime, endTime, duration , text ,id) => {
          dispatch(createAnnotationChronoThematique(videoId, startTime, endTime, duration , text ,id));
        },
        createAnnotationMeasurePolyline: (pictureId, value_in_mm, vertices, id, type) => {
            dispatch(createAnnotationMeasurePolyline(pictureId, value_in_mm, vertices, id, type));
        },
        createAnnotationPointOfInterest: (pictureId, x, y, id, video) => {
            dispatch(createAnnotationPointOfInterest(pictureId, x, y, id, video));
        },
        createAnnotationRectangular: (pictureId, vertices, id, video) => {
            dispatch(createAnnotationRectangular(pictureId, vertices, id, video));
        },
        createImageDetectAnnotationRectangular: (pictureId, vertices, id, confidence, name) => {
            dispatch(createImageDetectAnnotationRectangular(pictureId, vertices, id, confidence, name));
        },
        createAnnotationPolygon: (pictureId, vertices, area, id) => {
            dispatch(createAnnotationPolygon(pictureId, vertices, area, id));
        },
        createAnnotationAngle: (pictureId, value_in_deg, vertices, id) => {
            dispatch(createAnnotationAngle(pictureId, value_in_deg, vertices, id));
        },
        createAnnotationOccurrence: (pictureId, vertices, id) => {
            dispatch(createAnnotationOccurrence(pictureId, vertices, id));
        },
        createAnnotationColorPicker: (pictureId, value, x, y, id) => {
            dispatch(createAnnotationColorPicker(pictureId, value, x, y, id));
        },
        createAnnotationRatio: (pictureId, value1, value2, line1, line2, id) => {
            dispatch(createAnnotationRatio(pictureId, value1, value2, line1, line2, id));
        },
        createAnnotationTranscription: (pictureId, vertices, id, video) => {
            dispatch(createAnnotationTranscription(pictureId, vertices, id, video));
        },
        createAnnotationCategorical: (pictureId, vertices, id, video) => {
            dispatch(createAnnotationCategorical(pictureId, vertices, id, video));
        },
        createAnnotationRichtext: (pictureId, vertices, id, richText, video) => {
            dispatch(createAnnotationRichtext(pictureId, vertices, id, richText, video));
        },
        deleteAnnotationMeasureLinear: (pictureId, annotationId, tabName) => {
            dispatch(deleteAnnotationMeasureLinear(pictureId, annotationId));
            dispatch(updateTaxonomyValues(tabName));
        },
        firstPictureInSelection: (tabName) => dispatch(firstPictureInSelection(tabName)),
        lastPictureInSelection: (tabName) => dispatch(lastPictureInSelection(tabName)),
        deleteAnnotationPointOfInterest: (pictureId, annotationId) => {
            dispatch(deleteAnnotationPointOfInterest(pictureId, annotationId));
        },
        deleteAnnotationRectangular: (pictureId, annotationId) => {
            dispatch(deleteAnnotationRectangular(pictureId, annotationId));
        },
        deleteAnnotationChronothematique: (videoId, annotationId) => {
            dispatch(deleteAnnotationChronothematique(videoId, annotationId));
        },
        deleteEventAnnotation: (eventId, annotationId) => {
            dispatch(deleteEventAnnotation(eventId, annotationId));
        },
        deleteAnnotationPolygon: (pictureId, annotationId, tabName) => {
            dispatch(deleteAnnotationPolygon(pictureId, annotationId));
            dispatch(updateTaxonomyValues(tabName));
        },
        deleteAnnotationAngle: (pictureId, annotationId, tabName) => {
            dispatch(deleteAnnotationAngle(pictureId, annotationId));
            dispatch(updateTaxonomyValues(tabName));
        },
        deleteAnnotationOccurrence: (pictureId, annotationId, tabName) => {
            dispatch(deleteAnnotationOccurrence(pictureId, annotationId));
            dispatch(updateTaxonomyValues(tabName));
        },
        deleteAnnotationColorPicker: (pictureId, annotationId) => {
            dispatch(deleteAnnotationColorPicker(pictureId, annotationId));
        },
        deleteAnnotationRatio: (pictureId, annotationId) => {
            dispatch(deleteAnnotationRatio(pictureId, annotationId));
        },
        deleteAnnotationTranscription: (pictureId, annotationId) => {
            dispatch(deleteAnnotationTranscription(pictureId, annotationId));
        },
        deleteAnnotationRichtext: (pictureId, annotationId) => {
            dispatch(deleteAnnotationRichtext(pictureId, annotationId));
        },
        nextPictureInSelection: (tabName) => dispatch(nextPictureInSelection(tabName)),
        nextTenPictureInSelection: (tabName) => dispatch(nextTenPictureInSelection(tabName)),
        previousPictureInSelection: (tabName) => dispatch(previousPictureInSelection(tabName)),
        previousTenPictureInSelection: (tabName) => dispatch(previousTenPictureInSelection(tabName)),
        editAnnotation: (pictureId, annotationType, annotationId, title, text, coverage, annotation) => {
            dispatch(editAnnotation(pictureId, annotationType, annotationId, title, text, coverage, annotation));
        },
        createCartel: (pictureId, id, value) => {
            dispatch(createCartel(pictureId, id, value));
        },
        deleteCartel: (pictureId, id) => {
            dispatch(deleteCartel(pictureId, id));
        },
        saveLeafletSettings: (repeatMode) => {
            dispatch(saveLeafletSettings(repeatMode));
        },
        createAnnotationCircleOfInterest: (pictureId, x, y, r, id) => {
            dispatch(createAnnotationCircleOfInterest(pictureId, x, y, r, id));
        },
        deleteAnnotationCircleOfInterest: (pictureId, annotationId) => {
            dispatch(deleteAnnotationCircleOfInterest(pictureId, annotationId));
        },
        createAnnotationPolygonOfInterest: (pictureId, vertices, id) => {
            dispatch(createAnnotationPolygonOfInterest(pictureId, vertices, id));
        },
        deleteAnnotationPolygonOfInterest: (pictureId, annotationId) => {
            dispatch(deleteAnnotationPolygonOfInterest(pictureId, annotationId));
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
