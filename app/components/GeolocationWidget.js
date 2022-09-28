import React, {Component} from 'react';
import {Input, InputGroup, InputGroupAddon, InputGroupText} from "reactstrap";
import i18next from "i18next";
import {getDecimalLocation, validateLocationInput} from "./event/utils";
import PickTag from "../containers/PickTag";
import PickLocation from "../containers/PickLocation";

export default class GeolocationWidget extends Component {

    constructor(props) {
        super(props);
        this.state = {
            inEdit: false,
            value: '',
            place: '',
            latitude: '',
            longitude: '',
            errors: '',
            showLocationPopup: false
        };
    }

    static getDerivedStateFromProps(props, state) {
        const coordinates = props.location.split(/[ ,]+/);
        const lat = coordinates[0];
        const lng = coordinates[1];
        let latitude = props.latitude ? this.props.latitude : lat;
        let longitude = props.longitude ? this.props.longitude : lng;
        let place = props.place? props.place: '';
        let value = (!props.place && !latitude && !longitude) ? '' :
            `${place} (${latitude ? latitude: ''}, ${longitude? longitude: ''})`;
        return {
            value: value,
            place: state.inEdit ? state.place : place,
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
        const input = this.state.latitude + ' ' + this.state.longitude;
        console.log("_onOpenLocationInTheMap", input);
        const valid = validateLocationInput(input);
        const locations = []
        if(valid) {
            const location = {
                latLng : getDecimalLocation(input),
                resource: {},
                current: true
            };
            locations.push(location);
        }
        this.setState({
            locations: locations,
            showLocationPopup: true
        });
    }

    _formChangeHandler = (event) => {
        const {t} = i18next;
        const {name, value} = event.target;
        let errors = this.state.errors;
        if (name === 'latitude' || name === 'longitude') {
            let input = (name === 'latitude' ? value : this.state.latitude) + " " + (name === 'longitude' ? value : this.state.longitude);
            errors = validateLocationInput(input)
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
            <div>
                <PickLocation
                    locations = {this.state.locations}
                    openModal={this.state.showLocationPopup}
                    onClose={() => {
                        this.setState({showLocationPopup: false});
                    }}
                />
            </div>
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
                        <div className="geolocation-widget-editor-section-title">{t('inspector.metadata.geolocation.lbl_search_for_location')}</div>
                        <button className="pointer btn btn-primary">
                            <i className="fa fa-map-marker" aria-hidden="true"
                               onClick={() => this._onOpenLocationInTheMap}/>
                            {t('inspector.metadata.geolocation.btn_open_map_to_select_location')}
                        </button>
                    </div>
                    <Input type="text" name="textSearch" id="textSearch"
                           placeholder={t('inspector.metadata.geolocation.textbox_placeholder_text_search')}/>

                    <div className="geolocation-widget-editor-section">
                        <div className="geolocation-widget-editor-section-title">{t('inspector.metadata.geolocation.lbl_manuel_entry')}</div>
                        <Input type="text" name="place" id="location.place"
                               placeholder={t('inspector.metadata.geolocation.textbox_placeholder_place_name')}
                               value={this.state.place}
                               onChange={this._formChangeHandler}
                               onKeyDown={this._onKeyDown}/>
                        <Input type="text" name="latitude" id="location.latitude"
                               placeholder={t('inspector.metadata.geolocation.textbox_placeholder_latitude')}
                               value={this.state.latitude}
                               onChange={this._formChangeHandler}
                               onKeyDown={this._onKeyDown}/>
                        <Input type="text" name="longitude" id="location.longitude"
                               placeholder={t('inspector.metadata.geolocation.textbox_placeholder_longitude')}
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
