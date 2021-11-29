import React, {Component} from 'react';
import {RESOURCE_TYPE_EVENT} from "../../constants/constants";
import EventTimeline from "./EventTimeline";
import EventAndTagManager from "./EventAndTagManager";

class EventController extends Component {

    constructor(props) {
        super(props);
        this.state = {
            originalZoom: 1,
            originalPlaybackRate: 1,
            event: props.currentPicture,
        };
        this.eventTimeline = React.createRef();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.currentPicture.file !== prevProps.currentPicture.file) {
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.focusedAnnotation && this.eventTimeline.current) {
            this.eventTimeline.current.focusAnnotation(nextProps.focusedAnnotation);
        }
    }

    _editEvent = (eventId , annotateEvent) => {
        this.props.editEvent(eventId , annotateEvent);
    }

    _editEventAnnotationEndtime = (eventId, annotationId, endTime) => {
        this.props.editEventAnnotationEndtime(eventId, annotationId, endTime)
    }

    _extendEventDuration = (eventId , duration) => {
        this.props.extendEventDuration(eventId , duration);
    }

    _finishCorruptedEvent = (eventId , event) => {
        this.props.finishCorruptedEvent(eventId , event);
    }


    render() {
        return (
            <div id="rcn_event" className="bst rcn_video">
                <EventAndTagManager
                    editEvent={this._editEvent}
                    event={this.props.currentPicture}/>
                <div>
                    {
                    this.state.event.resourceType === RESOURCE_TYPE_EVENT ?
                        <EventTimeline
                            goToLibrary={this.props.goToLibrary}
                            finishCorruptedEvent = {this._finishCorruptedEvent}
                            editEvent = {this._editEvent}
                            saveEventAfterRecord={this.props.saveEventAfterRecord}
                            extendEventDuration={this._extendEventDuration}
                            ref={this.eventTimeline}
                            zoom={this.state.originalZoom}
                            playbackRate={this.state.originalPlaybackRate}
                            eventAnnotations={this.props.eventAnnotations}
                            editedAnnotation={this.props.editedAnnotation}
                            createEventAnnotation={this.props.createEventAnnotation}
                            editEventAnnotationEndtime={this._editEventAnnotationEndtime}
                            eventId={this.props.currentPicture.sha1}
                            event={this.props.currentPicture}
                            isEditing={this.props.isEditing}
                            isEditModeOpen={this.props.isEditing}
                            openEditPanelonAnnotationCreate={this.props.openEditPanelonAnnotationCreate}
                        /> :  null
                    }
                </div>
            </div>
        );
    }
}

export default EventController;