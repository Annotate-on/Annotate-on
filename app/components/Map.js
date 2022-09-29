import React, {Component} from "react";
import L from 'leaflet';
import PIN from "./pictures/location-dot-solid.svg";
import styled from "styled-components";
import {Marker, Popup, TileLayer} from "react-leaflet";
import {pointerIcon} from "./LeafletMap";

const _Root = styled.div`
    display: grid;
    grid-template-rows: auto;
    height: calc(100% - 40px);
 `;

const _LeafletDiv = styled.div`
    width: 100%;
    height: 100%;
`;


export default class Map extends Component {
    componentDidMount() {
        // create map
        this.map = L.map('map', {
            center: [51.505, -0.09],
            zoom: 7,
            layers: [
                L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                }),
            ]
        });

        // add layer
        // this.layer = L.layerGroup().addTo(this.map);


        var myIcon = L.icon({
            // iconUrl: './pictures/event/event-logo.png',
            iconUrl: PIN,
            iconSize: [18, 18],
            iconAnchor: [22, 94],
            popupAnchor: [-12, -100],
            // shadowUrl: 'my-icon-shadow.png',
            // shadowSize: [68, 95],
            // shadowAnchor: [22, 94]
        });

        const marker = L.marker([51.5, -0.09], {icon: myIcon}).on('click', event => {
        }).addTo(this.map)
            .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
            .openPopup();
        marker.on('mouseover',function(ev) {
            ev.target.openPopup();
        });

        // L.marker([51.5, -0.09], {icon: myIcon}).on('click', event => {
        //     alert('bravo aki')
        // }).addTo(this.layer)
        //     .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
        //     .openPopup();
        //
        // L.marker([50.5, -0.09], {icon: myIcon}).on('click', event => {
        //     alert('bravo aki')
        // }).addTo(this.layer)
        //     .bindPopup('A1 pretty CSS3 popup.<br> Easily customizable.')
        //     .openPopup();


        // // add marker
        // this.marker = L.marker(this.props.markerPosition).addTo(this.map);
    }

    componentDidUpdate({markerPosition}) {
        // check if position has changed
        // if (this.props.markerPosition !== markerPosition) {
        //     this.marker.setLatLng(this.props.markerPosition);
        // }
    }

    render() {

        return <_Root>
            <_LeafletDiv>
                <div id="map"></div>
            </_LeafletDiv>
        </_Root>

    }

}
