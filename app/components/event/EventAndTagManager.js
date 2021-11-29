import React, {Component} from 'react';
import {Nav, NavItem, NavLink, TabContent, TabPane} from 'reactstrap';
import classnames from 'classnames';
import EventForm from "../../containers/EventForm";
import {ee, EVENT_UPDATE_EVENT_RECORDING_STATUS} from "../../utils/library";
import TagManager from "../../containers/TagManager";


class EventAndTagManager extends Component {

    constructor(props) {
        super(props);
        this.state = {
            activeTab : '2',
            isEventRecording: false,
            calcHeight: null
        }
    }

    componentDidMount() {
        const height =  (document.getElementById('rcn_event').clientHeight * 0.9) - 185;
        this.setState({
            calcHeight: height
        })
        ee.on(EVENT_UPDATE_EVENT_RECORDING_STATUS , this._updateRecordingStatus)
    }

    componentWillUnmount() {
        ee.removeListener(EVENT_UPDATE_EVENT_RECORDING_STATUS , this._updateRecordingStatus)
    }

    _updateRecordingStatus = () => {
        console.log(!this.state.isEventRecording)
        this.setState({
            isEventRecording: !this.state.isEventRecording,
            activeTab: !this.state.isEventRecording ? '2' : '1'
        })
    }

    toggle = tab => {
        if(this.state.activeTab !== tab) {
            this.setState({
                activeTab: tab
            })
        }
    }

    cancelEditEvent = () => {
        this.toggle('2');
    }

    render() {
        return (
            <div style={{background: 'white'}}>
                <Nav tabs>
                    <NavItem>
                        <NavLink
                            className={classnames({ active: this.state.activeTab === '1' })}
                            disabled={this.state.isEventRecording}
                            onClick={() => { this.toggle('1'); }}
                        >
                            Event
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink
                            className={classnames({ active: this.state.activeTab === '2' })}
                            onClick={() => { this.toggle('2'); }}
                        >
                            Keywords
                        </NavLink>
                    </NavItem>
                </Nav>
                <TabContent className="eventAndTagManagerTab" style={{maxHeight: this.state.calcHeight !== null ? this.state.calcHeight : '90%'}} activeTab={this.state.activeTab}>
                    <TabPane tabId="1">
                        <div className="edit-form-tagmanager-wrapper">
                            <EventForm
                                cancelEditEvent={this.cancelEditEvent}
                                editEvent={this.props.editEvent}
                                event={this.props.event}
                                parentFolder={this.state.parentFolder}
                                isCreateMode={false}
                            />
                        </div>
                    </TabPane>
                    <TabPane tabId="2">
                       <TagManager isModalOrTab={true} isModalView={false} screen="tab"/>
                    </TabPane>
                </TabContent>
            </div>
        );
    }
}

export default EventAndTagManager;