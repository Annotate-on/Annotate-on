import {remote, shell} from 'electron';
import fs from 'fs-extra';
import path from 'path';
import promiseLimit from 'promise-limit';
import React, {Component, Fragment} from 'react';
import request from 'request';
import progress from 'request-progress';
import styled from 'styled-components';
import Tags from '../containers/Tags';
import {
    DOC_FG,
    DOC_ICON,
    DOC_ICON_HOVER,
    IMAGE_STORAGE_DIR,
    IMPORT_BOTANICAL,
    IMPORT_FROM_JSON,
    IMPORT_PALEONTOLOGY,
    IMPORT_ZOOLOGY
} from '../constants/constants';
import ReactTooltip from "react-tooltip";
import {getUserWorkspace} from '../utils/config'
import {Button, Col, Container, Row} from 'reactstrap';
import Folders from "../containers/Folders";
import {ee, EVENT_HIDE_LOADING, EVENT_SHOW_LOADING, initPicturesLibrary} from "../utils/library";
import {attachDefaultTags} from "../utils/tags";
import * as unzipper from "unzipper";
import {loadTags} from "../utils/common";

const RECOLNAT_LOGO = require('./pictures/logo.svg');
const HELP_ICON = require('./pictures/help.svg');
const img_import_from_explore_1 = require('./pictures/explore01.png');
const img_import_from_explore_2 = require('./pictures/explore02.png');

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
            importType: null,
            selectedExploreJsonFile: null,
            jobs: [],
            jobsCompleted: 0,
            progress: [],
            disableButtons: false,
            isEnabled: true,
            zipDownloaded: false,
            parentFolder: props.match.params.folderName === 'null' ? null : decodeURIComponent(props.match.params.folderName)
        };
        this.downloadFromExplore = this.downloadFromExplore.bind(this);
    }

    componentDidMount() {
        if (window.addEventListener) {
            window.addEventListener("message", this.onMessage, false);
        }
    }

    componentWillUnmount() {
        if (window.removeEventListener) {
            window.removeEventListener("message", this.onMessage)
        }
    }

    onMessage = (event) => {
        const data = event.data;
        if (data && data.event_id === 'annotate_download' && data.zipUrl) {
            console.log('Received event', event);

            const zipUrl = data.zipUrl.replace("/apps/recolnatwww/explore/", 'https://explore.recolnat.org/');
            const jsonName = path.basename(zipUrl, '.zip');
            const downloadPath = path.join(remote.app.getPath('temp'), path.basename(zipUrl));
            const destination = path.join(remote.app.getPath('temp'), path.basename(jsonName, '.json'));

            console.log(`Download zip to ${downloadPath}`);

            request(zipUrl, {proxy: process.env.RECOLNAT_HTTP_PROXY}).on('end', () => {
                fs.createReadStream(downloadPath)
                    .pipe(unzipper.Extract({path: destination}))
                    .promise().then(() => {
                    console.log("zip extracted at... " + destination);
                    console.log(`Open json file ${path.join(destination, jsonName)}`)

                    this.downloadFromExplore(path.join(destination, jsonName))
                }, () => {
                    console.error("Error unzip")
                })
            }).pipe(fs.createWriteStream(downloadPath));
        }
    };

    downloadFromExplore(selectedExploreJsonFile) {
        if (!fs.existsSync(selectedExploreJsonFile)) return;

        this.setState({selectedExploreJsonFile, zipDownloaded: true});

        const specimens = JSON.parse(fs.readFileSync(selectedExploreJsonFile, 'utf8'));

        // Jobs preparation

        const jobsDescriptions = [];
        let skippedSpecimen = 0;

        for (const specimen of specimens) {
            // Metadata
            const metadata = {};
            metadata.determinations = specimen.d_;
            metadata.basisofrecord = specimen.basisofrecord;
            metadata.catalognumber = specimen.catalognumber;
            metadata.collectioncode = specimen.collectioncode;
            metadata.collectionid = specimen.collectionid;
            metadata.collectionname = specimen.collectionname;
            metadata.dwcaid = specimen.dwcaid;
            metadata.family = specimen.family;
            metadata.genus = specimen.genus;
            metadata.institutioncode = specimen.institutioncode;
            metadata.institutionid = specimen.institutionid;
            metadata.institutionname = specimen.institutionname;
            metadata.modified = specimen.modified;
            metadata.scientificname = specimen.scientificname;
            metadata.specificepithet = specimen.specificepithet;
            metadata.recordedby = specimen.recordedby;
            metadata.fieldnumber = specimen.fieldnumber;
            metadata.eventdate = specimen.eventdate;
            metadata.decimallatitude = specimen.decimallatitude;
            metadata.decimallongitude = specimen.decimallongitude;
            metadata.recordnumber = specimen.recordnumber;


            specimen.m_.map(spec => {
                // Picture
                const pictureId = specimen.catalognumber;
                const pictureUrl = spec.identifier;

                if ('identifier' in spec && pictureUrl.length > 0) {
                    jobsDescriptions.push({
                        humanid: `${metadata.institutioncode}/${metadata.collectioncode}/${metadata.catalognumber}`,
                        id: pictureId,
                        metadata,
                        pictureUrl
                    });
                }
            });
        }

        this.setState({jobs: jobsDescriptions, skippedSpecimen});
    }

    startDownload = () => {
        // Check connectivity
        request('https://www.google.com', {timeout: 10000, proxy: process.env.RECOLNAT_HTTP_PROXY})
            .on('error', err => {
                console.log(err)
                remote.dialog.showErrorBox('Error', 'Cannot reach http://mediaphoto.mnhn.fr. Check your internet connection!');
                this.setState({selectedExploreJsonFile: null, disableButtons: false});
            }).on('end', () => {
            const limit = promiseLimit(4);

            // Download pictures
            const downloadPictureJob = (humanid, id, metadata, pictureUrl, targetMetadataFile, targetPictureFile, destDir) => {

                let occurrence = 0;
                while (fs.existsSync(targetPictureFile)) {
                    occurrence++;
                    targetMetadataFile = path.join(DESTINATION_DIR, `${id}_${occurrence} .json`);
                    targetPictureFile = path.join(DESTINATION_DIR, `${id}_${occurrence} .jpeg`);
                }

                return new Promise((resolve, reject) => {
                    progress(request(pictureUrl, {timeout: 30000, proxy: process.env.RECOLNAT_HTTP_PROXY}))
                        .on('progress', state => {
                            //
                            // Update current job status
                            //

                            // What is the current job index in all jobs progress list?
                            let jobIndex = -1;
                            for (let i = 0; i < this.state.progress.length; i++) {
                                if (this.state.progress[i].id === id) {
                                    jobIndex = i;
                                    break;
                                }
                            }
                            if (jobIndex !== -1) {
                                // The job is already on the list
                                this.setState({
                                    progress: [
                                        ...this.state.progress.slice(0, jobIndex),
                                        {
                                            ...this.state.progress[jobIndex],
                                            transferred: state.size.transferred
                                        },
                                        ...this.state.progress.slice(jobIndex + 1)
                                    ]
                                });
                            } else {
                                // New jobs are placed at the beginning of the list
                                this.setState({
                                    progress: [
                                        {
                                            humanid,
                                            id,
                                            pictureUrl,
                                            status: 'downloading',
                                            targetMetadataFile,
                                            targetPictureFile,
                                            transferred: state.size.transferred
                                        },
                                        ...this.state.progress
                                    ]
                                });
                            }
                        })
                        .on('error', err => {
                            console.log(err);
                            fs.unlink(targetPictureFile).then(_ => {
                                resolve()
                            });
                        })
                        .on('end', () => {
                            // Update current job status
                            let jobIndex = -1;
                            for (let i = 0; i < this.state.progress.length; i++) {
                                if (this.state.progress[i].id === id) {
                                    jobIndex = i;
                                    break;
                                }
                            }
                            this.setState({
                                jobsCompleted: this.state.jobsCompleted + 1,
                                progress: [
                                    ...this.state.progress.slice(0, jobIndex),
                                    {
                                        ...this.state.progress[jobIndex],
                                        status: 'downloaded'
                                    },
                                    ...this.state.progress.slice(jobIndex + 1)
                                ]
                            });

                            // Write metadata
                            fs.writeFileSync(targetMetadataFile, JSON.stringify(metadata));

                            // Resolve job promise
                            resolve({id, metadata, pictureUrl, targetMetadataFile, targetPictureFile, destDir});


                        })
                        .pipe(fs.createWriteStream(targetPictureFile));
                });
            };

            const DESTINATION_DIR = path.join(getUserWorkspace(), IMAGE_STORAGE_DIR, this.state.parentFolder)

            Promise.all(
                this.state.jobs.map(jobDescription => {
                    return limit(() =>
                        downloadPictureJob(
                            jobDescription.humanid,
                            jobDescription.id,
                            jobDescription.metadata,
                            jobDescription.pictureUrl,
                            path.join(DESTINATION_DIR, jobDescription.id + '.json'),
                            path.join(DESTINATION_DIR, jobDescription.id + '.jpeg'),
                            DESTINATION_DIR
                        )
                    );
                }))
                .then(results => {
                    const successfullyDownload = results.map(_ => {
                        if (_)
                            return _.targetPictureFile
                    }).filter(_ => _ !== undefined);

                    if (successfullyDownload.length === 0) {
                        this.setState({selectedExploreJsonFile: null, disableButtons: false});
                        return;
                    }

                    // Display loading overlay.
                    ee.emit(EVENT_SHOW_LOADING, successfullyDownload.length);

                    initPicturesLibrary(successfullyDownload, [this.state.parentFolder], this.props.pictures).then(pictureObjects => {
                        // Add new pictures to lib.
                        this.props.refreshState(pictureObjects);
                        // Select parent folder.
                        this.props.selectFolderGlobally(path.basename(DESTINATION_DIR));
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
                    })
                }).catch((err, pictureUrl) => {
                console.log('There was some error downloading images. ', pictureUrl);
                console.error(err)
            });
        });
    };

    setSelectedFolder = (folder) => {
        this.setState({parentFolder: folder, isEnabled: folder !== null});
    };

    render() {
        let iframeSrc = 'https://explore.recolnat.org/search/'
        let title = 'Import from json';

        switch (this.state.importType) {
            case IMPORT_BOTANICAL:
                iframeSrc = 'https://explore.recolnat.org/search/botanique/type=index';
                title = "Import Botanical";
                break;
            case IMPORT_ZOOLOGY:
                iframeSrc = 'https://explore.recolnat.org/search/zoologie/type=index';
                title = 'Import Zoology';
                break;
            case IMPORT_PALEONTOLOGY:
                iframeSrc = 'https://explore.recolnat.org/search/paleontologie/type=index';
                title = 'Import Paleontology';
                break;
        }

        return (
            <_Root className="bst">
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
                        {this.state.importType === null ? this._importOptions() : this.state.zipDownloaded ?
                            <Fragment>
                                <Container className="import-wizard">
                                    <Row>
                                        <Col className="page-title"
                                             sm={12} md={12} lg={12}>{this.state.jobs.length} files and their metadata
                                            will
                                            be
                                            imported ({this.state.jobsCompleted}/{this.state.jobs.length})</Col>
                                    </Row>
                                    {this.state.skippedSpecimen > 0 ?
                                        <Row>
                                            <Col className='warning-message'>
                                                {this.state.skippedSpecimen} specimen will not be imported as it
                                                contains
                                                multiple image references.
                                            </Col>
                                        </Row> : ''}
                                    <Row>
                                        <Col>

                                        </Col>
                                    </Row>
                                    <br/>

                                    {this.state.progress.map(_ => {
                                        return (
                                            <table key={_.id} className={_.status} cellPadding={0} cellSpacing={0}>
                                                <tbody>
                                                <tr>
                                                    <td>&nbsp;</td>
                                                    <td/>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        {_.status === 'downloading' ? (
                                                            <i className="fa fa-circle-o-notch fa-spin fa-fw"/>
                                                        ) : (
                                                            <i className="fa fa-check fa-fw"/>
                                                        )}
                                                    </td>
                                                    <td>{`${_.status} '${_.humanid}' (${(_.transferred / 1000 / 1000).toFixed(2)} MB)`}</td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <i className="fa fa-globe fa-fw"/>
                                                    </td>
                                                    <td>
                                                        <a className="link"
                                                           onClick={() => shell.openExternal(_.pictureUrl)}>
                                                            {_.pictureUrl}
                                                        </a>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <i className="fa fa-file-text-o fa-fw"/>
                                                    </td>
                                                    <td className="link"
                                                        onClick={() => shell.showItemInFolder(_.targetMetadataFile)}>
                                                        {_.targetMetadataFile}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <i className="fa fa-photo fa-fw"/>
                                                    </td>
                                                    <td className="link"
                                                        onClick={() => shell.showItemInFolder(_.targetPictureFile)}>
                                                        {_.targetPictureFile}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>&nbsp;</td>
                                                    <td/>
                                                </tr>
                                                </tbody>
                                            </table>
                                        );
                                    })}
                                    <Row>
                                        <Col sm={4} md={4} lg={4}>
                                            <Button
                                                disabled={!this.state.isEnabled || this.state.disableButtons || this.state.selectedExploreJsonFile === null
                                                || this.state.parentFolder === null}
                                                size="md" color="secondary"
                                                onClick={() => {
                                                    this.setState({
                                                        disableButtons: true
                                                    });
                                                    this.startDownload();
                                                }}
                                            >
                                                Start Import
                                            </Button>
                                            &emsp;
                                            <Button size="md" color="danger" onClick={() => {
                                                this.props.goToImportWizard(encodeURIComponent(this.state.parentFolder));
                                            }}
                                                    disabled={this.state.disableButtons}
                                            >
                                                Cancel
                                            </Button>
                                        </Col>
                                    </Row>
                                </Container>
                            </Fragment> : this.state.importType === IMPORT_FROM_JSON ? <Fragment>
                                <Container className="import-wizard">
                                    <div className="header_import_recolnat"> <h5>Select mode of import from Recolant
                                        <Button  className="btn-secondary pull-right" size="sm"   onClick={() => {
                                            this.props.goToImportWizard(encodeURIComponent(this.state.parentFolder));
                                        }}
                                                 disabled={this.state.disableButtons}
                                        >
                                            Cancel
                                        </Button></h5>
                                    </div>
                                    <fieldset className="import-fieldset">
                                        <legend className="import-legend">Import from Recolnat</legend>
                                        <Row>
                                            <Col sm={{size: 12}} md={{size: 12}} lg={{size: 12}}>
                                            <span
                                                className="inline-label">Import Pictures & Metadata from{' '}</span><span
                                                className="btn-link inline-link" color="primary">
                                		<a title="Open the search tool into Recolnat database"
                                           onClick={() => shell.openExternal('https://explore.recolnat.org/')}>explore.recolnat.org</a>
                                		</span>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col sm={{size: 12}} md={{size: 12}} lg={{size: 12}}>
                                                <span className="circle">1</span><span
                                                className="inline-value">Select & export</span>
                                                <span data-tip data-for='global' className='cardTitle'>
                                                    <img alt="help icon" className="help_icon" src={HELP_ICON}/>
                                                </span>
                                                <ReactTooltip multiline={true} place="right" effect="solid" id='global'
                                                              aria-haspopup='true'
                                                              role='example'>
                                                    <img alt="import image" width={350} src={img_import_from_explore_1}/>&nbsp;&nbsp;&nbsp;
                                                    <img
                                                        alt="import from explore"
                                                        width={450}
                                                        src={img_import_from_explore_2}/>
                                                </ReactTooltip>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col sm={{size: 12}} md={{size: 12}} lg={{size: 12}}>
                                                <span className="circle">2</span><span className="inline-value">Unzip the downloaded <span
                                                className="bolder">.zip</span> and </span>
                                                <Button className="btn btn-primary" color="primary"
                                                        title="Import images into Annotate library from the database Recolnat with Explore"
                                                        onClick={() => {
                                                            const _ = remote.dialog.showOpenDialog(remote.getCurrentWindow () ,{
                                                                properties: ['openFile'],
                                                                filters: [{
                                                                    name: 'JSON explore file',
                                                                    extensions: ['json']
                                                                }]
                                                            });
                                                            if (!_ || _.length < 1) return;
                                                            this.downloadFromExplore(_.pop());
                                                        }}
                                                ><img src={require('./pictures/file-plus.svg')}
                                                      alt="open json file"
                                                      width={15}/>
                                                    open the .json file
                                                </Button>
                                            </Col>
                                        </Row>
                                        <Row className="first-row">
                                        </Row>
                                    </fieldset>
                                </Container>
                            </Fragment> : <Fragment>
                                <div className="header_import_recolnat"> <h5>{title} specimens from Recolnat
                                    <Button className="btn-secondary pull-right" size="sm" onClick={() => {
                                        const iframe = document.getElementById('iframe');
                                        iframe.contentWindow.history.back()
                                    }}>Back</Button></h5>
                                </div>
                                <iframe id="iframe" onLoad={this._appendCss} width="100%" height="100%"
                                        style={{border: "1px", borderColor: "#dee2e6"}}
                                        src={iframeSrc}/>
                            </Fragment>
                        }
                    </_RightColumn>
                </_Content>
            </_Root>
        );
    }

    _appendCss = () => {
        const iframe = document.getElementById('iframe');
        const style = document.createElement('style');
        style.textContent = `
               div.ngdialog-content > div.ng-binding > div > span:nth-child(13) > div.alert.ng-isolate-scope.alert-success,
               body > div.all-site > div.ng-isolate-scope > div {
                display: none;
               }
           `;
        iframe.contentDocument.head.appendChild(style);
    }

    _importOptions = () => {
        const changeImportType = (type) => {
            this.setState({
                importType: type
            })
        };

        return  <Container className="import-wizard">
            <Row>
                <Col>
                    <div className="header_import_recolnat"> <h5>Select mode of import from Recolant
                        <Button  className="btn-secondary pull-right" size="sm"   onClick={() => {
                            this.props.goToImportWizard(encodeURIComponent(this.state.parentFolder));
                        }}
                                 disabled={this.state.disableButtons}
                        >
                            Cancel
                        </Button></h5>
                    </div>


                    <fieldset className="import-fieldset">
                        <legend className="import-legend">Choose option</legend>
                        <Row>
                            <Col  sm={3} md={3} lg={3}>
                                <div className="import-recolnat">
                                    <Button onClick={() => changeImportType(IMPORT_BOTANICAL)}>Search in botanical
                                        database</Button>
                                </div>
                            </Col>
                            <Col  sm={3} md={3} lg={3}>
                                <div className="import-recolnat">
                                    <Button onClick={() => changeImportType(IMPORT_ZOOLOGY)}>Search in zoology database</Button>
                                </div>
                            </Col>
                            <Col  sm={3} md={3} lg={3}>
                                <div className="import-recolnat">
                                    <Button onClick={() => changeImportType(IMPORT_PALEONTOLOGY)}>Search in paleontology
                                        database</Button>
                                </div>
                            </Col>
                            <Col  sm={3} md={3} lg={3}>
                                <div className="import-recolnat">
                                    <Button onClick={() => changeImportType(IMPORT_FROM_JSON)}>Open json with search
                                        results</Button>
                                </div>
                            </Col>
                        </Row>
                    </fieldset>
                </Col></Row></Container>
    }
}
