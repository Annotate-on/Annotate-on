import React from 'react';
import {connect} from 'react-redux';
import Component from '../components/event/EventController';
import {
    createEventAnnotation,
    editEvent, editEventAnnotationEndtime,
    extendEventDuration, finishCorruptedEvent,
    saveEventAfterRecord
} from "../actions/app";
import {push} from "connected-react-router";
import {ee, EVENT_SELECT_TAB} from "../utils/library";

const mapStateToProps = (state , ownProps) => {
    return {
        focusedAnnotation: state.app.focused_annotation,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        finishCorruptedEvent: (eventId) => {
          dispatch(finishCorruptedEvent(eventId))
        },
        editEvent: (eventId , name) => {
            dispatch(editEvent(eventId , name));
        },
        saveEventAfterRecord: (event) => {
            dispatch(saveEventAfterRecord(event));
        },
        extendEventDuration: (eventId , duration) => {
            dispatch(extendEventDuration(eventId , duration));
        },
        createEventAnnotation: (eventId, startTime, endTime, duration , text , id) => {
            dispatch(createEventAnnotation(eventId, startTime, endTime, duration , text ,id));
        },
        editEventAnnotationEndtime: (eventId, annotationId, endTime) => {
            dispatch(editEventAnnotationEndtime(eventId, annotationId , endTime));
        },
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Component);
