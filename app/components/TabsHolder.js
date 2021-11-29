import React, {Fragment, PureComponent} from 'react';
import classnames from "classnames";
import {Nav, NavItem, NavLink, TabContent, TabPane} from 'reactstrap';
import Tab from '../containers/Tab'
import {
    ee,
    EVENT_OPEN_TAB,
    EVENT_SELECT_TAB, EVENT_UPDATE_EVENT_RECORDING_STATUS,
    EVENT_UPDATE_IS_EDIT_MODE_OPEN_IN_NAVIGATION_AND_TABS,
    EVENT_UPDATE_RECORDING_STATUS_IN_NAVIGATION, SHOW_EDIT_MODE_VIOLATION_MODAL
} from "../utils/library";
import {ContextMenu, ContextMenuTrigger, MenuItem} from "react-contextmenu";
const CLOSE_TAB = require('./pictures/close-tab.svg');

export default class extends PureComponent {
    constructor(props) {
        super(props);

        const keys = Object.keys(this.props.openTabs);
        this.state = {
            selectedTab: 0,
            tabs: keys,
            isAnnotationRecording: false,
            isEditModeOpen: false,
            isEventRecordingLive: false,
        };
    }

    updateIsEditModeOpen = (isOpen) => {
        this.setState({
            isEditModeOpen: isOpen
        })
    }

    componentDidMount() {
        ee.on(EVENT_OPEN_TAB, this._handleOpenTabEvent)
        ee.on(EVENT_UPDATE_RECORDING_STATUS_IN_NAVIGATION, this.updateIsRecordingStatus);
        ee.on(EVENT_UPDATE_IS_EDIT_MODE_OPEN_IN_NAVIGATION_AND_TABS, this.updateIsEditModeOpen);
        ee.on(EVENT_UPDATE_EVENT_RECORDING_STATUS , this.updateIsEventRecordingLive);

        if (this.props.location.state && this.props.location.state.firstInit) {
            this._selectTab(0);
        }
    }

    componentWillUnmount() {
        ee.removeListener(EVENT_UPDATE_RECORDING_STATUS_IN_NAVIGATION, this.updateIsRecordingStatus);
        ee.removeListener(EVENT_OPEN_TAB, this._handleOpenTabEvent)
        ee.removeListener(EVENT_UPDATE_IS_EDIT_MODE_OPEN_IN_NAVIGATION_AND_TABS, this.updateIsEditModeOpen);
        ee.removeListener(EVENT_UPDATE_EVENT_RECORDING_STATUS , this.updateIsEventRecordingLive);
    }

    updateIsEventRecordingLive = (isRecording) => {
        this.setState({
            isEventRecordingLive: isRecording
        })
    }

    updateIsRecordingStatus = () => {
        this.setState({
            isAnnotationRecording: !this.state.isAnnotationRecording
        })
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            tabs: Object.keys(nextProps.openTabs)
        });
    }

    _handleOpenTabEvent = (tab) => {
        this.props.createTab(tab);
        this._selectTab();
    };

    _closeTab = (e, index, name) => {
        e.stopPropagation();
        e.preventDefault();
        if (this.state.tabs.length > 1) {
            // If closing current tab, select previous
            if (index > this.state.selectedTab)
                this._selectTab(this.state.selectedTab);
            else if (index === 0 && index === this.state.selectedTab) {
                this._selectTab(0);
            } else if (index <= this.state.selectedTab)
                this._selectTab(this.state.selectedTab - 1);
            this.props.closeTab(name);
        }
    };

    render() {
        return (
            <div className="bst rcn_tabsholder">
                <Nav tabs className="scroll-tabs">
                    <a onClick={e => {
                        if (this.state.isAnnotationRecording || this.state.isEditModeOpen || this.state.isEventRecordingLive){
                            e.preventDefault();
                            ee.emit(SHOW_EDIT_MODE_VIOLATION_MODAL)
                        }else{
                            this.props.goToLibrary();
                        }
                    }}>
                        <img alt="logo" src={require('./pictures/logo.svg')} className="logo" title={"Go back to home page"}/>
                    </a>
                    {this.state.tabs.map((name, index) => {
                        return <NavItem key={index}>
                            <NavLink className={classnames({active: this.state.selectedTab === index})}
                                     onClick={(e) => {
                                         if (this.state.isAnnotationRecording || this.state.isEditModeOpen  || this.state.isEventRecordingLive){
                                             e.preventDefault();
                                             ee.emit(SHOW_EDIT_MODE_VIOLATION_MODAL)
                                         }else{
                                             this._selectTab(index, name);
                                         }
                                     }}>
                                {this.state.editTabIndex === index ?
                                    <Fragment>
                                        <input type='text' placeholder={name} autoFocus={true}
                                               onKeyUp={event => {
                                                   if (event.keyCode === 13) {
                                                       this.saveTabName();
                                                   } else if (event.keyCode === 27) {
                                                       this.setState({
                                                           editTabIndex: null,
                                                           newTabName: null,
                                                           oldName: null
                                                       });
                                                   }
                                               }}
                                               onChange={event => {
                                                   this.setState({
                                                       newTabName: event.target.value
                                                   });
                                               }}/>
                                    </Fragment> :
                                    <Fragment>
                                        <ContextMenuTrigger renderTag="span" id="tab-target_context_menu"
                                                            collect={() => {
                                                                return {
                                                                    tabName: name,
                                                                    index: index
                                                                };
                                                            }}>{name}
                                        </ContextMenuTrigger>
                                        {this.state.tabs.length > 1 ?
                                            <img src={CLOSE_TAB} className="close-tab"
                                                 alt="close tabs"
                                                 onClick={(e) => {
                                                     if (this.state.isAnnotationRecording  || this.state.isEditModeOpen  || this.state.isEventRecordingLive){
                                                         e.preventDefault();
                                                         ee.emit(SHOW_EDIT_MODE_VIOLATION_MODAL)
                                                     }else{
                                                         this._closeTab(e, index, name)
                                                     }
                                                 }}
                                            /> : ''}
                                    </Fragment>
                                }
                            </NavLink>
                        </NavItem>
                    })}
                    <li className="new-tab-wrapper">
                        <div className="new-tab" onClick={e => {
                            if (this.state.isAnnotationRecording || this.state.isEditModeOpen  || this.state.isEventRecordingLive){
                                e.preventDefault();
                                ee.emit(SHOW_EDIT_MODE_VIOLATION_MODAL)
                            }else{
                                this._handleOpenTabEvent('library');
                            }
                        }}>&nbsp;</div>
                    </li>
                </Nav>
                <TabContent activeTab={this.state.selectedTab}>
                    {this.state.tabs.map((name, index) => {
                        return this.state.selectedTab === index ? (
                            <TabPane key={index} tabId={index}>
                            <Tab tabName={name} match={this.props.match}/>
                        </TabPane>) : ''
                    })}
                </TabContent>
                <div>
                    <ContextMenu id="tab-target_context_menu">
                        <MenuItem data={{action: 'edit'}} onClick={this._handleContextMenu}>
                            <i className="fa fa-pencil" aria-hidden="true"/> Rename
                        </MenuItem>
                    </ContextMenu>
                </div>
            </div>
        );
    }

    saveTabName() {
        const name = this.state.newTabName;
        const index = this.state.editTabIndex;
        this.props.renameTab(this.state.oldName, this.state.newTabName);

        this.setState({
            editTabIndex: null,
            newTabName: null,
            oldName: null
        });

        this._selectTab(index, name);
    }

    _handleContextMenu = (e, data) => {
        if (data.action === 'edit') {
            this.setState({editTabIndex: data.index, oldName: data.tabName});
        }
    };

    _selectTab = (index, name) => {
        if (name in this.props.openTabs) {
            this.setState({
                selectedTab: index
            });
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, this.props.openTabs[name].view);
            }, 100);
        } else if (index === undefined) {
            setTimeout(() => {
                const keys = Object.keys(this.props.openTabs);
                this.setState({
                    selectedTab: keys.length - 1
                });
                ee.emit(EVENT_SELECT_TAB, this.props.openTabs[keys[keys.length - 1]].view);
            }, 100);
        } else {
            this.setState({
                selectedTab: index
            });
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, this.props.openTabs[this.state.tabs[index]].view);
            }, 100);
        }
    };
}
