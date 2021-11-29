import React, {Fragment, PureComponent} from 'react';
import {
    Button,
    Col,
    Container,
    Form,
    FormGroup,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Row,
    Table
} from 'reactstrap';
import {
    deleteWorkspace,
    editProject,
    getProjectInfo,
    getThumbNailsDir,
    getUserWorkspace,
    getYaml,
    lockUnlockProject,
    probeLockedProject,
    PROJECT_INFO_DESCRIPTOR,
    setWorkspace
} from "../utils/config";
import fs from 'fs-extra';
import archiver from 'archiver';
import TableHeader from "./TableHeader";
import {remote, shell} from "electron";
import path from "path";
import {COMMON_TAGS, IMAGE_STORAGE_DIR, MODEL_XPER, TAG_AUTO} from "../constants/constants";
import {ContextMenu, ContextMenuTrigger, MenuItem} from "react-contextmenu";
import {
    createAutomaticTags,
    createCommonTags,
    ee,
    EVENT_CREATE_SYSTEM_TAGS,
    EVENT_HIDE_WAITING,
    EVENT_SHOW_ALERT,
    EVENT_SHOW_WAITING,
    getProjectVersion,
    updateProjectInfoVersion
} from "../utils/library";
import configYaml from 'config-yaml';
import lodash from "lodash";
import packageJson from "../../package.json";
import {getValidTags, lvlAutomaticTags, lvlTags} from "./tags/tagUtils";

const EDIT = require('./pictures/edit_tag.svg');
const COPY_PATH_IMAGE_CONTEXT = require('./pictures/copy-link.png');
const RECOLNAT_LOGO = require('./pictures/logo.svg');
const DELETE_IMAGE_CONTEXT = require('./pictures/delete-tag.svg');
const LOCK = require('./pictures/lock.svg');
const UNLOCK = require('./pictures/unlock.svg');

const EDIT_PROJECT = 'EDIT_PROJECT';
const DELETE_PROJECT = 'DELETE_PROJECT';
const LOCK_UNLOCK_PROJECT = 'LOCK_UNLOCK_PROJECT';

export default class extends PureComponent {
    constructor(props) {
        super(props);
        const sortBy = 'label';
        const sortDirection = 'ASC';
        const projectsWithInfo = this._makeProjects();

        const sortedProjects = this._sortList(sortBy, sortDirection, projectsWithInfo);

        this.state = {
            projects: sortedProjects,
            sortBy,
            sortDirection,
            workspace: getUserWorkspace(),
            showAction: null,
            showPathModal: false,
            projectPath: null
        };
    }

    _makeProjects() {
        const config = getYaml();
        let projectsWithInfo = [];
        if (config && config.projects !== undefined && config.projects.length > 0) {
            config.projects.forEach( p => {
                let projectInfo = getProjectInfo(p.path);
                let projectObject = lodash.omitBy({
                    path: p.path,
                    active: p.active,
                    corrupted: p.corrupted !== undefined,
                    date: projectInfo.date,
                    folders: projectInfo.folders,
                    images: projectInfo.images,
                    label: projectInfo.label,
                    locked: projectInfo.locked,
                    lockedBy: projectInfo.lockedBy
                }, v => lodash.isUndefined(v) || lodash.isNull(v));
                projectsWithInfo.push(projectObject);
            });
        }
        return projectsWithInfo;
    }

    componentWillReceiveProps(nextState) {
        let unsortedProject = this._makeProjects();
        const projects = this._sortList(this.state.sortBy, this.state.sortDirection, unsortedProject);
        this.setState({projects: projects});
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.showAction !== prevState.showAction || prevState.projects.length !== this.state.projects.length) {
            let unsortedProject = this._makeProjects();
            const projects = this._sortList(this.state.sortBy, this.state.sortDirection, unsortedProject);
            this.setState({projects: projects , showAction: null});
        }
    }

    _sort = (sortBy, sortDirection) => {
        const projects = this._sortList(sortBy, sortDirection);
        this.setState({sortBy, sortDirection, projects});
    };

    _sortList(sortBy, sortDirection, initList) {
        const list = initList || this.state.projects;
        const sorted = lodash.sortBy(list, _ => (typeof _[sortBy] === 'string' ? _[sortBy].toLowerCase() : _[sortBy]));
        return sortDirection === 'DESC' ? lodash.reverse(sorted) : sorted;
    }

    _handleContextMenu = (e, data) => {
        switch (data.action) {
            case 'edit':
                if (data.isCorrupted === true){
                    ee.emit(EVENT_SHOW_ALERT, "you can not edit corrupted project!");
                    break;
                }
                this._toggle(data.path);
                break;
            case 'copy_path':
                this._copyFilePath(data.path);
                break;
            case 'delete':
                if (data.isActive) {
                    alert("You can't delete currently active project.")
                } else if(data.locked !== undefined) {
                    alert("You can't delete locked project.")
                } else this._toggle2(data.path, data.isActive);
                break;
        }
    };

    _copyFilePath = (path) => {
        navigator.clipboard.writeText(path).then( () => {
                console.log('text copied: ', path)
            }
        )
    };

    _toggle = (path) => {
        if (path === undefined) {
            this.setState({
                modal: !this.state.modal,
            });
        } else {
            this.setState({
                modal: !this.state.modal,
                selectedProjectPath: path
            });
        }

    };

    _toggle2 = (path, isActive) => {
        if(isActive){
            alert("You can't delete currently active project.");
            return;
        }
        if (path === undefined) {
            this.setState({
                deleteModal: !this.state.deleteModal,
            });
        } else {
            this.setState({
                deleteModal: !this.state.deleteModal,
                selectedProjectPath: path
            });
        }
    };

    _closeShowPathModal = () => {
        this.setState({
            showPathModal: false,
            projectPath: null
        })
    }

    _openShowPathModal = (path) => {
        this.setState({
            showPathModal: true,
            projectPath: path
        })
    }

    _editProject = () => {
        if (this.state.label) {
            this.setState({
                modal: false,
                label: null,
                selectedProjectPath: null
            });
            editProject(this.state.selectedProjectPath, this.state.label);
            this.setState({
                showAction: EDIT_PROJECT,
            });
        }
    };

    _deleteSelectedProject(projectPath) {
        const config_file_path = path.join(remote.app.getPath('home'), 'annotate-config.yml');
        const readYml = configYaml(config_file_path);

        if (readYml.workspace === projectPath) {
            return false;
        }

        const deleteProject = function (path) {
            if (fs.existsSync(path)) {
                fs.readdirSync(path).forEach(function (file) {
                    const curPath = path + "/" + file;
                    if (fs.lstatSync(curPath).isDirectory()) {
                        deleteProject(curPath);
                    } else { // delete file
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(path);

            }
        };

        deleteProject(projectPath);
        deleteWorkspace(projectPath);
        this.setState({
            deleteModal: false,
            label: null,
            selectedProjectPath: null,
            showAction: DELETE_PROJECT
        });
    }

    _isForbiddenDirectory(source){
        const projectWorkspace = getUserWorkspace();
        return source.includes(projectWorkspace);
    }

    _zipDirectory(source) {
        let saverPath = remote.dialog.showSaveDialog( remote.getCurrentWindow() , {
            title: 'Save project to',
            defaultPath: path.join(getUserWorkspace(), `${this.state.workspace}.annotate`)
        });

        if (!saverPath || saverPath.length < 1) return;

        if (saverPath.substring(saverPath.length - 9) !== '.annotate') {
            saverPath = saverPath + '.annotate';
        }

        if (this._isForbiddenDirectory(path.dirname(saverPath)) === true) {
            alert('You cant export project in its own workspace')
            return;
        }

        try {
            ee.emit(EVENT_SHOW_WAITING, "Exporting to zip file...");
            const archive = archiver('zip', {zlib: {level: 9}});

            const stream = fs.createWriteStream(saverPath, {encoding: 'utf8'});

            archive
                .directory(source, false)
                .on('error', err => reject(err))
                .pipe(stream);

            stream.on('close', () => {
                ee.emit(EVENT_HIDE_WAITING);
                const result = remote.dialog.showMessageBox(remote.getCurrentWindow () ,{
                    type: 'info',
                    detail: saverPath,
                    message: `Export finished`,
                    buttons: ['OK', 'Open folder'],
                    cancelId: 1
                });
                if (result === 1) {
                    shell.showItemInFolder(saverPath);
                }
            });

            archive.finalize();
        } catch (err) {
            ee.emit(EVENT_HIDE_WAITING);
            console.error(err)
        }
    }

    render() {
        let status = '';

        return (<Container className="bst rcn_xper">
                <div className="bg">
                    <Row>
                        <Col sm={6} className="hide-overflow">
                            <a onClick={() => {
                                    this.props.goToLibrary();
                                }}>
                                <img alt="logo" src={RECOLNAT_LOGO} className="logo" title={"Go back to home page"}/>
                            </a>
                            <span className="project-label">Project:</span><span className="project-name">{this.props.projectName}</span>
                            <span className="project-label">Model:</span>
                            <span className="project-name">
                    {this.props.selectedTaxonomy ?
                        <Fragment>
                            {this.props.selectedTaxonomy.name}(type: {this.props.selectedTaxonomy.model === MODEL_XPER ?
                            <img
                                alt="xper3-logo"
                                height='16px'
                                src='http://www.xper3.fr/resources/img/xper3-logo.png'/> : 'Annotate-ON'} )
                        </Fragment> : 'Without model'
                    }
                            </span>
                        </Col>
                        <Col sm={6}>
                            <span className="title">Projects</span>
                        </Col>
                    </Row>
                </div>
                <br/>
                <Row className="action-bar">
                    <Col sm={12} md={12} lg={12}>
                        <Button className="btn btn-primary mr-md-3" color="primary"
                                title="Create new project"
                                onClick={() => {
                                    this.props.goToAddNewProject();
                                }}
                        >Create new project</Button>

                        <Button className="btn btn-primary mr-md-3" color="primary"
                                title="Save project as .annotate file"
                                onClick={() => this._zipDirectory(this.state.workspace)}
                        >Export project</Button>
                        <Button className="btn btn-primary mr-md-3" color="primary"
                                title="Select .annotate file to import project"
                                onClick={() => {
                                    this.props.goToZipImport();
                                }}
                        >Import project from .annotate file</Button>
                        <Button className="btn btn-primary mr-md-3" color="primary"
                                title="Select local folder with shared project"
                                onClick={() => {
                                    this.props.goToImportExistingProject();
                                }}
                        >Open project from shared folder</Button>
                    </Col>
                </Row>
                <br/>

                <Row className="content-table">
                    <Col md={{size: 12, offset: 0}}>
                        <div className="table-wrapper" id="wrapper" ref={_ => (this.pane = _)}>
                            <Table hover size="sm" className="targets-table">
                                <thead>
                                <tr>
                                    {/*<th></th>*/}
                                    <TableHeader title="Select" sortKey="active"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title="Lock" sortKey="locked"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title='Label' sortKey="label"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <th/>
                                    <TableHeader title='Date' sortKey="date"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title='Folders' sortKey="folders"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title='Images' sortKey="images"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title='Status' sortKey="active"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title='Path' sortKey="path"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <th/>
                                </tr>
                                </thead>
                                <tbody>
                                {
                                    this.state.projects.map((project, index) => {
                                        if (project.active === false) {
                                            status = 'non-active'
                                        } else {
                                            status = 'active'
                                        }

                                        return (
                                            <tr key={index}
                                                className={`${project.corrupted === true ? 'corrupted-project-row' : ''} ${project.active ? 'active-project' : ''}`}
                                            >
                                                <td width={40} style={{textAlign: 'center'}}>
                                                    <Input type="radio"
                                                           name="isActive"
                                                           onChange={_ => {
                                                           }}
                                                           checked={project.active}
                                                    />
                                                    <div className={`check ${project.corrupted === true ? 'corrupted-project-check' : ''}`}
                                                         onClick={() => {
                                                             if (project.corrupted && project.corrupted === true){
                                                                 ee.emit(EVENT_SHOW_ALERT, "can not switch to corrupted project!");
                                                                 return false;
                                                             }
                                                             const path_to_project = path.join(project.path, PROJECT_INFO_DESCRIPTOR);
                                                             const loadedProject = JSON.parse(fs.readFileSync(path_to_project));
                                                             if(probeLockedProject(loadedProject)) {
                                                                 lockUnlockProject(project.path);
                                                                 this._setWorkspace(project.path);
                                                             } else {
                                                                 remote.dialog.showMessageBox({
                                                                     type: 'info',
                                                                     detail: `Project is locked by user ${loadedProject.lockedBy}`,
                                                                     message: `Locked`,
                                                                     buttons: ['OK'],
                                                                     cancelId: 1
                                                                 });
                                                                 this.setState({showAction: LOCK_UNLOCK_PROJECT});
                                                             }
                                                         }}/>
                                                </td>
                                                <td width={60}>
                                                    <ContextMenuTrigger
                                                        id="projects_context_menu"
                                                        collect={() => {
                                                            return {
                                                                isCorrupted: project.corrupted === true,
                                                                path: project.path,
                                                                isActive: project.active,
                                                                locked: project.locked
                                                            };
                                                        }}>
                                                        {project.locked ? <img alt="lock" src={LOCK}/> : <img alt="unlock" src={UNLOCK}/>}
                                                    </ContextMenuTrigger>
                                                </td>
                                                <td className={`hide-overflow ${project.corrupted === true ? 'corrupted-project-label' : ''}`} id={'label-wrapper'}>
                                                    <ContextMenuTrigger
                                                        id="projects_context_menu"
                                                        collect={() => {
                                                            return {
                                                                isCorrupted: project.corrupted === true,
                                                                path: project.path,
                                                                isActive: project.active,
                                                                locked: project.locked
                                                            };
                                                        }}>
                                                        {project.corrupted === true ? 'corrupted project' : project.label }
                                                    </ContextMenuTrigger>
                                                </td>
                                                <td>
                                                </td>
                                                <td>
                                                    <ContextMenuTrigger
                                                        id="projects_context_menu"
                                                        collect={() => {
                                                            return {
                                                                isCorrupted: project.corrupted === true,
                                                                path: project.path,
                                                                isActive: project.active,
                                                                locked: project.locked
                                                            };
                                                        }}>
                                                        {project.date.substring(0, 11)}
                                                    </ContextMenuTrigger>
                                                </td>
                                                <td>
                                                    <ContextMenuTrigger
                                                        id="projects_context_menu"
                                                        collect={() => {
                                                            return {
                                                                isCorrupted: project.corrupted === true,
                                                                path: project.path,
                                                                isActive: project.active,
                                                                locked: project.locked
                                                            };
                                                        }}>
                                                        {project.folders ? project.folders : '0'}
                                                    </ContextMenuTrigger>
                                                </td>
                                                <td>
                                                    <ContextMenuTrigger
                                                        id="projects_context_menu"
                                                        collect={() => {
                                                            return {
                                                                isCorrupted: project.corrupted === true,
                                                                path: project.path,
                                                                isActive: project.active,
                                                                locked: project.locked
                                                            };
                                                        }}>
                                                        {project.images ? project.images : '0'}
                                                    </ContextMenuTrigger>
                                                </td>
                                                <td>
                                                    <ContextMenuTrigger
                                                        id="projects_context_menu"
                                                        collect={() => {
                                                            return {
                                                                isCorrupted: project.corrupted === true,
                                                                path: project.path,
                                                                isActive: project.active,
                                                                locked: project.locked
                                                            };
                                                        }}>
                                                        {status}
                                                    </ContextMenuTrigger>
                                                </td>
                                                <td title={project.path} className={'hide-overflow'} onClick={ ()=> this._openShowPathModal(project.path)}>
                                                    <ContextMenuTrigger
                                                        id="file_context_menu"
                                                        collect={() => {
                                                            return {
                                                                path: project.path,
                                                                isActive: project.active
                                                            };
                                                        }}>
                                                        {project.path}
                                                    </ContextMenuTrigger>
                                                </td>
                                                <td/>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    </Col>
                </Row>

                <div>
                    <ContextMenu id="projects_context_menu">
                        <MenuItem data={{action: 'edit'}} onClick={this._handleContextMenu}>
                            <img alt="select all" className='select-all' src={EDIT}/> Edit
                        </MenuItem>
                        <MenuItem divider/>

                        <MenuItem data={{action: 'delete'}} onClick={this._handleContextMenu}>
                            <img alt="delete" src={DELETE_IMAGE_CONTEXT}/> Delete
                        </MenuItem>
                    </ContextMenu>
                </div>

                <div>
                    <ContextMenu
                        id="file_context_menu">
                        <MenuItem
                            data={
                                {
                                    action: 'copy_path'
                                }
                            }
                            onClick={this._handleContextMenu}>
                            <img
                                alt="copy path"
                                src={COPY_PATH_IMAGE_CONTEXT}
                            /> Copy to clipboard
                        </MenuItem>
                    </ContextMenu>
                </div>

                <Modal isOpen={this.state.modal} toggle={this._toggle} wrapClassName="bst" autoFocus={false}>
                    <ModalHeader toggle={this._toggle}>Edit project label</ModalHeader>
                    <ModalBody>
                        <Form onSubmit={(e) => {
                            e.preventDefault();
                            this._editProject();
                        }}>
                            <FormGroup row>
                                <Label for="modelName" sm={5}>new project name</Label>
                                <Col sm={7}>
                                    <Input type="text" name="projectName" id="projectName" autoFocus={true}
                                           onChange={(e) => {
                                               this.setState({
                                                   label: e.target.value
                                               });
                                           }}
                                    />
                                </Col>
                            </FormGroup>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this._editProject}>Save</Button>
                        <Button color="secondary" onClick={this._toggle}>Cancel</Button>
                    </ModalFooter>
                </Modal>

                <Modal isOpen={this.state.deleteModal} toggle={this._toggle2} wrapClassName="bst"
                       autoFocus={false}>
                    <ModalHeader toggle={this._toggle2}>Are you sure you want to delete this project
                        ?</ModalHeader>
                    <ModalFooter>
                        <Button color="primary" onClick={(e) => {
                            e.preventDefault();
                            this._deleteSelectedProject(this.state.selectedProjectPath)
                        }
                        }>Yes</Button>
                        <Button color="secondary" onClick={this._toggle2}>Cancel</Button>
                    </ModalFooter>
                </Modal>

                <Modal isOpen={this.state.showPathModal} toggle={this._closeShowPathModal} wrapClassName="bst"
                       autoFocus={false}>
                    <ModalHeader toggle={this._closeShowPathModal}/>
                    <ModalBody>
                        {this.state.projectPath}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={() => {
                            this._copyFilePath(this.state.projectPath);
                            this._closeShowPathModal();
                        }}>Copy on clipboard</Button>
                        <Button color="secondary" onClick={this._closeShowPathModal}>Close</Button>
                    </ModalFooter>
                </Modal>

            </Container>

        );
    }

    _checkTags = (stateTags) => {

        if(!stateTags || stateTags.length === 0){
            return [];
        }

        let result = [];
        const allTags = stateTags;
        //get valid categories and tags
        const validTagsAndCategories = getValidTags(stateTags);
        if(validTagsAndCategories.length > 0){
            validTagsAndCategories.forEach(category => {
                result.push(category);
            })
        }
        //check if automatic tags exist
        const automaticTags = allTags.find(element => element.name === TAG_AUTO && element.hasOwnProperty("type"));
        if(automaticTags !== undefined){
            result.push(automaticTags);
        }else{
            const isOldAutomaticTagsPresent = allTags.find(element => element.name === TAG_AUTO);
            if(isOldAutomaticTagsPresent !== undefined){
                const aTags = createAutomaticTags();
                if(isOldAutomaticTagsPresent.hasOwnProperty("children")){
                    aTags.children = lvlAutomaticTags(isOldAutomaticTagsPresent.children)
                }
                result.push(aTags);
            }else{
                result.push(createAutomaticTags());
            }
        }

        //check if common tags already exists if not create new object
        const commonTags = allTags.find(element => element.name === COMMON_TAGS && element.hasOwnProperty("type")) || createCommonTags();
        const oldTags = lvlTags(allTags);
        oldTags.forEach( tag => {
            commonTags.children.push(tag);
        })

        result.push(commonTags);
        console.log("final result" , result);
        return result;
    }

    _setWorkspace = (dir) => {
        if (fs.existsSync(dir)) {
            this.setState({
                workspace: dir,
            });
        } else {
            deleteWorkspace(dir);
            this.setState({
                showAction: DELETE_PROJECT
            });
            return false;
        }

        const initialState = setWorkspace(dir);

        //check for version and implement new tag structure if project version is < 1.9.5
        console.log('Switching to new project')
        console.log('checking for project version')
        const version = getProjectVersion();
        console.log('project version ....' , version);
        if (!version && initialState !== null){
            console.log('project is missing version , setting version from package.json ' + packageJson.version)
            updateProjectInfoVersion(packageJson.version)
            console.log('updating tags structure...')
            const newTags = this._checkTags(initialState.tags);
            console.log('new structure' , newTags);
            initialState.tags = newTags;
            const unSelected = initialState.open_tabs;
            Object.keys(initialState.open_tabs).forEach( key => {
                unSelected[key].selected_tags = [];
            });
            initialState.open_tabs = unSelected;
            initialState.selected_tags = [];
        }
        ee.emit(EVENT_CREATE_SYSTEM_TAGS);
        console.log('initial state' , initialState);
        if (initialState !== null) {
            for (const sha1 in initialState.pictures) {
                initialState.pictures[sha1].file = path.join(getUserWorkspace(), IMAGE_STORAGE_DIR, initialState.pictures[sha1].file);
                initialState.pictures[sha1].thumbnail = path.join(getThumbNailsDir(), initialState.pictures[sha1].thumbnail);
            }
            this.props.setNewState(initialState);
        } else {
            this.props.setNewState(null);
        }

        this.setState({
            workspace: getUserWorkspace(),
        });
    }
}
