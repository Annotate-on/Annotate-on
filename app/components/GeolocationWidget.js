import React, {Component} from 'react';
import {Button, FormGroup, Input, InputGroup, InputGroupAddon, InputGroupText, Label} from "reactstrap";
import i18next from "i18next";
import {getDecimalLocation, validateLocationInput} from "./event/utils";
import PickLocation from "../containers/PickLocation";

export default class GeolocationWidget extends Component {

    constructor(props) {
        super(props);
        this.state = {
            inEdit: false,
            value: '',
            place: '',
            latLng: '',
            errors: '',
            showLocationPopup: false,
            pickLocation: false
        };
    }

    static getDerivedStateFromProps(props, state) {
        let lat;
        let lng;
        if(props.location) {
            const coordinates = props.location.split(/[ ,]+/);
            if(coordinates.length > 1) {
                lat = coordinates[0];
                lng = coordinates[1];
            }
        }

        let latitude = props.latitude ? props.latitude : lat;
        let longitude = props.longitude ? props.longitude : lng;

        let place = props.place? props.place: '';
        let latLng = (!latitude && !longitude) ? '' : `${latitude ? latitude: ''},${longitude? longitude: ''}`;
        let value = (!props.place && !latitude && !longitude) ? '' :
            `${place} (${latitude ? latitude: ''},${longitude? longitude: ''})`;

        return {
            value: value,
            place: state.inEdit ? state.place : place,
            latLng: state.inEdit ? state.latLng : latLng
        };
    }

    componentDidMount() {
        if(this.props.openEdit) {
            this._onEdit();
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // console.log('componentDidUpdate', this.state)
    }

    _onEdit = () => {
        this.setState({
            inEdit: true
        });
    }

    _onCancelEdit = () => {
        this.setState({
            inEdit: false,
            errors: ''
        });
    }

    _onSaveEdit = (e) => {
        const {t} = i18next;
        let errors = this.state.errors;
        let input = this.state.latLng;
        if(input.trim()) {
            errors = validateLocationInput(input) ? '' : t('inspector.metadata.alert_input_is_not_valid_please_provide_lat_long');
        } else {
            errors = ''
        }
        if(errors) {
            this.setState({
                errors: errors
            })
        } else if(this.props.onValueChange) {
            let lat = '';
            let lng = '';
            if(this.state.latLng) {
                const latLngArray = this.state.latLng.split(/[ ,]+/);
                lat = latLngArray[0].trim();
                lng = latLngArray[1].trim();
            }

            let event = {
                target: {
                    name: this.props.name,
                    value: {
                        place: this.state.place,
                        latitude: lat,
                        longitude:lng,
                    }
                },
                errors: errors
            }
            this.props.onValueChange(event);
            this.setState({
                inEdit: false,
                errors: ''
            });
        }
    }

    _onOpenLocationInTheMap = (pickValue) => {
        const {t} = i18next;
        const input = this.state.latLng;
        let location;
        if(input.trim()) {
            const valid = validateLocationInput(input);
            if(valid) {
                location = {
                    latLng : getDecimalLocation(input),
                    place: this.state.place
                };
                this.setState({
                    location: location,
                    showLocationPopup: true,
                    pickLocation: pickValue
                });
            } else {
                this.setState({
                    errors: t('inspector.metadata.alert_input_is_not_valid_please_provide_lat_long')
                });
            }
        } else {
            this.setState({
                showLocationPopup: true,
                pickLocation: pickValue
            });
        }
    }

    _onPickLocation = (location) => {
        this.setState({
            latLng: `${location.latLng[0]}, ${location.latLng[1]}`,
            showLocationPopup: false,
            errors: ''
        });
    }

    -_onSearchByLanLng = () => {
        console.log(`Search by lat/lng ${this.state.latlng}`)
    }

    -_onSearchByPlace = () => {
        console.log(`Search by place ${this.state.place}`)
    }

    _formChangeHandler = (event) => {
        const {t} = i18next;
        const {name, value} = event.target;
        this.setState({
            [name]: value
        });
    };

    render() {
        const {t} = i18next;
        const {errors} = this.state;
        return <div className="geolocation-widget">
            <div>
                <PickLocation
                    location = {this.state.location}
                    openModal={this.state.showLocationPopup}
                    onClose={() => {
                        this.setState({showLocationPopup: false});
                    }}
                    pickLocation = {this.state.pickLocation}
                    onPickLocation={(location) => {
                        this._onPickLocation(location);
                    }}
                />
            </div>
            <InputGroup>
                <Input type="text" name="location" id="location" readOnly={true}
                       placeholder={t('inspector.metadata.textbox_placeholder_coverage_place')}
                       title={t('inspector.metadata.textbox_tooltip_coverage_place')}
                       onClick={() => {
                           if(!this.state.inEdit) this._onEdit()
                       }}
                       value={this.state.value}/>
                <InputGroupAddon addonType="append">
                    <InputGroupText>
                        <i className="fa fa-external-link pointer" aria-hidden="true"
                           onClick={() => this._onOpenLocationInTheMap(false)}/>
                    </InputGroupText>
                </InputGroupAddon>
            </InputGroup>
            {this.state.inEdit &&
                <div className="geolocation-widget-editor">
                    <div className="geolocation-widget-editor-section">
                        <div className="geolocation-widget-editor-section-title">
                            {t('inspector.metadata.geolocation.popup_lbl_new_edit_geolocation')}
                        </div>
                    </div>
                    <div className="geolocation-widget-editor-section">
                        <FormGroup className="column">
                            <Label for="place" className="label-for1">{t('inspector.metadata.geolocation.popup_lbl_place_name')}</Label>
                            <InputGroup>
                                <Input type="text" name="place" id="location.place"
                                       value={this.state.place}
                                       onChange={this._formChangeHandler}
                                       autoFocus={true}
                                       onKeyDown={(e) => {
                                           if (e.key === 'Enter' && e.type === 'keydown') {
                                               this._onSearchByPlace();
                                           };
                                       }}
                                />
                                <InputGroupAddon addonType="append">
                                    <InputGroupText>
                                        <i className="fa fa-search pointer" aria-hidden="true"
                                           onClick={this._onSearchByPlace}/>
                                    </InputGroupText>
                                </InputGroupAddon>
                            </InputGroup>
                        </FormGroup>
                        <FormGroup className="column">
                            <Label for="latLng" className="label-for1">{t('inspector.metadata.geolocation.popup_lbl_lat_lng')}</Label>
                            <InputGroup>
                                <Input type="text" name="latLng" id="location.latLng"
                                       value={this.state.latLng}
                                       onChange={this._formChangeHandler}
                                       onKeyDown={(e) => {
                                           if (e.key === 'Enter' && e.type === 'keydown') {
                                               this._onSearchByLanLng();
                                           };
                                       }}
                                />
                                <InputGroupAddon addonType="append">
                                    <InputGroupText>
                                        <i className="fa fa-search pointer" aria-hidden="true"
                                           onClick={this._onSearchByLanLng}/>
                                    </InputGroupText>
                                </InputGroupAddon>
                            </InputGroup>
                        </FormGroup>
                        <Button className="pick-location-btn" color="primary" onClick={(e) => {
                            this._onOpenLocationInTheMap(true);
                            e.preventDefault();
                        }}>
                            <i className="fa fa-map-marker" aria-hidden="true"/>
                            {t('inspector.metadata.geolocation.btn_open_map_to_select_location')}
                        </Button>
                        {errors.length > 0 &&
                            <div className="alert alert-danger" role="alert">
                                {errors}
                            </div>
                        }
                        <div className="actions-row">
                            <Button color="success"  size="sm"
                                    onClick={(e) => {
                                        this._onSaveEdit()
                                        e.preventDefault();
                                    }}
                            >{t('global.save')}
                            </Button>
                            <Button color="danger"  size="sm"
                                    onClick={(e) => {
                                this._onCancelEdit();
                                e.preventDefault();
                            }}
                            >{t('global.cancel')}
                            </Button>
                        </div>
                    </div>
                </div>
            }
        </div>
    }

}
