import React, {PureComponent} from 'react';
import styled from 'styled-components';
import {Col, Container, Row} from 'reactstrap';
import {BarLoader} from 'react-spinners';

import {ee, EVENT_DIRECTORIES_ANALYSES_COMPLETE, EVENT_PROCESS_IMAGE_COMPLETE} from '../utils/library';

const _WaitIconDir = styled.i`
  @keyframes hop {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  animation: hop 250ms ease infinite alternate;
`;

const LOGO = require('./pictures/annotate-on_logo.jpg');
export default class extends PureComponent {
    constructor(props) {
        super(props);

        this.picturesMetadataCollected = 0;
        this.thumbnailsCreated = 0;

        this.state = {
            picturesFound: props.files ? props.files : 0,
            picturesMetadataCollectedProgress: 0,
            thumbnailsCreationProgress: 0,
            directories: []
        };

        ee.on(EVENT_DIRECTORIES_ANALYSES_COMPLETE, _ => {
            this.setState({
                picturesFound: _.files,
                directories: _.folders
            });
        });

        ee.on(EVENT_PROCESS_IMAGE_COMPLETE, _ => {
            this.picturesMetadataCollected++;
            this.setState({
                picturesMetadataCollectedProgress: Math.round(
                    100 * (this.picturesMetadataCollected / this.state.picturesFound).toFixed(2)
                )
            });
        });
    }

    render() {
        const { t } = this.props;
        return (
            <Container className="bst loading">
                <Row>
                    <Col sm={12} md={12} lg={12} className="full-logo">
                        <img src={LOGO} alt="logo"/>
                    </Col>
                </Row>
                <Row>
                    <Col sm={{size: 2, offset: 5}} md={{size: 2, offset: 5}} lg={{size: 2, offset: 5}}
                         className="loader">
                        <BarLoader
                            widthUnit={"%"}
                            width={100}
                            color={'#ff9800'}
                            loading={true}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col sm={{size: 12}} md={{size: 12}} lg={{size: 12}}
                         className="loader-label">
                        {t('global.lbl_importing_resources_files_to_folders')}:
                    </Col>
                </Row>
                <Row>
                    <Col sm={{size: 12}} md={{size: 12}} lg={{size: 12}}>
                        {this.state.directories.map(_ => (
                            <div key={_}>{_}</div>
                        ))}
                    </Col>
                </Row>
                <Row>
                    <Col sm={{size: 12}} md={{size: 12}} lg={{size: 12}}>
                        <span className="inline-label">{t('global.lbl_resources_files_found')}:  </span><span className="inline-value">
                        {this.state.picturesFound || <_WaitIconDir className="fa fa-hourglass-o" aria-hidden="true"/>}
                        </span>
                    </Col>
                </Row>
                <Row>
                    <Col sm={{size: 12}} md={{size: 12}} lg={{size: 12}}>
                        <span className="inline-label">{t('global.lbl_collecting_metadata_and_generating_thumbnails')}:  </span><span className="inline-value">
                              {this.state.picturesMetadataCollectedProgress ? (
                                  `${this.state.picturesMetadataCollectedProgress}%`
                              ) : (
                                  <_WaitIconDir className="fa fa-hourglass-o" aria-hidden="true"/>
                              )}
                        </span>
                    </Col>
                </Row>
            </Container>
        );
    }
}
