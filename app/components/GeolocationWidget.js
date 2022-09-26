import React, {Component} from 'react';
import {Form, FormGroup, Input, InputGroup, InputGroupAddon, InputGroupText} from "reactstrap";
import i18next from "i18next";

export default class GeolocationWidget extends Component {

    constructor(props) {
        super(props);
        this.state = {
            inEdit: false
        }
    }

    componentDidMount() {
    }

    componentDidUpdate(prevProps, prevState) {
    }

    _onEdit = () => {
        console.log("onEdit click");
        this.setState({
            inEdit: !this.state.inEdit
        });
    }

    _onSaveManualEntry = () => {
        console.log("onSaveManualEntry click");
    }

    _onOpenLocationInTheMap = () => {
        console.log("onOpenLocationInTheMap click")
    }

    render() {
        const {t} = i18next;
        return <div className="geolocation-widget">
            <InputGroup>
                <Input type="text" name="iptc.location" id="location" readOnly={true}
                       placeholder={t('inspector.metadata.textbox_placeholder_coverage_place')}
                       title={t('inspector.metadata.textbox_tooltip_coverage_place')}
                       value={`${this.props.place} (${this.props.latitude}, ${this.props.longitude})`}
                />
                <InputGroupAddon addonType="append">
                    <InputGroupText>
                        <i className={this.state.inEdit ? "fa fa-times pointer" : "fa fa-pencil pointer"}
                           aria-hidden="true"
                           onClick={() => this._onEdit()}/>
                    </InputGroupText>
                    <InputGroupText>
                        <i className="fa fa-external-link pointer" aria-hidden="true"
                           onClick={() => this._onOpenLocationInTheMap}/>
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
                        <Input type="text" name="textSearch" id="textSearch"
                               placeholder={"Place name"}
                               value={this.props.place}
                        />
                        <Input type="text" name="textSearch" id="textSearch"
                               placeholder={"Latitude"}
                               value={this.props.latitude}
                        />
                        <Input type="text" name="textSearch" id="textSearch"
                               placeholder={"Longitude"}
                               value={this.props.longitude}
                        />
                    </div>
                </div>
            }

        </div>
    }

}
