import React, {Component} from 'react';
import {Col, Container, Input, Row} from 'reactstrap';

import {updateSelectedLanguage,} from "../utils/config";
import RECOLNAT_LOGO from "./pictures/logo.svg";

export default class Options extends Component {

    constructor(props) {
        super(props);
        this.state = {}
    }

    _handleOnChangeLanguage = (event) => {
        console.info("selected language = [" + event.target.value + "]" )
        updateSelectedLanguage(event.target.value)
    };

    render() {
        const { t } = this.props;
        return (
            <Container className="bst options">
                <div className="bg">
                    <Row>
                        <Col sm={6} className="hide-overflow">
                            <a onClick={() => {
                                this.props.goToLibrary();
                            }}>
                                <img alt="logo" src={RECOLNAT_LOGO} className="logo" title={t('global.logo_tooltip_go_to_home_page')}/>
                            </a>
                        </Col>
                        <Col sm={6}>
                            <span className="title">{t('global.options.title')}</span>
                        </Col>
                    </Row>
                    <Row>
                        <div className="options-form">
                            <div className="options-form-item">
                                <Row>
                                    <Col sm={2} md={2} lg={2}  className="options-form-field-label">
                                        {t('global.options.lbl_select_language')}:
                                    </Col>
                                    <Col sm={2} md={2} lg={2}>
                                        <Input type="select" bsSize="md" title={t('global.options.select_language.tooltip')}
                                               value={this.props.i18n.language}
                                               onChange={this._handleOnChangeLanguage}>
                                            <option value="en" title={t('global.languages.EN')}>{t('global.languages.EN')}</option>
                                            <option value="fr" title={t('global.languages.FR')}>{t('global.languages.FR')}</option>
                                        </Input>
                                    </Col>
                                    <Col sm={8} md={8} lg={8}/>
                                </Row>
                            </div>
                        </div>
                    </Row>
                </div>
            </Container>
        );
    }
}
