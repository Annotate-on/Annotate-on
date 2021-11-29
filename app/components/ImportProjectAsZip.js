import React, {Component} from 'react';
import {getProjectInfoFile, getThumbNailsDir, getUserWorkspace, setWorkspace, updateTargetTypes} from '../utils/config'
import {Button, Col, Container, Form, FormGroup, Label, Row} from "reactstrap";
import {remote} from "electron";
import fs from "fs-extra";
import {IMAGE_STORAGE_DIR} from "../constants/constants";
import * as unzipper from "unzipper";
import JSZip from 'jszip';
import path from "path";
import {ee, EVENT_CREATE_SYSTEM_TAGS, EVENT_HIDE_WAITING, EVENT_SHOW_ALERT, EVENT_SHOW_WAITING} from "../utils/library";
import os from "os";
import crypto from "crypto";
import packageJson from '../../package.json';

const RECOLNAT_LOGO = require('./pictures/logo.svg');

export default class extends Component {

    constructor(props) {
        super(props);
        this.state = {
            workspace: getUserWorkspace(),
            selectedProject: null,
            isValidZip: false
        }
    }

    validateZip = (source) => {
        console.log(source);
        return new Promise((resolve) => {
            if (source.substring(source.length - 9) !== '.annotate') {
                resolve(false);
            } else {
                fs.readFile(source, function (err, data) {
                    if (err) throw err;
                    JSZip.loadAsync(data).then(function (zip) {
                        if (Object.keys(zip.files).indexOf('project-info.json') > -1) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    });
                });
            }
        })

    };

    unzipProject = (destination) => {
        const source = this.state.selectedProject;
        if (source !== null) {
            ee.emit(EVENT_SHOW_WAITING, "Importing project from zip file...");
            fs.createReadStream(source)
                .pipe(unzipper.Parse())
                .on('entry', function (entry) {
                    const fileName = entry.path;
                    const type = entry.type; // 'Directory' or 'File'
                    const size = entry.vars.uncompressedSize; // There is also compressedSize;
                    console.log(`Type ${type}. Size ${size}. File name ${fileName}`)
                    if (entry.type === "Directory")
                        fs.ensureDirSync(path.join(destination, entry.props.path))
                    else
                        entry.pipe(fs.createWriteStream(path.join(destination, entry.props.path), {encoding: 'utf8'}));
                })
                .on('finish', () => {
                    console.log("zip extracted at... " + destination);
                    const initialState = setWorkspace(destination);

                    const project = JSON.parse(fs.readFileSync(getProjectInfoFile()));
                    const version = project.version;

                    if (!version){
                        project.version = packageJson.version;
                    }
                    project.locked = crypto.createHash('sha1').update(os.userInfo().username).digest('hex');
                    project.lockedBy = os.userInfo().username;
                    fs.writeFileSync(getProjectInfoFile(), JSON.stringify({...project, path: undefined}));

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

                    ee.emit(EVENT_HIDE_WAITING);
                    updateTargetTypes(destination);
                    console.log("import project as zip set new tags....")
                    this.props.flatOldTags();
                    setTimeout( ()=> {
                        this.props.goToLibrary();
                    },200)

                });
        } else {
            console.log('invalid source of a selected project!');
        }

    };


    render() {
        return (
            <div className="bst rcn_collection">
                <div className="bg">
                    <a onClick={() => {
                        this.props.goToLibrary();
                    }}>
                        <img alt="recolnat logo" src={RECOLNAT_LOGO} className="logo" title={"Go back to home page"}/>
                    </a>
                    <span className="title">Import project from .annotate file</span>
                </div>

                <Container className="cnt">
                    <Row>
                        <Col sm={2} md={2} lg={2}>
                            <Label>Select ziped project file</Label>
                        </Col>
                        <Col sm={10} md={10} lg={10}>
                            <Form onSubmit={(e) => {
                                e.preventDefault();
                            }}>
                                <FormGroup>
                                    {/*// TODO 01.04.2020 leave just '.annotate'*/}
                                    <input type="file" name="file" color="red" accept=".zip,.7zip,.annotate"
                                           onChange={(e) => {

                                               let path = e.target.files[0].path;

                                               this.validateZip(path).then(result => {
                                                   if (result) {
                                                       this.setState({
                                                           selectedProject: path,
                                                           isEnabled: true
                                                       });
                                                   } else {
                                                       this.setState({
                                                           selectedProject: null,
                                                           isEnabled: false
                                                       });
                                                       ee.emit(EVENT_SHOW_ALERT, 'Invalid zip file..zip does not match recolnat project');
                                                   }
                                               });
                                           }}
                                    />

                                </FormGroup>
                            </Form>
                        </Col>

                    </Row>
                    <Row>
                        <Col sm={2} md={2} lg={2}>
                            <Label>Select folder to import project</Label>
                        </Col>
                        <Col sm={10} md={10} lg={10}>
                            <Button disabled={!this.state.isEnabled} className="btn btn-primary" color="primary"
                                    title="Create zip package"
                                    onClick={() => {
                                        const _ = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {properties: ['openDirectory', 'createDirectory']});
                                        if (!_ || _.length < 1) return;

                                        const folderPath = _.pop();
                                        const files = fs.readdirSync(folderPath);
                                        console.log(files)
                                        // TODO 11.03.2020 10:22 mseslija: this has to be fixed to skip hidden folders
                                        // if (files.length === 0 ) {
                                        this.unzipProject(folderPath);
                                        // }else{
                                        //     this._showAlert('Please select an empty folder');
                                        //     return;
                                        // }

                                    }}
                            >Select empty folder</Button>
                            &emsp;
                            <Button
                                size="md"
                                color="gray"
                                onClick={() => { this.props.goToSettings()}}>
                                Cancel
                            </Button>
                        </Col>
                    </Row>
                </Container>
            </div>
        );

    }
}
