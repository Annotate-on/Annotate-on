import React, {Component} from 'react';
import PlayerControls from "./PlayerControls";
import Chance from "chance";
import classnames from "classnames";
import {
    ee,
    EVENT_FOCUS_NEW_VIDEO_ANNOTATION_ON_ANNOTATION_FINISH,
    EVENT_HIGHLIGHT_ANNOTATION,
    EVENT_SAVE_ANNOTATION_CHRONOTHEMATIQUE_FROM_EDIT_PANEL,
    EVENT_SET_ANNOTATION_POSITION,
    EVENT_UNFOCUS_ANNOTATION,
    EVENT_UPDATE_RECORDING_STATUS_IN_NAVIGATION
} from "../utils/library";
import {_formatTimeDisplay} from "../utils/maths";

const chance = new Chance();
let containerWidth = 0;

// TODO 02.09.2020 20:01 mseslija:
// create annotation

export default class extends Component {
    constructor(props) {
        super(props);
        this.mouseDown = false;
        this.elapsedTime = React.createRef();
        this.scrubber = React.createRef();

        this.state = {
            videoAnnotations: this.props.annotationsChronothematique[this.props.videoId] ? this.props.annotationsChronothematique[this.props.videoId] : [],
            duration: props.player.duration(),
            currentTime: 0,
            zoom: this.props.zoom,
            isValidToRecord: true,
            startTime: null,
            endTime: null,
            isAnnotationRecording: false,
            focusedAnnotation: '',
            newAnnotationId: null
        }
    }

    _zoom = (value) => {
        this.setState({zoom: value});
    }

    componentDidMount() {
        this.forceUpdate();
        if (this.props.player.currentTime() === 0){
            this.setState({
                isValidToRecord: this._isValidAtStart(),
            })
        }
        this.props.player.on('timeupdate', (_) => {
            this.setState({
                currentTime: this.props.player.currentTime(),
                duration: this.props.player.duration(),
                isValidToRecord: this._isValid(),
            })
        })
    }

    componentWillUnmount() {
        this.props.player.off('timeupdate')
    }

    componentDidUpdate(prevProps, prevState, snapshot) {

        const newAnnotationId = chance.guid();
        //on annotation record start
        if (prevState.isAnnotationRecording === false && this.state.isAnnotationRecording === true){
            this._createVideoAnnotationOnRecordStart(this.props.videoId, this.state.startTime, '' , '', '', newAnnotationId);
        }
        //detect colision with existing annotation and stop record
        if (this.state.isAnnotationRecording === true && this.state.isValidToRecord === false) {
            const endTime = this._findNearestEndTime();
            this.props.player.currentTime(endTime);
            this.props.player.pause();
        }
        //stop annotation creation manually
        if (prevState.isAnnotationRecording !== this.state.isAnnotationRecording && this.state.isAnnotationRecording === false && this.state.isValidToRecord === true) {
            this.props.player.pause()
            const endTime = this._validateCurrentEndTime(this.state.endTime);
            this.props.player.currentTime(endTime + 0.2);
            this._updateEditedAnnotationEndtime(this.props.videoId , this.state.newAnnotationId , endTime);
        }
    }

    _createVideoAnnotationOnRecordStart = (resourceId, start, end, duration, text, id) => {
        if (this._isValidPositionOnRecordStart(start)) {
            this.props.createAnnotationChronoThematique(resourceId, start, end, duration, text, id);
            ee.emit(EVENT_UPDATE_RECORDING_STATUS_IN_NAVIGATION);
            ee.emit(EVENT_UNFOCUS_ANNOTATION)
            setTimeout( () => {
                this.props.openEditPanelonVideoAnnotationCreate(resourceId, id);
            } , 200);
            this.setState({
                // videoAnnotations: [],
                focusedAnnotation: null,
                newAnnotationId: id
            })
        } else {
            alert('something went wrong {_createVideoAnnotationOnRecordStart}')
            return false;
        }
    }

    _validateCurrentEndTime = (endTime) => {
        if (this.props.editedAnnotation && this.props.editedAnnotation.start !== undefined){
            for (let videoAnnotation of this.props.annotationsChronothematique[this.props.videoId].filter(ann => ann.start > this.props.editedAnnotation.start) || []){
                if (endTime > videoAnnotation.start){
                    endTime = videoAnnotation.start - 0.2;
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
        for (let videoAnnotation of this.props.annotationsChronothematique[this.props.videoId] || []) {
            if (start >= videoAnnotation.start && start <= videoAnnotation.end) {
                valid = false;
                break;
            }
        }
        return valid;
    }

    _updateEditedAnnotationEndtime(videoId , annId , endTime){

        if (this.state.startTime > endTime || endTime === undefined || endTime === false || endTime === ''){
            endTime = this.state.startTime + this.state.startTime * 0.025
        }

        this.props.editAnnotationChronothematiqueEndtime(videoId , annId , endTime);
        ee.emit(EVENT_SAVE_ANNOTATION_CHRONOTHEMATIQUE_FROM_EDIT_PANEL);
        ee.emit(EVENT_FOCUS_NEW_VIDEO_ANNOTATION_ON_ANNOTATION_FINISH , annId)
        this.setState({
            isAnnotationRecording: false,
            newAnnotationId: null,
            endTime: null,
            startTime: null
        })
    }

    _jumpTo = () => {
        this.props.player.currentTime();
        this.props.player.pause();
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
                <div className='timeline-item' style={{width: `${divsWidth}%`}} key={i}>
                    <span className="timeline-item-content">{_formatTimeDisplay(i * timeStretch)}</span>
                </div>);
        }
        return (
            <div className="timeline-ruler">
                <div className="timeline-item" style={{width: `${divsWidth}%`}}>
                    <span className="timeline-item-content">0:00</span>
                </div>
                {intervals}
                <div className="timeline-item" style={{width: `${divsWidth}%`}}>
                    <span
                        className="timeline-item-content">{_formatTimeDisplay(this.state.duration - timeStretch)}</span>
                    <span className="timeline-item-content-last">{_formatTimeDisplay(this.state.duration)}</span>
                </div>
            </div>
        );
    }

    _onEditClose = () => {
        this.setState({
            // videoAnnotations: [],
            isAnnotationRecording: false,
            startTime: null,
            endTime: null
        })
    }

    _isValidPosition = (start, end) => {
        let valid = true;
        for (let videoAnnotation of this.props.annotationsChronothematique[this.props.videoId] || []) {
            if (start >= videoAnnotation.start && start <= videoAnnotation.end ||
                end >= videoAnnotation.start && end <= videoAnnotation.end) {
                valid = false;
                break;
            }
        }
        return valid;
    }

    _isValidAtStart = () => {
        let valid = true;
        for (let videoAnnotation of this.props.annotationsChronothematique[this.props.videoId] || []) {
            if (videoAnnotation.start === 0) {
                valid = false;
                break;
            }
        }
        return valid;
    }

    _isValid = () => {
        let valid = true;
        for (let videoAnnotation of this.props.annotationsChronothematique[this.props.videoId] || []) {
            if ((this.props.player.currentTime()) >= videoAnnotation.start -.1 && this.props.player.currentTime() <= videoAnnotation.end +.1) {
                valid = false;
                break;
            }
        }
        return valid;
    }

    _isValidToEdit = (currentTime) => {
        for (let videoAnnotation of this.props.annotationsChronothematique[this.props.videoId] || []) {
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

    _drawAnnotation(annotationsContainerWidth) {
        const width = annotationsContainerWidth * (this.props.player.currentTime() - this.state.startTime) / this.state.duration;
        const startX = this.state.startTime * annotationsContainerWidth / this.state.duration;

        return <div className="track-annotation-drawing" key='drawing' style={{
            width: `${width}px`,
            backgroundColor: 'yellow',
            transform: `translateX(${(startX)}px)`
        }}>&nbsp;</div>
    }

    _record = () => {
        this.setState({isAnnotationRecording: !this.state.isAnnotationRecording});
        if (this.state.isAnnotationRecording === true) {
            this.setState({endTime: this.props.player.currentTime()})
        }
        if (this.state.isAnnotationRecording === false) {
            this.setState({startTime: this.props.player.currentTime()})
        }
    }

    _findNearestEndTime = () => {
        let endTime = 0;
        for (let videoAnnotation of this.props.annotationsChronothematique[this.props.videoId]) {
            if (this.state.startTime < videoAnnotation.start) {
                endTime = videoAnnotation.start - 0.15
                return endTime;
            }
        }
    }

    render() {
        return (
            <div className="timeline">
                <PlayerControls currentTime={this.props.player.currentTime()}
                                duration={this.state.duration}
                                player={this.props.player}
                                zoom={this._zoom}
                                zoomLevel={this.state.zoom}
                                volume={this.props.volume}
                                isValidToRecord={this.state.isValidToRecord}
                                record={this._record}
                                playbackRate={this.props.playbackRate}
                                isAnnotationRecording={this.state.isAnnotationRecording}
                                isEditModeOpen={this.props.isEditing}
                />
                <div className='timeline-display'>
                    {this._renderProgressBar()}
                    {this._renderTetris()}
                </div>
            </div>
        );
    }

    _renderProgressBar = () => {
        let offset = 0;
        if (this.elapsedTime.current !== null) {
            containerWidth = this.elapsedTime.current.parentElement.offsetWidth;
            offset = this.elapsedTime.current.parentElement.offsetWidth - (this.elapsedTime.current.parentElement.offsetWidth * this.props.player.currentTime()) / this.state.duration;
            this.elapsedTime.current.style.right = `${offset}px`;
            this.scrubber.current.style.left = `${-11 + (this.elapsedTime.current.parentElement.offsetWidth * this.props.player.currentTime()) / this.state.duration}px`;
        }

        return <div className="video-progress"
                    onClick={this._setTime}
                    onMouseMove={this._moveScrubber}
                    onMouseUp={this._stopScrubbing}
                    onMouseLeave={this._stopScrubbing}>
            <div className="elapsed-time" ref={this.elapsedTime}/>
            <div className="scrubber"
                 ref={this.scrubber}
                 onClick={event => {
                     event.stopPropagation();
                 }}
                 onMouseDown={() => {
                     this.mouseDown = true;
                     this.props.player.scrubbing(true)
                 }}>
                <div className="vertical-needle"/>
            </div>
        </div>
    }

    _renderTetris = () => {
        const annotationsContainerWidth = containerWidth * this.state.zoom;

        let zoomScroll = (this.props.player.currentTime() * containerWidth - this.props.player.currentTime() * annotationsContainerWidth) / this.state.duration;

        return <div className='track-wrapper'>
            <div className='tracks' style={{
                width: `${annotationsContainerWidth}px`,
                transform: `translateX(${zoomScroll}px)`
            }}>
                <div className='track' key={1}>
                    {this.props.annotationsChronothematique[this.props.videoId] ? this.props.annotationsChronothematique[this.props.videoId].map((annotation, aI) => {
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
                            transform: `translateX(${startX}px)`
                        }}
                                    onClick={() => this._selectAnnotation(annotation)}

                                    title={annotation.title + " (" + _formatTimeDisplay(annotation.duration) + ")"}
                        >
                            <div
                                className='timeline_annotation_header'>
                                {annotation.title} ({_formatTimeDisplay(annotation.duration)})
                            </div>
                            <div className='timeline_annotation_body'>
                                {annotation.value}
                            </div>
                        </div>
                    }) : null
                    }
                    {
                        this.state.isAnnotationRecording ? this._drawAnnotation(annotationsContainerWidth) : null
                    }
                </div>
                {this._generateTimelineRuler()}
            </div>
        </div>

    }

    _stopScrubbing = () => {
        this.mouseDown = false;
        this.props.player.scrubbing(false)
    }

    _moveScrubber = (event) => {
        if (this.mouseDown) {
            this.scrubber.current.style.left = `${event.pageX - this.elapsedTime.current.parentElement.getBoundingClientRect().left - 5}px`;
            let time = (this.state.duration * (event.pageX - this.elapsedTime.current.parentElement.getBoundingClientRect().left))
                / this.elapsedTime.current.parentElement.offsetWidth
            this.props.player.currentTime(time);
            this._updateAnnotationTime(time);
        }
    }

    _setTime = (event) => {
        event.stopPropagation();
        if (!this.props.player.scrubbing()) {
            let time = (this.state.duration * (event.pageX - event.target.getBoundingClientRect().left))
                / this.elapsedTime.current.parentElement.offsetWidth
            this.props.player.currentTime(time);

            this._updateAnnotationTime(time);
        }
        return false;
    }

    _updateAnnotationTime = (time) => {
        if (this.props.editedAnnotation && this._isValidToEdit(time)) {
            ee.emit(EVENT_SET_ANNOTATION_POSITION, time);
        }
    }

    focusAnnotation = (annotation) => {
        this.setState({focusedAnnotation: annotation});
    }

    _selectAnnotation = (annotation) => {
        if (this.props.isEditing)
            return;
        this.setState({focusedAnnotation: annotation});
        this.props.player.pause();
        this.props.player.currentTime(annotation.start);
        ee.emit(EVENT_HIGHLIGHT_ANNOTATION, annotation.id);
    }

    getZoom = () => {
        return this.state.zoom;
    }
}
