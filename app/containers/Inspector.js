import {connect} from 'react-redux';
import Component from '../components/Inspector';
import {
    editAnnotation,
    focusAnnotation,
    selectMenu,
    tagAnnotation,
    tagPicture,
    untagAnnotation,
    untagPicture,
    saveAnnotationSort,
    createTargetInstance,
    createAnnotationCategorical,
    deleteAnnotationCategorical, editCartel, unfocusAnnotation
} from '../actions/app';
import {push} from "connected-react-router";
import {withTranslation} from "react-i18next";

const mapStateToProps = (state, ownProps) => {
    let taxonomyInstance;
    if (state.app.selectedTaxonomy) {
        taxonomyInstance = state.app.taxonomyInstance[state.app.selectedTaxonomy.id];
    }

    return {
        allTags: state.app.tags,
        tagsByAnnotation: state.app.tags_by_annotation,
        tab: state.app.open_tabs[ownProps.tabName],
        selectedTaxonomy: state.app.selectedTaxonomy,
        picturesByCalibration: state.app.pictures_by_calibration,
        cartels: state.app.cartel_by_picture,
        taxonomyInstance,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        editAnnotation: (pictureId, annotationType, annotationId, title, text, coverage, annotation) => {
            dispatch(editAnnotation(pictureId, annotationType, annotationId, title, text, coverage, annotation));
        },
        focusAnnotation: (annotationId, annotationType, pictureId, ratioLine1, ratioLine2) => {
            dispatch(focusAnnotation(annotationId, annotationType, pictureId, ratioLine1, ratioLine2));
        },
        unfocusAnnotation: () => {
            dispatch(unfocusAnnotation());
        },
        tagAnnotation: (annotationId, tagName) => {
            dispatch(tagAnnotation(annotationId, tagName));
        },
        untagAnnotation: (annotationId, tagName) => {
            dispatch(untagAnnotation(annotationId, tagName));
        },
        untagPicture: (pictureId, tagName) => {
            dispatch(untagPicture(pictureId, tagName));
        },
        tagPicture: (pictureId, tagName) => {
            dispatch(tagPicture(pictureId, tagName));
        },
        goToTargets: () => {
            dispatch(selectMenu('DATA'));
            dispatch(push('/selection'));
        },
        saveAnnotationSort: (tabName, direction) => {
            dispatch(saveAnnotationSort(tabName, direction));
        },
        createTargetInstance: (ofType, tabName, annotationId, descriptorId, value, oldDescriptorId) => {
            dispatch(createTargetInstance(ofType, tabName, annotationId, descriptorId, value, oldDescriptorId));
        },
        createAnnotationCategorical: (pictureId, id, descriptorName) => {
            dispatch(createAnnotationCategorical(pictureId, id, descriptorName));
        },
        deleteAnnotationCategorical: (pictureId, annotationId) => {
            dispatch(deleteAnnotationCategorical(pictureId, annotationId));
        },
        editCartel: (pictureId, id, value) => {
            dispatch(editCartel(pictureId, id, value));
        },
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
