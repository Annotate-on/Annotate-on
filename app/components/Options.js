import React, { Component } from 'react';
import { Button, Col, Container, Input, Row } from 'reactstrap';

import { remote } from "electron";
import { DEFAULT_IIIF_CONNECTION_URL, DEFAULT_XPER_CONNECTION_URL } from "../constants/constants";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { getIIIFParams, getXperParams, updateIIIFParams, updateSelectedLanguage, updateXperParams } from "../utils/config";
import PageTitle from "./PageTitle";
const OPTIONS_IMAGE_CONTEXT = require('./pictures/options.svg');


export default class Options extends Component {

    constructor(props) {
        super(props);
        this.state = {
            xper: {
                formSaved:true,
                url: '',
                email: '',
                password: '',
                errors: {
                }
            },
            IIIF: {
                formSaved:true,
                url: '',
                username: '',
                password: '',
                errors: {
                }
            }
        }
    }

    componentDidMount() {
        let xperParams = getXperParams();
        let IIIFParams = getIIIFParams();
        this.setState({
                xper: {
                    formSaved:true,
                    url: xperParams.url ? xperParams.url : DEFAULT_XPER_CONNECTION_URL,
                    email:xperParams.email ? xperParams.email : '',
                    password:xperParams.password ? xperParams.password : ''
                },
                IIIF: {
                    formSaved:true,
                    url: IIIFParams.url ? IIIFParams.url : DEFAULT_IIIF_CONNECTION_URL,
                    username:IIIFParams.username ? IIIFParams.username : '',
                    password:IIIFParams.password ? IIIFParams.password : ''
                }
            }
        )
    }

    _handleOnSaveXperParamsForm = () => {
        const { t } = this.props;
        const valid = this._validateForm()
        if(valid) {
            try {
                updateXperParams(this.state.xper.url, this.state.xper.email, this.state.xper.password);
                this.setState({
                        xper: {
                            ...this.state.xper,
                            formSaved:true,
                        }
                    }
                )
            } catch (e) {
                this.setState({
                        xper: {
                            ...this.state.xper,
                            formSaved:false,
                        }
                    }
                )
                remote.dialog.showErrorBox(t('global.error'), t('library.import_images.alert_cannot_reach_mediaphoto'));
            }
        } else {
            this.setState({
                    xper: {
                        ...this.state.xper,
                        formSaved:false,
                    }
                }
            )
            remote.dialog.showErrorBox(t('global.error'), "All xper parameters are required!");
        }
    };

    _handleOnSaveIIIFParamsForm = () => {
        const { t } = this.props;
        const valid = this._validateIIIFForm()
        if(valid) {
            try {
                updateIIIFParams(this.state.IIIF.url, this.state.IIIF.username, this.state.IIIF.password);
                this.setState({
                        IIIF: {
                            ...this.state.IIIF,
                            formSaved:true,
                        }
                    }
                )
            } catch (e) {
                
                this.setState({
                        IIIF: {
                            ...this.state.IIIF,
                            formSaved:false,
                        }
                    }
                )
                remote.dialog.showErrorBox(t('global.error'), t('library.import_images.alert_cannot_reach_mediaphoto'));
            }
        } else {
            this.setState({
                    IIIF: {
                        ...this.state.IIIF,
                        formSaved:false,
                    }
                }
            )
            remote.dialog.showErrorBox(t('global.error'), "All IIIF parameters are required!");
        }
    };



    _validateForm = () => {
        let valid = this.state.xper.url && this.state.xper.email&& this.state.xper.password;
        return valid;
    };
    _validateIIIFForm = () => {
        let valid = this.state.IIIF.url && this.state.IIIF.username&& this.state.IIIF.password;
        return valid;
    };

    _handleOnChangeLanguage = (event) => {
        updateSelectedLanguage(event.target.value)
    };

    _xperParamsFormChangeHandler = ( event ) => {
        const { name, value } = event.target;
        const { t } = this.props;
        let errors = this.state.errors;
        const xper = {...this.state.xper};
        xper[name] = value ? value : '';
        xper.formSaved=false
        this.setState({
            xper: xper
        });
    };
    _IIIFParamsFormChangeHandler = ( event ) => {
        const { name, value } = event.target;
        const { t } = this.props;
        let errors = this.state.errors;
        const IIIF = {...this.state.IIIF};
        IIIF[name] = value ? value : '';
        IIIF.formSaved=false
        this.setState({
            IIIF: IIIF
        });
    };

    render() {
        const { t } = this.props;
        return (
            <Container className="bst options">
                <div >
                    <PageTitle
                        logo={OPTIONS_IMAGE_CONTEXT}
                        pageTitle={t('options.title')}
                        showProjectInfo={true}
                        projectName={this.props.projectName}
                        selectedTaxonomy={this.props.selectedTaxonomy}
                        docLink="options"
                    >
                    </PageTitle>

                    <Row>
                        <div className="options-form">
                            <div className="options-form-section">
                                <div className="options-form-section-title">
                                    {t('global.options.language_section_title')}
                                </div>
                                <div className="options-form-section-content">
                                    <div className="options-form-item">
                                        <Row>
                                            <Col sm={2} md={2} lg={2}  className="options-form-field-label">
                                                {t('global.options.lbl_select_language')}:
                                            </Col>
                                            <Col sm={2} md={2} lg={2}>
                                                <Input type="select" bsSize="md" title={t('global.options.select_language.tooltip')}
                                                       value={this.props.i18n.language}
                                                       onChange={this._handleOnChangeLanguage}>
                                                    {
                                                        SUPPORTED_LANGUAGES.map(lang => {
                                                            return <option key={lang} value={lang} title={t('global.languages.'+lang.toUpperCase())}>{t('global.languages.'+lang.toUpperCase())}</option>
                                                        })
                                                    }
                                                </Input>
                                            </Col>
                                            <Col sm={8} md={8} lg={8}/>
                                        </Row>
                                    </div>
                                </div>
                            </div>
                            <div className="options-form-section">
                                <div className="options-form-section-title">
                                    {t('global.options.xper_parameters_section_title')}
                                </div>
                                <div className="options-form-section-content">
                                    <div className="options-form-item">
                                        <Row>
                                            <Col sm={2} md={2} lg={2}  className="options-form-field-label">
                                                {t('global.options.lbl_xper_parameters_url')}:
                                            </Col>
                                            <Col sm={4} md={4} lg={4}>
                                                <Input name="url" type="text" bsSize="md" title={t('global.options.select_language.tooltip')}
                                                       value={this.state.xper.url}
                                                       onChange={this._xperParamsFormChangeHandler}>
                                                </Input>
                                            </Col>
                                            <Col sm={4} md={4} lg={4}/>
                                        </Row>
                                    </div>
                                    <div className="options-form-item">
                                        <Row>
                                            <Col sm={2} md={2} lg={2}  className="options-form-field-label">
                                                {t('global.options.lbl_xper_parameters_email')}:
                                            </Col>
                                            <Col sm={4} md={4} lg={4}>
                                                <Input name="email"  type="text" bsSize="md" title={t('global.options.select_language.tooltip')}
                                                       value={this.state.xper.email}
                                                       onChange={this._xperParamsFormChangeHandler}>
                                                </Input>
                                            </Col>
                                            <Col sm={4} md={4} lg={4}/>
                                        </Row>
                                    </div>
                                    <div className="options-form-item">
                                        <Row>
                                            <Col sm={2} md={2} lg={2}  className="options-form-field-label">
                                                {t('global.options.lbl_xper_parameters_password')}:
                                            </Col>
                                            <Col sm={4} md={4} lg={4}>
                                                <Input name="password" type="password" bsSize="md" title={t('global.options.select_language.tooltip')}
                                                       value={this.state.xper.password}
                                                       onChange={this._xperParamsFormChangeHandler}>
                                                </Input>
                                            </Col>
                                            <Col sm={4} md={4} lg={4}>
                                                <Button color={this.state.xper.formSaved ? 'success' : 'danger'} onClick={() => this._handleOnSaveXperParamsForm()}>{t('global.save')}</Button>
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </div>
                            <div className="options-form-section">
                                <div className="options-form-section-title">
                                    {t('global.options.iiif_parameters_section_title')}
                                </div>
                                <div className="options-form-section-content">
                                    <div className="options-form-item">
                                        <Row>
                                            <Col sm={2} md={2} lg={2}  className="options-form-field-label">
                                                {t('global.options.lbl_iiif_parameters_url')}:
                                            </Col>
                                            <Col sm={4} md={4} lg={4}>
                                                <Input name="url" type="text" bsSize="md" title=""
                                                       value={this.state.IIIF.url}
                                                       onChange={this._IIIFParamsFormChangeHandler}>
                                                </Input>
                                            </Col>
                                            <Col sm={4} md={4} lg={4}/>
                                        </Row>
                                    </div>
                                    <div className="options-form-item">
                                        <Row>
                                            <Col sm={2} md={2} lg={2}  className="options-form-field-label">
                                                {t('global.options.lbl_iiif_parameters_username')}:
                                            </Col>
                                            <Col sm={4} md={4} lg={4}>
                                                <Input name="username"  type="text" bsSize="md" title=""
                                                       value={this.state.IIIF.username}
                                                       onChange={this._IIIFParamsFormChangeHandler}>
                                                </Input>
                                            </Col>
                                            <Col sm={4} md={4} lg={4}/>
                                        </Row>
                                    </div>  
                                    <div className="options-form-item">
                                        <Row>
                                            <Col sm={2} md={2} lg={2}  className="options-form-field-label">
                                                {t('global.options.lbl_iiif_parameters_password')}:
                                            </Col>
                                            <Col sm={4} md={4} lg={4}>
                                                <Input name="password" type="password" bsSize="md" title=""
                                                       value={this.state.IIIF.password}
                                                       onChange={this._IIIFParamsFormChangeHandler}>
                                                </Input>
                                            </Col>
                                            <Col sm={4} md={4} lg={4}>
                                                <Button color={this.state.IIIF.formSaved ? 'success' : 'danger'} onClick={() => this._handleOnSaveIIIFParamsForm()}>{t('global.save')}</Button>
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Row>
                </div>
            </Container>
        );
    }
}
