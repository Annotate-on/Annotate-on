import React, {Component} from 'react';
import i18next from "i18next";
import {Marker, TileLayer, Map, Popup, LayerGroup, FeatureGroup} from "react-leaflet";
import L from "leaflet";
import styled from "styled-components";
import MarkerClusterGroup from 'react-leaflet-markercluster';
import _ from "lodash";
import PIN from "./pictures/location-dot-solid.svg";
import PIN_RED from "./pictures/location-dot-solid-red.svg";
import moment from "moment";
import {ee, EVENT_SELECT_TAB} from "../utils/library";
import {filter} from "lodash/collection";

const _Root = styled.div`
    display: grid;
    grid-template-rows: auto;
    height: calc(100% - 40px);
 `;

const _LeafletDiv = styled.div`
    width: 100%;
    height: 100%;
`;

const _PopUpDiv = styled.div`
    width: 300px;
`;

export const pointerIcon = new L.Icon({
    iconUrl: PIN,
    iconAnchor: [5, 55],
    popupAnchor: [10, -44],
    iconSize: [25, 55],
})

export const pointerIconRed = new L.Icon({
    iconUrl: PIN_RED,
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
            selectedImages: []
        }
        this.mapRef = React.createRef();
        this.markersRef = React.createRef();
        this.clusterRef = React.createRef();
    }

    _fitMapToMarkers = () => {
        const map = this.mapRef.current.leafletElement;  //get native Map instance
        map.fitBounds(this.clusterRef.leafletElement.getBounds());
        console.log(this.clusterRef)
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

        marker.on("dblclick", function (ev) {
            alert('double click')
        })
        this.clusterRef.leafletElement.addLayer(marker);
    }

    componentDidMount() {
        console.log("componentDidMount map")
        console.log(this.props.locations)
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
                         className={"leaflet-map"}
                         zoom={this.state.zoom}
                         zoomControl={true}
                         ref={this.mapRef}
                         doubleClickZoom={false}
                         onClick={(e) => {
                             // this._addMarker(e);
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
                            {this.props.locations.map((location, index) => {
                                return <Marker position={location.latLng} icon={this.props.selectedResources.includes(location.resource.sha1) ? pointerIconRed : pointerIcon}
                                        onClick={(e) => {
                                            if(e.originalEvent.shiftKey) {
                                                this.props.onSelectResource(location.resource.sha1);
                                            }
                                            e.target.closePopup();
                                        }}

                                        onDblClick={(e) => {
                                            this.props.onOpenResource(location.resource.sha1);
                                        }}

                                        onMouseOver={e => {
                                            e.target.openPopup();
                                        }}

                                        onMouseOut={e => {
                                            // e.target.closePopup();
                                        }}

                                        onPopupOpen={e => {
                                            const popUp = e.popup;
                                            const anchor =popUp.getElement()
                                                .querySelector('.action');
                                            if(anchor) {
                                                anchor.addEventListener("click", e => {
                                                    this.props.onSelection(location.resource.sha1);
                                                });
                                            }
                                        }}>
                                    <Popup >
                                        <div className={"map-marker-popup"}>
                                            {location.resource.erecolnatMetadata ?
                                                <div className="attributes-holder">
                                                    <div>
                                                        <div className="metadata-title">
                                                            {t('library.map-view.popup_lbl_catalog_n_1')}
                                                            Catalog N1
                                                        </div>
                                                        <div className="metadata-value">
                                                            {location.resource.erecolnatMetadata.catalognumber}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="metadata-title">
                                                            {t('library.map-view.popup_lbl_scientific_name')}
                                                        </div>
                                                        <div className="metadata-value">
                                                            {location.resource.erecolnatMetadata.scientificname}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="metadata-title">
                                                            {t('library.map-view.popup_lbl_collector_name')}
                                                        </div>
                                                        <div className="metadata-value">
                                                            {location.resource.erecolnatMetadata.recordedby}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="metadata-title">
                                                            {t('library.map-view.popup_lbl_date')}
                                                        </div>
                                                        <div className="metadata-value">
                                                            {location.resource.erecolnatMetadata.modified && moment(location.resource.erecolnatMetadata.modified).format('DD/MM/YYYY')}
                                                        </div>
                                                    </div>
                                                </div>
                                                : <div className="attributes-holder">
                                                        <div>
                                                            <div
                                                                className="metadata-title">
                                                                {t('library.map-view.popup_lbl_file_name')}
                                                            </div>
                                                            <div
                                                                className="metadata-value">
                                                                {location.resource.file_basename}
                                                            </div>
                                                        </div>
                                                    </div>
                                            }
                                            <img className="img-panel"
                                                 alt="img panel"
                                                 src={location.resource.thumbnail}>
                                            </img>
                                            <a href={"#"} className="action">{t('library.map-view.popup_open_in_annotation_editor')}</a>
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
