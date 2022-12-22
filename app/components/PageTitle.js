import React, {Fragment, Component} from 'react';
import {Col, Row} from "reactstrap";
import {APP_NAME, MODEL_XPER} from "../constants/constants";
import i18next from "i18next";
import DocLink from "../widget/DocLink";
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
                        {this.props.docLink &&
                            <DocLink permalink={this.props.docLink}/>
                        }
                        </div>
                    </Col>
                    <Col sm={7}>
                        {this.props.showProjectInfo &&
                            <div className="project-model-title">
                                {this.props.projectName &&
                                    <Fragment>
                                        <span className="project-label">{t('global.lbl_project')}:</span><span
                                        className="project-name">{this.props.projectName}</span>
                                        <span className="project-label">{t('global.lbl_model')}:</span>
                                    </Fragment>
                                }
                                <span className="project-name">
                    {this.props.selectedTaxonomy ?
                        <Fragment>{this.props.selectedTaxonomy.name} (type: {this.props.selectedTaxonomy.model === MODEL_XPER ?
                            <img height='16px'
                                 alt="xper3-logo"
                                 src='http://www.xper3.fr/resources/img/xper3-logo.png'>
                            </img> : APP_NAME})
                        </Fragment> : t('library.lbl_without_model')
                    }
                            </span>
                            </div>

                        }
                    </Col>
                </Row>
            </div>
        )
    }

}
