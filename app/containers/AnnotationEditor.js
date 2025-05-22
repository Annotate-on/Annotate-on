import {connect} from 'react-redux';
import Component from '../components/AnnotationEditor';
import {
    createTargetInstance,
    tagAnnotation,
    tagEventAnnotation,
    untagAnnotation,
    untagEventAnnotation,
    saveRelationsAnnotations
} from '../actions/app';
import {withTranslation} from "react-i18next";

const mapStateToProps = (state, ownProps) => {
    let taxonomyInstance = null;
    if (state.app.selectedTaxonomy) {
        taxonomyInstance = state.app.taxonomyInstance[state.app.selectedTaxonomy.id];
    }
    return {
        allTags: state.app.tags,
        currentResource: state.app.pictures[ownProps.sha1],
        tags: state.app.tags_by_annotation[ownProps.annotation.id],
        selectedTaxonomy: state.app.selectedTaxonomy,
        taxonomyInstance,
        relationsByAnnotations: state.app.relationsByAnnotations
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        tagAnnotation: tagName => dispatch(tagAnnotation(ownProps.annotation.id, tagName)),
        untagAnnotation: tagName => dispatch(untagAnnotation(ownProps.annotation.id, tagName)),
        createTargetInstance: (ofType, tabName, annotationId, descriptorId, value, oldDescriptorId) => {
            dispatch(createTargetInstance(ofType, tabName, annotationId, descriptorId, value, oldDescriptorId));
        },
        tagEventAnnotation: (tagName , inputGroup ) => dispatch(tagEventAnnotation(ownProps.annotation.id , tagName , inputGroup , ownProps.sha1)),
        untagEventAnnotation: (tagName , inputGroup) => dispatch(untagEventAnnotation(ownProps.annotation.id , tagName , inputGroup , ownProps.sha1)),
        saveRelationsAnnotations: (relationAnnotations, annotationId, annotationName, taxonomyId) => {
            dispatch(saveRelationsAnnotations(relationAnnotations, annotationId, annotationName, taxonomyId));
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
