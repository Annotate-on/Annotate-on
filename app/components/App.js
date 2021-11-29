import fs from 'fs-extra';
import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import styled, {css} from 'styled-components';
import path from 'path';
import {getCacheDir, getThumbNailsDir, getUserWorkspace} from '../utils/config'
import {
    IMAGE_STORAGE_DIR,
    MAIN_NAV_BG,
    MAIN_NAV_FG,
    MAIN_NAV_FG_OVER,
    NAV_SIZE,
    TAG_AUTO,
    TAG_DPI_1200,
    TAG_DPI_150,
    TAG_DPI_300,
    TAG_DPI_600,
    TAG_DPI_75,
    TAG_DPI_NO,
    TAG_GPS_NO,
    TAG_GPS_WIDTH,
    TAG_MODE_LANDSCAPE,
    TAG_MODE_PORTRAIT
} from '../constants/constants';
import {
    ee,
    EVENT_CREATE_SYSTEM_TAGS,
    EVENT_HIDE_LOADING,
    EVENT_HIDE_WAITING,
    EVENT_SELECT_TAB,
    EVENT_SHOW_ALERT,
    EVENT_SHOW_LOADING,
    EVENT_SHOW_WAITING,
    EVENT_UPDATE_RECORDING_STATUS_IN_NAVIGATION,
    EVENT_UPDATE_IS_EDIT_MODE_OPEN_IN_NAVIGATION_AND_TABS,
    SHOW_EDIT_MODE_VIOLATION_MODAL,
    updateProjectInfo,
    EVENT_UPDATE_EVENT_RECORDING_STATUS,
    EVENT_FORCE_UPDATE_EDIT_MODE,
    updateProjectInfoVersion,
    getProjectVersion
} from '../utils/library';
import {Alert, Col, Container, Row} from "reactstrap";
import Loading from "../containers/Loading";
import {DotLoader} from "react-spinners";
import {mapStackTrace} from 'sourcemapped-stacktrace';
import {escapePathString} from "../utils/js";
import {createNewCategory, createNewTag} from "./tags/tagUtils";
import Chance from "chance";
import SwitchProject from "../containers/SwitchProject";
import packageJson from "../../package.json";

const chance = new Chance();

const _Root = styled.div`
  background-color: white;
  display: flex;
  height: 100%;
  width: 100%;
`;

const _Main = styled.main`
  height: 100%;
  width: 100%;
  // overflow-x: auto;
  // overflow-y: auto;
`;

const _Nav = styled.nav`
  // background-color: ${MAIN_NAV_BG};
  display: flex;
  flex-direction: column;
  height: 100%;
  width: ${NAV_SIZE}px;
  background-color: #fff;
  border: solid 0.5px #dddddd;
`;

const _Link = styled(Link)`
  color: ${MAIN_NAV_FG};
  // display: flex;
  // line-height: ${NAV_SIZE}px;
  padding-top: 12px;
  text-align: center;
  transition: color 500ms ease;
  // width: ${NAV_SIZE}px;
  text-decoration: none;
  color: black;

  &:hover {
  // color: ${MAIN_NAV_FG_OVER};
    transition: color 250ms ease;
  }

  ${props =>
    props.selected &&
    css`background-color: #1d70f7;`
};
`;

export const annRecordingMsg = 'Please finish annotation creation/edit to continue.';
export const eventRecordingMsg = 'Please finish event recording to continue..';
const CREDITS = 'CREDITS';
const TAG_MANAGER = 'TAG_MANAGER';
const EVENT = 'EVENT';
const SELECTION = 'SELECTION';
const IMAGE = 'IMAGE';
const DATA = 'DATA';
const SETTINGS = 'SETTINGS';
const TAXONOMIES = 'TAXONOMIES';
const ERROR = require('./pictures/error.svg');
let autoSaveInterval;
let waitPane;
let waitText;

export default class AppMenu extends Component {

    constructor(props, context) {
        super(props, context);
        this.state = {
            selectedMenu: SELECTION,
            showAlert: false,
            alertText: '',
            showLoading: false,
            hasError: false,
            errorInfo: null,
            error: null,
            isAnnotationRecording: false,
            isEditModeOpen: false,
            showEditFormViolationModal: false,
            isEventRecordingLive: false,
            showProjects: false,
        }
    }

    componentDidCatch(error, errorInfo) {
        // Display fallback UI
        this.setState({hasError: true, error, errorInfo});
    }

    componentDidMount() {

        console.log('Mounting main app component !!!')
        console.log('checking for project version')
        const version = getProjectVersion();
        console.log('project version ....' , version);
        if (!version){
            console.log('project is missing version , setting version from package.json ' + packageJson.version)
           updateProjectInfoVersion(packageJson.version)
           console.log('updating tags structure...')
           this.props.flatOldTags();
        }

        ee.addListener(EVENT_SELECT_TAB, this._selectComponent);
        ee.on(EVENT_FORCE_UPDATE_EDIT_MODE , this.forceUpdateIsEditModeOpen)
        ee.on(EVENT_SHOW_ALERT, this._showAlert);
        ee.on(EVENT_SHOW_LOADING, this._showLoading);
        ee.on(EVENT_HIDE_LOADING, this._hideLoading);
        ee.on(EVENT_CREATE_SYSTEM_TAGS, this._createSystemTags);
        ee.on(EVENT_SHOW_WAITING, this._showWaiting);
        ee.on(EVENT_HIDE_WAITING, this._hideWaiting);
        ee.on(EVENT_UPDATE_RECORDING_STATUS_IN_NAVIGATION, this.updateIsRecordingStatus);
        ee.on(EVENT_UPDATE_IS_EDIT_MODE_OPEN_IN_NAVIGATION_AND_TABS, this.updateIsEditModeOpen);
        ee.on(SHOW_EDIT_MODE_VIOLATION_MODAL , this._showEditFormViolationModalWarning);
        ee.on(EVENT_UPDATE_EVENT_RECORDING_STATUS , this.updateIsEventRecordingLive);



        let localCounter = this.props.counter;
        // Autosave current app state to json.
        autoSaveInterval = setInterval(() => {
            if (localCounter !== this.props.counter) {
                const start = performance.now();
                const file = path.join(getCacheDir(), 'current-work.json');
                const currentState = {...this.props.appState};
                const storagePathLength = path.join(getUserWorkspace(), IMAGE_STORAGE_DIR).length;
                const thumbnailPathLength = getThumbNailsDir().length;
                const pictures = {};
                for (const sha1 in currentState.pictures) {
                    pictures[sha1] = {
                        ...currentState.pictures[sha1],
                        file: escapePathString(currentState.pictures[sha1].file.slice(storagePathLength)),
                        thumbnail: escapePathString(currentState.pictures[sha1].thumbnail.slice(thumbnailPathLength))
                    }
                }
                currentState.pictures = pictures;

                for(const tabName in currentState.open_tabs) {
                    const tab = currentState.open_tabs[tabName];
                    if('taxonomyInstance' in tab)
                        delete tab.taxonomyInstance;
                }

                //TODO: check if file exists
                fs.writeFileSync(file, JSON.stringify(currentState));

                localCounter = this.props.counter;
                console.log(`Save current work state done in ${performance.now() - start}ms.`)
            }
        }, 2000);

        this._createSystemTags();

        waitPane = document.getElementById('waitPane');
        waitText = document.getElementById('waitText');
    }

    componentWillUnmount() {
        ee.removeAllListeners(EVENT_FORCE_UPDATE_EDIT_MODE , this.forceUpdateIsEditModeOpen)
        ee.removeListener(EVENT_SELECT_TAB, this._selectComponent);
        ee.removeListener(EVENT_SHOW_ALERT, this._showAlert);
        ee.removeListener(EVENT_SHOW_LOADING, this._showLoading);
        ee.removeListener(EVENT_HIDE_LOADING, this._hideLoading);
        ee.removeListener(EVENT_CREATE_SYSTEM_TAGS, this._createSystemTags);
        ee.removeListener(EVENT_SHOW_WAITING, this._showWaiting);
        ee.removeListener(EVENT_HIDE_WAITING, this._hideWaiting);
        ee.removeListener(EVENT_UPDATE_RECORDING_STATUS_IN_NAVIGATION, this.updateIsRecordingStatus);
        ee.removeListener(EVENT_UPDATE_EVENT_RECORDING_STATUS , this.updateIsEventRecordingLive);
        ee.removeListener(EVENT_UPDATE_IS_EDIT_MODE_OPEN_IN_NAVIGATION_AND_TABS, this.updateIsEditModeOpen);
        ee.removeListener(SHOW_EDIT_MODE_VIOLATION_MODAL , this._showEditFormViolationModalWarning)

        clearInterval(autoSaveInterval)
    }

    updateIsEventRecordingLive = (isRecording) => {
        this.setState({
            isEventRecordingLive: isRecording
        })
    }

    forceUpdateIsEditModeOpen = () => {
        this.setState({
            isAnnotationRecording: false,
            isEventRecordingLive: false,
        })
    }
    updateIsEditModeOpen = (isOpen) => {
        this.setState({
            isEditModeOpen: isOpen
        })
    }

    updateIsRecordingStatus = () => {
        this.setState({
            isAnnotationRecording: !this.state.isAnnotationRecording
        })
    }

    componentWillUpdate(nextProps, nextState) {
        if (nextProps.picturesSize !== this.props.picturesSize) {
            console.log('Update pictures and folder size.');
            updateProjectInfo(nextProps.picturesSize);
        }
    }

    _createSystemTags = () => {
        // Create default system tags.

        const newCategory = createNewCategory(chance.guid() , TAG_AUTO);
        this.props.createCategory(newCategory)
        this.props.addSubCategory(TAG_AUTO, createNewTag(chance.guid() , TAG_DPI_NO), false , newCategory.id);
        this.props.addSubCategory(TAG_AUTO, createNewTag(chance.guid() , TAG_MODE_LANDSCAPE), false, newCategory.id);
        this.props.addSubCategory(TAG_AUTO, createNewTag(chance.guid() , TAG_MODE_PORTRAIT), false, newCategory.id);
        this.props.addSubCategory(TAG_AUTO, createNewTag(chance.guid() , TAG_GPS_WIDTH), false, newCategory.id);
        this.props.addSubCategory(TAG_AUTO, createNewTag(chance.guid() , TAG_GPS_NO), false, newCategory.id);
        this.props.addSubCategory(TAG_AUTO, createNewTag(chance.guid() , TAG_DPI_75), false, newCategory.id);
        this.props.addSubCategory(TAG_AUTO, createNewTag(chance.guid() , TAG_DPI_150), false, newCategory.id);
        this.props.addSubCategory(TAG_AUTO, createNewTag(chance.guid() , TAG_DPI_300), false, newCategory.id);
        this.props.addSubCategory(TAG_AUTO, createNewTag(chance.guid() , TAG_DPI_600), false, newCategory.id);
        this.props.addSubCategory(TAG_AUTO, createNewTag(chance.guid() , TAG_DPI_1200), false, newCategory.id);
    };

    _showAlert = (text) => {
        this.setState({
            alertText: text,
            showAlert: true
        });
        setTimeout(() => {
            this.setState({
                alertText: '',
                showAlert: false
            })
        }, 2000)
    };


    _showEditFormViolationModalWarning = () => {
        if (this.state.showEditFormViolationModal === false){
            this.setState({
                showEditFormViolationModal: true
            });
            setTimeout(() => {
                this.setState({
                    showEditFormViolationModal: false
                })
            }, 5000)
        }
    }

    _showWaiting = (text) => {
        try{
            console.log('Show waiting')
            waitPane.classList.add('visible');
            waitText.classList.add('visible');
            waitText.textContent = text;
        }catch(e){
            console.log(e);
        }
    };

    _hideWaiting = () => {
        console.log('Hide waiting')
        setTimeout(() => {
            waitPane.classList.remove('visible');
            waitText.classList.remove('visible');
            waitText.textContent = '';
        }, 500)
    };

    _onProjectSwitch = () => {
        this.setState({
            hasError: false
        })
        this.props.goToLibrary();
    }

    _showLoading = (files) => {
        this.setState({showLoading: true, files})
    };

    _hideLoading = () => {
        this.setState({showLoading: false})
    };

    _selectComponent = (selection) => {

        if (selection === 'eventHome'){
            this.setState({
                selectedMenu: selection
            })
        }else{
            this.setState({
                selectedMenu: selection === 'library' ? SELECTION : selection === 'image' ? IMAGE : DATA
            });
        }
    };

    render() {
        return (
            <_Root >
                <div className="bst annotate-alert-message-wrapper">
                    <Alert className='annotate-alert-message' isOpen={this.state.showEditFormViolationModal} toggle={ ()=> {this.setState({showEditFormViolationModal: false})}}>
                        <div className="alertText">
                            {this.state.isEventRecordingLive ? eventRecordingMsg : annRecordingMsg}
                        </div>
                    </Alert>
                </div>
                <div className="bst lock-selection-alert">
                    <Alert color="primary" className="show-first" isOpen={this.state.showAlert}>
                        <div className="alertText">
                            {this.state.alertText}
                        </div>
                    </Alert>
                </div>
                <div id="waitPane" className="wait-pane">
                    <div className="wait-content">
                        <div className="wait-spinner">
                            <DotLoader size={60} color={'#ff9800'}/>
                        </div>
                        <span id="waitText" className="wait-text"/>
                    </div>
                </div>
                {this.state.showLoading ?
                    <Loading files={this.state.files}/> : ''
                }
                <_Main>

                    {this.state.hasError ? this._errorDisplay() : this.props.children}</_Main>
                <_Nav>
                    <_Link className={(this.state.selectedMenu === SELECTION ? 'active-menu-item' : '') + ' menu-item'}
                           to="/selection"
                           onClick={(e) => {
                               if (this.state.isAnnotationRecording || this.state.isEditModeOpen || this.state.isEventRecordingLive){
                                   e.preventDefault();
                                   this._showEditFormViolationModalWarning();
                               }else {
                                   setTimeout(() => {
                                       ee.emit(EVENT_SELECT_TAB, 'library')
                                   }, 100)
                               }
                           }} title="Library to keywords and select images for annotating">
                        <div className="nav_box">
                            <div className="box"/>
                            <div className="right-menu-title">Library</div>
                        </div>
                    </_Link>
                    <_Link className={(this.state.selectedMenu === SETTINGS ? 'active-menu-item' : '') + ' menu-item'}
                           to="/settings"
                           onClick={(e) => {
                               if (this.state.isAnnotationRecording  || this.state.isEditModeOpen || this.state.isEventRecordingLive){
                                   e.preventDefault();
                                   this._showEditFormViolationModalWarning();
                               }else {
                                   this.setState({
                                       selectedMenu: SETTINGS
                                   });
                               }
                           }} title="Projects">
                        <div className="nav_box">
                            <div className="settings"/>
                            <div className="right-menu-title">Projects</div>
                        </div>
                    </_Link>
                    <_Link className={(this.state.selectedMenu === CREDITS ? 'active-menu-item' : '') + ' menu-item'}
                           to="/credits"
                           onClick={(e) => {
                               if (this.state.isAnnotationRecording  || this.state.isEditModeOpen || this.state.isEventRecordingLive){
                                   e.preventDefault();
                                   this._showEditFormViolationModalWarning();
                               }else{
                                   this.setState({
                                       selectedMenu: CREDITS
                                   });
                               }
                           }} title="Credits">
                        <div className="credits"/>
                        <div className="right-menu-title">Credits</div>
                    </_Link>
                    <div className="menu_separator"/>
                    <_Link className={(this.state.selectedMenu === IMAGE ? 'active-menu-item' : '') + ' menu-item'}
                           to="/selection"
                           onClick={(e) => {
                               if (this.state.isAnnotationRecording  || this.state.isEditModeOpen || this.state.isEventRecordingLive){
                                   e.preventDefault();
                                   this._showEditFormViolationModalWarning();
                               }else {
                                   setTimeout(() => {
                                       ee.emit(EVENT_SELECT_TAB, 'image')
                                   }, 100)
                               }
                           }} title="Annotate on selection">
                        <div className="nav_box">
                            <div className="image"/>
                            <div className="right-menu-title">Annotate</div>
                        </div>
                    </_Link>
                    <_Link
                           className={(this.state.selectedMenu === EVENT ? 'active-menu-item' : '') + ' menu-item'}
                           to="/selection"
                           onClick={(e) => {
                               if (this.state.isAnnotationRecording  || this.state.isEditModeOpen || this.state.isEventRecordingLive){
                                   e.preventDefault();
                                   this._showEditFormViolationModalWarning();
                               }else {
                                   this.setState({
                                       selectedMenu: EVENT
                                   })
                                   setTimeout(() => {
                                       ee.emit(EVENT_SELECT_TAB, 'eventHome')
                                   }, 100)
                               }
                           }} title="Create new event">
                        <div className="nav_box">
                            <div className="event"/>
                            <div className="right-menu-title">Event</div>
                        </div>
                    </_Link>
                    <div className="menu_separator"/>
                    <_Link className={(this.state.selectedMenu === DATA ? 'active-menu-item' : '') + ' menu-item'}
                           to="/selection"
                           onClick={(e) => {
                               if (this.state.isAnnotationRecording  || this.state.isEditModeOpen || this.state.isEventRecordingLive){
                                   e.preventDefault();
                                   this._showEditFormViolationModalWarning();
                               }else {
                                   setTimeout(() => {
                                       ee.emit(EVENT_SELECT_TAB, 'data')
                                   }, 100)
                               }
                           }} title="View and export results of annotations">
                        <div className="nav_box">
                            <div className="list"/>
                            <div className="right-menu-title">Results</div>
                        </div>
                    </_Link>
                    <_Link
                           disabled={true}
                           to="/this_path_needs_to_be_replaces_with_iiif"
                           style={{background: 'lightgrey'}}
                           onClick={() => {}} title="IIIF">
                        <div className="nav_box">
                            <div className="iiif"/>
                            <div className="right-menu-title">IIIF</div>
                        </div>

                    </_Link>
                    <div className="menu_separator"/>
                    <_Link className={(this.state.selectedMenu === TAXONOMIES ? 'active-menu-item' : '') + ' menu-item'}
                           to="/taxonomies"
                           onClick={(e) => {
                               if (this.state.isAnnotationRecording  || this.state.isEditModeOpen || this.state.isEventRecordingLive){
                                   e.preventDefault();
                                   this._showEditFormViolationModalWarning();
                               }else {
                                   this.setState({
                                       selectedMenu: TAXONOMIES
                                   });
                               }
                           }} title="Annotations models">
                        <div className="nav_box">
                            <div className="models"/>
                            <div className="right-menu-title">Models</div>
                        </div>
                    </_Link>
                    <_Link
                           className={(this.state.selectedMenu === TAG_MANAGER ? 'active-menu-item' : '') + ' menu-item'}
                           to="/tagManager"
                           onClick={(e) => {
                               if (this.state.isAnnotationRecording  || this.state.isEditModeOpen || this.state.isEventRecordingLive){
                                   e.preventDefault();
                                   this._showEditFormViolationModalWarning();
                               }else {
                                   this.setState({
                                       selectedMenu: TAG_MANAGER
                                   });
                               }
                           }} title="Tag manager">
                        <div className="nav_box">
                            <div className="tags-menu"/>
                            <div className="right-menu-title">Keywords</div>
                        </div>
                    </_Link>
                    <div className="menu_separator"/>
                </_Nav>
            </_Root>
        );
    }


    _errorDisplay = () => {
        let error = '';
        if (this.state.error && this.state.errorInfo) {
            mapStackTrace(this.state.error.stack, mappedStack => {
                this.textArea.value = `${this.state.error.message.toString()}\n\n${mappedStack.join("\n").replace(/    /g, '')}`;
            });
        }
        return <Container className="bst">
            <Row className="">
                <Col className="error-page">
                    <div>
                        <h4><img alt="error icon" src={ERROR}/> Oops! Something went wrong.</h4>
                        <span>Please send error with short description to <a
                            href="mailto:">annotateiiif@gmail.com</a></span>
                    </div>
                </Col>
            </Row>
            <Row className="">
                <Col className="error-page">
                    <button className="btn btn-primary" onClick={ () => {
                        this.setState({hasError: false, error: null, errorInfo: null})
                        this.props.goToLibrary();
                    }}>Return to main screen
                    </button>
                    &nbsp;&nbsp;&nbsp;
                    <button className="btn btn-primary" onClick={ () => {
                        this.textArea.select();
                        document.execCommand('copy');
                    }}>Copy error to clipboard
                    </button>
                    &nbsp;&nbsp;&nbsp;
                    <button className="btn btn-primary" onClick={ () => {
                        this.setState({
                            showProjects: !this.state.showProjects
                        })
                    }}>{this.state.showProjects ? 'Show error message' : 'Switch project'}
                    </button>
                </Col>
            </Row>
            <Row className="">
                <Col className="error-page">
                    {
                    !this.state.showProjects ?
                    <textarea className="error-area"
                               ref={(textarea) => this.textArea = textarea}
                               value={error}
                    /> :
                        <div>
                            <SwitchProject onProjectSwitch={this._onProjectSwitch}/>
                        </div>
                    }
                </Col>
            </Row>
        </Container>
    }
}
