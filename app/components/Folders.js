import {remote} from 'electron';
import React, {Fragment, PureComponent} from 'react';
import {Col, Collapse, Container, Form, Input, Row} from 'reactstrap';
import {
    addPicturesDirectory,
    getAllPicturesDirectories,
    getUserWorkspace,
    removePicturesDirectory,
    toConfigFileWithoutRefresh
} from '../utils/config'
import classnames from "classnames";
import path from "path";
import fs from "fs-extra";
import {ContextMenu, ContextMenuTrigger, MenuItem} from "react-contextmenu";
import {ee, EVENT_SHOW_ALERT, updateProjectInfo} from "../utils/library";
import {IMAGE_STORAGE_DIR} from "../constants/constants";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faPhotoVideo} from '@fortawesome/free-solid-svg-icons';
import {containsSpecialCharacters} from "../utils/js";
import FoldersFilter from "./FoldersFilter";

const EDIT = require('./pictures/edit_tag.svg');
const DELETE = require('./pictures/delete-tag.svg');
const COLLAPSE_ICON = require('./pictures/arrow_up.svg');
const EXPAND_ICON = require('./pictures/arrow_down.svg');
const SAVE_ICON = require('./pictures/save-tag.svg');
const CANCEL_ICON = require('./pictures/cancel-edit.svg');
const DOWNLOAD_ICON = require('./pictures/download.svg');
const SELECT_ALL = require('./pictures/select_all_gray.svg');
const ADD_DIALOG = 'ADD_DIALOG';

export default class extends PureComponent {
    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
        this.state = {collapse: true, newFolderName: '', selected: this.props.preselected};
    }

    handleClickOnFolder = (event, path, selected) => {
        if (!this.props.isImport) {
            if (selected) {
                this.props.unselectFolder(this.props.tabName, path);
            } else {
                this.props.selectFolder(this.props.tabName, path);
            }
        } else {
            if (this.state.selected === path) {
                this.props.setSelectedFolder(null);
                this.setState({selected: null});
            } else {
                this.props.setSelectedFolder(path);
                this.setState({selected: path});
            }
        }
    };

    toggle() {
        this.setState(state => ({collapse: !state.collapse}));
    }

    handleEditFolderSubmit = (event) => {
        event.preventDefault();
        if (this.state.newFolderName.length === 0)
            return
        const newName = this.state.newFolderName;
        const path = this.state.editFolder.folder.path;
        this.setState({editFolder: '', newFolderName: ''});

        this.props.renameFolder(newName, path);
    };

    handleResetFilterSelection = () => {
        this.props.unselectAllFolders(this.props.tabName);
    };

    _createEditFolderNameForm = () => {
        return <Form key={this.state.editFolder.path + 'new'} className="edit-folder-name" inline
                     onSubmit={this.handleEditFolderSubmit}>
            <Input bsSize="sm"
                   type="text"
                   name="name"
                   innerRef={_ => {
                       if (_)
                           _.focus();
                   }}
                   value={this.state.newFolderName}
                   onChange={(event) => {
                       this.setState({newFolderName: event.target.value});
                   }}
            />
            <img className='save-tag'
                 alt="save tag"
                 width={13} src={SAVE_ICON}
                 onClick={this.handleEditFolderSubmit}
            />
            <img className='cancel-edit' width={13}
                 alt="cancel edit"
                 src={CANCEL_ICON}
                 onClick={e => {
                     e.preventDefault();
                     this.setState({
                         editFolder: ''
                     });
                 }}/>
        </Form>
    };

    _drawFolders = (folders) => {
        const { t } = this.props;
        const enableClicks = this.props.isImport ? true : !this.props.tabData[this.props.tabName].manualOrderLock;

        folders.sort((left, right) => left.alias.localeCompare(right.alias));

        return folders.map(dir => {
            let selected = false;
            if (this.props.isImport) {
                selected = this.state.selected === dir.path;
            } else {
                selected = this.props.tabData[this.props.tabName].selected_folders.indexOf(dir.path) !== -1;
            }

            if (this.state.editFolder && this.state.editFolder.folder.path === dir.path) {
                return this._createEditFolderNameForm();
            } else return <div key={dir.path} className="folderHolder">
                <div
                    draggable="true"
                    onDragStart={e => this._onDragStart(e, dir.path)}
                    onDragEnd={this._onDragEnd}
                    onDragOver={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        dir.showChildren = true;
                        this.forceUpdate();
                    }}
                    onDrop={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        document.getElementById('folderRoot').classList.remove('root-hover');
                        this._onDrop(e, dir.path)
                    }}
                    className={classnames('folder', {'selected-folder': selected})}
                    onClick={(e) => {
                        if (enableClicks)
                            this.handleClickOnFolder(e, dir.path, selected);
                        else {
                            ee.emit(EVENT_SHOW_ALERT, t('folders.alert_cannot_change_selection_when_manual_order'));
                        }
                    }}>

                    <ContextMenuTrigger
                        attributes={{className: 'folder-name'}}
                        holdToDisplay={-1}
                        disable={!enableClicks}
                        renderTag="span"
                        id="folder_context_menu"
                        collect={() => {
                            return {
                                folder: dir
                            };
                        }}>{dir.alias}</ContextMenuTrigger>
                    {dir.children && dir.children.length > 0 ?
                        <img alt="collapse icon" className="caret" src={dir.showChildren ? COLLAPSE_ICON : EXPAND_ICON} onClick={e => {
                            e.stopPropagation();
                            dir.showChildren = !dir.showChildren;
                            this.forceUpdate();
                        }}/> : <span className="caret-empty">&nbsp;</span>}
                </div>

                {dir.children && dir.showChildren ?
                    <div style={{paddingLeft: "10px"}}>{this._drawFolders(dir.children)}</div> : ''}
            </div>
        })
    };

    render() {
        const { t } = this.props;
        const folders = getAllPicturesDirectories();
        let total = 0;
        const totalSizeOfFolders = (folder) => {
            total++;
            if (folder.children)
                folder.children.forEach(folder => {
                    totalSizeOfFolders(folder);
                });
        };
        folders.forEach(totalSizeOfFolders);

        return (
            <Container className="bst rcn_folders">
                <Row>
                    <Col className="folders-title" md={12} lg={12}>
                        <div className="collapse-panel">
                            <FontAwesomeIcon icon={faPhotoVideo}/>
                            <span className="collapse-panel-title" onClick={this.toggle}>
                                {t('folders.lbl_resource_folders')} ({total})
                            </span>

                            {this.state.collapse &&
                                <span title={t('folders.tooltip_add_new_folder')}
                                      className={classnames("add-icon", {'add-selected-icon': this.state.showDialog === ADD_DIALOG})}
                                      onClick={_ => {
                                          if (this.state.showDialog === ADD_DIALOG)
                                              this.setState({showDialog: ''});
                                          else
                                              this.setState({showDialog: ADD_DIALOG});
                                      }}/>
                            }

                            <img alt="arrow down" className="toogleCollapse" onClick={this.toggle}
                                 src={(this.state.collapse ? require('./pictures/arrow_down.svg') : require('./pictures/arrow_up.svg'))}/>

                        </div>
                    </Col>
                </Row>
                <Collapse className={classnames({'more-space': this.state.showDialog === ADD_DIALOG}, 'folders-collapse')} isOpen={this.state.collapse}>
                    {this.state.showDialog !== '' ?
                        <Row>
                            <Col className="action-panel">
                                {this.state.showDialog === ADD_DIALOG ?
                                    <Form onSubmit={this.handleCreateNewFolderSubmit}>
                                        <Input autoFocus placeholder={t('folders.textbox_placeholder_folder_name')}
                                               type="text"
                                               name="name"
                                               value={this.state.newFolderName}
                                               onChange={(event) => {
                                                   event.preventDefault();
                                                   this.setState({newFolderName: event.target.value});
                                               }}
                                        />
                                    </Form> : ''
                                }
                            </Col>
                        </Row> : ''
                    }
                    {
                        (!this.props.isImport && this.props.tab.selected_folders) &&
                            <FoldersFilter
                                total={total}
                                selected={this.props.tab.selected_folders.length}
                                onCancelFilter={ () => {
                                    this.handleResetFilterSelection()
                                }}
                            />
                    }
                    <div className="folders" id="folderRoot" draggable={true}
                         onDragEnter={e => {
                             if (e.target.classList.contains('folders'))
                                 e.target.classList.add('root-hover');
                         }}

                         onDragOver={e => {
                             e.preventDefault();
                             e.stopPropagation();
                         }}

                         onDragEnd={e=> {
                             e.preventDefault();
                             e.stopPropagation();
                             document.getElementById('folderRoot').classList.remove('root-hover');
                         }}

                         onDragExit={e=> {
                             e.preventDefault();
                             e.stopPropagation();
                             e.target.classList.remove('root-hover');
                         }}

                         onDrop={e => {
                             e.preventDefault();
                             e.stopPropagation();
                             document.getElementById('folderRoot').classList.remove('root-hover');
                             this._onDrop(e, "ROOT");
                         }}>
                        {this._drawFolders(folders)}
                    </div>
                    <div>
                        {!this.props.isImport ?
                        <ContextMenu id="folder_context_menu">
                           <Fragment>
                                <MenuItem data={{action: 'import_local'}} onClick={this._handleContextMenu}>
                                    <img alt="download icon" src={DOWNLOAD_ICON}/> {t('folders.context_menu_import_image')}
                                </MenuItem>
                                <MenuItem divider/>
                            </Fragment>
                            <Fragment>
                                <MenuItem data={{action: 'import_local_video'}} onClick={this._handleContextMenu}>
                                    <img alt="download icon" src={DOWNLOAD_ICON}/> {t('folders.context_menu_import_video')}
                                </MenuItem>
                                <MenuItem divider/>
                            </Fragment>
                            <Fragment>
                                <MenuItem data={{action: 'import_local_video'}} disabled={true} onClick={this._handleContextMenu}>
                                    <img alt="download icon" src={DOWNLOAD_ICON}/> {t('folders.context_menu_create_keywords_language')}
                                </MenuItem>
                                <MenuItem divider/>
                            </Fragment>
                            <Fragment>
                                <MenuItem data={{action: 'create_new_event'}} onClick={this._handleContextMenu}>
                                    <img alt="create event" src={DOWNLOAD_ICON}/> {t('folders.context_menu_create_a_new_event')}
                                </MenuItem>
                                <MenuItem divider/>
                            </Fragment>
                            <MenuItem data={{action: 'select_all'}} onClick={this._handleContextMenu}>
                                <img alt="select all" className='select-all' src={SELECT_ALL}/> {t('folders.context_menu_select_unselect_all')}
                            </MenuItem>
                            <MenuItem divider/>
                            <MenuItem data={{action: 'edit'}} onClick={this._handleContextMenu}>
                                <img alt="rename folder" src={EDIT}/> {t('folders.context_menu_rename_folder')}
                            </MenuItem>
                            <MenuItem divider/>
                            <MenuItem data={{action: 'delete'}} onClick={this._handleContextMenu}>
                                <img alt="delete folder" src={DELETE}/> {t('folders.context_menu_delete_folder')}
                            </MenuItem>
                        </ContextMenu>
                            : ''}
                    </div>
                </Collapse>
            </Container>
        );
    }

    _onDragStart = (event, folderPath) => {
        event.dataTransfer.setData('folderPath', folderPath);
    };

    _onDragEnd = () => {
        this.forceUpdate();
    };

    _onDrop = (e, folderPath) => {
        if (e.dataTransfer.getData('folderPath') === '')
            return false;

        console.log('Drop ', folderPath, e.dataTransfer.getData('folderPath'))
        if (e.dataTransfer.getData('folderPath') && e.dataTransfer.getData('folderPath') !== folderPath) {
            console.log('Target ', e.dataTransfer.getData('folderPath'));
            this.props.moveFolder(folderPath, e.dataTransfer.getData('folderPath'));
        }
    };

    _handleContextMenu = (e, data) => {
        const { t } = this.props;
        switch (data.action) {
            case 'edit':
                this.setState({
                    editFolder: data,
                    newFolderName: data.folder.alias
                });
                break;
            case 'delete':
                const result = remote.dialog.showMessageBox(remote.getCurrentWindow () ,{
                    type: 'question',
                    buttons: ['Yes', 'No'],
                    message: t('folders.alert_delete_folder_message', {folder: data.folder.alias}),
                    cancelId: 1,
                    detail: t('global.delete_confirmation')
                });
                if (result === 0) {
                    if (this.props.isImport) {
                        this.props.setSelectedFolder(null);
                    }
                    this.props.deleteFolder(data.folder.path);
                    removePicturesDirectory(data.folder.path);
                    this.setState({selected: null});
                }
                break;
            case 'import_recolnat':
                this.props.goToImport(encodeURIComponent(data.folder.path));
                break;
            case 'import_local':
                this.props.goToImportWizard(encodeURIComponent(data.folder.path));
                break;
            case 'import_local_video':
                this.props.goToImportVideoWizard(encodeURIComponent(data.folder.path));
                break;
            case 'create_new_event':
                this.props.goToImportEventWizard(encodeURIComponent(data.folder.path) ,this.props.tabName);
                break;
            case 'select_all':
                if(!data.folder.selectAll) {
                    this.props.selectFolder(this.props.tabName, data.folder.path);
                    data.folder.selectAll = true;
                    if (data.folder.children) {
                        this._selectFoldersRecursively(data.folder.children);
                    }
                } else {
                    this.props.unselectFolder(this.props.tabName, data.folder.path);
                    data.folder.selectAll = false;
                    if (data.folder.children) {
                        this._deselectFoldersRecursively(data.folder.children);
                    }
                }
                toConfigFileWithoutRefresh();
                break;
        }
    };

    handleCreateNewFolderSubmit = (event) => {
        const { t } = this.props;
        event.preventDefault();
        if (this.state.newFolderName.length === 0)
            return;

        if(containsSpecialCharacters(this.state.newFolderName)){
            alert(t('folders.alert_folder_contains_special_characters'));
            return false;
        }

        const DESTINATION_DIR = path.join(getUserWorkspace(), IMAGE_STORAGE_DIR, this.state.newFolderName);
        fs.ensureDirSync(DESTINATION_DIR);
        addPicturesDirectory(this.state.newFolderName);
        toConfigFileWithoutRefresh();
        updateProjectInfo(this.props.picturesSize);
        this.setState({
            newFolderName: ''
        })
    };

    _selectFoldersRecursively = folders => {
        for (const folder of folders) {
            this.props.selectFolder(this.props.tabName, folder.path);
            folder.selectAll = true;
            if (folder.children) {
                this._selectFoldersRecursively(folder.children);
            }
        }
    }

    _deselectFoldersRecursively = folders => {
        for (const folder of folders) {
            this.props.unselectFolder(this.props.tabName, folder.path);
            folder.selectAll = false;
            if (folder.children) {
                this._deselectFoldersRecursively(folder.children);
            }
        }
    }
}
