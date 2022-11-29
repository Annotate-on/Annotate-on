import React, {Component} from 'react';
import {Button, Col, Container, Input, Label, Row} from 'reactstrap';
import {remote} from "electron";
import path from 'path';
import {convertSDDtoJson} from "../utils/sdd-processor";
import {CATEGORICAL, NUMERICAL} from "../constants/constants";
import Chance from 'chance';
import {getTaxonomyDir, getXperParams} from "../utils/config";
import request from "request";

const RECOLNAT_LOGO = require('./pictures/logo.svg');
const chance = new Chance();

export default class extends Component {
    constructor(props) {
        super(props);

        const sddObject = props.model !== null ? convertSDDtoJson(path.join(getTaxonomyDir(), props.model.sddPath)) : null;
        this.state = {
            sddFile: props.model ? props.model.sddPath : '',
            sddObject
        };
    }

    _handleImportFromXperDatabase = () => {
        const { t } = this.props;
        let xperParams = getXperParams();
        console.log("_exportDataToSdd", xperParams);
        const hasParams = xperParams && xperParams.url && xperParams.email && xperParams.password;
        if(!hasParams) {
            remote.dialog.showErrorBox(t('global.error'), t('global.xper_params_are_required'));
            return;
        }
        let url = xperParams.url + '/list_bases_for_user';
        let username = xperParams.email;
        let password = xperParams.password;

        let auth = 'Basic ' + btoa(username + ":" + password);
        request({
                url : url,
                headers : {
                    "Authorization" : auth
                }},
            function (error, response, body) {
                console.log("body "+body);
                console.log("response "+response);
                console.log("error "+error);
                let result = JSON.parse(body)
                console.log("result ", result);
                let found = []
                if(result) {
                    for (const resultElement of result) {
                        found.push(resultElement.datasetName);
                    }
                    console.log("found ", found);
                }
                alert("Found databases : " + found.join(','))
            }
        );
    }

    render() {
        const { t } = this.props;
        let key = 0;
        return (
            <Container className="bst rcn_xper">
                <div className="bg">
                    <a onClick={() => {
                        this.props.goToLibrary();
                    }}> <img alt="logo" src={RECOLNAT_LOGO} className="logo" title={t('global.logo_tooltip_go_to_home_page')}/></a>
                    <span className="title">{t('models.import_from_xper.title')}</span>
                </div>
                <br/>

                <Row className='content'>
                    <Col md={{size: 6, offset: 3}}>
                        {
                            this.state.sddFile.length > 0 ? ''
                                :
                                <Row>
                                    <Col sm={{size: 10, offset: 2}}>
                                        <Button size="m" color="primary" onClick={() => this._handleImportFromXperDatabase()}>
                                            {t('models.import_from_xper.btn_import_from_xper_database')}</Button>
                                        &nbsp;&nbsp;
                                        <Button className="btn btn-primary" color="primary"
                                                onClick={() => {
                                                    const _ = remote.dialog.showOpenDialog(remote.getCurrentWindow () ,{
                                                        properties: ['openFile'],
                                                        filters: [{name: 'XML explore file', extensions: ['xml']}]
                                                    });
                                                    if (!_ || _.length < 1) return;
                                                    const location = _.pop();
                                                    this.setState({
                                                        sddFile: location,
                                                        sddObject: convertSDDtoJson(location),
                                                    });
                                                }}
                                        >{t('models.import_from_xper.btn_select_sdd_file_to_import')}</Button>
                                        &nbsp;&nbsp;
                                        <Button size="m" color="primary" onClick={() => {
                                            this.props.goBack();
                                        }}>{t('global.cancel')}</Button>
                                    </Col>
                                </Row>
                        }
                        <Row>
                            <Col sm={12}>

                                <br/>
                                {this.state.sddFile.length > 0 &&
                                <div>

                                    <Button className="btn btn-primary" color="primary"
                                            onClick={() => {
                                                this.props.goBack();
                                                this.props.saveTaxonomy(chance.guid(), this.state.sddObject.name,
                                                    this.state.sddFile, 0);
                                            }}
                                    >{t('models.import_from_xper.btn_save_model')}</Button>&nbsp;&nbsp;
                                    <Button className="btn btn-primary" color="primary"
                                            onClick={() => {
                                                this.props.goBack();
                                            }}
                                    >Cancel</Button>
                                    <br/>
                                    <Label className="file-name">{t('models.import_from_xper.lbl_model_descriptors_found_in_file')}:</Label>
                                    <Label className="file-name">{path.basename(this.state.sddFile)}</Label>
                                    <br/>
                                </div>
                                }
                            </Col>
                        </Row>

                        <Row>
                            <Col>
                                {this.state.sddObject ? this.state.sddObject.items.map((item, index) => {
                                    if (this.state.sddObject.groups.length === 0 || item.targetType === undefined && item.annotationType === CATEGORICAL) {
                                        return <div className="group-item" key={'categorical_' + index}>
                                            <span className="item-label">{t('models.import_from_xper.lbl_character_name')}: </span><span
                                            className="item-text">{item.targetName}</span>
                                            <br/>
                                            <span className="item-label">{t('models.import_from_xper.lbl_character_values')}:</span>
                                            <span
                                                className="item-text-values">
                                                <ul style={{display: 'inline-grid'}}>
                                                    {item.states ? item.states.map((state, inner) => {
                                                        return <li
                                                            key={'list_' + index + '_' + inner}>{state.name}</li>;
                                                    }) : ''}
                                                    </ul>
                                                   </span>
                                            <br/>
                                        </div>
                                    }else {
                                        console.log("item is a member of a group")
                                    }

                                    if (this.state.sddObject.groups.length === 0 || item.targetType === undefined && item.annotationType === NUMERICAL) {
                                        return <div className="group-item" key={'numerical_' + index}>
                                            <span className="item-label">{t('models.import_from_xper.lbl_character_name')}: </span><span
                                            className="item-text">{item.targetName}</span>
                                            <br/>

                                            <span
                                                className="item-label">{t('models.import_from_xper.lbl_character_measurement_type')}: </span><span
                                            className="item-text-values">{item.unit}</span>
                                            <br/>

                                        </div>
                                    }else {
                                        console.log("item is a member of a group")
                                    }
                                }) : ''}

                                {this.state.sddObject ? this.state.sddObject.groups.map((group, index) => {
                                    return <fieldset key={key++} className="outline">
                                        <legend>Group: {group.Representation.Label}</legend>
                                        <div className="" key={'group_' + index}>
                                            <span className="item-label">{t('models.import_from_xper.lbl_group_name')}: </span>
                                            <span className="">{group.Representation.Label}</span>

                                            {this.state.sddObject ? this.state.sddObject.items.map((item, index) => {
                                                if (item.annotationType === CATEGORICAL && item.targetType === group.Representation.Label)
                                                    return <div className="group-item" key={'categorical_' + index}>
                                                        <span className="item-label">{t('models.import_from_xper.lbl_character_name')}: </span><span
                                                        className="item-text">{item.targetName}</span>
                                                        <br/>
                                                        <span className="item-label">{t('models.import_from_xper.lbl_character_values')}:</span>
                                                        <span
                                                            className="item-text-values">
                                                <ul style={{display: 'inline-grid'}}>
                                                    {item.states ? item.states.map((state, inner) => {
                                                        return <li
                                                            key={'list_' + index + '_' + inner}>{state.name}</li>;
                                                    }) : ''}
                                                    </ul>
                                                   </span>
                                                        <br/>
                                                    </div>
                                                if (item.annotationType === NUMERICAL && item.targetType === group.Representation.Label)
                                                    return <div className="group-item" key={'numerical_' + index}>
                                                        <span className="item-label">{t('models.import_from_xper.lbl_character_name')}: </span><span
                                                        className="item-text">{item.targetName}</span>
                                                        <br/>

                                                        <span
                                                            className="item-label">{t('models.import_from_xper.lbl_character_measurement_type')}: </span><span
                                                        className="item-text-values">{item.unit}</span>
                                                        <br/>

                                                    </div>
                                            }) : ''}
                                        </div>
                                    </fieldset>
                                }) : ''}
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
        );
    }

}
