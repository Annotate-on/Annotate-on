import React, {PureComponent} from 'react';
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
    checkIfProjectsAreCorrupted,
    deleteWorkspace,
    editProject, forceUnlockProject,
    getProjectInfo,
    getThumbNailsDir,
    getUserWorkspace,
    getYaml, lockProject,
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
import {IMAGE_STORAGE_DIR} from "../constants/constants";
import {ContextMenu, MenuItem} from "react-contextmenu";
import {ee, EVENT_CREATE_SYSTEM_TAGS, EVENT_HIDE_WAITING, EVENT_SHOW_ALERT, EVENT_SHOW_WAITING} from "../utils/library";
import configYaml from 'config-yaml';
import lodash from "lodash";

const EDIT = require('./pictures/edit_tag.svg');
const COPY_PATH_IMAGE_CONTEXT = require('./pictures/copy-link.png');
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
        let projectsWithInfo = this._makeProjects();
        const sortedProjects = this._sortList(sortBy, sortDirection, projectsWithInfo);
        this.state = {
            projects: sortedProjects,
            sortBy,
            sortDirection,
            workspace: getUserWorkspace(),
            showAction: null,
        };
    }
    _makeProjects() {
        checkIfProjectsAreCorrupted();
        let projectsWithInfo = [];
        const config = getYaml();
        if (config && config.projects !== undefined && config.projects.length > 0) {
            config.projects.forEach(p => {
                let projectInfo = getProjectInfo(p.path);
                let projectObject = lodash.omitBy({
                    path: p.path,
                    active: p.active,
                    date: projectInfo.date,
                    folders: projectInfo.folders,
                    images: projectInfo.images,
                    label: projectInfo.label,
                    locked: projectInfo.locked,
                    lockedBy: projectInfo.lockedBy,
                    corrupted: p.corrupted
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
        const { t } = this.props;
        switch (data.action) {
            case 'edit':
                this._toggle(data.path);
                break;
            case 'copy_path':
                this._copyFilePath(data.path);
                break;
            case 'delete':
                if (data.isActive) {
                    alert(t('projects.alert_you_can_not_delete_currently_active_project'))
                } else if(data.locked !== undefined) {
                    alert(t('projects.alert_you_can_not_delete_locked_project'))
                } else this._toggle2(data.path, data.isActive);
                break;
        }
    };

    _copyFilePath = (path) => {
        navigator.clipboard.writeText(path).then(() => {
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
        const { t } = this.props;
        if(isActive){
            alert(t('projects.alert_you_can_not_delete_currently_active_project'));
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
                    if (fs.lstatSync(curPath).isDirectory()) { // recurse
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

    render() {
        let status = '';
        const { t } = this.props;
        return (<Container className="bst rcn_xper">
                <Row className="content-table">
                    <Col md={{size: 12, offset: 0}}>
                        <div className="table-wrapper" id="wrapper" ref={_ => (this.pane = _)}>
                            <Table hover size="sm" className="targets-table">
                                <thead>
                                <tr>
                                    {/*<th></th>*/}
                                    <TableHeader title={t('projects.table_column_select')} sortKey="active"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title={t('projects.table_column_lock')} sortKey="locked"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title={t('projects.table_column_label')} sortKey="label"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <th/>
                                    <TableHeader title={t('projects.table_column_date')} sortKey="date"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title={t('projects.table_column_folders')} sortKey="folders"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title={t('projects.table_column_images')} sortKey="images"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title={t('projects.table_column_status')} sortKey="active"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title={t('projects.table_column_path')} sortKey="path"
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
                                                className={project.active ? 'active-project' : ''}
                                            >
                                                {/*<th scope="row"></th>*/}
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
                                                                 ee.emit(EVENT_SHOW_ALERT, t('projects.alert_can_not_switch_to_corrupted_project'));
                                                                 return false;
                                                             }
                                                             const path_to_project = path.join(project.path, PROJECT_INFO_DESCRIPTOR);
                                                             if(!fs.existsSync(path.join(project.path, 'project-info.json'))) {
                                                                 remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                                                                     type: 'error',
                                                                     message: t('global.error'),
                                                                     detail: t('projects.alert_there_is_no_project_on_path', {file_path: project.path}),
                                                                     cancelId: 1
                                                                 });
                                                                 this.setState({showAction: LOCK_UNLOCK_PROJECT});
                                                                 return ;
                                                             }
                                                             const loadedProject = JSON.parse(fs.readFileSync(path_to_project));
                                                             if(probeLockedProject(loadedProject)) {
                                                                 lockUnlockProject(project.path);
                                                                 this._setWorkspace(project.path);
                                                             } else {
                                                                 const result = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                                                                     type: 'question',
                                                                     buttons: ['Yes', 'No'],
                                                                     message: t('global.locked'),
                                                                     cancelId: 1,
                                                                     detail: t('projects.alert_confirmation_unlock_project', {user: loadedProject.lockedBy, machine: loadedProject.lockedOn})
                                                                 });
                                                                 if(!result) {
                                                                     // user wants to unlock project
                                                                     forceUnlockProject(project.path);
                                                                     lockProject(project.path);
                                                                     this._setWorkspace(project.path);
                                                                 }
                                                                 this.setState({showAction: LOCK_UNLOCK_PROJECT});
                                                             }
                                                         }}/>
                                                </td>
                                                <td width={60}>
                                                    {project.locked ? <img alt="lock" src={LOCK}/> : <img alt="unlock" src={UNLOCK}/>}
                                                </td>
                                                <td className={`hide-overflow ${project.corrupted === true ? 'corrupted-project-label' : ''}`} id={'label-wrapper'}>
                                                    {project.corrupted === true ? t('projects.lbl_corrupted_project') : project.label }
                                                </td>
                                                <td>
                                                </td>
                                                <td>
                                                    {project.date.substring(0, 11)}
                                                </td>
                                                <td>
                                                    {project.folders ? project.folders : '0'}
                                                </td>
                                                <td>
                                                    {project.images ? project.images : '0'}
                                                </td>
                                                <td>
                                                    {status}
                                                </td>
                                                <td title={project.path} className={'hide-overflow'}>
                                                    {project.path}
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
                            <img alt="select all" className='select-all' src={EDIT}/> {t('global.edit')}
                        </MenuItem>
                        <MenuItem divider/>

                        <MenuItem data={{action: 'delete'}} onClick={this._handleContextMenu}>
                            <img alt="delete" src={DELETE_IMAGE_CONTEXT}/> {t('global.delete')}
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
                            /> {t('global.copy_to_clipboard')}
                        </MenuItem>
                    </ContextMenu>
                </div>

                <Modal isOpen={this.state.modal} toggle={this._toggle} wrapClassName="bst" autoFocus={false}>
                    <ModalHeader toggle={this._toggle}>{t('projects.dialog_title_edit_project_label')}</ModalHeader>
                    <ModalBody>
                        <Form onSubmit={(e) => {
                            e.preventDefault();
                            this._editProject();
                        }}>
                            <FormGroup row>
                                <Label for="modelName" sm={5}>{t('projects.lbl_new_project_name')}</Label>
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
                        <Button color="primary" onClick={this._editProject}>{t('global.save')}</Button>
                        <Button color="secondary" onClick={this._toggle}>{t('global.cancel')}</Button>
                    </ModalFooter>
                </Modal>

                <Modal isOpen={this.state.deleteModal} toggle={this._toggle2} wrapClassName="bst"
                       autoFocus={false}>
                    <ModalHeader toggle={this._toggle2}>{t('projects.dialog_title_delete_confirmation')}
                        ?</ModalHeader>
                    <ModalFooter>
                        <Button color="primary" onClick={(e) => {
                            e.preventDefault();
                            this._deleteSelectedProject(this.state.selectedProjectPath)
                        }
                        }>{t('global.yes')}</Button>
                        <Button color="secondary" onClick={this._toggle2}>{t('global.cancel')}</Button>
                    </ModalFooter>
                </Modal>
            </Container>
        );
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
        ee.emit(EVENT_CREATE_SYSTEM_TAGS);
        if (initialState !== null) {
            for (const sha1 in initialState.pictures) {
                initialState.pictures[sha1].file = path.join(getUserWorkspace(), IMAGE_STORAGE_DIR, initialState.pictures[sha1].file);
                initialState.pictures[sha1].thumbnail = path.join(getThumbNailsDir(), initialState.pictures[sha1].thumbnail);
            }
            this.props.setNewState(initialState);
            setTimeout( ()=> {
                this.props.onProjectSwitch();
            } , 200);
        } else {
            this.props.setNewState(null);
            setTimeout( ()=> {
                this.props.onProjectSwitch();
            } , 200);
        }

        this.setState({
            workspace: getUserWorkspace(),
        });
    }
}
