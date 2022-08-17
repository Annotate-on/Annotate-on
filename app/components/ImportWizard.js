import {remote} from 'electron';
import React, {Component} from 'react';
import styled from 'styled-components';
import Tags from '../containers/Tags';
import {DOC_FG, DOC_ICON, DOC_ICON_HOVER} from '../constants/constants';
import {importClipboardResource, importFolder, importResources} from '../utils/config'
import {Button, Col, Container, Row} from 'reactstrap';
import path from "path";
import Folders from "../containers/Folders";
import UrlImageImport from "../containers/UrlImageImport";
import DragAndDropImport from "../containers/DragAndDropImport";
import {ee, EVENT_HIDE_LOADING, EVENT_SELECT_TAB, EVENT_SHOW_LOADING, initPicturesLibrary} from "../utils/library";
import {attachDefaultTags} from "../utils/tags";
import PasteImageImport from "../containers/PasteImageImport";

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

        this.state = {parentFolder: props.match.params.folderName === 'null' ? null : decodeURIComponent(props.match.params.folderName)};
    }

    _saveFolder = (folder) => {
        // Display loading overlay.
        ee.emit(EVENT_SHOW_LOADING);

        const folderAlias = path.basename(folder);
        // Copy whole folder structure on file system.
        importFolder(folder, folderAlias, this.state.parentFolder).then(result => {
            this._loadImages(result.files, [this.state.parentFolder, ...result.directories]);
        });
    };

    _saveImages = (files) => {
        // Display loading overlay.
        ee.emit(EVENT_SHOW_LOADING, files.length);

        importResources(files, this.state.parentFolder).then(images => {
            this._loadImages(images, [this.state.parentFolder]);
        });
    };

    _saveImageFromClipboard = (resource, fileName) => {
        // Display loading overlay.
        ee.emit(EVENT_SHOW_LOADING, 1);

        importClipboardResource(resource, this.state.parentFolder, fileName).then(images => {
            this._loadImages(images, [this.state.parentFolder]);
        }).catch(error=> {
            ee.emit(EVENT_HIDE_LOADING);
            remote.dialog.showErrorBox('Error', error);
        });
    };

    /**
     * Add pictures to app config.
     * @private
     */
    _loadImages = (images, folders) => {
        initPicturesLibrary(images, folders, this.props.pictures).then(pictureObjects => {
            // Add new pictures to lib.
            this.props.refreshState(pictureObjects);
            // Select parent folder.
            this.props.selectFolderGlobally(this.state.parentFolder);
            // Tag new pictures.
            const newTags = this.props.tags.filter(_ => this.props.selectedTags.indexOf(_.name) > -1);
            for (const sha1 in pictureObjects) {
                for (const tag of newTags) {
                    this.props.tagPicture(sha1, tag.name);
                }

                attachDefaultTags(pictureObjects[sha1], this.props.tagPicture, this.props.createTag, this.props.addSubTag);
            }

            for (const tag of newTags) {
                this.props.selectTag(tag.name, true);
            }

            ee.emit(EVENT_HIDE_LOADING);
            this.props.goToLibrary();
        });
    };

    setSelectedFolder = (folder) => {
        this.setState({parentFolder: folder});
    };

    componentWillUnmount() {
        this.props.emptyTagsList();
    }

    render() {
        return (
            <_Root className="bst">
                <div className="bg">
                    <a onClick={ () => {
                        this.props.goToLibrary();
                    }}> <img alt="go to homepage" src={RECOLNAT_LOGO} className="logo" title={"Go back to home page"}/></a>
                    <span className="title">Import</span>
                </div>
                <_Content>
                    <div className="vertical">
                        <Folders isImport={true} setSelectedFolder={this.setSelectedFolder}
                                 preselected={this.state.parentFolder}/>
                        <Tags autoSelectNew={true} visibleActions={false} isImport={true}/>
                    </div>
                    <_RightColumn>
                        <Container className="import-wizard">
                            <Row className="first-row">
                                <Col sm={12} md={12} lg={12}>
                                    <div className="header_import_recolnat"> <h5>Select mode of import
                                    <Button
                                        className="btn btn-primary"
                                        title="Go back to library"
                                        size="sm" color="blue"
                                        onClick={ () => {
                                            this.props.goToLibrary();
                                            setTimeout(() => {
                                                ee.emit(EVENT_SELECT_TAB, 'library')
                                            }, 100)
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    </h5></div>
                                </Col>
                            </Row>
                            <br/>
                            <Row>
                                <Col sm={3} md={3} lg={3}>
                                    <fieldset className="import-fieldset">
                                        <legend className="import-legend">Import local images</legend>
                                        <div className="import-title">
                                            <Button disabled={this.state.parentFolder === null}
                                                    className="btn btn-secondary btn_import"
                                                    title="Import selected images"
                                                    onClick={ () => {
                                                        this.setState({showImportRemoteUrl: false});
                                                        const _ = remote.dialog.showOpenDialog(remote.getCurrentWindow () ,{
                                                            filters: [
                                                                {name: 'Images', extensions: ['jpg', 'png', 'jpeg']}
                                                            ],
                                                            properties: ['openFile', 'multiSelections']
                                                        });
                                                        if (!_ || _.length < 1) return;
                                                        this._saveImages(_);
                                                    }}
                                            >Select images</Button>
                                        </div>
                                    </fieldset>
                                    <fieldset className="import-fieldset">
                                        <legend className="import-legend">Import from URLs list</legend>
                                        <div className="import-title">
                                            <Button disabled={this.state.parentFolder === null}
                                                    className="btn btn-secondary btn_import"
                                                    title="Import images from urls"
                                                    onClick={ () => {
                                                        this.setState({showImportRemoteUrl: true});
                                                    }}
                                            >Paste URLs list</Button>
                                        </div>
                                    </fieldset>
                                    <fieldset className="import-fieldset">
                                        <legend className="import-legend">Import a full directory</legend>
                                        <div className="import-title">
                                            <Button disabled={this.state.parentFolder === null}
                                                    className="btn btn-secondary btn_import"
                                                    title="Import folders with images and subfolders hierarchy from your computer"
                                                    onClick={ () => {
                                                        const _ = remote.dialog.showOpenDialog(remote.getCurrentWindow () ,{properties: ['openDirectory', 'createDirectory']});
                                                        if (!_ || _.length < 1) return;

                                                        this._saveFolder(_.pop());
                                                    }}
                                            >Select directory</Button>
                                        </div>
                                    </fieldset>
                                    <fieldset className="import-fieldset">
                                        <legend className="import-legend">Import from Recolnat</legend>
                                        <div className="import-title">
                                            <Button disabled={this.state.parentFolder === null}
                                                    className="btn btn-secondary btn_import"
                                                    title="Import images from explore.recolnat.org"
                                                    onClick={ () => {
                                                        this.props.goToImport(encodeURIComponent(this.state.parentFolder));
                                                    }}
                                            >Import from Recolnat</Button>
                                        </div>
                                    </fieldset>
                                </Col>
                                <Col sm={9} md={9} lg={9}>
                                    {this.state.showImportRemoteUrl ?
                                        <UrlImageImport parentFolder={this.state.parentFolder}
                                                        onClose={() => {
                                                            this.setState({showImportRemoteUrl: false});
                                                        }}/> :

                                        <fieldset className="import-fieldset">
                                            <legend className="import-legend">Import local images by drag and drop
                                            </legend>
                                            <DragAndDropImport parentFolder={this.state.parentFolder}
                                                               saveImages={this._saveImages}/></fieldset>}
                                    <fieldset className="import-fieldset">
                                    <legend className="import-legend">Paste images from clipboard
                                    </legend>
                                    <PasteImageImport  parentFolder={this.state.parentFolder}
                                                      saveImage={this._saveImageFromClipboard} />

                                    </fieldset>
                                </Col>
                            </Row>
                        </Container>
                    </_RightColumn>
                </_Content>
            </_Root>
        );
    }
}
