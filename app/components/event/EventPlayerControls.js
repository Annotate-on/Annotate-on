import React, {Component} from 'react';
import {_formatTimeDisplayForEvent} from "../../utils/maths";
import {ee, SHOW_EDIT_MODE_VIOLATION_MODAL} from "../../utils/library";
import {Button, Modal, ModalBody, ModalFooter, ModalHeader} from "reactstrap";
import {EVENT_STATUS_FINISHED} from "./Constants";
import {extendEventConfirmationDialog} from "../ConfirmationDialog";
import {_formatEventTimeDisplay,} from "./utils";

const ADD_ANNOTATION = require('../pictures/chronothematique.svg');
const ADD_ANNOTATION_RED = require('../pictures/chronothematique_red.svg');

class EventPlayerControls extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showAction: null,
            skipTime: 5,
            timeStep: 5,
            currentZoom: this.props.zoomLevel,
            currentTime: 0,
            showEventFinishModal: false
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
       return  this.props.eventStatus === EVENT_STATUS_FINISHED ?
           //if edit mode is open
           <div className='controls'>
            <div className='rowContainer'>
                <div className='timerControl'>
                    <div className='currentTime'>{_formatEventTimeDisplay(this.props.currentTime)}</div>
                    /
                    <div className='totalTime'>{_formatEventTimeDisplay(this.props.duration)}</div>
                </div>
            </div>
            <div className='rowContainer'>

            </div>

            <div className='rowContainer'>
                <div className='playerControls'>
                    <div className='action-buttons'>

                        <div className='play-button left1'>
                            <i className={this.props.paused() ? "fa fa-play-circle" : "fa fa-pause-circle-o"}
                               aria-hidden="true" onClick={ () => {
                                if (this.props.paused())
                                    this.props.start()
                                else
                                    this.props.stop()
                            }}/>
                        </div>
                        <div className='action-button center1'>
                            <i title="Backward 5 sec" className="fa fa-backward" aria-hidden="true" onClick={() => {
                                this.props.rewindBackwards(this.state.timeStep)
                            }}/>
                            <i title="Goto start" className="fa fa-step-backward" aria-hidden="true" onClick={() => {
                                this.props.setTime(0)
                            }}/>
                        </div>
                        <div className='action-button center2'>
                            <i title="Forward 5 sec" className="fa fa-forward" aria-hidden="true" onClick={() => {
                                this.props.rewindForward(this.state.timeStep)
                            }}/>
                            <i title="Goto end" className="fa fa-step-forward" aria-hidden="true" onClick={() => {
                                this.props.setTime(this.props.duration)
                            }}/>
                        </div>

                        <div className='right1'>
                            <div disabled={true}
                                 className={this.props.isValidToRecord ? "add-annotation-button btn btn-primary" : "add-annotation-button btn btn-primary disabled"}
                                 onClick={() => {
                                if (this.props.isEditing !== null && this.props.isAnnotationRecording === false){
                                    ee.emit(SHOW_EDIT_MODE_VIOLATION_MODAL)
                                    return false;
                                }
                                if (this.props.isValidToRecord) {
                                    this.props._recordAnnotation()
                                    if (this.props.paused()) {
                                        this.props.start()
                                    }
                                }
                            }}>
                                <img className="add-annotation-picture"
                                     alt={this.props.isAnnotationRecording ? "add annotation red" : "add annotation"}
                                     src={this.props.isAnnotationRecording ? ADD_ANNOTATION_RED : ADD_ANNOTATION}/>
                                Annotate
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='event-bottom-player-container'>
                <div className='action-icons event-icon-padding'>
                    <div className="action-icon">
                        <i className="fa fa-tachometer" aria-hidden="true"/>
                    </div>
                    <div>
                        <input className="zoom-slider" id="rangeInputSpeed" type="range" step="0.5" min="0.5" max="5"
                               value={this.props.playbackSpeed} onChange={event => {
                            this.props.playbackRate(event.target.value);
                        }}/>
                        <span className='range_value'><output id="amountSpeed"
                            htmlFor="rangeInputSpeed">{this.props.playbackSpeed}</output>x</span>
                    </div>
                </div>
                <div className='action-icons event-icon-padding'>
                    <div className="action-icon">
                        <i className="fa fa-search" aria-hidden="true"/>
                    </div>
                    <div>
                        <input className="zoom-slider" id="myZoomRange" type="range" step="1" min="1" max="15"
                               value={this.props.zoomLevel} onChange={event => {
                            this.props.zoom(event.target.value);
                        }}/>
                        <span className='range_value'><output id="amountZoom"
                           htmlFor="myZoomRange">{this.props.zoomLevel}</output>x</span>
                    </div>
                </div>
            </div>
        </div> :
           //if event is live
           <div>
               <div>
                   <Modal isOpen={this.state.showEventFinishModal} className="myCustomModal" toggle={() => this.setState({showEventFinishModal: false})} contentClassName="event-stop-modal" wrapClassName="bst rcn_inspector pick-tag"
                          scrollable={true}
                          autoFocus={false}>
                       <ModalHeader toggle={ () => this.setState({showEventFinishModal: false})}>Stop event ?</ModalHeader>
                       <ModalBody className="warning-modal-body">
                           If you stop the event, we will not be able to continue the analysis. Are you sure you want to stop the event?
                       </ModalBody>
                       <ModalFooter>
                           <Button color="danger" onClick={(e)=> {
                               e.preventDefault();
                               this.props.saveEvent()
                           }}>Save</Button>
                            <Button color="primary" onClick={()=> {this.setState({showEventFinishModal: false})}}>Cancel</Button>
                       </ModalFooter>
                   </Modal>
               </div>
           <div className='controls'>
               <div className='rowContainer'>
                   <div className='timerControl'>
                       <div id="epc-current-time" className='currentTime'>{_formatTimeDisplayForEvent(this.props.currentTime)}</div>
                   </div>
               </div>
               <div className='rowContainer'>

               </div>
               <div className='rowContainer'>
                   <div className='playerControls'>
                       <div className='action-buttons epc-action-buttons'>
                           <div className="epc-action-button-div">
                               <Button
                                       className="start-stop-event-button"
                                       onClick={ () => {
                                    if (this.props.paused()){
                                        const dialogResult = extendEventConfirmationDialog('' , 'Do you want to start event');
                                        if (dialogResult === 0) {
                                            this.props.startEventRecording();
                                        }
                                    }else {
                                        this.setState({showEventFinishModal: true})
                                    }
                               }
                               }>{this.props.isEventRecording ? "Stop event" : "Start event"}
                               </Button>
                               <div style={{ width: '90px'}} className={this.props.isValidToRecord && this.props.isEventRecording ? "add-annotation-button btn btn-primary" : "add-annotation-button btn btn-primary disabled"} onClick={() => {
                                   if (this.props.isValidToRecord && this.props.isEventRecording) {
                                       this.props._recordAnnotation()
                                   }
                               }}>
                                   <img className="add-annotation-picture"
                                        alt={this.props.isAnnotationRecording ? "stop recording" : "start recording"}
                                        src={this.props.isAnnotationRecording ? ADD_ANNOTATION_RED : ADD_ANNOTATION}/>
                                   Annotate
                               </div>
                           </div>

                           <div className='epc-bottom-player-container'>
                               <div className='action-icons epc-zoom'>
                                   <div className="action-icon">
                                       <i className="fa fa-search" aria-hidden="true"/>
                                   </div>
                                   <div>
                                       <input className="zoom-slider" id="rangeInputSpeed2" type="range" step="1" min="1" max="15"
                                              defaultValue="1" onChange={event => {
                                           this.props.zoom(event.target.value);
                                       }}/>
                                       <span className='range_value'><output id="amountSpeed"
                                           htmlFor="rangeInputSpeed">{this.props.playbackRate}</output>x</span>
                                   </div>
                               </div>
                           </div>

                       </div>
                   </div>
               </div>
           </div>
        </div>
    }
}

export default EventPlayerControls;