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
    EVENT_SHOW_LOADING, EVENT_SHOW_LOADING_ON_RESOURCE_IMPORT,
    initVideosLibrary
} from "../utils/library";
import {attachDefaultVideoTags} from "../utils/tags";
import UrlVideoImport from "../containers/UrlVideoImport";
import DragAndDropImport from "../containers/DragAndDropImport";
import LoadingSpinner from "./LoadingSpinner";

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

    _saveVideos = (files) => {
        // Display loading overlay.
        try {
            importResources(files, this.state.parentFolder).then(resources => {
                this._hideLoading();
                ee.emit(EVENT_SHOW_LOADING, files.length);
                this._loadVideos(resources, [this.state.parentFolder]);
            });
        }catch (e){
            this._hideLoading();
        }
    };

    /**
     * Add pictures to app config.
     * @private
     */
    _loadVideos = (videos, folders) => {
        initVideosLibrary(videos, folders, this.props.pictures).then(videoObjects => {
            // Add new pictures to lib.
            this.props.refreshState(videoObjects);
            // Select parent folder.
            this.props.selectFolderGlobally(this.state.parentFolder);
            // Tag new pictures.
            const newTags = this.props.tags.filter(_ => this.props.selectedTags.indexOf(_.name) > -1);
            for (const sha1 in videoObjects) {
                for (const tag of newTags) {
                    this.props.tagPicture(sha1, tag.name);
                }

                attachDefaultVideoTags(videoObjects[sha1], this.props.tagPicture, this.props.createTag, this.props.addSubTag);
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

    render() {
        return (
            <_Root className="bst">
                {this.state.showLoadingSpinner ? <LoadingSpinner text={'Preparing files to import...'}/> :
                    <div>
                        <div className="bg">
                            <a onClick={() => {
                                this.props.goToLibrary();
                            }}> <img alt="logo" src={RECOLNAT_LOGO} className="logo" title={"Go back to home page"}/></a>
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
                                            <div className="header_import_recolnat"><h5>Select mode of import
                                                <Button
                                                    className="btn btn-primary"
                                                    title="Go back to library"
                                                    size="sm" color="blue"
                                                    onClick={() => {
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
                                                <legend className="import-legend">Import local videos</legend>
                                                <div className="import-title">
                                                    <Button disabled={this.state.parentFolder === null}
                                                            className="btn btn-secondary btn_import"
                                                            title="Import local videos"
                                                            onClick={() => {
                                                                this.setState({
                                                                    showImportRemoteUrl: false ,
                                                                    showLoadingSpinner: true
                                                                });
                                                                setTimeout( () => {
                                                                    const _ = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
                                                                        filters: [
                                                                            {
                                                                                name: 'Videos',
                                                                                extensions: ['mp4', 'mov', '3gp', 'mkv', 'ogv', 'webm']
                                                                            }
                                                                        ],
                                                                        properties: ['openFile', 'multiSelections']
                                                                    });
                                                                    if (!_ || _.length < 1) {
                                                                        this._hideLoading();
                                                                    } else {
                                                                        this._saveVideos(_);
                                                                    }
                                                                } , 30);

                                                            }}
                                                    >Select videos</Button>
                                                </div>
                                            </fieldset>
                                            <fieldset className="import-fieldset">
                                                <legend className="import-legend">Import from URLs list</legend>
                                                <div className="import-title">
                                                    <Button disabled={this.state.parentFolder === null}
                                                            className="btn btn-secondary btn_import"
                                                            title="Import videos from urls"
                                                            onClick={() => {
                                                                this.setState({showImportRemoteUrl: true});
                                                            }}
                                                    >Paste URLs list</Button>
                                                </div>
                                            </fieldset>
                                        </Col>
                                        <Col sm={9} md={9} lg={9}>
                                            {this.state.showImportRemoteUrl ?
                                                <UrlVideoImport parentFolder={this.state.parentFolder}
                                                                onClose={() => {
                                                                    this.setState({showImportRemoteUrl: false});
                                                                }}/> :
                                                <fieldset className="import-fieldset">
                                                    <legend className="import-legend">Import local videos by drag and
                                                        drop
                                                    </legend>
                                                    <DragAndDropImport parentFolder={this.state.parentFolder}
                                                                       _saveVideos={this._saveVideos}
                                                                       fileType="video"/>
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
