import React from 'react';
import {connect} from 'react-redux';
import {
    createAnnotation3dPointOfInterest, editAnnotation,
} from '../actions/app';
import _3DViewer from "../components/3DViewer";

const mapStateToProps = (state, ownProps) => {
    console.log(state, ownProps)
    return {
        annotations: state.app.annotations_3d_points_of_interest,
        focusedAnnotation: state.app.focused_annotation,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        createAnnotation3dPointOfInterest: (pictureId, id, position, normal, camera_position, camera_target) => {
            dispatch(createAnnotation3dPointOfInterest(pictureId, id, position, normal, camera_position, camera_target));
        },
        editAnnotation: (pictureId, annotationType, annotationId, title, text, coverage, annotation) => {
            dispatch(editAnnotation(pictureId, annotationType, annotationId, title, text, coverage, annotation));
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(_3DViewer);
