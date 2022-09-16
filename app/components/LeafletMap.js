import React, {Component} from 'react';
import i18next from "i18next";
import {Marker, TileLayer, Map, Popup, LayerGroup, FeatureGroup} from "react-leaflet";
import L from "leaflet";
import styled from "styled-components";
import MarkerClusterGroup from 'react-leaflet-markercluster';
import _ from "lodash";

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
        this.clusterRef = React.createRef();
    }

    _fitMapToMarkers = () => {
        const map = this.mapRef.current.leafletElement;  //get native Map instance
        const group = this.markersRef.current.leafletElement; //get native featureGroup instance
        map.fitBounds(this.clusterRef.leafletElement.getBounds());
        console.log(this.clusterRef)
        // this.clusterRef.zoomToBounds({padding: [20, 20]});
    };

    _addMarker = (e) => {
        console.log(e);
        this._createMarker(e.latlng);
        setTimeout(() => {
            this._fitMapToMarkers();
        }, 100)
    };

    _createMarker = (latlng) => {
        const icon = new L.Icon({
            iconUrl: PIN,
            iconAnchor: [5, 55],
            popupAnchor: [10, -44],
            iconSize: [25, 55],
        })
        const marker = new L.marker(latlng, {
            icon : icon
        });
        marker.bindPopup(`<b>I am on ${latlng}</b></br><button class="action">More info</button>`).openPopup();

        marker.on("popupopen", (a) => {
            console.log('popup open ')
            console.log(a)
            console.log(a.target)
            const popUp = a.popup;
            popUp.getElement()
                .querySelector('.action')
                .addEventListener("click", e => {
                    alert("show more clicked");
                });
        });
        // marker.addTo(this.markersRef.current.leafletElement);
        this.clusterRef.leafletElement.addLayer(marker);
    }

    _addRandomMarkers = () => {
        const icon = new L.Icon({
            iconUrl: PIN,
            iconAnchor: [5, 55],
            popupAnchor: [10, -44],
            iconSize: [25, 55],
        })
        console.log(this.clusterRef)
        console.log(this.clusterRef.leafletElement)
        _.times(100, (i) => {
            this._createMarker(this._getRandomLatLng());
        });
    }

    _getRandomLatLng = () => {
        let bounds = this.mapRef.current.leafletElement.getBounds(),
            southWest = bounds.getSouthWest(),
            northEast = bounds.getNorthEast(),
            lngSpan = northEast.lng - southWest.lng,
            latSpan = northEast.lat - southWest.lat;

        return new L.LatLng(
            southWest.lat + latSpan * Math.random(),
            southWest.lng + lngSpan * Math.random());
    }

    componentDidMount() {
        setTimeout(() => {
            this._addRandomMarkers();
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
                         className={"leaflet-map"}
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

                        <MarkerClusterGroup ref={(markerClusterGroup) => {
                            this.clusterRef = markerClusterGroup;
                        }}>
                        </MarkerClusterGroup>
                        {/*<FeatureGroup color="purple"*/}
                        {/*              ref={this.markersRef}>*/}
                        {/*    <Marker position={position} icon={pointerIcon}*/}
                        {/*            onClick={(e) => {*/}
                        {/*                this._fitMapToMarkers();*/}
                        {/*                e.target.closePopup();*/}
                        {/*            }}*/}
                        {/*            onMouseOver={e => {*/}
                        {/*                console.log("over")*/}
                        {/*                e.target.openPopup();*/}
                        {/*            }}*/}
                        {/*            onMouseOut={e => {*/}
                        {/*                console.log("out")*/}
                        {/*                e.target.closePopup();*/}
                        {/*            }}>*/}
                        {/*        <Popup>*/}
                        {/*            <table className="table">*/}
                        {/*                <thead>*/}
                        {/*                <tr>*/}
                        {/*                    <th scope="col">#</th>*/}
                        {/*                    <th scope="col">First</th>*/}
                        {/*                    <th scope="col">Last</th>*/}
                        {/*                    <th scope="col">Handle</th>*/}
                        {/*                </tr>*/}
                        {/*                </thead>*/}
                        {/*                <tbody>*/}
                        {/*                <tr>*/}
                        {/*                    <th scope="row">1</th>*/}
                        {/*                    <td>Mark</td>*/}
                        {/*                    <td>Otto</td>*/}
                        {/*                    <td>@mdo</td>*/}
                        {/*                </tr>*/}
                        {/*                <tr>*/}
                        {/*                    <th scope="row">2</th>*/}
                        {/*                    <td>Jacob</td>*/}
                        {/*                    <td>Thornton</td>*/}
                        {/*                    <td>@fat</td>*/}
                        {/*                </tr>*/}
                        {/*                <tr>*/}
                        {/*                    <th scope="row">3</th>*/}
                        {/*                    <td>Larry</td>*/}
                        {/*                    <td>the Bird</td>*/}
                        {/*                    <td>@twitter</td>*/}
                        {/*                </tr>*/}
                        {/*                </tbody>*/}
                        {/*            </table>*/}
                        {/*        </Popup>*/}
                        {/*    </Marker>*/}
                        {/*    <Marker position={[45.5, -0.09]} icon={pointerIcon}*/}
                        {/*            onClick={(e) => {*/}
                        {/*                this._fitMapToMarkers();*/}
                        {/*                e.target.closePopup();*/}
                        {/*            }}*/}
                        {/*    >*/}
                        {/*        <Popup*/}
                        {/*            onOpen={*/}
                        {/*            (e) => {*/}
                        {/*                console.log('on popup open')*/}
                        {/*                console.log(e)*/}
                        {/*                console.log(this);*/}
                        {/*                // this.getElement()*/}
                        {/*                //     .querySelector(".action")*/}
                        {/*                //     .addEventListener("click", e => {*/}
                        {/*                //         alert('show more')*/}
                        {/*                //     });*/}
                        {/*            }}>*/}
                        {/*            <button className="action">More info</button>*/}
                        {/*        </Popup>*/}
                        {/*    </Marker>*/}
                        {/*</FeatureGroup>*/}
                    </Map>
                </_LeafletDiv>
            </_Root>
        );
    }

}
