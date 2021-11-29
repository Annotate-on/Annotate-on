import React, {Component} from 'react';
import styled from 'styled-components';
import {DEFAULT_FOLDER_NAME, DOC_FG, DOC_ICON, DOC_ICON_HOVER, IMAGE_STORAGE_DIR} from '../constants/constants';
import {
    addPicturesDirectory,
    get,
    getUserWorkspace, lockProject,
    setWorkspace,
    toConfigFileWithoutRefresh, unlockProject
} from '../utils/config'
import {Button, Col, Container, Form, FormGroup, Input, Label, Row} from 'reactstrap';
import {remote} from "electron";
import fs from "fs-extra";
import path from "path";
import {ee, EVENT_CREATE_SYSTEM_TAGS, EVENT_SHOW_ALERT} from "../utils/library";

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
                    }}>
                        <img alt="logo"
                             src={RECOLNAT_LOGO}
                             className="logo"
                             title={"Go back to home page"}/>
                    </a>
                    <span className="title">Create new project</span>
                </div>
                <_Content>
                    <_RightColumn>
                        <Container className="import-wizard">
                            <br/>
                            <br/>
                            <Row>
                                <Col sm={2} md={2} lg={2}>
                                    <Label>Enter project title</Label>
                                </Col>
                                <Col sm={10} md={10} lg={10}>
                                    <Form onSubmit={(e) => {
                                        e.preventDefault();
                                    }}>
                                        <FormGroup row>
                                            <Col sm={4}>
                                                <Input type="text" name="occurrence" id="occurrence" autoFocus={true}
                                                       onChange={(e) => {
                                                           this.setState({
                                                               label: e.target.value,
                                                               isEnabled: e.target.value.length > 0
                                                           })
                                                       }}
                                                />
                                            </Col>
                                        </FormGroup>
                                    </Form>
                                </Col>
                            </Row>

                            <Row>
                                <Col sm={2} md={2} lg={2}>
                                    <Label>Select folder on file system</Label>
                                </Col>
                                <Col sm={10} md={10} lg={10}>
                                    <Button disabled={!this.state.isEnabled} className="btn btn-primary" color="primary"
                                            title="Create new project"
                                            onClick={this._createNewProjectHandler}
                                    >Select empty folder</Button>
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
            </_Root>
        );
    }

    _createNewProjectHandler = () => {
        const _ = remote.dialog.showOpenDialog(remote.getCurrentWindow () ,{properties: ['openDirectory', 'createDirectory']});
        if (!_ || _.length < 1) return;
        const label = this.state.label;
        const dir = _.pop();
        fs.ensureDirSync(dir);
        this.setState({
            workspace: dir
        });
        const files = fs.readdirSync(dir);
        if (files.length === 0) {
            // Unlock current project
            unlockProject()
            setWorkspace(dir, label);

            // Init store with blank state.
            this.props.setNewState({selectedProjectName: label});

            // create default folder
            fs.ensureDirSync(path.join(getUserWorkspace(), IMAGE_STORAGE_DIR, DEFAULT_FOLDER_NAME));
            addPicturesDirectory(DEFAULT_FOLDER_NAME);
            toConfigFileWithoutRefresh();

            // Lock new project
            lockProject(getUserWorkspace())

            ee.emit(EVENT_CREATE_SYSTEM_TAGS);
            this.props.goToLibrary();
        } else {
            ee.emit(EVENT_SHOW_ALERT, 'Please select an empty folder');
        }
    }
}



