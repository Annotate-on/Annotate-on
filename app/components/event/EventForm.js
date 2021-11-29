import React, {Component} from 'react';
import {Button, Col, Collapse, FormGroup, Input, Row} from "reactstrap";
import {
    ee,
    EVENT_UPDATE_EVENT_IN_EVENT_FORM,
    PATH_TO_EVENT_THUMBNAIL,
    REFRESH_EVENT_TIMELINE_STATE
} from "../../utils/library";
import path from "path";
import {getUserWorkspace} from "../../utils/config";
import {IMAGE_STORAGE_DIR, RESOURCE_TYPE_EVENT} from "../../constants/constants";
import {
    acceptedTimeIntervals,
    EVENT_DEFAULT_DURATION,
    EVENT_DEFAULT_TIME_EXTENSION,
    EVENT_STATUS_CREATED,
    EVENT_STATUS_FINISHED
} from "./Constants";
import {isNumber} from "lodash/lang";
import {_formatEventTimeDisplay, calculateTimeInSeconds, formatDate, getHours, getMinutes, getSeconds} from "./utils";

class EventForm extends Component {

    constructor(props) {
        super(props);
        this.state = {
            status: this.props.event !== null ? this.props.event.status : "New event",
            eventName: this.props.event !== null ? this.props.event.name : '',
            description: this.props.event !== null ? this.props.event.description : '',
            serie: this.props.event !== null ? this.props.event.serie : '',
            person: this.props.event !== null ? this.props.event.person : '',
            location: this.props.event !== null ? this.props.event.location : '',
            eventDuration: this.props.event !== null ? this.props.event.duration : EVENT_DEFAULT_DURATION,
            eventMaxDuration: this.props.event !== null ? this.props.event.eventMaxDuration : EVENT_DEFAULT_DURATION,
            eventDurationHours: this.props.event !== null ? this.props.eventDurationHours : '',
            eventDurationMinutes: this.props.event !== null ? this.props.eventDurationMinutes : '',
            eventTimeExtension: this.props.event !== null ? this.props.event.eventTimeExtension : EVENT_DEFAULT_TIME_EXTENSION,
            syncTimeStart: this.props.event !== null ? this.props.event.syncTimeStart : '',
            syncTimeEnd: this.props.event !== null ? this.props.event.syncTimeEnd : '',
            startDate: this.props.event !== null ? this.props.event.startDate : '',
            endDate: this.props.event !== null ? this.props.event.endDate : '',
            autoStartEvent: false,
            syncMinutes: this.props.event && this.props.event.startDate ? getMinutes(this.props.event.startDate) :  0,
            syncHours:  this.props.event && this.props.event.startDate ?  getHours(this.props.event.startDate) : 0,
            syncSeconds:  this.props.event && this.props.event.startDate ?  getSeconds(this.props.event.startDate) : 0,
            syncStartDate: this.props.event && this.props.event.startDate ? formatDate(this.props.event.startDate) : "",
            tabName: this.props.tabName ? this.props.tabName : '',
            timeCollapse: true
        }

        this.handleEventNameChange = this.handleEventNameChange.bind(this);
        this.handleEventPersonChange = this.handleEventPersonChange.bind(this);
        this.handleEventLocationChange = this.handleEventLocationChange.bind(this);
        this.handleEventDescriptionChange = this.handleEventDescriptionChange.bind(this);
        this.handleEventTimeChange = this.handleEventTimeChange.bind(this);
        this.handleEventHoursChange = this.handleEventHoursChange.bind(this);
        this.handleEventMinutesChange = this.handleEventMinutesChange.bind(this);
        this.handleEventSerieChange = this.handleEventSerieChange.bind(this);
        this.handleEventTimeExtensionChange = this.handleEventTimeExtensionChange.bind(this);
        this._submitEventEditForm = this._submitEventEditForm.bind(this);
        this.handleEventAutoStartChange = this.handleEventAutoStartChange.bind(this);
        this.handleEventSyncStarDateChange = this.handleEventSyncStarDateChange.bind(this);
        this.handleEventSyncStartHoursChange = this.handleEventSyncStartHoursChange.bind(this);
        this.handleEventSyncStartMinutesChange = this.handleEventSyncStartMinutesChange.bind(this);
    }

    componentDidMount() {
        ee.on(EVENT_UPDATE_EVENT_IN_EVENT_FORM , this._refreshEventFormState);
    }

    componentWillUnmount() {
        ee.removeListener(EVENT_UPDATE_EVENT_IN_EVENT_FORM, this._refreshEventFormState);

    }

    _refreshEventFormState = (event) => {
        if(event !== null && event !== undefined && event.status === EVENT_STATUS_FINISHED){
        this.setState({
            status: EVENT_STATUS_FINISHED,
            description: event.description,
            eventName: event.name,
            eventTimeExtension:  event.eventTimeExtension,
            location: event.location,
            person: event.person,
            serie:  event.serie,
            startDate: event.startDate ? event.startDate : null,
            endDate:  event.endDate ? event.endDate : null,
            syncSeconds: event.startDate ? getSeconds(event.startDate) :  0,
            syncMinutes: event.startDate ? getMinutes(event.startDate) :  0,
            syncHours:  event.startDate ?  getHours(event.startDate) : 0,
            syncStartDate: event.startDate ? formatDate(event.startDate) : "",
            syncTimeStart: event.syncTimeStart,
            syncTimeEnd: event.syncTimeEnd,
        })
        }

    }

    handleEventSyncStarDateChange = (event) => {
        this.setState({
            syncStartDate: event.target.value
        })
    }

    handleEventSyncStartHoursChange = (event) => {

        let hours = parseInt(event.target.value);

        if (hours > 23){
            this.setState({
                syncHours: 23
            })
        }
        else if (hours < 0){
            this.setState({
                syncHours: 0
            })
        }else{
            this.setState({
                syncHours: event.target.value
            })
        }
    }

    handleEventSyncStartSecondsChange = (event) => {

        let sec = parseInt(event.target.value);

        if (sec > 59){
            this.setState({
                syncSeconds: 59
            })
        }
        else if (sec < 0){
            this.setState({
                syncSeconds: 0
            })
        }else{
            this.setState({
                syncSeconds: event.target.value
            })
        }
    }

    handleEventSyncStartMinutesChange = (event) => {

        let minutes = parseInt(event.target.value);

        if (minutes > 59){
            this.setState({
                syncMinutes: 59
            })
        }
        else if (minutes < 0){
            this.setState({
                syncMinutes: 0
            })
        }else{
            this.setState({
                syncMinutes: event.target.value
            })
        }

    }


    handleEventAutoStartChange = () => {
        this.setState({
            autoStartEvent: !this.state.autoStartEvent
        })
    }

    componentWillReceiveProps(nextProps: Readonly<P>, nextContext: any) {
        if (nextProps.tabName !== undefined){
            this.setState({
                tabName: nextProps.tabName
            })
        }
    }


    componentDidUpdate(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot: SS) {
        if(prevProps.event !== null && this.props.event !== null && prevProps.event.sha1 !== this.props.event.sha1){
            this.setState({
                status: this.props.event.status,
                eventName: this.props.event.name,
                description: this.props.event.description,
                serie: this.props.event.serie,
                duration: this.props.event.duration,
                person: this.props.event.person,
                location: this.props.event.location,
                eventDuration: this.props.event.duration,
                eventMaxDuration: this.props.event.eventMaxDuration,
                eventDurationHours: this.props.event.eventDurationHours,
                eventDurationMinutes: this.props.event.eventDurationMinutes,
                eventTimeExtension: this.props.event.eventTimeExtension,
                syncSeconds: this.props.event.startDate ? getSeconds(this.props.event.startDate) :  0,
                syncMinutes: this.props.event.startDate ? getMinutes(this.props.event.startDate) :  0,
                syncHours:  this.props.event.startDate ?  getHours(this.props.event.startDate) : 0,
                syncStartDate: this.props.event.startDate ? formatDate(this.props.event.startDate) : "",
                syncTimeStart: this.props.event.syncTimeStart,
                syncTimeEnd: this.props.event.syncTimeEnd,
            })
        }
    }

    handleEventPersonChange = (event) => {
        this.setState({
            person: event.target.value
        });
    }

    handleEventLocationChange = (event) => {
        this.setState({
            location: event.target.value
        });
    }

    handleEventTimeExtensionChange(event){
        let timeValue = parseInt(event.target.value);
        this.setState({
            eventTimeExtension: timeValue
        });
    }


    handleEventSerieChange(event){
        this.setState({
            serie: event.target.value
        });
    }

    handleEventDescriptionChange(event) {
        this.setState({
            description: event.target.value
        });
    }

    handleEventNameChange(event) {
        this.setState({
            eventName: event.target.value
        });
    }

    handleEventTimeChange(event) {
        let timeValue = parseInt(event.target.value);
        this.setState({
            eventMaxDuration: acceptedTimeIntervals.includes(timeValue) ? timeValue : EVENT_DEFAULT_DURATION,
            eventDurationHours: '',
            eventDurationMinutes: ''
        });
    }

    handleEventHoursChange  = (event) => {
        let hours = parseInt(event.target.value);

        if (isNaN(hours) && event.target.value === ''){
            this.setState({
                eventDurationHours: 0
            })
        }
        if (hours <= 24) {
            this.setState({
                eventDurationHours: hours,
                eventMaxDuration: ''
            })
        }
    }

    handleEventMinutesChange  = (event) => {
        let minutes = parseInt(event.target.value);

        if (isNaN(minutes) && event.target.value === ''){
            this.setState({
                eventDurationMinutes: 0
            })
        }

        if (minutes <= 59) {
            this.setState({
                eventDurationMinutes: minutes,
                eventMaxDuration: ''
            })
        }
    }

    _submitEventEditForm = () => {
        if (this.getEventDuration() === 0){
            alert('please enter event duration.')
            return false;
        }else{
            const editedEvent = this.props.event;
            editedEvent.name = this.state.eventName;
            editedEvent.description = this.state.description;
            editedEvent.serie = this.state.serie;
            editedEvent.person = this.state.person;
            editedEvent.location = this.state.location;
            if (this.props.event.status !== EVENT_STATUS_FINISHED){
                editedEvent.duration = this.getEventDuration();
                editedEvent.eventDurationHours = this.state.eventDurationHours;
                editedEvent.eventDurationMinutes = this.state.eventDurationMinutes;
                editedEvent.eventMaxDuration = this.state.eventMaxDuration;
                editedEvent.eventTimeExtension = this.state.eventTimeExtension;
            }else{
                let [year, month , day] = this.state.syncStartDate.split('-');
                const newStartDate = new Date(year, month-1, day, this.state.syncHours, this.state.syncMinutes , this.state.syncSeconds)
                const newEndDate  = new Date(year, month-1, day, this.state.syncHours, this.state.syncMinutes , (newStartDate.getSeconds() + editedEvent.duration));
                editedEvent.startDate = newStartDate.toString();
                editedEvent.endDate = newEndDate.toString();
                editedEvent.syncTimeStart = calculateTimeInSeconds(newStartDate);
                editedEvent.syncTimeEnd = editedEvent.syncTimeStart + editedEvent.duration;
            }
            this.props.editEvent(editedEvent.sha1 , editedEvent);
            setTimeout( ()=> {
                ee.emit(REFRESH_EVENT_TIMELINE_STATE);
            } , 100)
        }
    }

    validateCreatedEventTime = (time) => {
        return !(time === '' || time === undefined);
    }

    getEventDuration = () => {
        if (this.props.event && this.props.event.duration > 0 && this.props.event.status === EVENT_STATUS_FINISHED){
            return this.props.event.duration
        }
        else if (this.validateCreatedEventTime(this.state.eventDurationHours) || this.validateCreatedEventTime(this.state.eventDurationMinutes)){
            let hours = isNumber(this.state.eventDurationHours) ? this.state.eventDurationHours * 3600 : 0;
            let minutes = isNumber(this.state.eventDurationMinutes) ? this.state.eventDurationMinutes * 60 : 0;
            return hours + minutes
        }else if (this.state.eventMaxDuration !== '' && this.state.eventMaxDuration !== undefined){
            return this.state.eventMaxDuration;
        }else{
            return  EVENT_DEFAULT_TIME_EXTENSION;
        }
    }

    _isEventNameAlreadyTaken = (path) => {
        let isTaken = false;
        if (this.props.allPictures && Object.keys(this.props.allPictures).length === 0){
            return  false;
        }

        const selectedFolders = this.props.tabData[this.props.tabName].selected_folders;
        const picturesInSelection = this.props.tabData[this.props.tabName].pictures_selection;

        //When there is folder selected and image in selection just check these instead looping thru all resources
        if (selectedFolders.length === 0 && picturesInSelection === 0){
            if (selectedFolders.includes(this.props.parentFolder)){
                if(picturesInSelection.length > 0){
                    picturesInSelection.forEach( resourceId => {
                        const filePath = this.props.allPictures[resourceId].file;
                        if (filePath === path){
                            isTaken = true;
                            return isTaken;
                        }
                    })
                }else{
                    return false;
                }
            }
        }else{
            Object.keys(this.props.allPictures).forEach(key => {
                if (this.props.allPictures[key]?.file === path){
                    isTaken = true;
                    return isTaken;
                }
            })
        }

        return  isTaken;
    }

    _createNewEvent = (startNow) => {

        if(this.state.eventName.length === 0 || this.state.eventDuration === 0){
            alert('please enter event name and duration')
            return false;
        }

        const eventId =  chance.guid();
        const DESTINATION_DIR = path.join(getUserWorkspace(), IMAGE_STORAGE_DIR , this.props.parentFolder);
        const EVENT_PATH = path.join(DESTINATION_DIR , this.state.eventName)


        if (this._isEventNameAlreadyTaken(EVENT_PATH)){
            alert('event with name ' + this.state.eventName + ' already exists in this folder.')
            return false;
        }


        const event = {
            id: eventId,
            sha1: eventId,
            name: this.state.eventName,
            description: this.state.description,
            serie: this.state.serie,
            person: this.state.person,
            location: this.state.location,
            duration: this.getEventDuration(),
            eventMaxDuration: this.state.eventMaxDuration,
            eventDurationHours: this.state.eventDurationHours,
            eventDurationMinutes: this.state.eventDurationMinutes,
            resourceType: RESOURCE_TYPE_EVENT,
            file: EVENT_PATH,
            file_basename: this.state.eventName,
            status: EVENT_STATUS_CREATED,
            startDate: null,
            endDate: null,
            syncTimeStart: null ,
            syncTimeEnd: null,
            thumbnail: PATH_TO_EVENT_THUMBNAIL,
            eventTimeExtension: this.state.eventTimeExtension,
            autoStart: startNow
        }

        this.props.createAnnotateEvent(event);
        this.props.selectFolderGlobally(this.props.parentFolder);
        if (startNow && this.state.tabName !== null && this.state.tabName !== undefined){
            this.props.goToImage(eventId);
        }else{
            this.props.goToLibrary();
        }

    }

    render() {

        if (this.props.event && this.props.event.eventMaxDuration === "" &&
            this.state.eventDurationHours === undefined || this.state.eventDurationMinutes === undefined){
            this.setState({
                eventDurationHours: this.props.event.eventDurationHours > 0 ? this.props.event.eventDurationHours : '',
                eventDurationMinutes: this.props.event.eventDurationMinutes > 0 ? this.props.event.eventDurationMinutes : '',
            })
        }

        return (
            <div className={this.props.isCreateMode ? "event-form" : "event-form event-form-edit-mode"}>
                {
                    this.props.event !== null && this.props.isCreateMode === false && this.props.event.status === EVENT_STATUS_FINISHED ?
                        <h5 className="event-header-text">Event edition</h5> : null
                }
                <div className="event-form-item">
                    <Row>
                        <Col sm={3} md={3} lg={3} className="event-form-field-label">
                            Status:
                        </Col>
                        <Col sm={9} md={9} lg={9} className="event-status">
                            <span><b>{this.state.status}</b></span>
                        </Col>
                    </Row>
                </div>
                <div className="event-form-item">
                    <Row>
                        <Col sm={3} md={3} lg={3}  className="event-form-field-label">
                            Name:
                        </Col>
                        <Col sm={9} md={9} lg={9}>
                            <Input type="text" name="eventName" id="eventName" value={this.state.eventName} onChange={this.handleEventNameChange}/>
                        </Col>
                    </Row>
                </div>
                <div className="event-form-item">
                    <Row>
                        <Col sm={3} md={3} lg={3}  className="event-form-field-label">
                            Description:
                        </Col>
                        <Col sm={9} md={9} lg={9}>
                            <Input type="textarea" name="description" id="description" className="description-input-field" value={this.state.description} onChange={this.handleEventDescriptionChange}/>
                        </Col>
                    </Row>
                </div>
                <div className="event-form-item">
                    <Row>
                        <Col sm={3} md={3} lg={3}  className="event-form-field-label">
                            Serie:
                        </Col>
                        <Col sm={9} md={9} lg={9}>
                            <Input type="text" name="serie" id="serie" value={this.state.serie} onChange={this.handleEventSerieChange}/>
                        </Col>
                    </Row>
                </div>
                <div className="event-form-item">
                    <Row>
                        <Col sm={3} md={3} lg={3}  className="event-form-field-label">
                            Person:
                        </Col>
                        <Col sm={9} md={9} lg={9}>
                            <Input type="text" name="person" id="person" value={this.state.person} onChange={this.handleEventPersonChange}/>
                        </Col>
                    </Row>
                </div>
                <div className="event-form-item">
                    <Row>
                        <Col sm={3} md={3} lg={3}  className="event-form-field-label">
                            Location:
                        </Col>
                        <Col sm={9} md={9} lg={9}>
                            <Input type="text" name="location" id="location" value={this.state.location} onChange={this.handleEventLocationChange}/>
                        </Col>
                    </Row>
                </div>
                {
                    this.props.event !== null && this.props.isCreateMode === false && this.props.event.status === EVENT_STATUS_FINISHED ?
                        <div>
                            <div className="event-form-item">
                                <Row>
                                    <Col sm={3} md={3} lg={3}  className="event-form-field-label">
                                        Duration:
                                    </Col>
                                    <Col sm={2} md={2} lg={2}>
                                        <p>{_formatEventTimeDisplay(this.props.event.duration)}</p>
                                    </Col>
                                    <Col sm={7} md={7} lg={7}/>
                                </Row>
                            </div>

                            <div className="event-form-item">
                                <Row className="date-option-row">
                                    <Col sm={3} md={3} lg={3}  className="event-form-field-label">
                                        Start Date:
                                    </Col>
                                    <Col sm={3} md={3} lg={3}>
                                        <Input type="date"
                                               value={this.state.syncStartDate}
                                               onChange={event => this.handleEventSyncStarDateChange(event)}/>
                                    </Col>
                                    <Col sm={2} md={2} lg={2}>
                                        <FormGroup className="fg-display-flex">
                                            <Input type="number"  min="0" max="24" name="e_hours" id="e_hours" value={this.state.syncHours} onChange={ (event) => this.handleEventSyncStartHoursChange(event)}/>
                                            <label><p>h</p></label>
                                        </FormGroup>
                                    </Col>
                                    <Col sm={2} md={2} lg={2}>
                                        <FormGroup className="fg-display-flex">
                                            <Input type="number"  min="0" max="59" name="e_minutes" id="e_minutes" value={this.state.syncMinutes} onChange={ (event) => this.handleEventSyncStartMinutesChange(event)}/>
                                            <label><p>m</p></label>
                                        </FormGroup>
                                    </Col>
                                    <Col sm={2} md={2} lg={2}>
                                        <FormGroup className="fg-display-flex">
                                            <Input type="number"  min="0" max="59" name="e_minutes" id="e_minutes" value={this.state.syncSeconds} onChange={ (event) => this.handleEventSyncStartSecondsChange(event)}/>
                                            <label><p>s</p></label>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </div>
                        </div> :
                        <div>
                            <div className="event-form-item">
                                <Row>
                                    <Col sm={3} md={3} lg={3}  className="event-form-field-label">
                                    </Col>
                                    <Col sm={3} md={3} lg={3} className="advanced-options-title">
                                        <Button
                                            color="link"
                                            className="event-button"
                                            onClick={ ()=> {
                                                this.setState({timeCollapse: !this.state.timeCollapse})
                                            }}
                                        >advanced options</Button>
                                    </Col>
                                    <Col sm={6} md={6} lg={6}/>
                                </Row>
                            </div>
                            <Collapse isOpen={this.state.timeCollapse}>
                            <div className="event-form-item">
                                <Row className="date-option-row">
                                    <Col sm={3} md={3} lg={3}  className="event-form-field-label">
                                        Maximum event duration:
                                    </Col>
                                    <Col sm={3} md={3} lg={3}>
                                        <Input type="select" name="duration_sl" id="duration_sl" value={this.state.eventMaxDuration} onChange={ (event) => this.handleEventTimeChange(event)}>
                                            <option>{''}</option>
                                            <option value="3600">1h</option>
                                            <option value="7200">2h</option>
                                            <option value="10800">3h</option>
                                        </Input>
                                    </Col>
                                    <Col sm={1} md={1} lg={1}>
                                        <p>or</p>
                                    </Col>
                                    <Col sm={2} md={2} lg={2}>
                                        <FormGroup className="fg-display-flex">
                                            <Input type="number"  min="0" max="24" name="e_hours" id="e_hours" value={this.state.eventDurationHours} onChange={ (event) => this.handleEventHoursChange(event)}/>
                                            <label><p>h</p></label>
                                        </FormGroup>
                                    </Col>
                                    <Col sm={2} md={2} lg={2}>
                                        <FormGroup className="fg-display-flex">
                                            <Input type="number"  min="0" max="59" name="e_minutes" id="e_minutes" value={this.state.eventDurationMinutes} onChange={ (event) => this.handleEventMinutesChange(event)}/>
                                            <label><p>m</p></label>
                                        </FormGroup>
                                    </Col>
                                    <Col sm={1} md={1} lg={1}/>
                                </Row>
                            </div>

                            <div className="event-form-item">
                                <Row>
                                    <Col sm={3} md={3} lg={3}  className="event-form-field-label">
                                        Automatic time extension:
                                    </Col>
                                    <Col sm={3} md={3} lg={3}>
                                        <Input type="select" name="duration_ex" id="duration_ex" value={this.state.eventTimeExtension} onChange={ event => this.handleEventTimeExtensionChange(event)}>
                                            <option value="1800">+30min</option>
                                            <option value="3600">+1h</option>
                                            <option value="7200">+2h</option>
                                            <option value="0">none</option>
                                        </Input>
                                    </Col>
                                    <Col sm={6} md={6} lg={6}/>
                                </Row>
                            </div>
                            </Collapse>
                        </div>
                }
                {
                    this.props.isCreateMode ?
                        <div className="event-form-item">
                            <Row>
                                <Col sm={3} md={3} lg={3}  className="event-form-field-label">
                                </Col>
                                <Col sm={3} md={3} lg={3}>
                                    <Button
                                        color="success"
                                        className="event-button"
                                        disabled={this.state.eventName.length === 0 || this.getEventDuration() === 0}
                                        onClick={ ()=> {
                                                this._createNewEvent(true);
                                        }}
                                    >Start event now</Button>
                                </Col>
                                <Col sm={6} md={6} lg={6}/>
                            </Row>
                        </div> : null
                }

                <Row className="ef-action-buttons">
                    <Col sm={3} md={3} lg={3}  className="event-form-field-label">
                    </Col>
                    <Col sm={9} md={9} lg={9}>
                        <Button disabled={this.state.eventName.length === 0 || this.getEventDuration() === 0} color="primary" className="event-button" onClick={ ()=> {
                            if (this.props.isCreateMode){
                                this._createNewEvent(false);
                            }else{
                                this._submitEventEditForm();
                            }
                        }}>{this.props.isCreateMode ? 'Create new event' : 'Save changes'}
                        </Button>
                        <Button
                            className={`btn btn-primary ef-cancel-button`}
                            title="Go back to library"
                            color="blue"
                            onClick={() => {
                                if (this.props.isCreateMode){
                                    this.props.goToLibrary();
                                }else{
                                    this.props.cancelEditEvent();
                                }}}
                        >
                            Cancel
                        </Button>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default EventForm;
