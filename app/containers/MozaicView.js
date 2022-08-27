import {connect} from 'react-redux';
import Component from '../components/MozaicView';
import {
    deleteAnnotateEvent,
    deletePicture,
    lockSelection, selectFolderGlobally,
    setPictureInSelection,
    tagPicture,
    untagPicture,
    updateMozaicToggle
} from '../actions/app';
import {push} from "connected-react-router";
import {withTranslation} from "react-i18next";

const mapStateToProps = (state, ownProps) => {
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
        tags: state.app.tags,
        manualOrderLock: state.app.open_tabs[ownProps.tabName].manualOrderLock,
        cartels: state.app.cartel_by_picture
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        untagPicture: (pictureId, tagName) => {
            dispatch(untagPicture(pictureId, tagName));
        },
        tagPicture: (pictureId, tagName) => {
            dispatch(tagPicture(pictureId, tagName));
        },
        setPictureInSelection: (pictureId, tabName) => {
            dispatch(setPictureInSelection(pictureId, tabName));
        },
        goToImage: () => {
            dispatch(push('/image'));
        },
        lockSelection: (enabled, tabName, order) => {
            return new Promise(resolve => {
                dispatch(lockSelection(enabled, tabName, order));
                resolve();
            });
        },
        goToCollectionExport: (tabName) => {
            dispatch(push(`/collection-export/${tabName}`));
        },
        updateToggle: (tabName, showCollection, showDetails) => {
            dispatch(updateMozaicToggle(tabName, showCollection, showDetails));
        },
        deletePicture: (sha1) => {
            dispatch(deletePicture(sha1));
        },
        deleteAnnotateEvent: (sha1) => {
            dispatch(deleteAnnotateEvent(sha1));
        },
        selectFolderGlobally: (path) => {
            dispatch(selectFolderGlobally(path));
        },
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
