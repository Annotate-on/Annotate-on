import React, {Component} from 'react';
import EventPlayerControls from "./EventPlayerControls";
import {
    ee,
    EVENT_FORCE_UPDATE_EDIT_MODE,
    EVENT_GET_EVENT_TIMELINE_CURRENT_TIME,
    EVENT_GOTO_ANNOTATION,
    EVENT_HIGHLIGHT_ANNOTATION,
    EVENT_SAVE_EVENT_ANNOTATION_FROM_EDIT_PANEL,
    EVENT_SET_ANNOTATION_POSITION,
    EVENT_UNFOCUS_ANNOTATION,
    EVENT_UPDATE_EVENT_IN_EVENT_FORM,
    EVENT_UPDATE_EVENT_RECORDING_STATUS,
    EVENT_UPDATE_RECORDING_STATUS_IN_NAVIGATION,
    NOTIFY_CURRENT_TIME,
    REFRESH_EVENT_TIMELINE_STATE
} from "../../utils/library";
import classnames from "classnames";
import {_formatTimeDisplay} from "../../utils/maths";
import {EVENT_STATUS_FINISHED, EVENT_STATUS_RECORDING} from "./Constants";
import {Button, Modal, ModalBody, ModalFooter, ModalHeader} from "reactstrap";
import {_formatEventTimeDisplay, mergeAllEventAnnotationTags} from "./utils";
import i18next from "i18next";

let containerWidth = 0;

class EventTimeline extends Component {
    constructor(props) {
        super(props);
        this.mouseDown = false;
        this.elapsedTime = React.createRef();
        this.scrubber = React.createRef();
        this.state = {
            startTime: null,
            endTime: null,
            eventStartTime: 0,
            duration: this.props.event.duration,
            currentTime: 0,
            event: this.props.event,
            timeInterval: 0.5,
            tickDelay: 500,
            eventAnnotations: this.props.eventAnnotations,
            zoom: 1,
            isValidToRecord: true,
            isAnnotationRecording: false,
            focusedAnnotation: '',
            isEventRecording: false,
            newAnnotationId: null,
            syncTimeStart: this.props.event.syncTimeStart || null,
            syncTimeEnd: this.props.event.syncTimeEnd || null,
            startDate: this.props.event.startDate || null,
            refreshState: false,
            showTimeExtensionAlert: false,
            isShowTimeExtensionAlertAlreadyShown: false,
            playbackSpeed: 1,
        }
    }

    _goToEventAnnotation = (annotation, position) => {
        if (position === "start" || position === "") {
            this.setState({
                currentTime: annotation.start
            })
        }
        if (position === "end") {
            this.setState({
                currentTime: annotation.end
            })
        }
    }

    _isValidAtStart = () => {
        let valid = true;
        for (let annotation of this.props.eventAnnotations || []) {
            if (annotation.start === 0) {
                valid = false;
                break;
            }
        }
        return valid;
    }

    _isValid = () => {
        let valid = true;
        for (let ann of this.props.eventAnnotations || []) {
            // console.log(`Current time : ${(this.props.player.currentTime()+.5)}`)
            if (this.state.currentTime >= ann.start -.1 && this.state.currentTime <= ann.end +.1) {
                valid = false;
                break;
            }
        }
        return valid;
    }

    componentDidMount() {
        //check for corrupted events
        if (this.state.event.status === EVENT_STATUS_RECORDING && (this.state.syncTimeEnd === null || this.state.syncTimeStart ===  null)){
            this.props.finishCorruptedEvent(this.state.event.sha1 , this.state.event)
        }

        this.forceUpdate();
        ee.on(REFRESH_EVENT_TIMELINE_STATE , this._refreshState)
        ee.on(EVENT_GOTO_ANNOTATION, this._goToEventAnnotation);
        ee.on(EVENT_GET_EVENT_TIMELINE_CURRENT_TIME, this.notifyCurrentTime);

        if (this.state.currentTime === 0){
            this.setState({
                isValidToRecord: this._isValidAtStart(),
            })
        }
    }

    componentWillUnmount() {
        clearInterval(this.interval);
        ee.removeListener(EVENT_GOTO_ANNOTATION, this._goToEventAnnotation);
        ee.removeListener(REFRESH_EVENT_TIMELINE_STATE , this._refreshState)
        ee.removeListener(EVENT_GET_EVENT_TIMELINE_CURRENT_TIME , this.notifyCurrentTime)
        ee.emit(EVENT_FORCE_UPDATE_EDIT_MODE)
    }

    notifyCurrentTime = () => {
        ee.emit(NOTIFY_CURRENT_TIME , this.state.currentTime);
    }

    _refreshState = () => {
        this.setState({
            duration: this.props.event.duration,
            syncTimeStart: this.props.event.syncTimeStart,
            syncTimeEnd: this.props.event.syncTimeEnd
        })
    }

    componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot: SS) {

        if (this.props.event && this.props.event.status !== EVENT_STATUS_FINISHED && this.state.currentTime > this.state.duration * 0.9  && this.props.event.eventTimeExtension > 0){
                this.setState({
                    duration: this.state.duration + this.props.event.eventTimeExtension,
                    syncTimeEnd: this.state.syncTimeEnd + this.props.event.eventTimeExtension,

                })
            this.extendEventWithoutModalWarning(this.props.event.eventTimeExtension);
        }

        if(this.props.event.status !== EVENT_STATUS_FINISHED && this.props.event.eventTimeExtension === 0 && this.state.currentTime > this.state.duration * 0.9 && !this.state.isShowTimeExtensionAlertAlreadyShown){
            this.setState({
                showTimeExtensionAlert: true,
                isShowTimeExtensionAlertAlreadyShown: true,
            })
        }

        if (!this.state.isAnnotateEventRecording && prevState.currentTime !== this.state.currentTime){
            this.setState({
                isValidToRecord: this._isValid()
            })
        }

        //on annotation record start
        if (prevState.isAnnotationRecording === false && this.state.isAnnotationRecording === true){
            const annId =  chance.guid();
            this._createEventAnnotationOnRecordStart(this.props.eventId, this.state.startTime, '' , '', '', annId);
        }

        if (this.state.isAnnotationRecording === true && this.state.currentTime >= this.state.duration){
            if (this.props.event.status === EVENT_STATUS_FINISHED){
                this.setTime(this.state.duration);
                this.pause();
            }else{
                this._updateEditedAnnotationEndtime(this.props.eventId , this.state.newAnnotationId , this.state.duration - 0.5);
                setTimeout(()=> {
                    this.saveEvent();
                } , 100);
            }
        }

        //detect colision with existing annotation and stop record in edit mode for finished events
        if (this.props.event.status === EVENT_STATUS_FINISHED && this.state.isAnnotationRecording === true && this.state.isValidToRecord === false) {
            const endTime = this._findNearestEndTime();
            this.setTime(endTime);
            this._updateEditedAnnotationEndtime(this.props.eventId , this.state.newAnnotationId , endTime);
            this.pause();
        }

        //stop annotation creation manually
        if (prevState.isAnnotationRecording !== this.state.isAnnotationRecording && this.state.isAnnotationRecording === false && this.state.isValidToRecord === true && this.state.newAnnotationId !== null) {
            if (this.props.event.status === EVENT_STATUS_FINISHED){
                this.pause();
            }
            const endTime = this.props.event.status === EVENT_STATUS_FINISHED ? this._validateCurrentEndTime(this.state.endTime) : this.state.currentTime
            if (endTime !== 0 && this.state.newAnnotationId){
            this._updateEditedAnnotationEndtime(this.props.eventId , this.state.newAnnotationId , endTime);
            }
            if (this.props.isEditModeOpen){
                this.setCurrentTime(endTime + 0.11);
            }
        }

        if (this.state.event && this.state.event.status !== EVENT_STATUS_FINISHED && this.state.event.status !== EVENT_STATUS_RECORDING && this.state.event.autoStart && !this.state.isEventRecording){
            this.startEventRecording();
        }

    }

    componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any) {
        if (nextProps.event && nextProps.event.status === EVENT_STATUS_FINISHED && this.state.syncTimeStart !== nextProps.event.syncTimeStart){
            this.setState({
                duration: nextProps.event.duration,
                syncTimeEnd: nextProps.event.syncTimeEnd,
                syncTimeStart: nextProps.event.syncTimeStart
            })
        }

        if (this.state.duration !== nextProps.event.duration){
            this.setState({
                duration: nextProps.event.duration,
                syncTimeEnd: nextProps.event.syncTimeEnd !== null ? nextProps.event.syncTimeEnd : this.state.syncTimeEnd,
                syncTimeStart: nextProps.event.syncTimeStart !== null ? nextProps.event.syncTimeStart : this.state.syncTimeStart
            })
        }
    }

    _validateCurrentEndTime = (endTime) => {
        if (this.props.editedAnnotation && this.props.editedAnnotation.start !== undefined){
            for (let eventAnnotation of this.props.eventAnnotations.filter(ann => ann.start > this.props.editedAnnotation.start) || []){
                if (endTime > eventAnnotation.start){
                    endTime = eventAnnotation.start - 0.2;
                    return endTime;
                }
            }
            return endTime;
        }else{
            return  false;
        }
    }

    _isValidPositionOnRecordStart = ( start ) => {
        let valid = true;
        for (let videoAnnotation of this.props.eventAnnotations || []) {
            if (start >= videoAnnotation.start && start <= videoAnnotation.end) {
                valid = false;
                break;
            }
        }
        return valid;
    }

    _findNearestEndTime = () => {
        let endTime = 0;
        for (let videoAnnotation of this.props.eventAnnotations) {
            if (this.state.startTime < videoAnnotation.start) {
                endTime = videoAnnotation.start - 0.15
                return endTime;
            }
        }
    }

    _createAnn = (resourceId, start, end, duration, text , annId) => {
        this.props.createEventAnnotation(resourceId, start, end, duration, text, annId);
        ee.emit(EVENT_UPDATE_RECORDING_STATUS_IN_NAVIGATION);
        ee.emit(EVENT_UNFOCUS_ANNOTATION)
        setTimeout( () => {
            this.props.openEditPanelonAnnotationCreate(resourceId, annId);
        } , 50);
        this.setState({
            focusedAnnotation: null,
            newAnnotationId: annId
        })
    }

    _createEventAnnotationOnRecordStart = (resourceId, start, end, duration, text , annId) => {
        console.log('_createEventAnnotationOnRecordStart')
        if (this.props.event.status === EVENT_STATUS_FINISHED && this._isValidPositionOnRecordStart(start , this.props.eventAnnotations)) {
            this._createAnn(resourceId, start, end, duration, text , annId);
        }else if (this.props.event.status !== EVENT_STATUS_FINISHED){
            this._createAnn(resourceId, start, end, duration, text , annId);
        }else {
            alert('something went wrong {_createEventAnnotationOnRecordStart}')
            return false;
        }
    }

    _updateEditedAnnotationEndtime(eventId , annId , endTime) {
        if (this.state.startTime > endTime || endTime === undefined || endTime === false || endTime === '') {
            endTime = this.state.startTime + this.state.startTime * 0.025
        }

        this.props.editEventAnnotationEndtime(eventId, annId, endTime);
        ee.emit(EVENT_SAVE_EVENT_ANNOTATION_FROM_EDIT_PANEL);
        ee.emit(EVENT_UPDATE_RECORDING_STATUS_IN_NAVIGATION);

        this.setState({
            isAnnotationRecording: false,
            newAnnotationId: null,
            endTime: null,
            startTime: null
        })
    }

    startEventRecording = () => {
        const duration = this.props.event.duration;
        const startDate = new Date();
        const syncStart = startDate.getHours() * 3600 + startDate.getMinutes() * 60 + startDate.getSeconds();
        //flag that event has started to record
        const event = this.props.event;
        event.status = EVENT_STATUS_RECORDING;
        event.startDate = startDate;
        event.syncTimeStart = syncStart;

        this.props.editEvent(event.sha1 , event);

        this.interval = setInterval(this.tick , this.state.tickDelay);
        ee.emit(EVENT_UPDATE_EVENT_RECORDING_STATUS , true);
        this.setState({
            isEventRecording: true,
            syncTimeStart: syncStart,
            syncTimeEnd: syncStart + duration,
            startDate: startDate,
        })
    }

    saveEvent = () => {
        const event = this.props.event;
        const endDate = new Date();
        if (this.props.event.sha1 && this.state.currentTime > 0){
            event.duration = this.state.currentTime;
            event.syncTimeStart = this.state.syncTimeStart;
            event.syncTimeEnd = this.state.syncTimeStart + this.state.currentTime;
            event.startDate = this.state.startDate;
            event.endDate = endDate;
            event.status = EVENT_STATUS_FINISHED;
            if (this.state.isAnnotationRecording){
                this._updateEditedAnnotationEndtime(this.props.eventId , this.state.newAnnotationId , this.state.currentTime - 0.5);
            }
            setTimeout( () => {
                this.props.saveEventAfterRecord(event);
            } , 100 );
            clearInterval(this.interval);
        }
        ee.emit(EVENT_UPDATE_EVENT_RECORDING_STATUS , false);
        ee.emit(EVENT_UPDATE_EVENT_IN_EVENT_FORM , event);
        console.log('saving event.....')
        clearInterval(this.interval);
        this.setState({
            isEventRecording: false,
            currentTime: 0,
            syncTimeStart: event.syncTimeStart,
            duration: event.duration,
            syncTimeEnd: event.syncTimeEnd
        })
        setTimeout( () => {
            ee.emit(EVENT_FORCE_UPDATE_EDIT_MODE , false);
            ee.emit(EVENT_UPDATE_EVENT_RECORDING_STATUS , false);
            this.props.goToLibrary();
        } , 150 );
    }

    stop = () => {
        clearInterval(this.interval);
        this.setState({
            isEventRecording: false
        })
    }

    start = () => {
        this.interval = setInterval(this.tick , this.state.tickDelay);
        this.setState({
            isEventRecording: true
        })
    }

    tick = () => {
        if (this.state.currentTime >= this.state.duration){
            if (this.props.event.status !== EVENT_STATUS_FINISHED && !this.state.isAnnotationRecording){
                this.saveEvent();
            }else{
                this.stopRecording();
            }
        }else{
            this.setState({
                currentTime: this.state.currentTime + this.state.timeInterval
            });
        }
    }

    focusAnnotation = (annotation) => {
        this.setState({focusedAnnotation: annotation});
    }

    playbackRate  = (level) => {
        this.setState({
            playbackSpeed: level
        })
    }

    rewindBackwards = (timeStep) => {
        this.setState({
            currentTime: this.state.currentTime - timeStep <= 0 ? 0 : this.state.currentTime - timeStep
        });
   }

    rewindForward = (timeStep) => {
        if (this.state.currentTime + timeStep > this.state.duration){
            clearInterval(this.interval);
            this.setState({
                isEventRecording: false,
                currentTime: this.state.duration
            })
        }else{
            this.setState({
                currentTime: this.state.currentTime + timeStep
            })
        }
    }

    paused = () => {
        return !this.state.isEventRecording;
    }

    pauseOnVideoEnd = () => {
        clearInterval(this.interval);
        this.setState({
            isEventRecording: false,
            currentTime: this.state.duration
        })
    }

    stopRecording = () => {
        clearInterval(this.interval);
        this.setState({
            isEventRecording: false,
        })
    }

    pause = () => {
        clearInterval(this.interval);
        this.setState({
            isEventRecording: false
        })
    }

    setCurrentTime = (time) => {
        if (time >=  this.state.eventStartTime && time <= this.state.duration){
            this.setState({
                currentTime: time
            })
        }else{
            this.setState({
                currentTime: 0
            })
        }
    }

    _recordAnnotation = () => {
        this.setState({isAnnotationRecording: !this.state.isAnnotationRecording});
        if (this.state.isAnnotationRecording === true) {
            this.setState({endTime: this.state.currentTime})
        }
        if (this.state.isAnnotationRecording === false) {
            this.setState({startTime: this.state.currentTime})
        }
    }

    _zoom = ( level ) => {
        this.setState({
            zoom: level
        })
    }

    getZoom = () => {
        return this.state.zoom;
    }

    setTime = (time) => {
        this.setState({
            currentTime: time
        })
    }

    getCurrentTime = () => {
        return this.state.currentTime;
    }

    scrubbing = () => {
        console.log('scrubbing..')
    }

    _setTime = (event) => {
        if (this.props.event.status !== EVENT_STATUS_FINISHED){
            return false;
        }
        event.stopPropagation();
        let time = (this.state.duration * (event.pageX - event.target.getBoundingClientRect().left))
            / this.elapsedTime.current.parentElement.offsetWidth
        this.setCurrentTime(time);
        this._updateAnnotationTime(time);
    }

    _isValidToEdit = (currentTime) => {
        for (let videoAnnotation of this.props.eventAnnotations || []) {
            // Check left annotations
            if (this.props.editedAnnotation && this.props.editedAnnotation.start > videoAnnotation.end &&
                currentTime <= videoAnnotation.end) {
                return false
            }
            // Check right annotations
            if (this.props.editedAnnotation && this.props.editedAnnotation.end < videoAnnotation.start &&
                currentTime >= videoAnnotation.start) {
                return false
            }

            if (currentTime >= videoAnnotation.start && currentTime <= videoAnnotation.end) {
                return this.props.editedAnnotation && videoAnnotation.id === this.props.editedAnnotation.id;
            }
        }
        return true;
    }

    _updateAnnotationTime = (time) => {
        if (this.props.editedAnnotation && this._isValidToEdit(time)) {
            ee.emit(EVENT_SET_ANNOTATION_POSITION, time);
        }
    }

    _stopScrubbing = () => {
        if (this.props.event.status !== EVENT_STATUS_FINISHED){
            return false;
        }
        this.mouseDown = false;
    }

    _moveScrubber = (event) => {
        if (this.props.event.status !== EVENT_STATUS_FINISHED){
            return false;
        }
        if (this.mouseDown) {
            this.scrubber.current.style.left = `${event.pageX - this.elapsedTime.current.parentElement.getBoundingClientRect().left - 5}px`;
            let time = (this.state.duration * (event.pageX - this.elapsedTime.current.parentElement.getBoundingClientRect().left))
                / this.elapsedTime.current.parentElement.offsetWidth
            this.setCurrentTime(time);
            this._updateAnnotationTime(time);
        }
    }

    _generateTimelineRulerForRealTime = () => {
        let numberOfDivs = 5 * this.state.zoom;
        let divsWidth = 100 / numberOfDivs;
        if (this.state.zoom > 5) {
            divsWidth = divsWidth / 2;
            numberOfDivs = numberOfDivs * 2;
        }

        const timeStretch = this.state.duration / numberOfDivs;

        let intervals = [];
        for (let i = 1; i < numberOfDivs - 1; i++) {
            intervals.push(
                <div className='timeline-item' style={{width: `${divsWidth}%`}} key={i}>
                    <span className="timeline-item-content">{this.state.syncTimeStart !== null ?
                        _formatEventTimeDisplay(this.state.syncTimeStart + (i * timeStretch)) : 'x'
                    }
                    </span>
                </div>);
        }
        return (
            <div className="timeline-ruler" style={{height: '30px' , borderTop: '2px dotted white'}}>
                <div className="timeline-item" style={{width: `${divsWidth}%`}}>
                    <span className="timeline-item-content">{this.state.syncTimeStart !== null ? _formatEventTimeDisplay(this.state.syncTimeStart) : 'x'}</span>
                </div>
                {intervals}
                <div className="timeline-item" style={{width: `${divsWidth}%`}}>
                    <span className="timeline-item-content">{this.state.syncTimeStart !== null ? _formatEventTimeDisplay(this.state.syncTimeEnd - timeStretch) : 'x'}</span>
                    <span className="timeline-item-content-last">{this.state.syncTimeStart !== null ? _formatEventTimeDisplay(this.state.syncTimeEnd) : 'x'}</span>
                </div>
            </div>
        );
    }

    _generateTimelineRuler = () => {
        let numberOfDivs = 5 * this.state.zoom;
        let divsWidth = 100 / numberOfDivs;
        if (this.state.zoom > 5) {
            divsWidth = divsWidth / 2;
            numberOfDivs = numberOfDivs * 2;
        }

        const timeStretch = this.state.duration / numberOfDivs;

        let intervals = [];
        for (let i = 1; i < numberOfDivs - 1; i++) {
            intervals.push(
                <div className='timeline-item-top' style={{width: `${divsWidth}%`}} key={i}>
                    <span className="timeline-item-content">{_formatEventTimeDisplay(i * timeStretch)}</span>
                </div>);
        }
        return (
            <div className="timeline-ruler" style={{height: '30px'}}>
                <div className="timeline-item-top" style={{width: `${divsWidth}%`}}>
                    <span className="timeline-item-content">0:00</span>
                </div>
                {intervals}
                <div className="timeline-item-top" style={{width: `${divsWidth}%`}}>
                    <span
                        className="timeline-item-content">{_formatEventTimeDisplay(this.state.duration - timeStretch)}</span>
                    <span className="timeline-item-content-last">{_formatEventTimeDisplay(this.state.duration)}</span>
                </div>
            </div>
        );
    }

    _drawAnnotation(annotationsContainerWidth) {
        const width = annotationsContainerWidth * (this.state.currentTime - this.state.startTime) / this.state.duration;
        const startX = this.state.startTime * annotationsContainerWidth / this.state.duration;

        return <div className="track-annotation-drawing" key='drawing' style={{
            width: `${width}px`,
            backgroundColor: 'yellow',
            transform: `translateX(${(startX)}px)`,
            position: 'absolute',
            top: '40px'
        }}>&nbsp;</div>
    }

    _selectAnnotation = (annotation) => {
        console.log('select annotation')
        if (this.props.isEditing || this.props.isEditModeOpen || this.props.event.status !== EVENT_STATUS_FINISHED || this.state.isEventRecording)
            return false;
        this.setState({focusedAnnotation: annotation});
        this.pause();
        this.setTime(annotation.start);
        ee.emit(EVENT_HIGHLIGHT_ANNOTATION, annotation.id);
    }

    _renderProgressBar = () => {
        let offset = 0;
        if (this.elapsedTime.current !== null) {
            containerWidth = this.elapsedTime.current.parentElement.offsetWidth;
            offset = this.elapsedTime.current.parentElement.offsetWidth - (this.elapsedTime.current.parentElement.offsetWidth * this.state.currentTime) / this.state.duration;
            this.elapsedTime.current.style.right = `${offset}px`;
            this.scrubber.current.style.left = `${-11 + (this.elapsedTime.current.parentElement.offsetWidth * this.state.currentTime) / this.state.duration}px`;

        }

        return <div className="video-progress"
                    onClick={this._setTime}
                    onMouseMove={this._moveScrubber}
                    onMouseUp={this._stopScrubbing}
                    onMouseLeave={this._stopScrubbing}>

            <div className="elapsed-time" ref={this.elapsedTime}/>
            <div className="scrubber"
                 disabled={true}
                 ref={this.scrubber}
                 onClick={event => {
                     event.stopPropagation();
                 }}
                 onMouseDown={() => {
                     this.mouseDown = true;
                     // this.props.player.scrubbing(true)
                 }}>
                <div className="vertical-needle"/>
            </div>
        </div>
    }

    _renderTetris = () => {
        const annotationsContainerWidth = containerWidth * this.state.zoom;

        let zoomScroll = (this.state.currentTime * containerWidth - this.state.currentTime * annotationsContainerWidth) / this.state.duration;

        return <div className='track-wrapper'>

            <div className='tracks' style={{
                width: `${annotationsContainerWidth}px`,
                transform: `translateX(${zoomScroll}px)`
            }}>
                {this._generateTimelineRuler()}
                <div className='track' key={1}>
                    {this.props.eventAnnotations ? this.props.eventAnnotations.map((annotation, aI) => {
                        const tags = mergeAllEventAnnotationTags(annotation);
                        const width = annotationsContainerWidth * annotation.duration / this.state.duration;
                        const startX = annotation.start * annotationsContainerWidth / this.state.duration;

                        return <div className={classnames('track-annotation',
                            {
                                'highlight-annotation': this.state.focusedAnnotation &&
                                    (this.state.focusedAnnotation.annotationId === annotation.id ||
                                        this.state.focusedAnnotation.id === annotation.id)
                            })} key={aI} style={{
                            width: `${width}px`,
                            backgroundColor: annotation.color,
                            transform: `translateX(${startX}px)`,
                            position: 'absolute',
                            top: '40px'
                        }}
                                    onClick={() => this._selectAnnotation(annotation)}
                                    title={annotation.title + " (" + _formatTimeDisplay(annotation.duration) + ")"}
                        >
                            <div className='timeline_annotation_header'>
                                {annotation.title} ({_formatTimeDisplay(annotation.duration)})
                            </div>
                            <div className='timeline_annotation_body'>
                                {annotation.value}
                            </div>
                            <div className='timeline_annotation_tags'>
                                {
                                    tags.map( (tag,index) => {
                                        let startX_TAG = 0;
                                        const ratio = tag.start - annotation.start;
                                        if (ratio > 0){
                                            startX_TAG =  (ratio / annotation.duration) * width;
                                        }
                                        return <div
                                            key={`etm-ti-${index}`}
                                            className="etm-tagItem"
                                            style={{
                                            transform: `translateX(${startX_TAG}px)`,
                                            position: 'absolute'}}
                                        >{tag.name}</div>
                                    })
                                }
                            </div>
                        </div>
                    }) : null
                    }
                    {
                        this.state.isAnnotationRecording ? this._drawAnnotation(annotationsContainerWidth) : null
                    }
                </div>
                {this._generateTimelineRulerForRealTime()}
            </div>
        </div>
    }

    extendEventWithoutModalWarning = (time) => {
        this.props.extendEventDuration(this.props.event.sha1 , time);
    }

    extendEvent = (time) => {
        this.setState({
            showTimeExtensionAlert: false,
            isShowTimeExtensionAlertAlreadyShown: false,
            duration: this.state.duration + time,
            syncTimeEnd: this.state.syncTimeEnd + time,
        })
        this.props.extendEventDuration(this.props.event.sha1 , time);
    }

    hideAlert = () => {
        this.setState({
            showTimeExtensionAlert: false,
        })
    }

    render() {
        const { t } = i18next;
        return (
            <div>
                <div>
                    <Modal isOpen={this.state.showTimeExtensionAlert} className="myCustomModal" toggle={this.hideAlert} contentClassName="event-stop-modal" wrapClassName="bst rcn_inspector pick-tag"
                           autoFocus={true}>
                        <ModalHeader toggle={ () => this.setState({showEventFinishModal: false})}>{t('global.warning')}!</ModalHeader>
                        <ModalBody className="warning-modal-body">
                            {t('annotate.event_timeline.dialog_event_to_expire_title')}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" onClick={(e)=> {
                                e.preventDefault();
                                this.extendEvent(1800);
                            }}>{t('global.yes')}</Button>
                            <Button color="primary" onClick={this.hideAlert}>{t('global.cancel')}</Button>
                        </ModalFooter>
                    </Modal>
                </div>

                <div className="timeline">
                    <EventPlayerControls
                        setTime={this.setTime}
                        rewindForward={this.rewindForward}
                        rewindBackwards={this.rewindBackwards}
                        saveEvent={this.saveEvent}
                        eventStatus={this.props.event.status}
                        currentTime={this.state.currentTime}
                        duration={this.state.duration}
                        stop={this.stop}
                        start={this.start}
                        startEventRecording={this.startEventRecording}
                        _recordAnnotation={this._recordAnnotation}
                        pause={this.pause}
                        paused={this.paused}
                        zoom={this._zoom}
                        zoomLevel={this.state.zoom}
                        isValidToRecord={this.state.isValidToRecord}
                        playbackRate={this.playbackRate}
                        playbackSpeed={this.state.playbackSpeed}
                        isEventRecording={this.state.isEventRecording}
                        isAnnotationRecording={this.state.isAnnotationRecording}
                        isEditing={this.props.isEditing}
                        editedAnnotation={this.props.editedAnnotation}
                    />
                    <div className='timeline-display'>
                        {this._renderProgressBar()}
                        {this._renderTetris()}
                    </div>
                </div>
            </div>
        );
    }
}

export default EventTimeline;
