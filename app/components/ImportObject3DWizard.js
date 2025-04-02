import {remote} from 'electron';
import React, {Component} from 'react';
import styled from 'styled-components';
import Tags from '../containers/Tags';
import {DOC_FG, DOC_ICON, DOC_ICON_HOVER} from '../constants/constants';
import {importResources} from '../utils/config'
import {Button, Col, Container, Row} from 'reactstrap';
import Folders from "../containers/Folders";
import {
    ee,
    EVENT_HIDE_LOADING,
    EVENT_SELECT_TAB,
    EVENT_SHOW_LOADING, EVENT_SHOW_LOADING_ON_RESOURCE_IMPORT, initObjects3DLibrary
} from "../utils/library";
import DragAndDropImport from "../containers/DragAndDropImport";
import LoadingSpinner from "./LoadingSpinner";
import UrlObject3DImport from "../containers/UrlObject3DImport";

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
            showLoadingSpinner: false
        };
    }


    componentDidMount() {
        ee.on(EVENT_SHOW_LOADING_ON_RESOURCE_IMPORT , this._showLoading);
    }

    componentWillUnmount() {
        ee.removeListener(EVENT_SHOW_LOADING_ON_RESOURCE_IMPORT , this._showLoading);
        this.props.emptyTagsList();
    }


    _showLoading = () => {
        this.setState({
            showLoadingSpinner: true
        })
    }

    _hideLoading = () => {
        this.setState({
            showLoadingSpinner: false
        })
    }

    _saveObjects3D = (files) => {
        // Display loading overlay.
        try {
            importResources(files, this.state.parentFolder).then(resources => {
                this._hideLoading();
                ee.emit(EVENT_SHOW_LOADING, files.length);
                this._loadObjects3D(resources, [this.state.parentFolder]);
            });
        }catch (e){
            this._hideLoading();
        }
    };

    _loadObjects3D = (models3D, folders) => {
        initObjects3DLibrary(models3D, folders, this.props.pictures).then(objects3D => {
            // Add new pictures to lib.
            this.props.refreshState(objects3D);
            // Select parent folder.
            this.props.selectFolderGlobally(this.state.parentFolder);

            ee.emit(EVENT_HIDE_LOADING);
            this.props.goToLibrary();
        });
    };

    setSelectedFolder = (folder) => {
        this.setState({parentFolder: folder});
    };

    render() {
        const { t } = this.props;
        return (
            <_Root className="bst">
                {this.state.showLoadingSpinner ? <LoadingSpinner text={t('library.import_objects3D.loading_preparing_files_to_import')}/> :
                    <div>
                        <div className="bg">
                            <a onClick={() => {
                                this.props.goToLibrary();
                            }}> <img alt="logo" src={RECOLNAT_LOGO} className="logo" title={t('global.logo_tooltip_go_to_home_page')}/></a>
                            <span className="title">
                                {t('library.import_objects3D.title')}
                            </span>
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
                                            <div className="header_import_recolnat"><h5>Select mode of import for 3D objects
                                                <Button
                                                    className="btn btn-primary"
                                                    title={t('global.btn_tooltip_go_back_to_library')}
                                                    size="sm" color="blue"
                                                    onClick={() => {
                                                        this.props.goToLibrary();
                                                        setTimeout(() => {
                                                            ee.emit(EVENT_SELECT_TAB, 'library')
                                                        }, 100)
                                                    }}>
                                                    {t('global.cancel')}
                                                </Button>
                                            </h5></div>
                                        </Col>
                                    </Row>
                                    <br/>
                                    <Row>
                                        <Col sm={3} md={3} lg={3}>
                                            <fieldset className="import-fieldset">
                                                <legend className="import-legend">
                                                    {t('library.import_objects3D.lbl_import_local_objects3D')}
                                                </legend>
                                                <div className="import-title">
                                                    <Button disabled={this.state.parentFolder === null}
                                                            className="btn btn-secondary btn_import"
                                                            title={t('library.import_objects3D.btn_tooltip_select_objects3D')}
                                                            onClick={() => {
                                                                this.setState({
                                                                    showImportRemoteUrl: false ,
                                                                    showLoadingSpinner: true
                                                                });
                                                                setTimeout( () => {
                                                                    const _ = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
                                                                        filters: [
                                                                            {
                                                                                name: 'Objects3D',
                                                                                extensions: ['glb', 'gltf']
                                                                            }
                                                                        ],
                                                                        properties: ['openFile', 'multiSelections']
                                                                    });
                                                                    if (!_ || _.length < 1) {
                                                                        this._hideLoading();
                                                                    } else {
                                                                        this._saveObjects3D(_);
                                                                    }
                                                                } , 30);
                                                            }}>
                                                        {t('library.import_objects3D.btn_select_objects3D')}
                                                    </Button>
                                                </div>
                                            </fieldset>
                                            <fieldset className="import-fieldset">
                                                <legend className="import-legend">
                                                    {t('library.import_images.lbl_import_from_urls')}
                                                </legend>
                                                <div className="import-title">
                                                    <Button disabled={this.state.parentFolder === null}
                                                            className="btn btn-secondary btn_import"
                                                            title={t('library.import_objects3D.btn_tooltip_paste_urls')}
                                                            onClick={() => {
                                                                this.setState({showImportRemoteUrl: true});
                                                            }}>
                                                        {t('library.import_objects3D.btn_paste_urls')}
                                                    </Button>
                                                </div>
                                            </fieldset>
                                        </Col>
                                        <Col sm={9} md={9} lg={9}>
                                            {this.state.showImportRemoteUrl ?
                                                <UrlObject3DImport parentFolder={this.state.parentFolder}
                                                                onClose={() => {
                                                                    this.setState({showImportRemoteUrl: false});
                                                                }}/> :
                                                <fieldset className="import-fieldset">
                                                    <legend className="import-legend">
                                                        {t('library.import_objects3D.lbl_import_local_objects3D_by_dnd')}
                                                    </legend>
                                                    <DragAndDropImport parentFolder={this.state.parentFolder}
                                                                       _saveObjects3D={this._saveObjects3D}
                                                                       fileType="objects3D"/>
                                                </fieldset>
                                            }
                                        </Col>
                                    </Row>
                                </Container>
                            </_RightColumn>
                        </_Content>
                    </div>}
            </_Root>
        );
    }
}
