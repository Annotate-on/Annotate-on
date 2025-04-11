import React, {PureComponent} from "react";
import {Col, Container, Form, FormGroup, Input, Label, Row} from "reactstrap";
import use3DStore from "../widget/3d_viewer/store";
import {ENVIRONMENT_MAPS} from "../widget/3d_viewer/lib/constants";

export default class _3DSettings extends PureComponent {

    constructor(props) {
        console.log(" _3DSettings", props);
        super(props);
    }

    render() {
        const { t } = this.props;
        return (
            <_3DSettingsWrapper t={t}/>
        )
    }
}

function _3DSettingsWrapper(props) {
    const { t } = props;
    console.log(" _3DSettingsWrapper", props);
    const {
        ambientLightIntensity,
        setAmbientLightIntensity,
        environmentMap,
        setEnvironmentMap,
    } = use3DStore();

    return (
        <Container className="bst rcn_3d_settings">
            <Form onSubmit={(e) => {
                e.preventDefault();
            }} className="3d-settings-form">
                <FormGroup >
                    <Row>
                        <Col sm={10}>
                            <Label for="type" className="label-for">{t('inspector.3d_settings.lbl_ambient-light')}</Label>
                        </Col>
                    </Row>
                    <Row>
                        <Col sm={10}>
                            <input className="ambient-light-slider"
                                   id="ambient-light-range"
                                   type="range"
                                   step="1"
                                   min="0"
                                   max="10"
                                   value={ambientLightIntensity}
                                   onChange={event => {
                                       setAmbientLightIntensity(event.target.value)
                                   }}
                            />
                        </Col>
                        <Col sm={2}>
                                <span className='range_value'>
                                    <output id="amountambientLightIntensity" htmlFor="ambient-light-range">{ambientLightIntensity}</output>
                                </span>
                        </Col>
                    </Row>
                </FormGroup>
                <FormGroup >
                    <Row>
                        <Col sm={10}>
                            <Label for="type" className="label-for">{t('inspector.3d_settings.lbl_environment_lighting')}</Label>
                        </Col>
                    </Row>
                    <Row>
                        <Col sm={10} md={10} lg={10}>
                            <Input type="select" bsSize="md" title={t('inspector.3d_settings.lbl_environment_lighting')}
                                   value={environmentMap}
                                   onChange={event => {
                                        console.log("setEnvironmentMap", event.target.value);
                                       setEnvironmentMap(event.target.value)
                                   }}>
                                {
                                    ENVIRONMENT_MAPS.map( (envMap) => {
                                        return <option key={envMap.value} value={envMap.value} title={envMap.label}>{envMap.label}</option>
                                    })
                                }
                            </Input>
                        </Col>
                        <Col sm={10}/>
                    </Row>
                </FormGroup>

            </Form>

        </Container>
    )
}



