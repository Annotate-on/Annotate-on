import React, {Component} from 'react';
import {Form, FormGroup, Input, InputGroup, InputGroupAddon, InputGroupText} from "reactstrap";
import i18next from "i18next";

export default class GeolocationWidget extends Component {

    constructor(props) {
        super(props);
        // console.log("GeolocationWidget", this.props);
        this.state = {
            inEdit: false,
            value: '',
            place: '',
            latitude: '',
            longitude: '',
            errors: ''
        };
    }

    static getDerivedStateFromProps(props, state) {
        // console.log("_getDerivedStateFromProps", props, state);
        const coordinates = props.location.split(/[ ,]+/);
        const lat = coordinates[0];
        const lng = coordinates[1];
        let latitude = props.latitude ? this.props.latitude : lat;
        let longitude = props.longitude ? this.props.longitude : lng;
        let value = (!props.place && !latitude && !longitude) ? '' :
            `${props.place? props.place: ''} (${latitude ? latitude: ''}, ${longitude? longitude: ''})`;
        return {
            value: value,
            place: state.inEdit ? state.place : props.place,
            latitude: state.inEdit ? state.latitude : latitude,
            longitude: state.inEdit ? state.longitude : longitude
        };
    }

    componentDidMount() {
        // console.log('componentDidMount');
    }

    componentDidUpdate(prevProps, prevState) {
        // console.log('componentDidUpdate', this.props)
    }

    _onEdit = () => {
        console.log("onEdit click");
        this.setState({
            inEdit: true
        });
    }

    _onCancelEdit = () => {
        console.log("_onCancelEdit click");
        this.setState({
            inEdit: false,
            errors: ''
        });
    }

    _onSaveManualEntry = () => {
        console.log("onSaveManualEntry click");
    }

    _onOpenLocationInTheMap = () => {
        console.log("onOpenLocationInTheMap click")
        if(this.props.onShowLocationOnMap) {
            this.props.onShowLocationOnMap();
        }
    }

    _validateLocationInput(input) {
        console.log("validateLocationInput ", input)
        const regexDecimal = new RegExp('(^-?\\d*\\.{0,1}\\d+$)');
        const regexDMS = new RegExp('([0-9]{1,2})[:|°]([0-9]{1,2})[:|\'|′]?([0-9]{1,2}(?:\\.[0-9]+)?)?["|″|\'\']([N|S]) ([0-9]{1,3})[:|°]([0-9]{1,2})[:|\'|′]?([0-9]{1,2}(?:\\.[0-9]+)?)?["|″|\'\']([E|W])');

        const coordinates = input.split(/[ ,]+/);
        const lat = coordinates[0];
        const lng = coordinates[1];

        if (input === '' || input === 'N/A') {
            return true;
        }
        if (regexDecimal.test(lat) && regexDecimal.test(lng) && this.validateDecimalCoords(lat, lng)) {
            return true;
        }
        if (regexDMS.test(input)) {
            const latD = this.convertDMStoDecimal(lat);
            const lngD = this.convertDMStoDecimal(lng);
            if (this.validateDecimalCoords(latD, lngD)) {
                return true;
            }
        } else {
            this.setState({_validateLocationInput: false});
            return false;
        }
    }

    validateDecimalCoords(lat, lng) {
        return lat > -90 && lat < 90 && lng > -180 && lng < 180;
    }

    convertDMStoDecimal(coordinates) {
        let parts = coordinates.split(/[^\d+(\,\d+)\d+(\.\d+)?\w]+/);
        let degrees = parseFloat(parts[0]);
        let minutes = parseFloat(parts[1]);
        let seconds = parseFloat(parts[2].replace(',', '.'));
        let direction = parts[3];

        let dd = degrees + minutes / 60 + seconds / (60 * 60);

        if (direction === 'S' || direction === 'W') {
            dd = dd * -1;
        }
        return dd;
    }

    _formChangeHandler = (event) => {
        const {t} = i18next;
        const {name, value} = event.target;
        let errors = this.state.errors;
        if (name === 'latitude' || name === 'longitude') {
            let input = (name === 'latitude' ? value : this.state.latitude) + ", " + (name === 'longitude' ? value : this.state.longitude);
            errors = this._validateLocationInput(input)
                ? ''
                : t('inspector.metadata.alert_input_is_not_valid_please_provide_lat_long');
        }
        console.log('_formChangeHandler', errors)
        this.setState({
            [name]: value,
            errors: errors
        });
    };

    _onKeyDown = (_) => {
        console.log('key ' + _.key);
        console.log('type ' + _.type);
        if (_.key === 'Escape' && _.type === 'keydown')  {
            this._onCancelEdit();
            return;
        }
        if (_.key === 'Enter' && _.type === 'keydown') {
            if(this.props.onValueChange && !this.state.errors) {
                let event = {
                    target: {
                        name: this.props.name,
                        value: {
                            place: this.state.place,
                            latitude: this.state.latitude,
                            longitude: this.state.longitude,
                        }
                    },
                    errors: this.state.errors
                }
                this.setState({
                    inEdit: false,
                    errors: ''
                });
                this.props.onValueChange(event);
            }
            _.preventDefault();
        }
    }

    _validateForm = (errors) => {
        let valid = true;
        Object.values(errors).forEach(
            (val) => val.length > 0 && (valid = false)
        );
        return valid;
    };

    render() {
        const {t} = i18next;
        const {errors} = this.state;
        return <div className="geolocation-widget">
            <InputGroup>
                <Input type="text" name="location" id="location" readOnly={true}
                       placeholder={t('inspector.metadata.textbox_placeholder_coverage_place')}
                       title={t('inspector.metadata.textbox_tooltip_coverage_place')}
                       value={this.state.value}/>
                <InputGroupAddon addonType="append">
                    <InputGroupText>
                        <i className={this.state.inEdit ? "fa fa-times pointer" : "fa fa-pencil pointer"}
                           aria-hidden="true"
                           onClick={() => this.state.inEdit ? this._onCancelEdit(): this._onEdit()}/>
                    </InputGroupText>
                    <InputGroupText>
                        <i className="fa fa-external-link pointer" aria-hidden="true"
                           onClick={() => this._onOpenLocationInTheMap()}/>
                    </InputGroupText>
                </InputGroupAddon>
            </InputGroup>
            {this.state.inEdit &&
                <div className="geolocation-widget-editor">
                    <div className="geolocation-widget-editor-section">
                        <div className="geolocation-widget-editor-section-title">Search for location</div>
                        <button className="pointer btn btn-primary">
                            <i className="fa fa-map-marker" aria-hidden="true"
                               onClick={() => this._onOpenLocationInTheMap}/>
                            Open map to select location
                        </button>
                    </div>
                    <Input type="text" name="textSearch" id="textSearch"
                           placeholder={"Text search (showing 5 results in a list)"}/>

                    <div className="geolocation-widget-editor-section">
                        <div className="geolocation-widget-editor-section-title">Manuel entry</div>
                        <Input type="text" name="place" id="location.place" ref={this.inputPlaceRef}
                               placeholder={"Place name"}
                               value={this.state.place}
                               onChange={this._formChangeHandler}
                               onKeyDown={this._onKeyDown}/>
                        <Input type="text" name="latitude" id="location.latitude" ref={this.inputLatRef}
                               placeholder={"Latitude"}
                               value={this.state.latitude}
                               onChange={this._formChangeHandler}
                               onKeyDown={this._onKeyDown}/>
                        <Input type="text" name="longitude" id="location.longitude"
                               placeholder={"Longitude"}
                               value={this.state.longitude}
                               onChange={this._formChangeHandler}
                               onKeyDown={this._onKeyDown}
                        />
                        {errors.length > 0 &&
                            <div className="alert alert-danger" role="alert">
                                {errors}
                            </div>
                        }
                    </div>
                </div>
            }
        </div>
    }

}
