import React, {Component} from 'react';
import i18next from "i18next";
import {Marker, TileLayer, Map, Popup, LayerGroup, FeatureGroup} from "react-leaflet";
import L from "leaflet";
import styled from "styled-components";

import PIN from "./pictures/location-dot-solid.svg";

const _Root = styled.div`
    display: grid;
    grid-template-rows: auto;
    height: calc(100% - 40px);
 `;

const _LeafletDiv = styled.div`
    width: 100%;
    height: 100%;
`;

export const pointerIcon = new L.Icon({
    iconUrl: PIN,
    iconAnchor: [5, 55],
    popupAnchor: [10, -44],
    iconSize: [25, 55],
})

export default class LeafletMap extends Component {

    constructor(props, context) {
        super(props, context);
        this.state = {
            lat: 51.505,
            lng: -0.09,
            zoom: 10,
        }
        this.mapRef = React.createRef();
        this.markersRef = React.createRef();
    }

    _fitMapToMarkers = () => {
        const map = this.mapRef.current.leafletElement;  //get native Map instance
        const group = this.markersRef.current.leafletElement; //get native featureGroup instance
        map.fitBounds(group.getBounds());
    };

    _addMarker = (e) => {
        console.log(e);
        const icon = new L.Icon({
            iconUrl: PIN,
            iconAnchor: [5, 55],
            popupAnchor: [10, -44],
            iconSize: [25, 55],
        })
        const marker = new L.marker(e.latlng, {
            icon : icon
        });
        marker.bindPopup(`<b>I am on ${e.latlng}</b>`).openPopup();
        marker.addTo(this.markersRef.current.leafletElement);
        setTimeout(() => {
            this._fitMapToMarkers();
        }, 100)
    };

    componentDidMount() {
        setTimeout(() => {
            this._fitMapToMarkers();
        }, 100)
    }

    render() {
        const {t} = i18next;
        const position = [this.state.lat, this.state.lng]
        return (
            <_Root>
                <_LeafletDiv>
                    <Map center={position}
                         zoom={this.state.zoom}
                         zoomControl={true}
                         ref={this.mapRef}
                         onClick={(e) => {
                             this._addMarker(e);
                             e.target.closePopup();
                         }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                        />

                        <FeatureGroup color="purple"
                                      // ref={_ => (this._setGroupRef(_))}
                                      ref={this.markersRef}>
                            <Marker position={position} icon={pointerIcon}
                                    onClick={(e) => {
                                        this._fitMapToMarkers();
                                        e.target.closePopup();
                                    }}
                                // onDoubleClick={() => {
                                //     alert('on double click')
                                //     e.target.closePopup();
                                // }}
                                    onMouseOver={e => {
                                        console.log("over")
                                        e.target.openPopup();
                                    }}
                                    onMouseOut={e => {
                                        console.log("out")
                                        e.target.closePopup();
                                    }}>
                                <Popup>
                                    <table className="table">
                                        <thead>
                                        <tr>
                                            <th scope="col">#</th>
                                            <th scope="col">First</th>
                                            <th scope="col">Last</th>
                                            <th scope="col">Handle</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr>
                                            <th scope="row">1</th>
                                            <td>Mark</td>
                                            <td>Otto</td>
                                            <td>@mdo</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">2</th>
                                            <td>Jacob</td>
                                            <td>Thornton</td>
                                            <td>@fat</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">3</th>
                                            <td>Larry</td>
                                            <td>the Bird</td>
                                            <td>@twitter</td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </Popup>
                            </Marker>
                            <Marker position={[45.5, -0.09]} icon={pointerIcon}
                                    onClick={(e) => {
                                        this._fitMapToMarkers();
                                        e.target.closePopup();
                                    }}
                                // onDoubleClick={() => {
                                //     alert('on double click')
                                //     e.target.closePopup();
                                // }}
                                    onMouseOver={e => {
                                        console.log("over")
                                        e.target.openPopup();
                                    }}
                                    onMouseOut={e => {
                                        console.log("out")
                                        e.target.closePopup();
                                    }}>
                                <Popup>
                                    <table className="table">
                                        <thead>
                                        <tr>
                                            <th scope="col">#</th>
                                            <th scope="col">First</th>
                                            <th scope="col">Last</th>
                                            <th scope="col">Handle</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr>
                                            <th scope="row">1</th>
                                            <td>Mark</td>
                                            <td>Otto</td>
                                            <td>@mdo</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">2</th>
                                            <td>Jacob</td>
                                            <td>Thornton</td>
                                            <td>@fat</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">3</th>
                                            <td>Larry</td>
                                            <td>the Bird</td>
                                            <td>@twitter</td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </Popup>
                            </Marker>
                        </FeatureGroup>
                    </Map>
                </_LeafletDiv>
            </_Root>
        );
    }

}
