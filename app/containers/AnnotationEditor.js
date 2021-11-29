import {connect} from 'react-redux';
import Component from '../components/AnnotationEditor';
import {
    createTargetInstance,
    tagAnnotation,
    tagEventAnnotation,
    untagAnnotation,
    untagEventAnnotation
} from '../actions/app';

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
        taxonomyInstance
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
        untagEventAnnotation: (tagName , inputGroup) => dispatch(untagEventAnnotation(ownProps.annotation.id , tagName , inputGroup , ownProps.sha1))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Component);
