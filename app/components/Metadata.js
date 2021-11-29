import React, {Component} from 'react';
import {
    Button,
    Col,
    Container,
    Form,
    FormGroup,
    Input,
    InputGroup,
    InputGroupAddon,
    InputGroupText,
    Row
} from "reactstrap";
import PickTag from "../containers/PickTag";
import {shell} from "electron";
import {METADATA_DETERMINATIONS_TITLES, METADATA_TITLES} from "../utils/erecolnat-metadata";
import {loadMetadata, saveMetadata} from "../utils/config";
import fs from "fs-extra";
import path from "path";

const REMOVE_TAG = require('./pictures/delete_tag.svg');

export default class extends Component {
    constructor(props, context) {
        super(props, context);
        console.log(props);
        const metadata = {
            'naturalScienceMetadata': {
                'catalogNumber': props.picture.catalogNumber || '',
                'reference': props.picture.reference || '',
                'family': props.picture.family || '',
                'genre': props.picture.genre || '',
                'sfName': props.picture.sfName || '',
                'fieldNumber': props.picture.fieldNumber || ''

            },
            'iptc': {
                'title': props.picture.title || '',
                'creator': props.picture.creator || '' ,
                'subject': props.picture.subject || '',
                'description': props.picture.description || '',
                'publisher': props.picture.publisher || '',
                'contributor':props.picture.contributor || '',
                'created': props.picture.exifDate || '',
                'type' : props.picture.type || '',
                'format': props.picture.format || '',
                'identifier': props.picture.identifier || '',
                'source':  props.picture.source || '',
                'language':  props.picture.language || '',
                'relation':  props.picture.relation || '',
                'location': props.picture.exifPlace || '',
                'rights':  props.picture.rights || '',
                'contact': props.picture.contact || '',

            },
            'exif': {
                'dimensionsX': props.picture.width,
                'dimensionsY': props.picture.height,
                'resolutionX': props.picture.dpix || '',
                'resolutionY': props.picture.dpiy || '',
                'orientation': props.picture.orientation || ''
            }
        };


        this.state = {
            _validateLocationInput : true ,
            metadata, initMetadata: {
                naturalScienceMetadata: {...metadata.naturalScienceMetadata},
                iptc: {...metadata.iptc},
                exif: {...metadata.exif}
            },
            formSaved: true ,
            errors: {
                location: '',
            }
        };
    }


    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.picture !== prevProps.picture) {
            let metadata = loadMetadata(this.props.picture.sha1);
            if (metadata === null) {
                metadata = {
                    naturalScienceMetadata: {...this.state.initMetadata.naturalScienceMetadata},
                    iptc: {...this.state.initMetadata.iptc},
                    exif: {...this.state.initMetadata.exif}
                }
            }

            metadata.iptc = {
                ...metadata.iptc,
                'title':metadata.iptc.title ? metadata.iptc.title : this.props.picture.title || '',
                'creator': metadata.iptc.creator ? metadata.iptc.creator : this.props.picture.creator || '',
                'subject': metadata.iptc.subject ? metadata.iptc.subject : this.props.picture.subject || '',
                'description': metadata.iptc.description ? metadata.iptc.description : this.props.picture.description || '',
                'publisher': metadata.iptc.publisher ? metadata.iptc.publisher : this.props.picture.publisher || '',
                'contributor':  metadata.iptc.contributor ? metadata.iptc.contributor : this.props.picture.contributor || '',
                'created': metadata.iptc.created ? metadata.iptc.created : this.props.picture.exifDate || '',
                'type' : metadata.iptc.type ? metadata.iptc.type : this.props.picture.type || '',
                'format':  metadata.iptc.format ? metadata.iptc.format : this.props.picture.format || '',
                'identifier':  metadata.iptc.identifier ? metadata.iptc.identifier : this.props.picture.identifier || '',
                'source':  metadata.iptc.source ? metadata.iptc.source : this.props.picture.source || '',
                'language':  metadata.iptc.language ? metadata.iptc.language : this.props.picture.language || '',
                'relation': metadata.iptc.relation ? metadata.iptc.relation : this.props.picture.relation || '',
                'location': metadata.iptc.location ? metadata.iptc.location : this.props.picture.exifPlace || '',
                'rights': metadata.iptc.rights ? metadata.iptc.rights : this.props.picture.rights || '',
                'contact':  metadata.iptc.contact ? metadata.iptc.contact : this.props.picture.contact || '',
            };

            metadata.exif = {
                ...metadata.exif,
                'dimensionsX': this.props.picture.width,
                'dimensionsY': this.props.picture.height,
                'resolutionX': this.props.picture.dpix || '',
                'resolutionY': this.props.picture.dpiy || ''
            };
            this.setState({metadata, formSaved: true});
        }
    }

    componentDidMount() {
        const metadata = loadMetadata(this.props.picture.sha1);
        this.setState(prevState => ({
            metadata: metadata ? metadata : {
                naturalScienceMetadata: {...this.state.initMetadata.naturalScienceMetadata},
                iptc: {...this.state.initMetadata.iptc},
                exif: {...this.state.initMetadata.exif}
            }
        }))
    }

    _openInGoogleMaps(locationCoordinates) {
        shell.openExternal(`https://www.google.com/maps/place/${locationCoordinates}`);
    }
    _validateLocationInput(input) {

        const regexDecimal = new RegExp('(^-?\\d*\\.{0,1}\\d+$)');
        const regexDMS = new RegExp('([0-9]{1,2})[:|°]([0-9]{1,2})[:|\'|′]?([0-9]{1,2}(?:\\.[0-9]+)?)?["|″|\'\']([N|S]) ([0-9]{1,3})[:|°]([0-9]{1,2})[:|\'|′]?([0-9]{1,2}(?:\\.[0-9]+)?)?["|″|\'\']([E|W])');

        const coordinates = input.split(/[ ,]+/);
        const lat = coordinates[0];
        const lng = coordinates[1];

        if (input === '' || input === 'N/A'){
            return true
        }
        else if (regexDecimal.test(lat) && regexDecimal.test(lng)) {
            if (this.validateDecimalCoords(lat , lng)){
                return true;
            }
        }
        else if (regexDMS.test(input)) {
            const  latD = this.convertDMStoDecimal(lat);
            const  lngD = this.convertDMStoDecimal(lng);
            if (this.validateDecimalCoords(latD , lngD)){
                return  true;
            }
        }else {
            this.setState({_validateLocationInput : false});
        }
    }

    validateDecimalCoords(lat , lng) {
        return lat > -90 && lat < 90 && lng > -180 && lng < 180;
    }

    convertDMStoDecimal(coordinates){

        let parts = coordinates.split(/[^\d+(\,\d+)\d+(\.\d+)?\w]+/);
        let degrees = parseFloat(parts[0]);
        let minutes = parseFloat(parts[1]);
        let seconds = parseFloat(parts[2].replace(',','.'));
        let direction = parts[3];

        let dd = degrees + minutes / 60 + seconds / (60 * 60);

        if (direction === 'S' || direction === 'W') {
            dd = dd * -1;
        }
        return dd;
    }

    _formChangeHandler = ( event ) => {

        const { name, value } = event.target;
        let errors = this.state.errors;

        if (name === 'iptc.location'){
            errors.location =
                this._validateLocationInput(value)
                    ? ''
                    : 'Input is not valid , please provide lat/long [value1,value2] data in DMS or decimal format';
        }

        const path = event.target.name.split('.');
        const metadata = {...this.state.metadata};

        metadata[path[0]][path[1]] = event.target.value;


        this.setState({
            metadata,
            formSaved: false,
            errors: errors
        });
    };




    _saveForm = (_) => {
        if(this._validateForm(this.state.errors)) {
            if ((_.key !== 'Enter' && _.key !== 'Tab') && _.type === 'keydown') {
                return;
            }
            saveMetadata(this.props.picture.sha1, this.state.metadata);

            console.log(this.state.metadata);
            this.props.updatePictureDate(this.props.picture.sha1, this.state.metadata.iptc.created, this.state.metadata.iptc.location);

            let naturalScienceMetadata2 = '';
            let  iptcMetadata ='';
            let  exifMetadata ='';

            let sfMetadata = this.state.metadata.naturalScienceMetadata;
            let iptc = this.state.metadata.iptc;
            let exif = this.state.metadata.exif;
            const separator = ';';


            for (let prop in sfMetadata) {
                if (sfMetadata[prop] !== ''){
                    let xmp_tag = `\t\t <recolnat:${prop}>${sfMetadata[prop]}</recolnat:${prop}> \n`;
                    if (sfMetadata[prop].includes(separator)) {
                        const _array = sfMetadata[prop].split(separator);
                        _array.forEach( ( a ) => {
                            naturalScienceMetadata2 = naturalScienceMetadata2 +`\t\t <recolnat:${prop}>${a}</recolnat:${prop}> \n`;
                        });
                    }else{
                        naturalScienceMetadata2 = naturalScienceMetadata2 + xmp_tag;
                    }
                }
            }

            for (let prop in iptc) {
                if (iptc[prop] !== ''){
                    let xmp_tag = `\t\t <dc:${prop}>${iptc[prop]}</dc:${prop}> \n`;
                    if (iptc[prop].includes(separator)) {
                        const _array = iptc[prop].split(separator);
                        _array.forEach( ( a ) => {
                            iptcMetadata = iptcMetadata +`\t\t <dc:${prop}>${a}</dc:${prop}> \n`;
                        });
                    }else{
                        iptcMetadata = iptcMetadata + xmp_tag;
                    }
                }
            }

            for (let prop in exif) {
                if (exif[prop] !== ''){
                    exifMetadata = exifMetadata + `\t\t <exif:${prop}>`+ `${exif[prop]}</exif:${prop}> \n`;
                }
            }

            const rdf = `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
                    <rdf:Description
                    xmlns:recolnat="http://www.recolnat.org/terms/"
                    xmlns:dc="http://purl.org/dc/elements/1.1/"
                    xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/"
                    xmlns:exif="http://ns.adobe.com/exif/2.2/"> 
                    
             ${(naturalScienceMetadata2)}
                                    
             ${(iptcMetadata)}
                                    
             ${(exifMetadata)}
                    </rdf:Description>
        </rdf:RDF>`

            const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <metadata xmlns="http://www.recolnat.org/terms/"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://example.org/myapp/"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:dcterms="http://purl.org/dc/terms/">
        ${(iptcMetadata)}
        </metadata>`;

            const parentFolder = path.dirname(this.props.picture.file);
            const fileName = this.props.picture.file_basename.substring(0, this.props.picture.file_basename.lastIndexOf('.'));
            fs.writeFileSync(path.join(parentFolder, `${fileName}.xmp`), rdf);
            fs.writeFileSync(path.join(parentFolder, `${fileName}.xml`), xml);

            console.log("Files saved", `${fileName}.xmp ,  ${fileName}.xml` );
            this.setState({formSaved: true});
            console.info('Valid Form')
        }else{
            console.error('Invalid Form')
        }
    };

    _validateForm = (errors) => {
        let valid = true;
        Object.values(errors).forEach(
            (val) => val.length > 0 && (valid = false)
        );
        return valid;
    };


    render() {
        const {errors} = this.state;
        return <Container className="metadata-pane">
            <Row>
                <Col className="local-title">Keywords</Col>
                {!this.props.readOnly && (
                    <Col className="local-title">
                        <Button className="btn btn-secondary" color="gray"
                                onClick={() => {
                                    this.setState({pickTag: true});
                                }}>
                            Create (Modify) keywords</Button>
                    </Col>
                )}
            </Row>
            <Row>
                <Col>
                    <PickTag openModal={this.state.pickTag}
                             onClose={() => {
                                 this.setState({pickTag: false});
                             }}
                             onTagSelected={(tag) => {
                                 this.props.tagPicture(this.props.picture.sha1, tag);
                             }}
                    />
                </Col>
            </Row>
            <Row>
                <Col>
                    <div className="tags-panel">
                        {this.props.tags && this.props.tags.map(_ => {
                            return (
                                <span key={`tag_${_}`} className="annotation-tag-controls">{_}&nbsp;
                                    <img src={REMOVE_TAG}
                                         className='delete-tag'
                                         alt="remove tag"
                                         onClick={() => {
                                             this.props.untagPicture(this.props.picture.sha1, _);
                                         }}/>
                                </span>
                            );
                        })}
                    </div>
                </Col>
            </Row>
            <Row>
                <Col className="local-title">Metadata</Col>
                {!this.props.picture.erecolnatMetadata ?<Col className="local-title">
                    <Button className="pull-right" color={this.state.formSaved ? 'success' : 'danger'}
                            onClick={this._saveForm}>Save</Button>
                </Col>:''}
            </Row>
            <Row>
                <Col sm={12} md={12} lg={12} className="metadata-title">File name</Col>
                <Col sm={12} md={12} lg={12}
                     className="metadata-value">{this.props.picture.file_basename}</Col>
            </Row>
            {this.props.picture.erecolnatMetadata ?
                <div className="link-pane">
                    <Row>
                        <Col sm={12} md={12} lg={12} className="link-value">
                            <a onClick={() =>
                                shell.openExternal(
                                    `https://explore.recolnat.org/search/botanique/type=advanced&catalognumber=${
                                        this.props.picture.erecolnatMetadata.catalognumber
                                    }`
                                )
                            }
                            >
                                <img alt="link" src={require('./pictures/external-link.svg')}/> explore.recolnat.org
                            </a>
                        </Col>
                        <Col sm={12} md={12} lg={12} className="link-value">
                            <a
                                onClick={() =>
                                    shell.openExternal(
                                        `http://lesherbonautes.mnhn.fr/specimens/${
                                            this.props.picture.erecolnatMetadata.institutioncode
                                        }/${this.props.picture.erecolnatMetadata.collectioncode}/${
                                            this.props.picture.erecolnatMetadata.catalognumber
                                        }`
                                    )
                                }
                            >
                                <img alt="external link" src={require('./pictures/external-link.svg')}/>
                                Les Herbonautes
                            </a>
                        </Col>
                    </Row>
                </div>
                : <div>
                    <br/>
                    <Form ref={_ => this.form = _} id='metadata-form'>
                        <span className="subtitle">Scientific metadata</span>
                        <hr/>
                        <FormGroup>
                            <Input type="text" name="naturalScienceMetadata.catalogNumber" id="catalogNumber"
                                   onKeyDown={this._saveForm}
                                   placeholder="Catalog Number"
                                   title = "Catalog Number"
                                   value={this.state.metadata.naturalScienceMetadata.catalogNumber}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="naturalScienceMetadata.reference" id="reference"
                                   placeholder="Reference"
                                   title = "Reference"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.naturalScienceMetadata.reference}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="naturalScienceMetadata.family" id="family"
                                   placeholder="Family"
                                   title = "Family"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.naturalScienceMetadata.family}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="naturalScienceMetadata.genre" id="genre"
                                   placeholder="Genus"
                                   title = "Genus"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.naturalScienceMetadata.genre}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="naturalScienceMetadata.sfName" id="sfName"
                                   placeholder="Scientific name"
                                   title = "Scientific name"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.naturalScienceMetadata.sfName}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="naturalScienceMetadata.fieldNumber" id="fieldNumber"
                                   placeholder="Collection number"
                                   title = "Collection number"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.naturalScienceMetadata.fieldNumber}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>

                        <span className="subtitle">IPTC / Dublin Core</span>
                        <hr/>
                        <FormGroup>
                            <Input type="text" name="iptc.title" id="title"
                                   placeholder="Title"
                                   title = "Title"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.iptc.title}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="iptc.creator" id="creator"
                                   placeholder="Creator"
                                   title = "Creator"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.iptc.creator}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="iptc.subject" id="subject"
                                   placeholder="Subject/Keywords"
                                   title = "Subject/Keywords"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.iptc.subject}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="iptc.description" id="description"
                                   placeholder="Description"
                                   title = "Description"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.iptc.description}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="iptc.publisher" id="publisher"
                                   placeholder="Publisher"
                                   title = "Publisher"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.iptc.publisher}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="iptc.contributor" id="contributor"
                                   placeholder="Contributor"
                                   title = "Contributor"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.iptc.contributor}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="iptc.created" id="created"
                                   placeholder="Date"
                                   title = "Date"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.iptc.created}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="iptc.type" id="type"
                                   placeholder="Type"
                                   title = "Type"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.iptc.type}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="iptc.format" id="format"
                                   placeholder="Format"
                                   title = "Format"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.iptc.format}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="iptc.identifier" id="identifier"
                                   placeholder="Identifier"
                                   title = "Identifier"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.iptc.identifier}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="iptc.source" id="source"
                                   placeholder="Source"
                                   title = "Source"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.iptc.source}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="iptc.language" id="language"
                                   placeholder="Language"
                                   title = "Language"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.iptc.language}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="iptc.relation" id="relation"
                                   placeholder="Relation"
                                   title = "Relation"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.iptc.relation}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <InputGroup>
                                <Input type="text" name="iptc.location" id="location"
                                       placeholder="Coverage / place"
                                       title = "Coverage / place"
                                       onKeyDown={this._saveForm}
                                       value={this.state.metadata.iptc.location}
                                       onChange={this._formChangeHandler}/>
                                <InputGroupAddon addonType="append">
                                    <InputGroupText>
                                        <i className="fa fa-external-link" aria-hidden="true"
                                           onClick={() => this._openInGoogleMaps(this.state.metadata.iptc.location)}
                                        />
                                    </InputGroupText>
                                </InputGroupAddon>
                                {errors.location.length > 0 &&
                                <span className='error'>{errors.location}</span>}
                            </InputGroup>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="iptc.rights" id="rights"
                                   placeholder="Rights Usage Terms"
                                   title = "Rights Usage Terms"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.iptc.rights}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="iptc.contact" id="contact"
                                   placeholder="Contact"
                                   title = "Contact"
                                   onKeyDown={this._saveForm}
                                   value={this.state.metadata.iptc.contact}
                                   onChange={this._formChangeHandler}/>
                        </FormGroup>

                        <span className="subtitle">EXIF metadata</span>
                        <hr/>
                        <FormGroup>
                            <Input type="text" name="exif.dimensions" id="dimensions"
                                   placeholder="Dimensions"
                                   title = "Dimensions"
                                   readOnly
                                   value={this.state.metadata.exif.dimensionsX + ' x ' + this.state.metadata.exif.dimensionsY}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="exif.resolutionX" id="resolutionX"
                                   placeholder="Resolution"
                                   title = "Resolution"
                                   readOnly
                                   value={`${this.state.metadata.exif.resolutionX} x ${this.state.metadata.exif.resolutionY}`}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Input type="text" name="exif.orientation" id="orientation"
                                   placeholder="Orientation"
                                   title = "Orientation"
                                   readOnly
                                   value={this.state.metadata.exif.orientation}
                            />
                        </FormGroup>
                    </Form>
                    <br/>
                    <br/>
                </div>}
            {this.props.picture.erecolnatMetadata &&
            Object.keys(METADATA_TITLES).map(_ => {
                if (_ === 'determinations') {
                } else {
                    return (
                        <Row key={'erecolnat_metadata' + _}>
                            <Col sm={12} md={12} lg={12} className="metadata-title">
                                {METADATA_TITLES[_]}
                            </Col>
                            <Col sm={12} md={12} lg={12} className="metadata-value">
                                {this.props.picture.erecolnatMetadata[_]}
                            </Col>
                        </Row>
                    );
                }
            })}

            {this.props.picture.erecolnatMetadata &&
            this.props.picture.erecolnatMetadata.determinations &&
            this.props.picture.erecolnatMetadata.determinations.length > 0 && (
                <Row key={'erecolnat_metadata_determinations'}>
                    <Col sm={12} md={12} lg={12}
                         className="metadata-title">{`${METADATA_TITLES.determinations} (${
                        this.props.picture.erecolnatMetadata.determinations.length
                    })`}</Col>
                    <ul className="metadata-list">
                        {this.props.picture.erecolnatMetadata.determinations.map(determination => {
                            return (
                                <li key={Math.random()}>
                                    {Object.keys(METADATA_DETERMINATIONS_TITLES).map(_ => {
                                        return (
                                            <div
                                                key={'erecolnat_metadata_determination_' + _}>
                                                <div style={{color: '#999'}}>{METADATA_DETERMINATIONS_TITLES[_]}</div>
                                                <div className="metadata-value">{determination[_]}</div>
                                            </div>
                                        );
                                    })}
                                </li>
                            );
                        })}
                    </ul>
                </Row>
            )}
        </Container>
    }
}