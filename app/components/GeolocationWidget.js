import React, {Component} from 'react';
import {
    Button,
    DropdownItem,
    DropdownMenu,
    FormGroup,
    Input,
    InputGroup,
    InputGroupAddon,
    InputGroupText,
    Label
} from "reactstrap";
import i18next from "i18next";
import {getDecimalLocation, validateLocationInput} from "./event/utils";
import PickLocation from "../containers/PickLocation";
import * as Nominatim from "nominatim-browser";

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
            pickLocation: false,
            geocodeResults:null,
        };
    }

    static getDerivedStateFromProps(props, state) {
        if(state.inEdit) return null;
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
            this.setState({
                inEdit: false,
                errors: ''
            });
            this.props.onValueChange(event);
        } else {
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
        this._onSearchByLanLng();
    }

    -_onSearchByLanLng = () => {
        console.log(`Search by lat/lng ${this.state.latLng}`)
        const latLngValue = getDecimalLocation(this.state.latLng);
        if(!latLngValue) {
            console.log(`Bad format for lat/long`);
            return ;
        }
        Nominatim.reverseGeocode({
            lat: latLngValue[0],
            lon: latLngValue[1],
            addressdetails: true,
            email: 'nenad@presek-i.com'
        }).then((result) => {
            console.log("result", result)
            if (result) {
                this.setState({
                    place : result.display_name
                });
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    -_onSearchByPlace = () => {
        console.log(`Search by place ${this.state.place}`)
        Nominatim.geocode({
                city: this.state.place,
                addressdetails: true,
                email: 'nenad@presek-i.com'
            })
            .then((results) => {
                console.log("results", results)
                this.setState({
                    geocodeResults: results
                })
            }).catch((error) => {
                console.error(error);
            });
    }

    _onSelectedPlace = (value) => {
        console.log("_onSelectedPlace", value);
        if(!value) return;
        let latLng = (!value.lat && !value.lon) ? '' : `${value.lat ? value.lat: ''},${value.lon? value.lon: ''}`;
        this.setState({
            latLng,
            place: value.display_name,
            geocodeResults: null
        })
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
        return <div className="geolocation-widget popup-widget">
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
                       title={this.state.value ? this.state.value : t('inspector.metadata.textbox_tooltip_coverage_place')}
                       onClick={() => {
                           if(!this.state.inEdit) this._onEdit()
                       }}
                       value={this.state.value}/>
                <InputGroupAddon addonType="append">
                    <InputGroupText>
                        <i className={this.state.latLng ? "fa fa-external-link pointer": "fa fa-external-link disabled"} aria-hidden="true"
                           onClick={() => {
                               if(this.state.latLng) this._onOpenLocationInTheMap(false);
                           }}/>
                    </InputGroupText>
                </InputGroupAddon>
            </InputGroup>
            {this.state.inEdit &&
                <div className="widget-editor">
                    <div className="widget-editor-section">
                        <div className="widget-editor-section-title">
                            {t('inspector.metadata.geolocation.popup_lbl_new_edit_geolocation')}
                        </div>
                    </div>
                    <div className="widget-editor-section">
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
                                           } else if(e.key === 'Escape' && e.type === 'keydown') {
                                               this.setState({
                                                   geocodeResults:null
                                               })
                                           }
                                       }}
                                />
                                <InputGroupAddon addonType="append">
                                    <InputGroupText>
                                        <i className="fa fa-search pointer" aria-hidden="true"
                                           onClick={this._onSearchByPlace}/>
                                    </InputGroupText>
                                </InputGroupAddon>
                                {this.state.geocodeResults &&
                                    <DropdownMenu className="show geocode-results-popup">
                                        {this.state.geocodeResults.map((value, index) => {
                                            return <div key={index} role="menuitem" className="dropdown-item"
                                                        onClick={event => {
                                                            this._onSelectedPlace(value)
                                                        }}>{value.display_name}</div>
                                        })}
                                </DropdownMenu>
                                }
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
