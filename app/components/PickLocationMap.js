import React, {Component} from 'react';
import i18next from "i18next";
import {FeatureGroup, Map, Marker, Popup, TileLayer} from "react-leaflet";
import L from "leaflet";
import styled from "styled-components";
import MarkerClusterGroup from 'react-leaflet-markercluster';
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
        this.clusterRef = React.createRef();
    }

    _fitMapToMarkers = () => {
        const map = this.mapRef.current.leafletElement;  //get native Map instance
        const bounds = this.clusterRef.leafletElement.getBounds();
        if(bounds && bounds.isValid()) {
            map.fitBounds(this.clusterRef.leafletElement.getBounds());
        }
    };

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
            this._clearMap();
            this._initLeaflet();
            if(this.props.fitToBounds) {
                setTimeout(() => {
                    this._fitMapToMarkers();
                }, 100)
            } else {
                setTimeout(() => {
                    this._centerMapToSelectedLocation();
                }, 100)
            }
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.mapRef.current) {
            this._clearMap();
            this._initLeaflet();
            setTimeout(() => {
                if(this.pickedMarkerRef) {
                    this.pickedMarkerRef.leafletElement.openPopup();
                }
            }, 10)
        }
    }

    _clearMap = () => {
        if(this._miniMap) {
            this._miniMap.remove();
        }
    };

    _initLeaflet = () => {
        const map = this.mapRef.current.leafletElement;
        const osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const osmAttrib='Map data &copy; OpenStreetMap contributors';
        const osm2 = new L.TileLayer(osmUrl, {minZoom: 0, maxZoom: 13, attribution: osmAttrib});
        // if(this.pickedPopupRef) {
        //     // console.log('pickedPopupRef', this.pickedPopupRef)
        //     this.pickedPopupRef.leafletElement.openOn(map);
        // }
        // this._miniMap = new L.Control.MiniMap(osm2, {
        //     position: "bottomright",
        //     autoToggleDisplay: false,
        //     toggleDisplay: true
        // }).addTo(map);
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
                        <MarkerClusterGroup ref={(markerClusterGroup) => {
                            this.clusterRef = markerClusterGroup;
                        }}>
                            {locations.map((location, index) => {
                                return <Marker ref={(r) => {
                                    if(location.picked) {
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
                                                           if(this.props.onPickLocation) {
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
                                            {this.props.pickLocation && location.picked && <button className="btn btn-primary action" >
                                                {t('inspector.metadata.geolocation.popup_btn_add_location')}
                                            </button>}
                                        </div>
                                    </Popup>
                                </Marker>
                            })}
                        </MarkerClusterGroup>
                    </Map>
                </_LeafletDiv>
            </_Root>
        );
    }

}
