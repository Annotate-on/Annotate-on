import React, {Component} from 'react';
import PlayerControls from "./PlayerControls";
import Chance from "chance";
import classnames from "classnames";
import {
    ee,
    EVENT_FOCUS_NEW_VIDEO_ANNOTATION_ON_ANNOTATION_FINISH,
    EVENT_HIGHLIGHT_ANNOTATION,
    EVENT_SET_ANNOTATION_POSITION,
    EVENT_UNFOCUS_ANNOTATION,
    EVENT_UPDATE_RECORDING_STATUS_IN_NAVIGATION, STOP_ANNOTATION_RECORDING
} from "../utils/library";
import {_formatTimeDisplay} from "../utils/maths";
import i18next from "i18next";

const chance = new Chance();
let containerWidth = 0;

const STOP = require('./pictures/stop.svg');

export default class extends Component {
    constructor(props) {
        super(props);
        this.mouseDown = false;
        this.elapsedTime = React.createRef();
        this.scrubber = React.createRef();

        const poi = props.annotationsPointsOfInterest ? props.annotationsPointsOfInterest.filter(ann => 'video' in ann) : [];
        const rec = props.annotationsRectangular ? props.annotationsRectangular.filter(ann => 'video' in ann) : [];
        const chrono = props.annotationsChronothematique ? props.annotationsChronothematique[props.videoId] : [];

        this.state = {
            tracks: this._sortAnnotationsIntoTracks([...chrono, ...poi, ...rec]),
            duration: props.player.duration(),
            currentTime: 0,
            zoom: this.props.zoom,
            startTime: null,
            endTime: null,
            // isAnnotationRecording: false,
            focusedAnnotation: '',
            newAnnotationId: null
        }
    }

    _zoom = (value) => {
        this.setState({zoom: value});
    }

    _getTime = (an, property) => {
        if ('video' in an) {
            return an.video[property]
        } else return an[property]
    }

    _sortAnnotationsIntoTracks = (allAnnotations) => {
        allAnnotations = allAnnotations.sort((a, b) => {

            let aStart = this._getTime(a, 'start'), bStart = this._getTime(b, 'start');
            return aStart - bStart;
        });
        /*{
            "10": [an1, an4],
            "4": [an2],
            "6": [an3]
        }*/
        let tracks = {0: []};
        allAnnotations.map(an => {
            let inserted = false;
            let start = this._getTime(an, 'start'), end = this._getTime(an, 'end');

            if (end === -1) {
                end = start + 0.1;
            }

            for (let lastTime in tracks) {
                if (lastTime <= start) {
                    tracks[end] = [...tracks[lastTime], an];
                    delete tracks[lastTime];
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                tracks[end] = [an];
            }
        });

        console.log("Tracks", tracks);
        return tracks;
    }

    componentDidMount() {
        this.forceUpdate();
        this.props.player.on('timeupdate', (_) => {
            this.setState({
                currentTime: this.props.player.currentTime(),
                duration: this.props.player.duration()
            })
        })
    }

    componentWillUnmount() {
        this.props.player.off('timeupdate')
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // const newAnnotationId = chance.guid();
        //on annotation record start
        // if (prevState.isAnnotationRecording === false && this.state.isAnnotationRecording === true && this.state.isChronothematique) {
        //     this._createVideoAnnotationOnRecordStart(this.props.videoId, this.state.startTime, '', '', '', newAnnotationId);
        // }
        // //stop annotation creation manually
        // if (prevState.isAnnotationRecording !== this.state.isAnnotationRecording && this.state.isAnnotationRecording === false && this.state.isChronothematique) {
        //     this.props.player.pause()
        //     this._updateEditedAnnotationEndtime(this.props.videoId, this.state.newAnnotationId, this.state.endTime);
        // }

        if (this.props.annotationsPointsOfInterest !== prevProps.annotationsPointsOfInterest ||
            this.props.annotationsRectangular !== prevProps.annotationsRectangular ||
            this.props.annotationsChronothematique !== prevProps.annotationsChronothematique) {
            const poi = this.props.annotationsPointsOfInterest ? this.props.annotationsPointsOfInterest.filter(ann => 'video' in ann) : [];
            const rec = this.props.annotationsRectangular ? this.props.annotationsRectangular.filter(ann => 'video' in ann) : [];
            const chrono = this.props.annotationsChronothematique ? this.props.annotationsChronothematique[props.videoId] : [];
            this.setState({
                tracks: this._sortAnnotationsIntoTracks([...chrono, ...poi, ...rec])
            })
        }
    }

    _createVideoAnnotationOnRecordStart = (resourceId, start, end, duration, text, id) => {
        const {t} = i18next;
        this.props.createAnnotationChronoThematique(resourceId, start, end, duration, text, id);
        ee.emit(EVENT_UPDATE_RECORDING_STATUS_IN_NAVIGATION);
        ee.emit(EVENT_UNFOCUS_ANNOTATION)
        setTimeout(() => {
            this.props.openEditPanelonVideoAnnotationCreate(resourceId, id);
        }, 200);
        this.setState({
            focusedAnnotation: null,
            newAnnotationId: id
        })
    }

    _updateEditedAnnotationEndtime(videoId, annId, endTime) {
        if (this.state.startTime > endTime || endTime === undefined || endTime === false || endTime === '') {
            endTime = this.state.startTime + this.state.startTime * 0.025
        }

        this.props.editAnnotationChronothematiqueEndtime(videoId, annId, endTime);
        ee.emit(EVENT_FOCUS_NEW_VIDEO_ANNOTATION_ON_ANNOTATION_FINISH, annId)
        this.setState({
            // isAnnotationRecording: false,
            newAnnotationId: null,
            endTime: null,
            startTime: null
        })
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

    // _drawAnnotation(annotationsContainerWidth) {
    //     const width = annotationsContainerWidth * (this.props.player.currentTime() - this.state.startTime) / this.state.duration;
    //     const startX = this.state.startTime * annotationsContainerWidth / this.state.duration;
    //
    //     return <div className="track-annotation-drawing" key='drawing' style={{
    //         width: `${width}px`,
    //         backgroundColor: 'yellow',
    //         transform: `translateX(${(startX)}px)`
    //     }}>&nbsp;</div>
    // }
    //
    // record = (isChronothematique) => {
    //     if (this.state.isAnnotationRecording === true) {
    //         this.setState({
    //             isAnnotationRecording: false,
    //             endTime: this.props.player.currentTime(),
    //             isChronothematique
    //         });
    //     } else if (this.state.isAnnotationRecording === false) {
    //         this.setState({
    //             isAnnotationRecording: true,
    //             startTime: this.props.player.currentTime(),
    //             isChronothematique
    //         })
    //     }
    // }

    render() {
        return (
            <div className="timeline">
                <PlayerControls currentTime={this.props.player.currentTime()}
                                duration={this.state.duration}
                                player={this.props.player}
                                zoom={this._zoom}
                                zoomLevel={this.state.zoom}
                                volume={this.props.volume}
                                isValidToRecord={true}
                                record={this.record}
                                playbackRate={this.props.playbackRate}
                                isEditModeOpen={this.props.isEditing}
                />
                <div className='timeline-display video'>
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
                <div>
                    {Object.entries(this.state.tracks).map((track, i) => {
                        return this._drawTrack(annotationsContainerWidth, track[1], i)
                    })}
                </div>

            </div>
            {this._generateTimelineRuler()}
        </div>
    }

    _drawTrack = (annotationsContainerWidth, annotations, row) => {
        return <div className="track" key={row}>
            {annotations ? annotations.map((annotation, aI) => {
                const start = this._getTime(annotation, 'start')
                let end = this._getTime(annotation, 'end');
                let isRecording = false;
                if (end === -1) {
                    isRecording = true;
                    if (this.props.player.currentTime() < start) {
                        end = start + 0.1;
                    } else end = this.props.player.currentTime();
                }

                const duration = end - start;
                const width = annotationsContainerWidth * duration / this.state.duration;
                const startX = start * annotationsContainerWidth / this.state.duration;

                return <div className={classnames('track-annotation',
                    {
                        'highlight-annotation': this.state.focusedAnnotation &&
                            (this.state.focusedAnnotation.annotationId === annotation.id ||
                                this.state.focusedAnnotation.id === annotation.id) && !isRecording
                    },{'highlight-recording': isRecording})} key={aI} style={{
                    width: `${width}px`,
                    backgroundColor: annotation.color,
                    transform: `translateX(${startX}px)`
                }}
                            onClick={() => !isRecording && this._selectAnnotation(annotation)}
                            title={annotation.title + " (" + _formatTimeDisplay(annotation.duration) + ")"}>
                    <div
                        className='timeline_annotation_header'>
                        {annotation.title} ({_formatTimeDisplay(duration)})

                        {isRecording? <img alt="stop_ann_recording" className="btn_menu recording-stop" src={STOP} onClick={event => {
                            event.preventDefault();
                            event.stopPropagation();

                            ee.emit(STOP_ANNOTATION_RECORDING , annotation);
                        }}/>:''}
                    </div>
                    <div className='timeline_annotation_body'>
                        {annotation.value}
                    </div>
                </div>
            }) : null}
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
        if (this.props.editedAnnotation) {
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
        let start = annotation.start;
        if ('video' in annotation)
            start = annotation.video.start;
        this.props.player.currentTime(start);
        ee.emit(EVENT_HIGHLIGHT_ANNOTATION, annotation.id);
    }

    getZoom = () => {
        return this.state.zoom;
    }
}
