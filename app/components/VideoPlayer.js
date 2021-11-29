import React, {PureComponent} from 'react';
import videojs from 'video.js'
import Timeline from "./Timeline";
import {DEFAULT_VOLUME} from "../constants/constants";
import {ee, EVENT_GOTO_ANNOTATION} from "../utils/library";

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
                this.player.currentTime(annotation.start);
            }
            if (position === "end") {
                this.player.currentTime(annotation.end);
            }
            this.player.pause();
        }
    }

    render() {
        return (
            <div className="bst rcn_video">
                <div data-vjs-player>
                    <video className="video-js"
                           ref={this.videoPlayer}>
                    </video>
                </div>
                {this.player && this.state.loadedmetadata ?
                    <Timeline ref={this.timeline}
                              zoom={this.state.originalZoom}
                              volume={this.state.originalVolume}
                              playbackRate={this.state.originalPlaybackRate}
                              openEditPanelonVideoAnnotationCreate={this.props.openEditPanelonVideoAnnotationCreate}
                              createAnnotationChronoThematique={this.props.createAnnotationChronoThematique}
                              annotationsChronothematique={this.props.annotationsChronothematique}
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
}
