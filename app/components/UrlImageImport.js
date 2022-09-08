import React, {PureComponent} from 'react';
import {Button, Col, Input, Row} from 'reactstrap';
import request from "request";
import {remote, shell} from "electron";
import promiseLimit from "promise-limit";
import progress from "request-progress";
import fs from "fs-extra";
import {getUserWorkspace, saveMetadata} from "../utils/config";
import path from "path";
import {IMAGE_STORAGE_DIR, URL_REGEXP} from "../constants/constants";
import {
    authorized_pictures_extensions,
    ee,
    EVENT_HIDE_LOADING,
    EVENT_SHOW_LOADING,
    initPicturesLibrary
} from "../utils/library";
import fileType from 'file-type';
import readChunck from 'read-chunk';
import Chance from "chance";
import {attachDefaultTags} from "../utils/tags";
import {loadTags} from "../utils/common";


const chance = new Chance();

export default class extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {urls: null, progress: [] , validPictures: []};
    }

    writeImageMetadata(image) {

        const validPictureObjects = this.state.validPictures;

        const url = validPictureObjects.find(x => x.targetFile === image.file).url;

        let metadata = {
            'naturalScienceMetadata': {
                'catalogNumber': image.catalogNumber || '',
                'reference': url || '',
                'family': image.family || '',
                'genre': image.genre || '',
                'sfName': image.sfName || '',
                'fieldNumber': image.fieldNumber || ''

            },
            'iptc': {
                'title': image.title || '',
                'creator': image.creator || '' ,
                'subject': image.subject || '',
                'description': image.description || '',
                'publisher': image.publisher || '',
                'contributor':image.contributor || '',
                'created': image.exifDate || '',
                'type' : image.type || '',
                'format': image.format || '',
                'identifier': image.identifier || '',
                'source':  image.source || '',
                'language':  image.language || '',
                'relation':  image.relation || '',
                'location': image.exifPlace || '',
                'rights':  image.rights || '',
                'contact': image.contact || '',

            },
            'exif': {
                'dimensionsX': image.width,
                'dimensionsY': image.height,
                'resolutionX': image.dpix || '',
                'resolutionY': image.dpiy || '',
                'orientation': image.orientation || ''
            }
        };

        saveMetadata(image.sha1, metadata);
    }

    startDownload = () => {
        this.setState({
            isDownloading: true
        });
        // Check connectivity
        request('https://www.google.com', {timeout: 10000, proxy: process.env.RECOLNAT_HTTP_PROXY})
            .on('error', err => {
                console.log(err)
                remote.dialog.showErrorBox('Error', 'Cannot start download. Check your internet connection!');
                this.setState({
                    isDownloading: false
                });
            }).on('end', () => {
            const limit = promiseLimit(4);

            // Download pictures
            const downloadPictureJob = (id, pictureUrl, targetPictureFile, destDir) => {
                return new Promise((resolve, reject) => {
                    if (!pictureUrl.match(URL_REGEXP)) {
                        resolve({invalidUrl: pictureUrl})
                    }

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
                                            id,
                                            pictureUrl,
                                            status: 'downloading',
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
                            fs.remove(targetPictureFile).then(_ => {
                                resolve({invalidUrl: pictureUrl})
                            });
                        })
                        .on('end', () => {
                            console.log('Done');
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

                            const buffer = readChunck.sync(targetPictureFile, 0, 4100);
                            fileType.fromBuffer(buffer).then(type => {
                                if (type !== undefined && authorized_pictures_extensions.indexOf(`.${type.ext}`) !== -1) {
                                    resolve({id, pictureUrl, targetPictureFile, destDir});
                                } else {
                                    fs.remove(targetPictureFile).then(_ => {
                                        resolve({invalidUrl: pictureUrl})
                                    });
                                }
                            });
                        })
                        .pipe(fs.createWriteStream(targetPictureFile));
                });
            };

            const DESTINATION_DIR = path.join(getUserWorkspace(), IMAGE_STORAGE_DIR, this.props.parentFolder);
            const urls = this.state.urls.split('\n');

            Promise.all(
                urls.map(url => {
                    const pictureId = chance.guid();
                    // const pictureId = crypto.createHash('sha1').update(url).digest('hex');
                    const targetPictureFile = path.join(DESTINATION_DIR, pictureId + '.jpeg');
                    return limit(() =>
                        downloadPictureJob(
                            pictureId,
                            url,
                            targetPictureFile,
                            DESTINATION_DIR
                        )
                    );
                }))
                .then(results => {
                    const successfullyDownload = [];
                    const invalidUrls = [];

                    results.map(_ => {
                        if ('invalidUrl' in _) {
                            invalidUrls.push(_.invalidUrl);
                        } else {
                            const picture = {
                                url: _.pictureUrl,
                                id: _.id,
                                targetFile: _.targetPictureFile
                            }
                            this.state.validPictures.push(picture);
                            successfullyDownload.push(_.targetPictureFile);
                        }
                    });

                    if (invalidUrls.length > 0) {
                        remote.dialog.showMessageBox({
                            type: 'warning',
                            message: 'Following URLs are invalid or don\'t contain proper image.',
                            detail: invalidUrls.join('\n')
                        });
                    }

                    if (successfullyDownload.length === 0) {
                        this.setState({
                            isDownloading: false,
                            progress: []
                        });
                        return;
                    }

                    // Display loading overlay.
                    ee.emit(EVENT_SHOW_LOADING, successfullyDownload.length);
                    initPicturesLibrary(successfullyDownload, [this.props.parentFolder], this.props.pictures).then(pictureObjects => {

                        //save url as reference (sf metadata field) create both xmp and xml file
                        if (Object.keys(pictureObjects).length !== 0) {
                            Object.keys(pictureObjects).forEach(e => {
                                    this.writeImageMetadata(pictureObjects[e]);
                                }
                            );
                        }
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

                }).catch(err => {
                console.log('There was some error downloading images.');
                console.error(err)
            });
        });
    };

    render() {
        const { t } = this.props;
        return (
            <fieldset className="import-fieldset">
                <legend className="import-legend">{t('library.import_images.lbl_import_remote_images')}</legend>
                <div className="bst rcn_urldownloader">
                    <Row>
                        <Col sm={12} md={12} lg={12}>
                            <Input autoFocus type="textarea" rows={10}
                                   disabled={this.state.isDownloading}
                                   placeholder={t('library.import_images.text_area_placeholder_paste_image_urls')}
                                   onChange={(e) => {
                                       this.setState({
                                           urls: e.target.value
                                       })
                                   }}
                            />

                        </Col>
                    </Row>
                    <Row>
                        <Col sm={11} md={11} lg={11}>
                            <Button
                                className="btn btn btn-success"
                                disabled={!this.state.urls || this.state.isDownloading || this.props.parentFolder === null}
                                onClick={this.startDownload}
                            >{t('global.save')}</Button>
                            &emsp;
                            <Button className="btn btn-danger" size="md" color="warning" onClick={this.props.onClose}>
                                {t('global.cancel')}
                            </Button>
                        </Col>
                    </Row>
                    {this.state.progress.map((_, index) => {
                        return (
                            <table key={index} className={_.status} cellPadding={0} cellSpacing={0}>
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
                                    <td>{`${_.status} '${_.id}' (${(_.transferred / 1000 / 1000).toFixed(2)} MB)`}</td>
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
                </div>
            </fieldset>
        );
    }
}
