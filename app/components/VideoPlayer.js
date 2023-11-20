import React, {PureComponent} from 'react';
import videojs from 'video.js'
import Timeline from "./Timeline";
import {DEFAULT_VOLUME} from "../constants/constants";
import {ee, EVENT_GOTO_ANNOTATION, EVENT_SET_ANNOTATION_POSITION, STOP_ANNOTATION_RECORDING} from "../utils/library";
import LeafletVideo from "./LeafletVideo";
import lodash from "lodash";

let tcin = 0;
export default class extends PureComponent {

    constructor(props) {
        super(props);
        this.videoPlayer = React.createRef();
        this.state = {
            loadedmetadata: false,
            originalZoom: 1,
            originalVolume: DEFAULT_VOLUME,
            originalPlaybackRate: 1
        };
        this.timeline = React.createRef();
    }

    componentDidMount() {

        ee.on(STOP_ANNOTATION_RECORDING, this._saveEndTimeToAnnotation);
        this.player = videojs(this.videoPlayer.current, {
            id: 'vid_1234',
            preload: 'auto',
            autoplay: false,
            controls: false,
            currentTime: 1,
            width: 400,
            fill: true,
            muted: false,
            sources: [{
                src: this.props.currentPicture.file,
                type: 'video/mp4'
            }],
            userActions: {
                doubleClick: false
            }
        });

        this.player.ready(() => {
            this.player.volume(DEFAULT_VOLUME)

            this.player.on("loadedmetadata", (_) => {
                this.player.playbackRate(this.state.originalPlaybackRate);
                this.setState({
                    loadedmetadata: true
                })
            });
        });

        ee.on(EVENT_GOTO_ANNOTATION, this._gotoAnnotation);
        window.addEventListener('keyup', this._processKeyboardEvents, true);
    }

    componentWillUnmount() {
        ee.removeListener(STOP_ANNOTATION_RECORDING, this._saveEndTimeToAnnotation);
        window.removeEventListener('keyup', this._processKeyboardEvents, true);
        if (this.player) {
            this.player.off("loadedmetadata");
            this.player.off("ratechange");
            this.player.dispose()
        }
        ee.removeListener(EVENT_GOTO_ANNOTATION, this._gotoAnnotation);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.currentPicture.file !== prevProps.currentPicture.file) {
            this.setState({
                originalPlaybackRate: this.player.playbackRate(),
                originalVolume: this.player.volume(),
                originalZoom: this.timeline.current.getZoom(),
                loadedmetadata: false
            })
            this.player.src(this.props.currentPicture.file)
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.focusedAnnotation && this.timeline.current) {
            this.timeline.current.focusAnnotation(nextProps.focusedAnnotation);
        }
    }

    _processKeyboardEvents = (event) => {
        //kad nije edit mode u annotation tabu
        if (this.props.editedAnnotation || event.target.className === 'form-control')
            return
        switch (event.which) {
            case 32:
                if (this.player.paused())
                    this.player.play()
                else
                    this.player.pause()
                break;
            case 37: //Backward
                this.player.currentTime(this.player.currentTime() - 5)
                break;
            case 39: //Forward
                this.player.currentTime(this.player.currentTime() + 5)
                break;
        }
    }

    _gotoAnnotation = (annotation, position) => {
        if (this.player) {
            if (position === "start" || position === "") {
                let start = annotation.start
                if(!lodash.isNil(annotation.video))
                    start = annotation.video.start;
                this.player.currentTime(start);
            }
            if (position === "end") {
                let end = annotation.end
                if(!lodash.isNil(annotation.video)) {
                    end = annotation.video.end;
                    if (end === -1)
                        end = annotation.video.start;
                }
                this.player.currentTime(end);
            }
            this.player.pause();
        }
    }

    _saveEndTimeToAnnotation = (annotation) => {
        this.props.saveAnnotationEndTime(annotation.annotationType, annotation.id, this.player.currentTime(), this.props.currentPicture.sha1);
    }

    render() {
        return (
            <div className="bst rcn_video">

                <div className="leaflet-wrapper">
                    <div data-vjs-player>
                        <video className="video-js"
                               ref={this.videoPlayer}>
                        </video>
                    </div>
                    {this.player && this.state.loadedmetadata ?
                    <LeafletVideo
                                  currentPicture={this.props.currentPicture} ref={this.props.leafletVideo}
                                  leafletPositionByPicture={this.props.leafletPositionByPicture}
                                  annotationsMeasuresLinear={this.props.annotationsMeasuresLinear}
                                  annotationsPointsOfInterest={this.props.annotationsPointsOfInterest}
                                  annotationsRectangular={this.props.annotationsRectangular}
                                  annotationsPolygon={this.props.annotationsPolygon}
                                  annotationsAngle={this.props.annotationsAngle}
                                  annotationsColorPicker={this.props.annotationsColorPicker}
                                  annotationsOccurrence={this.props.annotationsOccurrence}
                                  annotationsTranscription={this.props.annotationsTranscription}
                                  annotationsRichtext={this.props.annotationsRichtext}
                                  annotationsCircleOfInterest={this.props.annotationsCircleOfInterest}
                                  annotationsPolygonOfInterest={this.props.annotationsPolygonOfInterest}
                                  onCreated={this._onCreated}
                                  onEditStop={this.props.onEditStop}
                                  onDrawStart={this.props.onDrawStart}
                                  onDrawStop={this.props.onDrawStop}
                                  calibrationMode={this.props.calibrationActive}
                                  fireSaveEvent={this.props.fireSaveEvent}
                                  onContextMenuEvent={this.props.handleLeafletContextMenu}
                                  targetColors={this.props.targetColors}
                                  taxonomyInstance={this.props.taxonomyInstance}
                                  repeatMode={this.props.repeatMode}
                                  saveLeafletSettings={this.props.saveLeafletSettings}
                                  player={this.player}
                                  onLeafletClick={this._onLeafletClick}
                    />:''}
                </div>
                {this.player && this.state.loadedmetadata ?
                    <Timeline ref={this.timeline}
                              zoom={this.state.originalZoom}
                              volume={this.state.originalVolume}
                              playbackRate={this.state.originalPlaybackRate}
                              annotationsPointsOfInterest={this.props.annotationsPointsOfInterest}
                              annotationsRectangular={this.props.annotationsRectangular}
                              annotationsChronothematique={this.props.annotationsChronothematique}
                              annotationsCircleOfInterest={this.props.annotationsCircleOfInterest}
                              file={this.props.currentPicture.file}
                              videoId={this.props.currentPicture.sha1}
                              isEditing={this.props.isEditing}
                              editedAnnotation={this.props.editedAnnotation}
                              editAnnotationChronothematiqueEndtime={this.props.editAnnotationChronothematiqueEndtime}
                              player={this.player}/>
                    : ''
                }
            </div>
        );
    }

    _onLeafletClick = e => {
        console.log("Leaflet clicked")
        this.player.pause();
        tcin = this.player.currentTime()
    }

    _onCreated = (e) => {
        console.log("_onCreated")
        this.player.pause();
        e.layer.video = {
            start: this.player.currentTime(),
            end: -1
        }
        this.props.onCreated(e);
    }
}
