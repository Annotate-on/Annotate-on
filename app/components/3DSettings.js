import React, {PureComponent} from "react";
import {Col, Container, Form, FormGroup, Label, Row} from "reactstrap";
import useStore from "../widget/3d_viewer/store";

export default class _3DSettings extends PureComponent {

    constructor(props) {
        console.log(" _3DSettings", props);
        super(props);
        this.state = {
            ambientLightIntensity: 0
        };
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
    } = useStore();

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

            </Form>

        </Container>
    )
}



