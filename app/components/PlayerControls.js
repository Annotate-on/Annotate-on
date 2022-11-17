import React, {Component} from "react";
import {_formatTimeDisplay} from "../utils/maths";
import {SHOW_EDIT_MODE_VIOLATION_MODAL , ee} from "../utils/library";
import i18next from "i18next";

const ADD_ANNOTATION = require('./pictures/chronothematique.svg');
const ADD_ANNOTATION_RED = require('./pictures/chronothematique_red.svg');

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showAction: null,
            skipTime: 5,
            timeStep: 5,
            currentZoom: this.props.zoomLevel,
            currentTime: 0
        }
    }

    componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot: SS) {
        if (prevProps.isAnnotationRecording === true && this.props.isAnnotationRecording === false) {
            this.props.player.pause();
        }
    }

    _handleZoom = (value) => {
        if (value <= 0 || value > 15) {
            return false;
        } else {
            this.props.zoom(value);
        }
    }

    render() {
        const { t } = i18next;
        return <div className='controls'>
            <div className='rowContainer'>
                <div className='timerControl'>
                    <div className='currentTime'>{_formatTimeDisplay(this.props.currentTime)}</div>
                    /
                    <div className='totalTime'>{_formatTimeDisplay(this.props.duration)}</div>
                </div>
            </div>
            <div className='rowContainer'>

            </div>

            <div className='rowContainer'>
                <div className='playerControls'>
                    <div className='action-buttons'>
                        <div className='action-button left1'>
                            <i title={t('annotate.player_controls.lbl_goto_start')} className="fa fa-step-backward" aria-hidden="true" onClick={() => {
                                this.props.player.currentTime(0)
                            }}/>
                            <i title={t('annotate.player_controls.lbl_backward_5_sec')} className="fa fa-backward" aria-hidden="true" onClick={() => {
                                this.props.player.currentTime(this.props.player.currentTime() - this.state.timeStep)
                            }}/>
                        </div>
                        <div className='play-button center1'>
                            <i className={this.props.player.paused() ? "fa fa-play-circle" : "fa fa-pause-circle-o"}
                               aria-hidden="true" onClick={() => {
                                if (this.props.player.paused())
                                    this.props.player.play()
                                else
                                    this.props.player.pause()
                            }}/>
                        </div>
                        <div className='action-button center2'>
                            <i title={t('annotate.player_controls.lbl_forward_5_sec')} className="fa fa-forward" aria-hidden="true" onClick={() => {
                                this.props.player.currentTime(this.props.player.currentTime() + this.state.timeStep)
                            }}/>
                            <i title={t('annotate.player_controls.lbl_goto_end')} className="fa fa-step-forward" aria-hidden="true" onClick={() => {
                                this.props.player.currentTime(this.props.duration)
                            }}/>
                        </div>
                    </div>
                </div>
            </div>
            <div className='bottom-player-container'>
                <div className='action-icons'>
                    <div className="action-icon">
                        <i className="fa fa-volume-up" aria-hidden="true"/>
                    </div>
                    <div>
                        <input className="zoom-slider" id="rangeInput" type="range" min="0" max="100"
                               defaultValue={this.props.volume * 100} onChange={event => {
                            this.props.player.volume(event.target.value / 100);
                        }}/>
                        <span className='range_value'>
                            <output name="amount" id="amount" htmlFor="rangeInput">{this.props.volume * 100}</output>%
                        </span>
                    </div>
                </div>
                <div className='action-icons'>
                    <div className="action-icon">
                        <i className="fa fa-tachometer" aria-hidden="true"/>
                    </div>
                    <div>
                        <input className="zoom-slider" id="rangeInputSpeed" type="range" step="0.5" min="0.5" max="5"
                               defaultValue={this.props.playbackRate}
                               onChange={event => {
                                   this.props.player.playbackRate(event.target.value);
                               }}/>
                        <span className='range_value'>
                            <output id="amountSpeed" htmlFor="rangeInputSpeed">{this.props.playbackRate}</output>x
                        </span>
                    </div>
                </div>
                <div className='action-icons'>
                    <div className="action-icon">
                        <i className="fa fa-search" aria-hidden="true"/>
                    </div>
                    <div>
                        <input className="zoom-slider" id="myZoomRange" type="range" step="1" min="1" max="15"
                               value={this.props.zoomLevel} onChange={event => {
                            this.props.zoom(event.target.value);
                            // amountZoom.value=myZoomRange.value;
                        }}/>
                        <span className='range_value'><output id="amountZoom"
                                                              htmlFor="myZoomRange">{this.props.zoomLevel}</output>x</span>
                    </div>
                </div>
            </div>
        </div>
    }
}
