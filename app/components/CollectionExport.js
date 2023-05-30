import { remote } from "electron";
import fs from 'fs';
import JSZip from 'jszip';
import React, { Component } from 'react';
import { Button, Col, Container, Form, FormGroup, Input, Label, Row } from 'reactstrap';
import { getIIIFParams, loadMetadata } from "../utils/config";
import { EVENT_HIDE_WAITING, EVENT_SHOW_WAITING, ee } from "../utils/library";

const RECOLNAT_LOGO = require('./pictures/logo.svg');
const { dialog, shell } = remote;


export default class extends Component {
    constructor(props) {
        super(props);
        const initPicturesList = this.props.tabData[this.props.match.params.tabName].pictures_selection.map(_ => this.props.allPictures[_])
        this.state = {showLoadingModal: false, initPicturesList , selectedThumbnailImage: null, collectionType: "RESOURCE_TYPE_PICTURE"};
    }

    exportCollection = () => {
        ee.emit(EVENT_SHOW_WAITING);
        const { t } = this.props;
        let zip = new JSZip();
        let imgFolder = zip.folder("images");
        let imgThumbnailFolder = imgFolder.folder("img_thumb");
        let thumbnailFolder = imgFolder.folder("thumbnail");
        let thumbnailName;
        const selectedPictures = [];
        const recolnatLicense = 'https://creativecommons.org/licenses/by-nc/4.0/';
        const logo = 'https://www.recolnat.org/menu/cfb9d3804c5430a57847fed2e6617794.png';
       
        if (this.state.initPicturesList) {
            const filteredPictures = Object.values(this.state.initPicturesList).filter(picture => picture.resourceType === this.state.collectionType);

            if (this.state.selectedThumbnailImage) {
                const thumbnailImage = this.state.selectedThumbnailImage;
                thumbnailName = thumbnailImage.name;
                thumbnailFolder.file(thumbnailName , fs.readFileSync(thumbnailImage.path));
            }else {
                const thumbnailImage = filteredPictures[0];
                thumbnailName = thumbnailImage.file_basename;
                thumbnailFolder.file(thumbnailImage.file_basename + (this.state.collectionType=='RESOURCE_TYPE_VIDEO' ? '.jpg' : '') , fs.readFileSync(thumbnailImage.thumbnail));
            }

            filteredPictures.map(_ => {
                const image = {..._};
                // Remove filed that don't have purpose on server side.
                delete image.thumbnail;
                imgFolder.file(image.file_basename, fs.readFileSync(image.file));
                imgThumbnailFolder.file(image.file_basename + (this.state.collectionType=='RESOURCE_TYPE_VIDEO' ? '.jpg' : ''),fs.readFileSync(image.thumbnail) );
                delete image.thumbnail;
                delete image.file;
                image.xmp_metadata = {};

                if(image.sha1 in this.props.cartels)
                    image.cartel = this.props.cartels[image.sha1];

                    if (image.erecolnatMetadata) {
                        image.seeAlso = "https://api.recolnat.org/erecolnat/v1/specimens/cb/" +
                            image.erecolnatMetadata.catalognumber;
                    }

                    if (loadMetadata(image.sha1) !== null) {
                        image.xmp_metadata = loadMetadata(image.sha1);
                    }

                if (this.props.annotations) {
                    this.props.annotations.map(annotation => {

                        if (annotation.id in this.props.appState.tags_by_annotation) {
                            annotation.tags = this.props.appState.tags_by_annotation[annotation.id];
                        }

                        if (annotation.pictureId === image.sha1) {
                            if (!image.annotations)
                                image.annotations = [];
                            image.annotations.push(annotation);
                        }
                    });
                }
                selectedPictures.push(image);
            });

            zip.file('data.json', JSON.stringify(selectedPictures));
            zip.file('metadata.json', JSON.stringify({
                label: this.state.collectionName,
                description: this.state.collectionDescription,
                license: recolnatLicense,
                logo: logo,
                thumbnail: thumbnailName,
                resourceType: this.state.collectionType
            }));
            zip.generateAsync({ type: 'blob' }).then(content => {
                
                let IIIFParams = getIIIFParams();
            
                const formData = new FormData();
                
                formData.append('file', content, this.state.collectionName +'.zip'); // Set the desired name for the zip file
        
                const headers = new Headers();
                headers.append('Authorization', 'Basic ' + btoa(IIIFParams.username + ":" + IIIFParams.password)); 
        
                fetch(IIIFParams.url, {
                method: 'POST',
                headers: headers,
                body: formData,
                })
                .then(response => {
                    ee.emit(EVENT_HIDE_WAITING);
                    if (response.ok) {
                    return response.json(); 
                    throw new Error('Error uploading file: ' + response.status);
                    }
                })
                .then(data => {
                    console.log('Server response:', data);
                    document.getElementById('collection_form').reset();
                    this.setState({
                        serverResponseUrl: data.data.url,
                        selectedThumbnailImage: null,
                        collectionType: 'RESOURCE_TYPE_PICTURE',
                        collectionName: '',
                        collectionDescription: '',
                        isEnabled: false,
                    });
                })
                .catch(error => {
                    ee.emit(EVENT_HIDE_WAITING);
                    if(IIIFParams.username == null || IIIFParams.password == null ||IIIFParams.url == null)
                    {
                        remote.dialog.showErrorBox(t('global.error'), t('global.alert_please_check_your_IIIF_parameters'));    
                    }else{
                        remote.dialog.showErrorBox(t('global.error'), error.message);
                    }
                    console.log('Error uploading file:', error);
                    
                });
            })
            .catch(error => {
                console.log('Error generating zip file:', error);
            });

                }
            };
      openLink = () => {
        const { serverResponseUrl } = this.state;
        if (serverResponseUrl) {
          shell.openExternal(serverResponseUrl);
        }
      };

    render() {
        const { t } = this.props;
        const { serverResponseUrl } = this.state;
        return (
            <div className="bst rcn_collection">
                <div className="bg">
                    <a onClick={ () => {
                        this.props.goToLibrary()}}>
                        <img src={RECOLNAT_LOGO}
                             alt="go to home page"
                             className="logo"
                             title={"Go back to home page"}/>
                    </a>
                    <span className="title">{t('results.collections.export.title')}</span>
                </div>
                <Container className="cnt">
                    <Row className="first-row">
                        <Col sm={12} md={12} lg={12}>
                            <Button size="md" color="gray" onClick={() => {
                                this.props.goToLibrary();
                            }}>Back</Button>
                        </Col>
                    </Row>
                    <Row>
                        <Col sm={12} md={12} lg={12}>
                            <h2 className="title_section">{t('results.collections.export.subtitle')}</h2>
                        </Col>
                    </Row>

                    <Row>
                        <Col sm={6} md={6} lg={6}>
                            <br/>
                            <Form id="collection_form" onSubmit={(e) => {
                                e.preventDefault();
                            }}>
                                <FormGroup row>
                                    <Label for="collection_type" sm={5}>{t('results.collections.export.form_lbl_type')}</Label>
                                    <Col sm={7}>
                                    <Input type="select" name="collection_type" id="collection_type"
                                                    autoFocus={true}
                                                    onChange={(e) => {
                                                        this.setState({
                                                            collectionType: e.target.value,
                                                            
                                                        })
                                                    }}
                                                    >
                                                    <option key="Image" value="RESOURCE_TYPE_PICTURE">{t('results.collections.export.dropdown_lbl_image')}</option>
                                                    <option key="Video" value="RESOURCE_TYPE_VIDEO">{t('results.collections.export.dropdown_lbl_video')}</option>
                                    </Input>
                                    </Col>
                                </FormGroup>
                                <FormGroup row>
                                    <Label for="collection_name" sm={5}>{t('results.collections.export.form_lbl_name')}</Label>
                                    <Col sm={7}>
                                        <Input type="text" name="collection_name" id="collection_name"
                                               autoFocus={false}
                                               onChange={(e) => {
                                                   this.setState({
                                                       collectionName: e.target.value,
                                                       isEnabled: e.target.value.length > 0
                                                   })
                                               }}
                                        />
                                    </Col>
                                </FormGroup>
                                <FormGroup row>
                                    <Label for="collection_description" sm={5}>{t('results.collections.export.form_lbl_description')}</Label>
                                    <Col sm={7}>
                                        <Input type="textarea" name="collection_description" id="collection_description"
                                               onChange={(e) => {
                                                   this.setState({
                                                       collectionDescription: e.target.value
                                                   })
                                               }}
                                        />
                                    </Col>
                                </FormGroup>
                                <FormGroup row>
                                    <Label for="collection_description" sm={5}>{t('results.collections.export.form_lbl_licence')}</Label>
                                    <Col sm={7}>
                                        <Input type="text" name="collection_license" id="collection_license"
                                               value="https://creativecommons.org/licenses/by-nc/4.0/"
                                               disabled={true}
                                        />
                                    </Col>
                                </FormGroup>
                                <FormGroup row>
                                    <Label for="collection_logo" sm={5}>{t('results.collections.export.form_lbl_logo')}</Label>
                                    <Col sm={7}>
                                        <Input type="text" name="collection_logo" id="collection_logo"
                                               value="https://www.recolnat.org/menu/cfb9d3804c5430a57847fed2e6617794.png"
                                               disabled={true}
                                        />
                                    </Col>
                                </FormGroup>
                                <FormGroup row>
                                    <Label for="collection_thumbnail" sm={5}>{t('results.collections.export.form_lbl_thumbnail')}</Label>
                                    <Col sm={7}>
                                        <input type="file" name="file"  color="red"
                                               onChange={(e) => {
                                                   this.setState({
                                                       selectedThumbnailImage: e.target.files[0]
                                                   })
                                               }}
                                        />
                                    </Col>
                                </FormGroup>
                            </Form>
                        </Col>
                    </Row>
                    <Row>
                        <Col sm={12} md={12} lg={12}>
                            <br/>
                            <Button disabled={!this.state.isEnabled} className="btn btn-primary" color="primary"
                                    title="Create zip package"
                                    onClick={this.exportCollection}
                            >{t('results.collections.export.btn_export')}</Button>
                             <br/><br/><br/>
                             {serverResponseUrl && (
                               <div><span>Your collection is successfuly uploaded to server </span><br/><br/> 
                               <button onClick={this.openLink} className="btn btn-primary" color="primary">
                              {t('results.collections.export.btn_open_iiif_link')}
                             </button>
                             </div>
                            )}

                        </Col>
                    </Row>
                </Container>
            </div>
        );

    }
}
