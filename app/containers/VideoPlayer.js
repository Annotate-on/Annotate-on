import React from 'react';
import {connect} from 'react-redux';
import Component from '../components/VideoPlayer';
import {
    createAnnotationChronoThematique,
    editAnnotationChronothematiqueEndtime,
    saveAnnotationEndTime
} from '../actions/app';

const mapStateToProps = state => {
    return {
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
        },
        saveAnnotationEndTime: (annType, annId, endTime, pictureId) => {
            dispatch(saveAnnotationEndTime(annType, annId, endTime, pictureId));
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps, null, {pure: false})(Component);
