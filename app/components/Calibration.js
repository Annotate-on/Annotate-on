import React, {PureComponent} from 'react';
import {Button, Col, Container, FormGroup, Input, Label, Row} from 'reactstrap';
import {convertMMToDpi} from "../utils/maths";
import {ONE_DIMENSIONAL, TWO_DIMENSIONAL} from '../constants/constants';
import Chance from "chance";
import {remote} from "electron";

const chance = new Chance();
const CLOSE = require('./pictures/x.svg');

export default class extends PureComponent {

    constructor(props, context) {
        super(props, context);
        let selectedCalibration = null;
        if (props.sha1 in this.props.picturesByCalibration) {
            selectedCalibration = this.props.picturesByCalibration[props.sha1]
        }
        const chance = new Chance();

        const catalogName = props.catalogName != null ? props.catalogName : chance.integer({min: 20, max: 120});

        this.state = {
            showCreateForm: false,
            pxX: 0,
            mmX: 0,
            dpiX: 0,
            pxY: 0,
            mmY: 0,
            dpiY: 0,
            measureName: 'CALIB_' + catalogName,
            measureType: ONE_DIMENSIONAL,
            selectedCalibration: selectedCalibration,
            editCalibration: false,
            deleteDate: null,
            applyToAll: false
        }
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.pixels !== nextProps.pixels) {
            if (this.props.selectAxis === 'X') {
                this.setState({
                    pxX: nextProps.pixels,
                });
            } else if (this.props.selectAxis === 'Y') {
                this.setState({
                    pxY: nextProps.pixels,
                });
            }
        }

        if (nextProps.sha1 in this.props.picturesByCalibration) {
            this.setState({
                selectedCalibration: this.props.picturesByCalibration[nextProps.sha1]
            });
        } else {
            this.setState({
                selectedCalibration: null
            });
        }
    }

    createNewCalibrationHandler = () => {
        this.setState({showCreateForm: !this.state.showCreateForm});
        this.props.activateCalibration(!this.state.showCreateForm);
    };

    deleteAxis = (axis) => {
        console.log("Delete axis " + axis);
        this.props.deleteAxis(axis);
        if (axis === 'X')
            this.setState({pxX: 0, mmX: 0, dpiX: 0});
        else if (axis === 'Y')
            this.setState({pxY: 0, mmY: 0, dpiY: 0});
    };

    saveCalibration = (applyToAll = false) => {
        const { t } = this.props;
        console.log("saveCalibration")
        if (this.state.measureName.length === 0) {
            remote.dialog.showMessageBox(remote.getCurrentWindow () ,{
                type: 'error',
                message: t('inspector.calibration.alert_save_message_empty_name'),
                buttons: ['OK'],
                cancelId: 1
            });
            return;
        }
        if (applyToAll) {
            const result = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                type: 'question',
                buttons: ['Yes', 'No'],
                message: t('inspector.calibration.alert_save_confirmation_title'),
                cancelId: 1,
                detail: t('inspector.calibration.alert_save_confirmation_message')
            });

            if (result === 1)
                return;
        }

        if (this.state.dpiX !== 0 && this.state.dpiY !== 0 && this.state.measureName.length > 0) {
            if (this.state.editCalibration) {
                const calibration = this.props.calibrations.find(c => c.calibrationId === this.state.editCalibrationId)
                if (calibration) {
                    calibration.pxX = this.state.pxX;
                    calibration.mmX = this.state.mmX;
                    calibration.dpiX = this.state.dpiX;
                    calibration.pxY = this.state.pxY;
                    calibration.mmY = this.state.mmY;
                    calibration.dpiY = this.state.dpiY;
                    calibration.name = this.state.measureName;
                    calibration.measureType = this.state.measureType;
                    this._selectCalibration(calibration, calibration.dpiX, calibration.dpiY, applyToAll , true);
                }
            } else {
                const calibration = {
                    calibrationId: chance.guid(),
                    pxX: this.state.pxX,
                    mmX: this.state.mmX,
                    dpiX: this.state.dpiX,
                    pxY: this.state.pxY,
                    mmY: this.state.mmY,
                    dpiY: this.state.dpiY,
                    name: this.state.measureName,
                    measureType: this.state.measureType
                };
                this.props.calibrations.unshift(calibration);

                if (applyToAll) {
                    this._selectCalibration(calibration, calibration.dpiX, calibration.dpiY, applyToAll);
                } else {
                    this._selectCalibration(calibration, calibration.dpiX, calibration.dpiY);
                }
            }

            this.setState({
                showCreateForm: false,
                pxX: 0,
                mmX: 0,
                dpiX: 0,
                pxY: 0,
                mmY: 0,
                dpiY: 0,
                measureName: 'CALIB_' + (this.props.catalogName != null ? this.props.catalogName : chance.integer({
                    min: 20,
                    max: 120
                })),
                measureType: ONE_DIMENSIONAL,
                editCalibration: false,
                editCalibrationId: null,
                selectedCalibration: null,
                applyToAll: false
            });
            this.props.activateCalibration(false);
            this.props.changeMeasureType(ONE_DIMENSIONAL);
        }
    };

    cancel = () => {
        this.setState({
            showCreateForm: false,
            pxX: 0,
            mmX: 0,
            dpiX: 0,
            pxY: 0,
            mmY: 0,
            dpiY: 0,
            measureName: 'CALIB_' + (this.props.catalogName != null ? this.props.catalogName : chance.integer({
                min: 20,
                max: 120
            })),
            measureType: ONE_DIMENSIONAL,
            editCalibration: false,
            editCalibrationId: null
        });
        this.props.activateCalibration(false);
        this.props.changeMeasureType(ONE_DIMENSIONAL);
    };

    _removeCalibration = () => {
        delete this.props.picturesByCalibration[this.props.sha1];
        this.setState({
            selectedCalibration: null
        });

        this.props.changeCalibration();
    };

    _selectCalibration = (value, dpiX, dpiY, applyToAll , edit) => {

        console.log(value, dpiX, dpiY)
        this.setState({
            selectedCalibration: value
        });

        if (edit) {
            let picsWithCalibrationsToEdit = [];
            this.props.tabData.pictures_selection.map(sha1 => {
                if (this.props.picturesByCalibration[sha1] !== undefined &&
                    this.props.picturesByCalibration[sha1].calibrationId === value.calibrationId) {
                    picsWithCalibrationsToEdit.push(sha1);
                    this.props.picturesByCalibration[sha1] = {
                        calibrationId: value.calibrationId,
                        dpix: dpiX,
                        dpiy: dpiY
                    };
                }
            });
            this.props.changeCalibration(null , picsWithCalibrationsToEdit);
        }

        if (applyToAll) {
            this.props.tabData.pictures_selection.map(sha1 => {
                this.props.picturesByCalibration[sha1] = {
                    calibrationId: value.calibrationId,
                    dpix: dpiX,
                    dpiy: dpiY
                };
            });
            this.props.changeCalibration(applyToAll);
        } else {
            this.props.picturesByCalibration[this.props.sha1] = {
                calibrationId: value.calibrationId,
                dpix: dpiX,
                dpiy: dpiY
            };
            this.props.changeCalibration();
        }
        this.props.updateTaxonomyValues(this.props.tabName);
    };

    _editCalibration = (e, calibration) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Edit calibration %o", calibration);
        this.setState({
            editCalibrationId: calibration.calibrationId,
            editCalibration: true,
            showCreateForm: true,
            pxX: calibration.pxX,
            mmX: calibration.mmX,
            dpiX: calibration.dpiX,
            pxY: calibration.pxY,
            mmY: calibration.mmY,
            dpiY: calibration.dpiY,
            measureName: calibration.name,
            measureType: calibration.measureType
        });
        this.props.activateCalibration(true);
    };

    _onTypeChange = (e) => {
        if (this.props.changeMeasureType) {
            this.props.changeMeasureType(e.currentTarget.value);
        }
        this.setState({
            measureType: e.currentTarget.value
        })
    };

    _deleteCalibration = (calibration) => {

        const cal = this.props.calibrations.findIndex(c => c.calibrationId === calibration.calibrationId)
        this.props.calibrations.splice(cal, 1);
        this.setState({
            selectedCalibration: null,
            deleteDate: new Date()
        });

        let picsWithCalibrationsToEdit = [];
        this.props.tabData.pictures_selection.map(sha1 => {
            if (this.props.picturesByCalibration[sha1] !== undefined && this.props.picturesByCalibration[sha1].calibrationId === calibration.calibrationId) {
                delete this.props.picturesByCalibration[sha1];
                picsWithCalibrationsToEdit.push(sha1);
            }
        });

        this.props.changeCalibration(null , picsWithCalibrationsToEdit);
    };

    createTwoDimensionalForm = () => {
        const { t } = this.props;
        return <Container className="bst calibration">
            <Row>
                <Col className="calibration-title" sm={9} md={9} lg={9}>{t('inspector.calibration.title_new_calibration')}</Col>
                <Col sm={2} md={2} lg={2}><img alt="close" src={CLOSE} onClick={this.cancel}/></Col>
            </Row>
            <Row>
                <Col md={6}>
                    {t('inspector.calibration.lbl_type')}:
                </Col>
            </Row>
            <Row>
                <Col md={12}>
                    <FormGroup check>
                        <Label check>
                            <Input type="radio" name="measureType"
                                   value={ONE_DIMENSIONAL}
                                   checked={ONE_DIMENSIONAL === this.state.measureType}
                                   onChange={this._onTypeChange}
                            />{' '} {t('inspector.calibration.lbl_one_dimension')}
                        </Label>
                    </FormGroup>
                </Col>
            </Row>
            <Row>
                <Col md={12}>
                    <FormGroup check>
                        <Label check>
                            <Input type="radio" name="measureType"
                                   value={TWO_DIMENSIONAL}
                                   checked={TWO_DIMENSIONAL === this.state.measureType}
                                   onChange={this._onTypeChange}
                            />{' '}{t('inspector.calibration.lbl_two_dimensional')}
                        </Label>
                    </FormGroup>
                </Col>
            </Row>
            <Row>
                <Col md={12}>{t('inspector.calibration.lbl_measure_on_image')}:</Col>
            </Row>
            <FormGroup row>
                <Label for="length" sm={4} md={4} lg={4}>{t('inspector.calibration.lbl_x_is', { x:this.state.pxX })}</Label>
                <Col sm={2} md={2} lg={2} className="length-value">
                    <Input type="text" name="length"  disabled={this.state.pxX <= 0}
                           value={this.state.mmX}
                           onClick={_=> {
                               this.setState({
                                   mmX: ''});
                           }}
                           onChange={(event) => {
                        this.setState({
                            mmX: event.target.value,
                            dpiX: convertMMToDpi(event.target.value, this.state.pxX).toFixed(0)
                        })
                    }}/>
                </Col>
                <Col sm={4} md={4} lg={4} className="dpi">
                    mm = {this.state.dpiX}dpi
                </Col>
                <Col sm={1} md={1} lg={1} className="delete-dpi">
                    <i className="fa fa-trash" aria-hidden="true" onClick={() => this.deleteAxis('X')}/>
                </Col>
            </FormGroup>
            <FormGroup row>
                <Label for="length" sm={4} md={4} lg={4}>{t('inspector.calibration.lbl_y_is', { y:this.state.pxY })}</Label>
                <Col sm={2} md={2} lg={2} className="length-value">
                    <Input type="text" name="length"  disabled={this.state.pxY <= 0}
                           value={this.state.mmY}
                           onClick={_=> {
                               this.setState({
                                   mmY: ''});
                           }}
                           onChange={(event) => {
                        this.setState({
                            mmY: event.target.value,
                            dpiY: convertMMToDpi(event.target.value, this.state.pxY).toFixed(0)
                        })
                    }}/>
                </Col>
                <Col sm={4} md={4} lg={4} className="dpi">
                    mm = {this.state.dpiY}dpi
                </Col>
                <Col sm={1} md={1} lg={1} className="delete-dpi">
                    <i className="fa fa-trash" aria-hidden="true" onClick={() => this.deleteAxis('Y')}/>
                </Col>
            </FormGroup>
            <FormGroup>
                <Label for="name">{t('inspector.calibration.lbl_name')}</Label>
                <Input type="text" name="name" id="name" value={this.state.measureName}
                       onChange={(event) => {
                           this.setState({
                               measureName: event.target.value
                           })
                       }}/>
            </FormGroup>
            <Row>
                <Col md={3}>
                    <Button color="primary" size="md" onClick={() => this.saveCalibration(false)}></Button>
                </Col>
                <Col md={3}>
                    <Button color="gray" size="md" onClick={this.cancel}>{t('global.cancel')}</Button>
                </Col>
            </Row>
            <Row><Col md={12}><br /></Col></Row>
            <Row>
                <Col md={12}>
                    <Button color="primary" size="md" onClick={() => this.saveCalibration(true)}>{t('inspector.calibration.btn_name_apply_to_all_images')}</Button>
                </Col>
            </Row>
        </Container>
    };

    createOneDimensionalForm = () => {
        const { t } = this.props;
        return <Container className="bst calibration">
            <Row>
                <Col className="calibration-title" sm={9} md={9} lg={9}>{t('inspector.calibration.title_new_calibration')}</Col>
                <Col sm={2} md={2} lg={2}><img alt="close" src={CLOSE} onClick={this.cancel}/></Col>
            </Row>
            <Row>
                <Col md={6}>
                    {t('inspector.calibration.lbl_type')}:
                </Col>
            </Row>
            <Row>
                <Col md={12}>
                    <FormGroup check>
                        <Label check>
                            <Input type="radio" name="measureType"
                                   value={ONE_DIMENSIONAL}
                                   checked={ONE_DIMENSIONAL === this.state.measureType}
                                   onChange={this._onTypeChange}
                            />{' '} {t('inspector.calibration.lbl_one_dimension')}
                        </Label>
                    </FormGroup>
                </Col>
            </Row>
            <Row>
                <Col md={12}>
                    <FormGroup check>
                        <Label check>
                            <Input type="radio" name="measureType"
                                   value={TWO_DIMENSIONAL}
                                   checked={TWO_DIMENSIONAL === this.state.measureType}
                                   onChange={this._onTypeChange}
                            />{' '}{t('inspector.calibration.lbl_two_dimensional')}
                        </Label>
                    </FormGroup>
                </Col>
            </Row>
            <Row>
                <Col md={12}>{t('inspector.calibration.lbl_measure_on_image')}:</Col>
            </Row>
            <FormGroup row>
                <Label for="length" sm={4} md={4} lg={4}>{t('inspector.calibration.lbl_x_y_is', { x:this.state.pxX })}</Label>
                <Col sm={2} md={2} lg={2} className="length-value">
                    <Input type="text" name="length" disabled={this.state.pxX <= 0}
                           value={this.state.mmX}
                           onClick={_=> {
                               this.setState({
                                   mmX: ''});
                           }}
                           onChange={(event) => {
                        this.setState({
                            mmX: event.target.value,
                            dpiX: convertMMToDpi(event.target.value, this.state.pxX).toFixed(0),
                            dpiY: convertMMToDpi(event.target.value, this.state.pxX).toFixed(0)
                        })
                    }}/>
                </Col>
                <Col sm={4} md={4} lg={4} className="dpi">
                    mm = {this.state.dpiX}dpi
                </Col>
                <Col sm={1} md={1} lg={1} className="delete-dpi">
                    <i className="fa fa-trash" aria-hidden="true" onClick={() => this.deleteAxis('X')}/>
                </Col>
            </FormGroup>
            <FormGroup>
                <Label for="name">{t('inspector.calibration.lbl_name')}</Label>
                <Input type="text" name="name" id="name" value={this.state.measureName}
                       onChange={(event) => {
                           this.setState({
                               measureName: event.target.value
                           })
                       }}/>
            </FormGroup>
            <Row>
                <Col md={3}>
                    <Button color="primary" size="md" onClick={ () => this.saveCalibration(false)}>{t('global.save')}</Button>
                </Col>
                <Col md={3}>
                    <Button color="gray" size="md" onClick={this.cancel}>{t('global.cancel')}</Button>
                </Col>
            </Row>
            <Row><Col md={12}><br /></Col></Row>
            <Row>
                <Col md={12}>
                    <Button color="primary" size="md" onClick={() => this.saveCalibration(true)}>{t('inspector.calibration.btn_name_apply_to_all_images')}</Button>
                </Col>
            </Row>
        </Container>
    };

    render() {
        const { t } = this.props;
        return !this.state.showCreateForm ? (
                <Container className="bst calibration">
                    <Row>
                        <Col md={6}>
                            <Button title={t('inspector.calibration.btn_tooltip_new_calibration')} size="md" color="primary"
                                    onClick={this.createNewCalibrationHandler}>{t('inspector.calibration.btn_new_calibration')}
                            </Button>
                        </Col>
                        <Col md={6}>
                            <Button title={t('inspector.calibration.btn_tooltip_deactivate')} className="pull-right" size="md"
                                    color="gray"
                                    onClick={this._removeCalibration}>{t('inspector.calibration.btn_deactivate')}
                            </Button>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            {
                                (this.props.dpix && this.props.dpiy) ?
                                    t('inspector.calibration.lbl_original_dpi_x_y', { x:this.props.dpix, y:this.props.dpiy })
                                    : t('inspector.calibration.lbl_original_dpi_not_detected')
                            }
                        </Col>
                    </Row>
                    {
                        this.props.calibrations.length > 0 ?
                            (<Row className="calibration-subtitle"><Col md={12}>{t('inspector.calibration.lbl_select_one_calibration_below')}</Col></Row>) : ''
                    }
                    {
                        this.props.calibrations.length > 0 ? (
                            this.props.calibrations.map(calibration => {
                                let checked = false;
                                if (this.state.selectedCalibration)
                                    checked = this.state.selectedCalibration.calibrationId === calibration.calibrationId;
                                return <Row key={calibration.calibrationId}
                                            className={checked ? 'selected-calibration list-item' : 'list-item'}
                                            onClick={() => this._selectCalibration(calibration, calibration.dpiX, calibration.dpiY)}>
                                    <Col md={12} lg={12}>
                                        <span className="calibration-name">
                                        {calibration.name}<br />[{calibration.dpiX},{calibration.dpiY}] dpi
                                        </span>

                                        <div className="action-bar">
                                            <img src={require('./pictures/edit.svg')}
                                                 alt="edit"
                                                 width={17}
                                                 onClick={e => {
                                                     this._editCalibration(e, calibration)
                                                 }}
                                            />
                                            &nbsp;
                                            <img
                                                alt="trush"
                                                 src={require('./pictures/trush.svg')}
                                                 width={17}
                                                 onClick={e => {
                                                     e.preventDefault();
                                                     e.stopPropagation();
                                                     const result = remote.dialog.showMessageBox(remote.getCurrentWindow () ,{
                                                         type: 'question',
                                                         buttons: ['Yes', 'No'],
                                                         message: t('inspector.calibration.alert_delete_message', {calibration: calibration.name}),
                                                         cancelId: 1,
                                                         detail: t('global.delete_confirmation')
                                                     });
                                                     if (result === 0) this._deleteCalibration(calibration);
                                                 }}
                                            />
                                        </div>
                                    </Col>
                                </Row>
                            })) : (
                            <Row>
                                <Col className="no-calibrations" md={12}>
                                    {t('inspector.calibration.lbl_there_are_no_calibrations')}
                                </Col>
                            </Row>
                        )
                    }
                </Container>
            ) :
            this.state.measureType === TWO_DIMENSIONAL ?
                this.createTwoDimensionalForm() : this.createOneDimensionalForm();
    }
}
