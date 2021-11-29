import React from 'react';
import {connect} from 'react-redux';
import Component from '../components/VideoPlayer';
import {createAnnotationChronoThematique , editAnnotationChronothematiqueEndtime} from '../actions/app';

const mapStateToProps = state => {
    return {
        annotationsChronothematique: state.app.annotations_chronothematique,
        focusedAnnotation: state.app.focused_annotation,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        createAnnotationChronoThematique: (pictureId, startTime, endTime, duration , text ,id) => {
            dispatch(createAnnotationChronoThematique(pictureId, startTime, endTime, duration , text ,id));
        },
        editAnnotationChronothematiqueEndtime: (pictureId, annotationId, endTime) => {
            dispatch(editAnnotationChronothematiqueEndtime(pictureId, annotationId , endTime));
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps, null, {pure: false})(Component);
