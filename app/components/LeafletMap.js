import React, {Component} from 'react';
import i18next from "i18next";
import {FeatureGroup, Map, Marker, Popup, TileLayer} from "react-leaflet";
import L from "leaflet";
import styled from "styled-components";
import MarkerClusterGroup from 'react-leaflet-markercluster';
import PIN from "./pictures/location-dot-solid.svg";
import PIN_ANN from "./pictures/location-pin-solid-annotation.svg";
import PIN_ANN_RED from "./pictures/location-pin-solid-annotation-red.svg";
import PIN_ANN_BLUE from "./pictures/location-pin-solid-annotation-blue.svg";
import PIN_RED from "./pictures/location-dot-solid-red.svg";
import PIN_BLUE from "./pictures/location-dot-solid-blue.svg";
import moment from "moment";
import {EditControl} from "react-leaflet-draw";
import {MARKER_TYPE_METADATA} from "../constants/constants";


const _Root = styled.div`
    display: grid;
    grid-template-rows: auto;
    height: 100%;
 `;

const _LeafletDiv = styled.div`
    width: 100%;
    height: 100%;
`;

export const pointerIcon = new L.Icon({
    iconUrl: PIN,
    iconAnchor: [12, 34],
    popupAnchor: [0, -35],
    iconSize: [25, 35],
})

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
export const pointerAnnIcon = new L.Icon({
    iconUrl: PIN_ANN,
    iconAnchor: [12, 34],
    popupAnchor: [0, -35],
    iconSize: [25, 35],
})

export const pointerAnnIconRed = new L.Icon({
    iconUrl: PIN_ANN_RED,
    iconAnchor: [12, 34],
    popupAnchor: [0, -35],
    iconSize: [25, 35],
})

export const pointerAnnIconBlue = new L.Icon({
    iconUrl: PIN_ANN_BLUE,
    iconAnchor: [12, 34],
    popupAnchor: [0, -35],
    iconSize: [25, 35],
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
        this.clusterRef = React.createRef();
        this.editControlFirst = React.createRef();
        this.featureGroup = React.createRef();
    }

    _fitMapToMarkers = () => {
        const map = this.mapRef.current.leafletElement;  //get native Map instance
        const bounds = this.clusterRef.leafletElement.getBounds();
        if(bounds && bounds.isValid()) {
            map.fitBounds(this.clusterRef.leafletElement.getBounds());
        }
    };

    componentDidMount() {
        if (this.mapRef.current){
            this._clearMap();
            this._initLeaflet();
            if(this.props.fitToBounds === "true") {
                setTimeout(() => {
                    this._fitMapToMarkers();
                }, 100)
            }
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.mapRef.current) {
            this._clearMap();
            this._initLeaflet();
        }
    }

    _clearMap = () => {
        if(this._miniMap) {
            this._miniMap.remove();
        }
        const drawnLayers = this.featureGroup.leafletElement;
        if(drawnLayers) {
            drawnLayers.eachLayer((layer) => {
                layer.off('click');
                drawnLayers.removeLayer(layer);
            });
        }
    };

    _initLeaflet = () => {
        const map = this.mapRef.current.leafletElement;
        const osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const osmAttrib='Map data &copy; OpenStreetMap contributors';
        const osm2 = new L.TileLayer(osmUrl, {minZoom: 0, maxZoom: 13, attribution: osmAttrib});
        // this._miniMap = new L.Control.MiniMap(osm2, {
        //     position: "bottomright",
        //     autoToggleDisplay: false,
        //     toggleDisplay: true
        // }).addTo(map);
    }

    _onSelectionCreated = (e) => {
        let selectedResources = [];
        if(e.layerType ==='rectangle') {
            e.layer.getBounds().contains([43, 25]);
            for (const location of this.props.locations) {
                const selected = e.layer.getBounds().contains(location.latLng);
                if(selected) {
                    selectedResources.push(location.resource.sha1);
                }
            }
        } else if(e.layerType ==='polygon') {
            for (const location of this.props.locations) {
                const selected = this._isMarkerInsidePolygon(location.latLng, e.layer);
                if(selected) {
                    selectedResources.push(location.resource.sha1);
                }
            }
        }
        if(selectedResources) {
            this.props.onSelectResources(selectedResources)
        }
        const drawnLayers = this.featureGroup.current.leafletElement;
        drawnLayers.eachLayer((layer) => {
            layer.off('click');
            drawnLayers.removeLayer(layer);
        });
    };

    _isMarkerInsidePolygon = (marker, poly) => {
        const polyPoints = poly.getLatLngs()[0];
        const x = marker[0], y = marker[1];
        let inside = false;
        for (let i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
            let xi = polyPoints[i].lat, yi = polyPoints[i].lng;
            let xj = polyPoints[j].lat, yj = polyPoints[j].lng;

            let intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    _getMarkerIcon(location) {
        if(this.props.selectedResources.includes(location.resource.sha1)) {
            return MARKER_TYPE_METADATA === location.type ? pointerIconRed : pointerAnnIconRed;
        }
        if(location.current) {
            return MARKER_TYPE_METADATA === location.type ? pointerIconBlue : pointerAnnIconBlue;
        }
        return MARKER_TYPE_METADATA === location.type ? pointerIcon : pointerAnnIcon;
    }

    render() {
        const {t} = i18next;
        let position = [this.state.lat, this.state.lng]
        for (const location of this.props.locations) {
            if(location.current) {
                position = location.latLng;
            }
        }
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
                             // console.log("onKeydown");
                             // console.log(e);
                         }}

                         onKeyUp={e => {
                             // console.log("onKeyup");
                             // console.log(e)
                         }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                        />
                        <MarkerClusterGroup ref={(markerClusterGroup) => {
                            this.clusterRef = markerClusterGroup;
                        }}>
                            {this.props.locations.map((location, index) => {
                                return <Marker
                                    key={index} position={location.latLng}
                                    icon={this._getMarkerIcon(location)}
                                    onClick={(e) => {
                                        if (e.originalEvent.shiftKey) {
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
                                        const anchor = popUp.getElement()
                                            .querySelector('.action');
                                        if (anchor) {
                                            anchor.addEventListener("click", e => {
                                                this.props.onOpenResource(location.resource.sha1, location.annotation);
                                            });
                                        }
                                    }}>
                                    location.resource && <Popup>
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
                                            {location.resource.thumbnail &&
                                                <img className="img-panel"
                                                     alt="img panel"
                                                     src={location.resource.thumbnail}>
                                                </img>
                                            }
                                            {location.annotation &&
                                                <div className="annotation-holder">
                                                    <img height="12px"
                                                         className="btn_menu"
                                                         alt={location.annotation.annotationType}
                                                         src={require('./pictures/' + location.annotation.annotationType + '.svg')}
                                                    />
                                                    <span title={location.annotation.title}>{location.annotation.title}</span>
                                                </div>
                                            }
                                            <a href={"#"} className="action">{t('library.map-view.popup_open_in_annotation_editor')}</a>
                                        </div>
                                    </Popup>
                                </Marker>
                            })}
                        </MarkerClusterGroup>
                        <FeatureGroup ref={this.featureGroup}>
                            <EditControl ref={this.editControlFirst}
                                         position='bottomleft'
                                         onCreated={this._onSelectionCreated}
                                         edit={{
                                             edit: false,
                                             remove: false
                                         }}
                                         draw={{
                                             circle: false,
                                             marker: false,
                                             polyline : false,
                                         }}
                            ></EditControl>
                        </FeatureGroup>
                    </Map>
                </_LeafletDiv>
            </_Root>
        );
    }

}
