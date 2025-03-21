import React from 'react';
import {connect} from 'react-redux';
import {
    saveAnnotationEndTime
} from '../actions/app';
import _3DViewer from "../components/3DViewer";

const mapStateToProps = state => {
    return {
        focusedAnnotation: state.app.focused_annotation,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        saveAnnotationEndTime: (annType, annId, endTime, pictureId) => {
            dispatch(saveAnnotationEndTime(annType, annId, endTime, pictureId));
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(_3DViewer);
