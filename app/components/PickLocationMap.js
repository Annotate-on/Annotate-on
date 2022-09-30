import React, {Component} from 'react';
import i18next from "i18next";
import {Map, Marker, Popup, TileLayer} from "react-leaflet";
import L from "leaflet";
import styled from "styled-components";
import PIN_RED from "./pictures/location-dot-solid-red.svg";
import PIN_BLUE from "./pictures/location-dot-solid-blue.svg";

const _Root = styled.div`
    display: grid;
    grid-template-rows: auto;
    height: 100%;
 `;

const _LeafletDiv = styled.div`
    width: 100%;
    height: 100%;
`;

export const pointerIconRed = new L.Icon({
    iconUrl: PIN_RED,
    iconAnchor: [12, 34],
    popupAnchor: [0, -35],
    iconSize: [25, 35],
})

export const pointerIconBlue = new L.Icon({
    iconUrl: PIN_BLUE,
    iconAnchor: [12, 34],
    popupAnchor: [0, -35],
    iconSize: [25, 35],
})

export default class PickLocationMap extends Component {

    constructor(props, context) {
        super(props, context);
        this.state = {
            lat: 51.505,
            lng: -0.09,
            zoom: 5,
        }
        this.mapRef = React.createRef();
    }

    _centerMapToSelectedLocation = () => {
        const map = this.mapRef.current.leafletElement;
        map.setView(new L.LatLng(this.state.lat, this.state.lng), 5)
    }

    static getDerivedStateFromProps(props, state) {
        return {
            lat: (props.selectedLocation) ? props.selectedLocation.latLng[0]: (state.lat ? state.lat : 51.505),
            lng: (props.selectedLocation ) ? props.selectedLocation.latLng[1]: (state.lng ? state.lng : -0.09),
        };
    }

    componentDidMount() {
        if (this.mapRef.current){
            setTimeout(() => {
                this._centerMapToSelectedLocation();
            }, 100)
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.mapRef.current) {
            setTimeout(() => {
                if(this.pickedMarkerRef) {
                    this.pickedMarkerRef.leafletElement.openPopup();
                }
            }, 10)
        }
    }

    _addMarker = (e) => {
        if(!this.props.pickLocation) return;
        console.log(e);
        const location = {
            latLng : [e.latlng.lat, e.latlng.lng],
            picked : true
        };

        this.setState( {
            pickedLocation : location
        })
    };

    render() {
        const {t} = i18next;
        let locations = [];
        let position = [this.state.lat, this.state.lng];
        if(this.props.selectedLocation) {
            locations.push(this.props.selectedLocation);
        }
        if(this.state.pickedLocation) {
            locations.push(this.state.pickedLocation);
        }
        return (
            <_Root>
                <_LeafletDiv>
                    <Map center={position}
                         className={"leaflet-map pick-location-map " + (this.props.pickLocation ? "pick-location-map-edit" : "pick-location-map-view")}
                         zoom={this.state.zoom}
                         zoomControl={true}
                         ref={this.mapRef}
                         doubleClickZoom={false}
                         onClick={(e) => {
                             this._addMarker(e);
                             // e.target.closePopup();
                         }}

                         onKeyDown={e => {
                             console.log("onKeydown");
                             console.log(e);
                         }}

                         onKeyUp={e => {
                             console.log("onKeyup");
                             console.log(e)
                         }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                        />
                        {locations.map((location, index) => {
                            return <Marker ref={(r) => {
                                if (location.picked) {
                                    this.pickedMarkerRef = r;
                                }
                            }} key={index} position={location.latLng}
                                           icon={location.picked ? pointerIconRed : pointerIconBlue}
                                           onClick={(e) => {
                                               e.target.closePopup();
                                           }}

                                           onDblClick={(e) => {

                                           }}

                                           onMouseOver={e => {
                                               e.target.openPopup();
                                           }}

                                           onMouseOut={e => {
                                               // e.target.closePopup();
                                           }}

                                           onPopupOpen={e => {
                                               const popUp = e.popup;
                                               const anchor = popUp.getElement()
                                                   .querySelector('.action');
                                               if (anchor) {
                                                   anchor.addEventListener("click", e => {
                                                       if (this.props.onPickLocation) {
                                                           this.props.onPickLocation(this.state.pickedLocation);
                                                       }
                                                   });
                                               }
                                           }}>
                                <Popup>
                                    <div className={"map-marker-popup"}>
                                        <div className="attributes-holder">
                                            <div
                                                className="metadata-title">
                                                {t('inspector.metadata.geolocation.popup_lbl_place')}:
                                            </div>
                                            <div
                                                className="metadata-value">
                                                {location.place}
                                            </div>
                                        </div>
                                        <div className="attributes-holder">
                                            <div
                                                className="metadata-title">
                                                {t('inspector.metadata.geolocation.popup_lbl_lat')}:
                                            </div>
                                            <div
                                                className="metadata-value">
                                                {location.latLng[0]}
                                            </div>
                                        </div>
                                        <div className="attributes-holder">
                                            <div
                                                className="metadata-title">
                                                {t('inspector.metadata.geolocation.popup_lbl_lng')}:
                                            </div>
                                            <div
                                                className="metadata-value">
                                                {location.latLng[1]}
                                            </div>
                                        </div>
                                        <br/>
                                        {this.props.pickLocation && location.picked &&
                                            <button className="btn btn-primary action">
                                                {t('inspector.metadata.geolocation.popup_btn_add_location')}
                                            </button>}
                                    </div>
                                </Popup>
                            </Marker>
                        })}
                    </Map>
                </_LeafletDiv>
            </_Root>
        );
    }
}
