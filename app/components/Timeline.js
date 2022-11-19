import React, {Component} from 'react';
import PlayerControls from "./PlayerControls";
import Chance from "chance";
import classnames from "classnames";
import {
    ee,
    EVENT_GOTO_ANNOTATION,
    EVENT_HIGHLIGHT_ANNOTATION,
    EVENT_SET_ANNOTATION_POSITION, EVENT_UPDATE_IS_EDIT_MODE_OPEN_IN_NAVIGATION_AND_TABS,
    STOP_ANNOTATION_RECORDING
} from "../utils/library";
import {_formatTimeDisplay} from "../utils/maths";
import i18next from "i18next";
import lodash from "lodash";

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

        this.state = {
            tracks: this._sortAnnotationsIntoTracks([...poi, ...rec]),
            duration: props.player.duration(),
            currentTime: 0,
            zoom: this.props.zoom,
            startTime: null,
            endTime: null,
            focusedAnnotation: '',
            newAnnotationId: null
        }
    }

    _zoom = (value) => {
        this.setState({zoom: value});
    }

    _getTime = (an, property) => {
        if (!lodash.isNil(an.video)) {
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
                // end = start + 0.1;
                tracks[chance.hash({length: 5})] = [an];
                return
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
        ee.on(EVENT_GOTO_ANNOTATION, this._gotoAnnotation);
        ee.on(EVENT_UPDATE_IS_EDIT_MODE_OPEN_IN_NAVIGATION_AND_TABS, this._gotoAnnotation);
    }

    componentWillUnmount() {
        this.props.player.off('timeupdate')
        ee.removeListener(EVENT_GOTO_ANNOTATION, this._gotoAnnotation);
        ee.removeListener(EVENT_UPDATE_IS_EDIT_MODE_OPEN_IN_NAVIGATION_AND_TABS, this._gotoAnnotation);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.annotationsPointsOfInterest !== prevProps.annotationsPointsOfInterest ||
            this.props.annotationsRectangular !== prevProps.annotationsRectangular) {
            const poi = this.props.annotationsPointsOfInterest ? this.props.annotationsPointsOfInterest.filter(ann => 'video' in ann) : [];
            const rec = this.props.annotationsRectangular ? this.props.annotationsRectangular.filter(ann => 'video' in ann) : [];
            this.setState({
                tracks: this._sortAnnotationsIntoTracks([...poi, ...rec])
            })
        }
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
                        className={classnames('timeline_annotation_header', {'highlight-recording': isRecording})}>
                        {annotation.title} ({_formatTimeDisplay(duration)})


                    </div>

                    {isRecording? <img alt="stop_ann_recording" className="recording-stop" src={STOP} onClick={event => {
                        event.preventDefault();
                        event.stopPropagation();

                        ee.emit(STOP_ANNOTATION_RECORDING , annotation);
                    }}/>:''}

                    {/*<div className='timeline_annotation_body'>*/}
                    {/*    {annotation.value}*/}
                    {/*</div>*/}
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
            Object.entries(this.state.tracks).map(track=>{
                track[1].map(annotation=>{
                    if (annotation.id === this.props.editedAnnotation.id) {
                        annotation.video[this.state.editAnnotationPosition] = time;
                    }
                })
            })
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
        if (!lodash.isNil(annotation.video))
            start = annotation.video.start;
        this.props.player.currentTime(start);
        ee.emit(EVENT_HIGHLIGHT_ANNOTATION, annotation.id);
    }

    getZoom = () => {
        return this.state.zoom;
    }

    _gotoAnnotation = (annotation, position) => {
        this.setState({editAnnotationPosition: position})
    }
}
