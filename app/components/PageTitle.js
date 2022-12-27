import React, {Fragment, Component} from 'react';
import {Col, Row} from "reactstrap";
import {APP_NAME, MODEL_XPER} from "../constants/constants";
import i18next from "i18next";
import DocLink from "../widget/DocLink";
import ImportComboBox from "../containers/ImportComboBox";
export default class extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        const { t } = i18next;
        return (
            <div className="bg">
                <Row className="app-page-title">
                    <Col sm={5} className="hide-overflow">
                        <div className="app-page-title-left-container">
                        {this.props.logo &&
                            <img alt="logo" height="18px" src={this.props.logo} className="logo"/>
                        }
                        {this.props.pageTitle &&
                            <span className="title">{this.props.pageTitle}</span>
                        }
                        {this.props.titleWidget &&
                            this.props.titleWidget
                        }
                        {/*{this.props.docLink &&*/}
                        {/*    <DocLink permalink={this.props.docLink}/>*/}
                        {/*}*/}
                        </div>
                    </Col>
                    <Col sm={7}>
                        {this.props.showProjectInfo &&
                            <div className="project-model-title">
                                {/*<ImportComboBox></ImportComboBox>*/}
                                {this.props.projectName &&
                                    <Fragment>
                                        <span className="project-label">{t('global.lbl_project')}:</span>
                                        <span className="project-name">{this.props.projectName}</span>
                                        <span className="project-label">{t('global.lbl_model')}:</span>
                                    </Fragment>
                                }

                                {this.props.selectedTaxonomy ?
                                    <Fragment>
                                        <span className="model-name">{this.props.selectedTaxonomy.name}</span>
                                        <i className="model-type-icon">{this.props.selectedTaxonomy.model === MODEL_XPER ? "Xper" : "Ann"}</i>
                                    </Fragment>
                                    :
                                    <span className="model-name">{t('library.lbl_without_model')}</span>
                                }
                                <ImportComboBox></ImportComboBox>
                                {this.props.docLink &&
                                    <DocLink permalink={this.props.docLink}/>
                                }
                            </div>
                        }

                    </Col>

                </Row>
            </div>
        )
    }

}
