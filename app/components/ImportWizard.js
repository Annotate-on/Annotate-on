import { remote } from 'electron';
import path from "path";
import React, { Component } from 'react';
import { Button, Col, Container, Input, Label, Row } from 'reactstrap';
import styled from 'styled-components';
import { DOC_FG, DOC_ICON, DOC_ICON_HOVER } from '../constants/constants';
import DragAndDropImport from "../containers/DragAndDropImport";
import Folders from "../containers/Folders";
import ImportIIIF from '../containers/ImportIIIF';
import PasteImageImport from "../containers/PasteImageImport";
import Tags from '../containers/Tags';
import UrlImageImport from "../containers/UrlImageImport";
import { importClipboardResource, importFolder, importResources } from '../utils/config';
import { EVENT_HIDE_LOADING, EVENT_SELECT_TAB, EVENT_SHOW_LOADING, ee, initPicturesLibrary } from "../utils/library";
import { attachDefaultTags, loadTags } from "../utils/tags";

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
            parentFolder: props.match.params.folderName === 'null' ? null : decodeURIComponent(props.match.params.folderName),
            applyExifMetadataForRotation: true,
            showImportRemoteUrl: false,
            showImportIIIF: false
        };
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

    _onRotatePictureChange = (event) => {
        const {checked} = event.target;
        this.setState({
            applyExifMetadataForRotation: checked
        });
    }

    /**
     * Add pictures to app config.
     * @private
     */
    _loadImages = (images, folders) => {
        initPicturesLibrary(images, folders, this.props.pictures, this.state.applyExifMetadataForRotation).then(pictureObjects => {
            // Add new pictures to lib.
            this.props.refreshState(pictureObjects);
            // Select parent folder.
            this.props.selectFolderGlobally(this.state.parentFolder);
            // Tag new pictures.
            const newTags = loadTags(this.props.tags, this.props.selectedTags);
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
        const { t } = this.props;
        return (
            <_Root className="bst">
                <div className="bg">
                    <a onClick={ () => {
                        this.props.goToLibrary();
                    }}> <img alt="go to homepage" src={RECOLNAT_LOGO} className="logo" title={t('global.logo_tooltip_go_to_home_page')}/></a>
                    <span className="title">{t('library.import_images.title')}</span>
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
                                    <div className="header_import_recolnat"> <h5>{t('library.import_images.lbl_select_mode_of_import')}
                                    <Button
                                        className="btn btn-primary"
                                        title={t('global.btn_tooltip_go_back_to_library')}
                                        size="sm" color="blue"
                                        onClick={ () => {
                                            this.props.goToLibrary();
                                            setTimeout(() => {
                                                ee.emit(EVENT_SELECT_TAB, 'library')
                                            }, 100)
                                        }}
                                    >
                                        {t('global.cancel')}
                                    </Button>
                                    </h5></div>
                                </Col>
                            </Row>
                            <br/>
                            <Row>
                                <Col sm={3} md={3} lg={3}>
                                    <fieldset className="import-fieldset">
                                        <legend className="import-legend">{t('library.import_images.lbl_import_local_images')}</legend>
                                        <div className="import-title">
                                            <Button disabled={this.state.parentFolder === null}
                                                    className="btn btn-secondary btn_import"
                                                    title={t('library.import_images.btn_tooltip_select_images')}
                                                    onClick={ () => {
                                                        this.setState({showImportRemoteUrl: false});
                                                        this.setState({showImportIIIF: false});
                                                        const _ = remote.dialog.showOpenDialog(remote.getCurrentWindow () ,{
                                                            filters: [
                                                                {name: 'Images', extensions: ['jpg', 'png', 'jpeg']}
                                                            ],
                                                            properties: ['openFile', 'multiSelections']
                                                        });
                                                        if (!_ || _.length < 1) return;
                                                        this._saveImages(_);
                                                    }}
                                            >{t('library.import_images.btn_select_images')}</Button>
                                        </div>
                                    </fieldset>
                                    <fieldset className="import-fieldset">
                                        <legend className="import-legend">{t('library.import_images.lbl_import_from_urls')}</legend>
                                        <div className="import-title">
                                            <Button disabled={this.state.parentFolder === null}
                                                    className="btn btn-secondary btn_import"
                                                    title={t('library.import_images.btn_tooltip_paste_urls')}
                                                    onClick={ () => {
                                                        this.setState({showImportRemoteUrl: true});
                                                        this.setState({showImportIIIF: false});
                                                    }}
                                            >{t('library.import_images.btn_paste_urls')}</Button>
                                        </div>
                                    </fieldset>
                                    <fieldset className="import-fieldset">
                                        <legend className="import-legend">{t('library.import_images.lbl_import_full_directory')}</legend>
                                        <div className="import-title">
                                            <Button disabled={this.state.parentFolder === null}
                                                    className="btn btn-secondary btn_import"
                                                    title={t('library.import_images.btn_tooltip_select_directory')}
                                                    onClick={ () => {
                                                        const _ = remote.dialog.showOpenDialog(remote.getCurrentWindow () ,{properties: ['openDirectory', 'createDirectory']});
                                                        if (!_ || _.length < 1) return;

                                                        this._saveFolder(_.pop());
                                                    }}
                                            >{t('library.import_images.btn_select_directory')}</Button>
                                        </div>
                                    </fieldset>
                                    <fieldset className="import-fieldset">
                                        <legend className="import-legend">{t('library.import_images.lbl_import_from_recolnat')}</legend>
                                        <div className="import-title">
                                            <Button disabled={this.state.parentFolder === null}
                                                    className="btn btn-secondary btn_import"
                                                    title={t('library.import_images.btn_tooltip_import_from_recolnat')}
                                                    onClick={ () => {
                                                        this.props.goToImport(encodeURIComponent(this.state.parentFolder), this.state.applyExifMetadataForRotation);
                                                    }}
                                            >{t('library.import_images.btn_import_from_recolnat')}</Button>
                                        </div>
                                    </fieldset>
                                    <fieldset className="import-fieldset">
                                        <legend className="import-legend">{t('library.import_images.lbl_import_from_iiif')}</legend>
                                        <div className="import-title">
                                            <Button disabled={this.state.parentFolder === null}
                                                    className="btn btn-secondary btn_import"
                                                    title={t('library.import_images.btn_tooltip_import_from_iiif')}
                                                    onClick={ () => {
                                                        this.setState({showImportRemoteUrl: false});
                                                        this.setState({showImportIIIF: true});
                                                    }}
                                            >{t('library.import_images.btn_import_from_iiif')}</Button>
                                        </div>
                                    </fieldset>
                                </Col>
                                <Col sm={9} md={9} lg={9}>
                                    {this.state.showImportRemoteUrl ?
                                        <UrlImageImport parentFolder={this.state.parentFolder}
                                                        applyExifMetadataForRotation = {this.state.applyExifMetadataForRotation}
                                                        onClose={() => {
                                                            this.setState({showImportRemoteUrl: false});
                                                            this.setState({showImportIIIF: false});
                                                        }}/> : <div></div> }
                                    {this.state.showImportIIIF ?
                                        <div>
                                            <ImportIIIF parentFolder={this.state.parentFolder}
                                                        applyExifMetadataForRotation = {this.state.applyExifMetadataForRotation}
                                                        onClose={() => {
                                                            this.setState({showImportIIIF: false});
                                                        }}/>
                                                        </div> : <div></div> }
                                                        {this.state.showImportIIIF == false && this.state.showImportRemoteUrl == false?
                                                        <div><fieldset className="import-fieldset">
                                            <legend className="import-legend">{t('library.import_images.lbl_import_local_images_by_dnd')}</legend>
                                            <DragAndDropImport parentFolder={this.state.parentFolder}
                                                               saveImages={this._saveImages}/></fieldset>
                                    <fieldset className="import-fieldset">
                                    <legend className="import-legend">{t('library.import_images.lbl_paste_images_from_clipboard')}</legend>
                                    <PasteImageImport  parentFolder={this.state.parentFolder}
                                                      saveImage={this._saveImageFromClipboard} />
                                    </fieldset></div>: <div></div>}
                                </Col>
                            </Row>
                            <Row>
                                <Col sm={12} md={12} lg={12}>
                                    <div className="form-check">
                                        <Input name="applyExifMetadataForRotation"
                                               id="apply-exif-metadata-for-rotation"
                                               type="checkbox"
                                               checked={this.state.applyExifMetadataForRotation}
                                               onChange={this._onRotatePictureChange}> </Input>
                                        <Label for="apply-exif-metadata-for-rotation" className="form-check-label pointer">
                                            {t('library.import_images.lbl_apply_exif_metadata_for_rotation')}
                                        </Label>
                                    </div>
                                </Col>
                            </Row>
                        </Container>
                    </_RightColumn>
                </_Content>
            </_Root>
        );
    }
}
