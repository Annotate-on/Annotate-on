import React, {Component} from 'react';
import styled from 'styled-components';
import {DOC_FG, DOC_ICON, DOC_ICON_HOVER, IMAGE_STORAGE_DIR} from '../constants/constants';
import {
    addProjectToWorkSpace,
    get,
    getThumbNailsDir,
    getUserWorkspace,
    probeLockedProject,
    PROJECT_INFO_DESCRIPTOR,
    setWorkspace,
    updateTargetTypes
} from '../utils/config'
import {Button, Col, Container, Label, Row, Spinner} from 'reactstrap';
import {remote} from "electron";
import fs from "fs-extra";
import path from "path";
import {ee, EVENT_CREATE_SYSTEM_TAGS, EVENT_SHOW_ALERT, updateProjectInfoVersion} from "../utils/library";
import packageJson from "../../package.json";


const RECOLNAT_LOGO = require('./pictures/logo.svg');

const _Root = styled.div`
  color: ${DOC_FG};
  height: 100%;
  overflow: hidden;
  width: 100%;
   display: flex;
   flex-direction: column;
  > * {
    // padding: 30px;
  }

  .link:hover {
    text-decoration: underline;
  }

  .icon {
    color: ${DOC_ICON};

    &:hover {
      color: ${DOC_ICON_HOVER};
    }
  }
`;

const _Content = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

const _RightColumn = styled.div`
  height: 100%;
  width: 100%;
`;

export default class extends Component {

    constructor(props) {
        super(props);
        this.state = {
            projects: get().projects,
            workspace: getUserWorkspace(),
        }
    }

    render() {
        return (
            <_Root className="bst">
                <div className="bg">
                    <a onClick={ () => {
                        this.props.goToLibrary();
                    }}> <img alt="logo" src={RECOLNAT_LOGO} className="logo" title={"Go back to home page"}/></a>
                    <span className="title">Import existing project</span>
                </div>
                <_Content>
                    <_RightColumn>
                        <Container className="import-wizard">
                            <Row className="iep-row">
                                <Col sm={6} md={6} lg={6}>
                                    <h2 className="title_section">Select folder with existing project</h2>
                                </Col>
                            </Row>
                            <br/>
                            <Row>
                                <Col sm={2} md={2} lg={2}>
                                    <Label >Select folder on file system</Label>
                                </Col>
                                <Col sm={10} md={10} lg={10}>
                                    <Button className="btn btn-primary" color="primary"
                                            title=" Import existing project"
                                            onClick={ () => {
                                                const _ = remote.dialog.showOpenDialog(remote.getCurrentWindow () ,{properties: ['openDirectory']});
                                                if (!_ || _.length < 1) return;
                                                const label = this.state.label;
                                                const dir = _.pop();
                                                fs.ensureDirSync(dir);


                                                const path_to_project = path.join(dir, PROJECT_INFO_DESCRIPTOR);
                                                const project = JSON.parse(fs.readFileSync(path_to_project));
                                                const version = project.version;

                                                if (!version){
                                                    updateProjectInfoVersion(packageJson.version)
                                                }

                                                if(!probeLockedProject(project)) {
                                                    addProjectToWorkSpace(dir, false);
                                                    updateTargetTypes(dir);
                                                    remote.dialog.showMessageBox({
                                                        type: 'info',
                                                        detail: `Project is locked by user ${project.lockedBy}`,
                                                        message: `Locked`,
                                                        buttons: ['OK'],
                                                        cancelId: 1
                                                    });
                                                    this.props.goToSettings();
                                                    return;
                                                }

                                                this.setState({
                                                    workspace: dir
                                                });
                                                // const files = fs.readdirSync(dir);
                                                const isWorkspace = fs.existsSync(path.join(dir, 'collaboratoire-cache'));
                                                if (isWorkspace) {
                                                    updateTargetTypes(dir);

                                                    const initialState = setWorkspace(dir , label);
                                                    ee.emit(EVENT_CREATE_SYSTEM_TAGS);

                                                    if (initialState !== null) {
                                                        for (const sha1 in initialState.pictures) {
                                                            initialState.pictures[sha1].file = path.join(getUserWorkspace(), IMAGE_STORAGE_DIR, initialState.pictures[sha1].file);
                                                            initialState.pictures[sha1].thumbnail = path.join(getThumbNailsDir(), initialState.pictures[sha1].thumbnail);
                                                        }
                                                        this.props.setNewState(initialState);
                                                    } else {
                                                        this.props.setNewState(null);
                                                    }
                                                    console.log("import existing project set new tags....")
                                                    this.props.flatOldTags();
                                                    setTimeout( ()=> {
                                                        this.props.goToLibrary();
                                                    },100)
                                                }else {
                                                    ee.emit(EVENT_SHOW_ALERT, 'Selected folder does not match recolnat project');
                                                }
                                            }}
                                    ><img alt="add folder" src={require('./pictures/add-folder.svg')} width={15}/> Import existing project</Button>
                                    &emsp;
                                    <Button size="md" color="gray" onClick={ () => {
                                        this.props.goToSettings();
                                    }}
                                    >
                                        Cancel
                                    </Button>
                                </Col>
                            </Row>

                        </Container>
                    </_RightColumn>
                </_Content>
                {this.state.showLoadingModal?<div className='loading-dialog'>
                    <Spinner className='loading-spinner'/>
                    <span className='spinner-text'>Importing pictures...</span>
                </div>:''}
            </_Root>
        );

    }
}


