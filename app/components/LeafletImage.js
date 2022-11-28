import React, {Component} from 'react';
import styled from 'styled-components';
import {FeatureGroup, Map} from 'react-leaflet';
import L from 'leaflet';
import {EditControl} from 'react-leaflet-draw';
import i18next from "i18next";

/**
 * NOTE!
 * THIS IMPORT IS REQUIRED TO RUN THE APP
 **/
import MiniMap from 'leaflet-minimap';

import {
    ANNOTATION_ANGLE,
    ANNOTATION_COLORPICKER,
    ANNOTATION_MARKER,
    ANNOTATION_POLYGON,
    ANNOTATION_POLYLINE,
    ANNOTATION_RECTANGLE,
    ANNOTATION_RICHTEXT,
    ANNOTATION_SIMPLELINE,
    ANNOTATION_TRANSCRIPTION,
    DELETE_EVENT,
    EDIT_EVENT,
    HIGHLIGHT_OPTIONS
} from "../constants/constants";
import 'leaflet-contextmenu'
import {ee, EVENT_HIGHLIGHT_ANNOTATION, EVENT_HIGHLIGHT_ANNOTATION_ON_LEAFLET} from "../utils/library";
import {overide_defaults} from "../widget/leaflet-override";

//
// STYLE
//
const _Root = styled.div`
    display: grid;
    grid-template-rows: auto;
    height: calc(100% - 40px);
`;
const _LeafletDiv = styled.div`
  width: 100%;
  height: 100%;
`;

const EDIT_ANNOTATION_OPTIONS = {
    edit: true,
    color: '#ff004e',
    opacity: 1.0,
    dashArray: '5, 5, 1, 5'
};

const SIMPLELINE_OPTIONS = {
    guidelineDistance: 5,
    maxGuideLineLength: 4000,
    repeatMode: true,
    shapeOptions: {
        stroke: true,
        color: '#ff0000',
        weight: 2,
        opacity: 1.0,
        fill: false,
        clickable: true
    },
    metric: true, // Whether to use the metric measurement system or imperial
    feet: true, // When not metric, to use feet instead of yards for display.
    nautic: false, // When not metric, not feet use nautic mile for display
    showLength: false, // Whether to display distance in the tooltip
    zIndexOffset: 2000, // This should be > than the highest z-index any map layers
    factor: 1, // To change distance calculation
    maxPoints: 2, // Once this number of points are placed, finish shape
    icon: new L.DivIcon({
        iconSize: new L.Point(12, 12),
        className: 'leaflet-div-icon leaflet-editing-icon'
    })
};

const POLYLINE_OPTIONS = {
    guidelineDistance: 5,
    maxGuideLineLength: 4000,
    repeatMode: true,
    shapeOptions: {
        stroke: true,
        color: '#ff0000',
        weight: 2,
        opacity: 1.0,
        fill: false,
        clickable: true
    },
    metric: true, // Whether to use the metric measurement system or imperial
    feet: true, // When not metric, to use feet instead of yards for display.
    nautic: false, // When not metric, not feet use nautic mile for display
    showLength: false, // Whether to display distance in the tooltip
    zIndexOffset: 2000, // This should be > than the highest z-index any map layers
    factor: 1, // To change distance calculation
    maxPoints: 0, // Once this number of points are placed, finish shape
    icon: new L.DivIcon({
        iconSize: new L.Point(12, 12),
        className: 'leaflet-div-icon leaflet-editing-icon'
    })
};

const POLYGON_OPTIONS = {
    guidelineDistance: 5,
    maxGuideLineLength: 4000,
    repeatMode: true,
    allowIntersection: false, // Restricts shapes to simple polygons
    drawError: {
        color: '#e1e100', // Color the shape will turn when intersects
        message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
    },
    shapeOptions: {
        stroke: true,
        color: '#ff0000',
        weight: 2,
        opacity: 1.0,
        fill: true,
        clickable: true
    },

    showArea: false,
    metric: true,
    icon: new L.DivIcon({
        iconSize: new L.Point(12, 12),
        className: 'leaflet-div-icon leaflet-editing-icon'
    })
};

const RECTANGLE_OPTIONS = {
    repeatMode: true,
    shapeOptions: {
        stroke: true,
        color: '#ff0000',
        weight: 2,
        opacity: 1.0,
        fill: true,
        clickable: true
    }
};

const MARKER_OPTIONS = {
    stroke: true,
    repeatMode: true,
    color: '#ff0000',
    weight: 2,
    opacity: 1.0,
    fill: true,
    clickable: true,
    shadowUrl: null,
    icon: new L.Icon({
        shadowUrl: null,
        iconAnchor: new L.Point(10, 22),
        iconSize: new L.Point(20, 20),
        iconUrl: require('./pictures/poi-marker.svg')
    })
};

const COLORPICKER_OPTIONS = {
    stroke: true,
    color: '#ff0000',
    weight: 4,
    opacity: 1,
    fill: true,
    fillColor: null, //same as color by default
    fillOpacity: 0.2,
    clickable: true,
    repeatMode: true,
    icon: new L.DivIcon({
        iconSize: new L.Point(26, 26),
        className: 'leaflet-div-color-picker leaflet-editing-color-picker',
        iconAnchor: new L.Point(6, 20)
    }),
    touchIcon: new L.DivIcon({
        iconSize: new L.Point(20, 20),
        className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
    }),
    zIndexOffset: 2000
};

const ANGLE_OPTIONS = {
    guidelineDistance: 5,
    repeatMode: true,
    maxGuideLineLength: 4000,
    shapeOptions: {
        stroke: true,
        color: '#ff0000',
        weight: 2,
        opacity: 1.0,
        fill: true,
        clickable: true
    },
    icon: new L.DivIcon({
        iconSize: new L.Point(12, 12),
        className: 'leaflet-div-icon leaflet-editing-icon'
    })
};

const TRANSCRIPTION_OPTIONS = {
    repeatMode: true,
    shapeOptions: {
        dashArray: 4,
        stroke: true,
        color: '#ff0000',
        weight: 2,
        opacity: 1.0,
        fill: true,
        fillOpacity: 0.0001,
        clickable: true
    }
};

const RICHTEXT_OPTIONS = {
    repeatMode: false,
    shapeOptions: {
        dashArray: 10,
        stroke: true,
        color: '#ff0000',
        weight: 2,
        opacity: 1.0,
        fill: false,
        clickable: true
    },
    textSize: 20
};

const lpd = {};
const lpp = new Promise(function (resolve, reject) {
    lpd.resolve = resolve;
    lpd.reject = reject;
});
const fgd = {};
const fdp = new Promise(function (resolve, reject) {
    fgd.resolve = resolve;
    fgd.reject = reject;
});
//
// COMPONENT
//
let contextMenu = null;
let selectedAnnotation = null;

class LeafletImage extends Component {
    constructor(props, context) {
        const { t } = i18next;
        super(props, context);
        this.sha1 = props.currentPicture.sha1;
        this.state = {
            currentPicture: props.currentPicture,
            sha1: props.currentPicture.sha1,
            control: null,
            enableToolBox: true
        };

        SIMPLELINE_OPTIONS.repeatMode = props.repeatMode;
        POLYLINE_OPTIONS.repeatMode = props.repeatMode;
        RECTANGLE_OPTIONS.repeatMode = props.repeatMode;
        POLYGON_OPTIONS.repeatMode = props.repeatMode;
        ANGLE_OPTIONS.repeatMode = props.repeatMode;
        COLORPICKER_OPTIONS.repeatMode = props.repeatMode;
        MARKER_OPTIONS.repeatMode = props.repeatMode;
        TRANSCRIPTION_OPTIONS.repeatMode = props.repeatMode;
        RICHTEXT_OPTIONS.repeatMode = props.repeatMode;

        contextMenu = {
            contextmenu: true,
            contextmenuItems: [{
                icon: require('./pictures/edit-annotation.svg'),
                text: t('global.edit'),
                index: 0,
                callback: this._editAnnotationEvent
            }, {
                icon: require('./pictures/delete-anotation.svg'),
                text: t('global.delete'),
                index: 1,
                callback: this._deleteAnnotationEvent
            }]
        }
    };

    componentWillReceiveProps(nextProps) {
        if (this.state.sha1 !== nextProps.currentPicture.sha1)
            this.setState({
                currentPicture: nextProps.currentPicture,
                sha1: nextProps.currentPicture.sha1
            });

        if ((nextProps.annotationsPointsOfInterest !== undefined && nextProps.annotationsPointsOfInterest && this.props.annotationsPointsOfInterest === undefined) ||
            (nextProps.annotationsMeasuresLinear !== undefined && nextProps.annotationsMeasuresLinear && this.props.annotationsMeasuresLinear === undefined) ||
            (nextProps.annotationsRectangular !== undefined && nextProps.annotationsRectangular && this.props.annotationsRectangular === undefined) ||
            (nextProps.annotationsPolygon !== undefined && nextProps.annotationsPolygon && this.props.annotationsPolygon === undefined) ||
            (nextProps.annotationsColorPicker !== undefined && nextProps.annotationsColorPicker && this.props.annotationsColorPicker === undefined) ||
            (nextProps.annotationsRichtext !== undefined && nextProps.annotationsRichtext && this.props.annotationsRichtext === undefined) ||
            (nextProps.annotationsAngle !== undefined && nextProps.annotationsAngle && this.props.annotationsAngle === undefined)) {

            if (this._recolnatPrint) {
                this._recolnatPrint.initialize({
                    annotationsPointsOfInterest: nextProps.annotationsPointsOfInterest,
                    annotationsMeasuresLinear: nextProps.annotationsMeasuresLinear,
                    annotationsRectangular: nextProps.annotationsRectangular,
                    annotationsPolygon: nextProps.annotationsPolygon,
                    annotationsAngle: nextProps.annotationsAngle,
                    annotationsColorPicker: nextProps.annotationsColorPicker,
                    annotationsOccurrence: nextProps.annotationsOccurrence,
                    annotationsTranscription: nextProps.annotationsTranscription,
                    annotationsRichtext: nextProps.annotationsRichtext
                })
            }
        }

        if ((nextProps.annotationsPointsOfInterest && this.props.annotationsPointsOfInterest && nextProps.annotationsPointsOfInterest.length !== this.props.annotationsPointsOfInterest.length) ||
            (nextProps.annotationsMeasuresLinear && this.props.annotationsMeasuresLinear && nextProps.annotationsMeasuresLinear.length !== this.props.annotationsMeasuresLinear.length) ||
            (nextProps.annotationsRectangular && this.props.annotationsRectangular && nextProps.annotationsRectangular.length !== this.props.annotationsRectangular.length) ||
            (nextProps.annotationsPolygon && this.props.annotationsPolygon && nextProps.annotationsPolygon.length !== this.props.annotationsPolygon.length) ||
            (nextProps.annotationsColorPicker && this.props.annotationsColorPicker && nextProps.annotationsColorPicker.length !== this.props.annotationsColorPicker.length) ||
            (nextProps.annotationsRichtext && this.props.annotationsRichtext && nextProps.annotationsRichtext.length !== this.props.annotationsRichtext.length) ||
            (nextProps.annotationsAngle && this.props.annotationsAngle && nextProps.annotationsAngle.length !== this.props.annotationsAngle.length)) {

            if (this._recolnatPrint) {
                this._recolnatPrint.initialize({
                    annotationsPointsOfInterest: nextProps.annotationsPointsOfInterest,
                    annotationsMeasuresLinear: nextProps.annotationsMeasuresLinear,
                    annotationsRectangular: nextProps.annotationsRectangular,
                    annotationsPolygon: nextProps.annotationsPolygon,
                    annotationsAngle: nextProps.annotationsAngle,
                    annotationsColorPicker: nextProps.annotationsColorPicker,
                    annotationsOccurrence: nextProps.annotationsOccurrence,
                    annotationsTranscription: nextProps.annotationsTranscription,
                    annotationsRichtext: nextProps.annotationsRichtext
                })
            }

            if (this._recolnatZoiExport) {
                this._recolnatZoiExport.initialize({
                    annotationsRectangular: nextProps.annotationsRectangular
                })
            }
        }
    };

    componentDidMount() {
        if (this.leafletMap){
            this._initLeaflet();
        }
        ee.on(EVENT_HIGHLIGHT_ANNOTATION_ON_LEAFLET, this.highlightAnnotationFromInspector);
    }

    componentWillUnmount() {
        ee.removeListener(EVENT_HIGHLIGHT_ANNOTATION_ON_LEAFLET, () => {});
    }

    highlightAnnotationFromInspector = ( id , annotationType) => {
        if (id && annotationType){
            const annotation = {annotationId: id , annotationType: annotationType};
            this.highlightAnnotation(annotation);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.state.sha1 !== nextState.currentPicture.sha1
            || this.props.calibrationMode !== nextProps.calibrationMode;
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.leafletMap) {
            this._clearMap();
            this._initLeaflet();
        }
    }

    render() {
        const { t } = i18next;
        return (
            <_Root>
                <_LeafletDiv>
                    <Map setView={[0, 0]} center={[0, 0]} zoom={10} zoomControl={false} contextmenu={true}
                         contextmenuWidth={140}
                         ref={_ => (this._setMapRef(_))} crs={L.CRS.Simple}>
                        <FeatureGroup ref={_ => (this.featureGroupEdit = _)}/>
                        <FeatureGroup ref={_ => (this._setGroupRef(_))}>
                            <EditControl ref={_ => (this.editControlFirst = _)}
                                         position='topleft'
                                         onEdited={this.props.onEdited}
                                         onCreated={this._onCreated}
                                         onDeleted={this.props.onDeleted}
                                         onMounted={this.props._onMounted}
                                         onEditStart={this.props.onEditStart}
                                         onEditStop={this.props.onEditStop}
                                         onDeleteStart={this.props.onDeleteStart}
                                         onDeleteStop={this.props.onDeleteStop}
                                         onDrawStart={this._onDrawStart}
                                         onDrawStop={this._onDrawStop}
                                         edit={{
                                             edit: false,
                                             remove: false
                                         }}
                                         draw={{
                                             circle: false,
                                             simpleline: SIMPLELINE_OPTIONS,
                                             polyline: !this.props.calibrationMode ? POLYLINE_OPTIONS : false,
                                             polygon: !this.props.calibrationMode ? POLYGON_OPTIONS : false,
                                             angle: !this.props.calibrationMode ? ANGLE_OPTIONS : false,
                                             occurrence: !this.props.calibrationMode? ANGLE_OPTIONS : false,
                                             // left out delivery of 16.05.2019.
                                             // ratio: !this.props.calibrationMode ? COLORPICKER_OPTIONS : false
                                             marker: !this.props.calibrationMode ? MARKER_OPTIONS : false,
                                             rectangle: !this.props.calibrationMode ? RECTANGLE_OPTIONS : false,
                                             colorPicker: !this.props.calibrationMode ? COLORPICKER_OPTIONS : false,
                                             transcription: !this.props.calibrationMode ? TRANSCRIPTION_OPTIONS : false,
                                             categorical: !this.props.calibrationMode,
                                             richtext: !this.props.calibrationMode ? RICHTEXT_OPTIONS : false,
                                             cartel: !this.props.calibrationMode
                                         }}
                            />

                        </FeatureGroup>
                    </Map>
                </_LeafletDiv>
            </_Root>
        );
    }


    /**
     * Call this method after component is initiated and add image overlay and minimap.
     * @private
     */
    _initLeaflet = () => {
        const { t } = i18next;
        const map = this.leafletMap.leafletElement;
        const mapContainer = this.leafletMap.container;
        selectedAnnotation = null;

        //Save annotation on enter pressed
        L.DomEvent.on(mapContainer, 'keyup', (event) => {
            if (event.keyCode === 13) {
                this.props.fireSaveEvent(event);
            }
        });

        let zoomv = mapContainer.offsetWidth < this.state.currentPicture.width ? (this.state.currentPicture.width / mapContainer.offsetWidth) : 1;
        let zoomh = mapContainer.offsetHeight < this.state.currentPicture.height ? this.state.currentPicture.height / mapContainer.offsetHeight : 1;

        if (zoomh === Infinity) zoomh = this.state.currentPicture.height;
        if (zoomv === Infinity) zoomh = this.state.currentPicture.width;

        const zoom = zoomv < zoomh ? zoomh : zoomv;
        const zoomCorrection = 10;
        this.boundsZoomLevel = Math.log2(zoom) + zoomCorrection;

        let mzoomv = 150 < this.state.currentPicture.width ? (this.state.currentPicture.width / 150) : 1;
        let mzoomh = 150 < this.state.currentPicture.height ? this.state.currentPicture.height / 150 : 1;

        if (mzoomh === Infinity) mzoomh = this.state.currentPicture.height;
        if (mzoomv === Infinity) mzoomh = this.state.currentPicture.width;

        const mzoom = 10 - Math.log2(mzoomv < mzoomh ? mzoomh : mzoomv) + Math.log2(zoom);

        const southWest = map.unproject([0, this.state.currentPicture.height], this.boundsZoomLevel);
        const northEast = map.unproject([this.state.currentPicture.width, 0], this.boundsZoomLevel);

        const bounds = new L.LatLngBounds(southWest, northEast);


        // add the image overlay, so that it covers the entire map
        this._imageOverlay = L.imageOverlay(this.state.currentPicture.file, bounds);
        this._imageOverlay.addTo(map);
        // L.control.scale().addTo(map);
        //map.setMaxBounds(bounds);


        if (this.props.leafletPositionByPicture.hasOwnProperty(this.props.currentPicture.sha1)) {
            setTimeout(() => {
                try {
                    map.fitBounds(this.props.leafletPositionByPicture[this.props.currentPicture.sha1].bounds);
                } catch (err) {
                    map.fitBounds(bounds);
                }
            }, 50);
        } else {
            map.fitBounds(bounds);
        }

        map.options.maxZoom = this.boundsZoomLevel + Math.sqrt(5);
        map.options.boundsZoomLevel = this.boundsZoomLevel
        map.options.minZoom = zoomCorrection;
        map.options.zoomSnap = 0.1;
        map.options.zoomDelta = 0.1;
        map.options.wheelPxPerZoomLevel = 60;
        map.options.picture = this.state.currentPicture.file;

        //Image overlay for minimap
        const imageLayer2 = L.imageOverlay(this.state.currentPicture.file, bounds);
        const rect1 = {color: "#333333", weight: 1, opacity: 0.5, fillOpacity: 0.5};
        const rect2 = {color: "#ff5555", weight: 1, opacity: 0, fillOpacity: 0};

        this._miniMap = new L.Control.MiniMap(imageLayer2, {
            position: "bottomleft",
            autoToggleDisplay: false,
            zoomLevelFixed: mzoom,
            toggleDisplay: true,
            aimingRectOptions: rect1,
            shadowRectOptions: rect2
        }).addTo(map);

        this._zoomControl = L.control.zoom({
            position: 'topright',
            zoomInTitle: t('annotate.editor.btn_tooltip_increase_zoom'),
            zoomOutTitle: t('annotate.editor.btn_tooltip_decrease_zoom')
        }).addTo(map);

        this._fitToView = L.control.fitToView(bounds).addTo(map);
        // Tradusction of tooltips

        Promise.all([lpp, fdp]).then( () => {
            setTimeout(() => {
                map.on('zoomend', this._mapZoomOrMoveEvent, this);
                map.on('moveend', this._mapZoomOrMoveEvent, this);
            }, 500);
            this._drawAnnotations();
        });

        map.on('contextmenu.show', function (event) {
            const annotation = event.relatedTarget;
            if (!annotation)
                return;
            // do something with your marker
            selectedAnnotation = annotation;
        });

        if (!this.props.calibrationMode) {
            this._recolnatPrint = L.recolnatPrint({
                picture: this.props.currentPicture,
                annotationsPointsOfInterest: this.props.annotationsPointsOfInterest,
                annotationsMeasuresLinear: this.props.annotationsMeasuresLinear,
                annotationsRectangular: this.props.annotationsRectangular,
                annotationsPolygon: this.props.annotationsPolygon,
                annotationsAngle: this.props.annotationsAngle,
                annotationsColorPicker: this.props.annotationsColorPicker,
                annotationsOccurrence: this.props.annotationsOccurrence,
                annotationsTranscription: this.props.annotationsTranscription,
                annotationsRichtext: this.props.annotationsRichtext
            }).addTo(map);

            this._recolnatZoiExport = L.recolnatZOIExport({
                picture: this.props.currentPicture,
                annotationsRectangular: this.props.annotationsRectangular
            }).addTo(map);

            this._recolnatControlMenu = L.recolnatControlMenu({
                id: 'toggle-checkbox',
                radioText: t('annotate.editor.lbl_enable_repeat_mode'),
                repeatModeHandler: this._setRepeatMode,
                defaultValue: this.props.repeatMode
            });
            if (this.state.enableToolBox)
                this._recolnatControlMenu.addTo(map);

            // This is workaround to make recolnat control menu appear on first palace
            if (this.editControlFirst) {
                this.editControlFirst.leafletElement.remove();
                if (this.state.enableToolBox)
                    this.editControlFirst.leafletElement.addTo(map);
            }
        }
    };

    _onDrawStart = (e) => {
        console.log("Draw start", e)
        this.props.onDrawStart(e);
        const drawnLayers = this.featureGroup.leafletElement;
        drawnLayers.eachLayer((layer) => {
            layer.unbindContextMenu();
        });
    };

    _onDrawStop = (e) => {
        if (!this.featureGroup)
            return;
        this.props.onDrawStop(e);
        const drawnLayers = this.featureGroup.leafletElement;
        //Return back context menu
        drawnLayers.eachLayer((layer) => {
            layer.bindContextMenu(contextMenu);
        });
    };

    _mapZoomOrMoveEvent = () => {
        const map = this.leafletMap.leafletElement;
        if (this.props.leafletPositionByPicture.hasOwnProperty(this.props.currentPicture.sha1)) {
            this.props.leafletPositionByPicture[this.props.currentPicture.sha1].bounds = map.getBounds();
        } else {
            this.props.leafletPositionByPicture[this.props.currentPicture.sha1] = {bounds: map.getBounds()};
        }
    };

    _setMapRef = (_) => {
        this.leafletMap = _;
        if (_)
            lpd.resolve(_);
    };

    _setGroupRef = (_) => {
        this.featureGroup = _;
        if (_)
            fgd.resolve(_);
    };

    _onMounted = (e) => {
        console.log(e)
    };

    _onCreated = (e) => {
        if (!this.props.calibrationMode) {
            e.layer.bindContextMenu(contextMenu);
        }
        this.props.onCreated(e);
        ee.emit(EVENT_HIGHLIGHT_ANNOTATION, e.layer.annotationId , true);
        this.highlightAnnotation({
            annotationId: e.layer.annotationId,
            annotationType: e.layer.annotationType
        })
        e.layer.on('click', this._emitEvent);
    };

    /**
     * Remove map layers.
     * @private
     */
    _clearMap = () => {
        this.leafletMap.leafletElement.off('mousemove');
        this.leafletMap.leafletElement.off('click');
        this.leafletMap.leafletElement.off('contextmenu.show');
        this.leafletMap.leafletElement.off('zoomend', this._mapZoomOrMoveEvent, this);
        this.leafletMap.leafletElement.off('moveend', this._mapZoomOrMoveEvent, this);
        if (this._recolnatPrint) {
            this._recolnatPrint.remove();
        }
        if (this._recolnatZoiExport) {
            this._recolnatZoiExport.remove();
        }
        if (this._recolnatControlMenu) {
            this._recolnatControlMenu.remove();
        }
        this._imageOverlay.remove();
        this._miniMap.remove();
        this._zoomControl.remove();
        this._fitToView.remove();
        const drawnLayers = this.featureGroup.leafletElement;
        drawnLayers.eachLayer((layer) => {
            layer.off('click');
            drawnLayers.removeLayer(layer);
        });
    };

    _resolveColor = (id, options) => {
        if (this.props.taxonomyInstance &&
            'taxonomyByAnnotation' in this.props.taxonomyInstance && this.props.taxonomyInstance.taxonomyByAnnotation[id]) {
            options.color = this.props.targetColors[this.props.taxonomyInstance.taxonomyByAnnotation[id].descriptorId];
            console.log("New color ", options.color)
        }
    };

    /**
     * Draw existing annotations on leaflet.
     * @private
     */
    _drawAnnotations = () => {
        // console.log("_drawAnnotations")
        const map = this.leafletMap.leafletElement;
        const featureGroup = this.featureGroup.leafletElement;

        if (this.props.annotationsPointsOfInterest) {
            this.props.annotationsPointsOfInterest.map(point => {
                const latLng = map.unproject(new L.Point(point.x, point.y), this.boundsZoomLevel);

                const options = {
                    ...MARKER_OPTIONS, ...contextMenu
                };
                this._resolveColor(point.id, options);

                const layer = L.marker(latLng, options);
                layer.annotationId = point.id;
                layer.annotationType = point.annotationType;
                featureGroup.addLayer(layer);
                layer.bindTooltip(point.title, {
                    permanent: true,
                    opacity: 0.7,
                    direction: 'right',
                    className: 'poi-tooltip',
                    offset: L.point(-20, -30)
                }).openTooltip();
                layer.on('click', this._emitEvent);
            });
        }

        if (this.props.annotationsMeasuresLinear) {
            this.props.annotationsMeasuresLinear.map(polyline => {
                const latLngs = polyline.vertices.map(vertex => {
                    return map.unproject(new L.Point(vertex.x, vertex.y), this.boundsZoomLevel);
                });

                const options = {...POLYLINE_OPTIONS.shapeOptions, ...contextMenu};
                this._resolveColor(polyline.id, options);
                const layer = L.polyline(latLngs, options);
                layer.annotationId = polyline.id;
                layer.annotationType = polyline.annotationType;
                featureGroup.addLayer(layer);
                layer.on('click', this._emitEvent);
            });
        }

        if (this.props.annotationsRectangular) {
            this.props.annotationsRectangular.map(rectangle => {
                const first = rectangle.vertices[0];
                const third = rectangle.vertices[2];
                const startLatLng = map.unproject(L.point(first.x, first.y), this.boundsZoomLevel);
                const endLatLng = map.unproject(L.point(third.x, third.y), this.boundsZoomLevel);

                const options = {...RECTANGLE_OPTIONS.shapeOptions, ...contextMenu};
                this._resolveColor(rectangle.id, options);

                const layer = L.rectangle(new L.LatLngBounds(startLatLng, endLatLng), options);
                layer.annotationId = rectangle.id;
                layer.annotationType = rectangle.annotationType;
                featureGroup.addLayer(layer);
                layer.bindTooltip(rectangle.title, {
                    permanent: true,
                    opacity: 1,
                    direction: 'center',
                    className: 'zoi-tooltip'
                }).openTooltip();
                layer.on('click', this._emitEvent);
            });
        }

        if (this.props.annotationsPolygon) {
            this.props.annotationsPolygon.map(polygon => {
                const latLngs = [];
                polygon.vertices.map(vertex => {
                    latLngs.push(map.unproject(L.point(vertex.x, vertex.y), this.boundsZoomLevel));
                });

                const options = {...POLYGON_OPTIONS.shapeOptions, ...contextMenu};
                this._resolveColor(polygon.id, options);

                const layer = L.polygon(latLngs, options);
                layer.annotationId = polygon.id;
                layer.annotationType = polygon.annotationType;
                featureGroup.addLayer(layer);
                layer.on('click', this._emitEvent);
            });
        }

        if (this.props.annotationsAngle) {
            this.props.annotationsAngle.map(angle => {
                const latLngs = [];
                angle.vertices.map(vertex => {
                    latLngs.push(map.unproject(L.point(vertex.x, vertex.y), this.boundsZoomLevel));
                });

                const options = {...ANGLE_OPTIONS.shapeOptions, ...contextMenu};
                this._resolveColor(angle.id, options);

                const layer = L.polyline(latLngs, options);
                layer.annotationId = angle.id;
                layer.annotationType = angle.annotationType;
                featureGroup.addLayer(layer);
                layer.on('click', this._emitEvent);
            });
        }

        if (this.props.annotationsColorPicker) {
            this.props.annotationsColorPicker.map(point => {
                const latLng = map.unproject(new L.Point(point.x, point.y), this.boundsZoomLevel);

                const options = {
                    ...COLORPICKER_OPTIONS, ...contextMenu
                };
                this._resolveColor(point.id, options);

                const layer = L.marker(latLng, options);
                layer.annotationId = point.id;
                layer.annotationType = point.annotationType;
                featureGroup.addLayer(layer);
                layer.on('click', this._emitEvent);
            });
        }

        if (this.props.annotationsOccurrence) {
            this.props.annotationsOccurrence.map(occurrence => {
                const latLngs = [];
                occurrence.vertices.map(vertex => {
                    latLngs.push(map.unproject(L.point(vertex.x, vertex.y), this.boundsZoomLevel));
                });
                const options = {...ANGLE_OPTIONS.shapeOptions, ...contextMenu};
                const layer = L.occurrence(latLngs, options);
                layer.annotationId = occurrence.id;
                layer.annotationType = occurrence.annotationType;
                featureGroup.addLayer(layer);
                layer.on('click', this._emitEvent);
            });
        }

        if (this.props.annotationsTranscription) {
            this.props.annotationsTranscription.map(transcription => {
                const first = transcription.vertices[0];
                const third = transcription.vertices[2];
                const startLatLng = map.unproject(L.point(first.x, first.y), this.boundsZoomLevel);
                const endLatLng = map.unproject(L.point(third.x, third.y), this.boundsZoomLevel);

                const options = {...TRANSCRIPTION_OPTIONS.shapeOptions, ...contextMenu};
                this._resolveColor(transcription.id, options);

                const layer = L.transcription(new L.LatLngBounds(startLatLng, endLatLng), options);
                layer.annotationId = transcription.id;
                layer.annotationType = transcription.annotationType;
                featureGroup.addLayer(layer);
                layer.on('click', this._emitEvent);
            });
        }

        if (this.props.annotationsRichtext) {
            this.props.annotationsRichtext.map(richtext => {
                const first = richtext.vertices[0];
                const third = richtext.vertices[2];
                const startLatLng = map.unproject(L.point(first.x, first.y), this.boundsZoomLevel);
                const endLatLng = map.unproject(L.point(third.x, third.y), this.boundsZoomLevel);

                const options = {...RICHTEXT_OPTIONS.shapeOptions, ...contextMenu};
                this._resolveColor(richtext.id, options);

                const layer = L.richtext(new L.LatLngBounds(startLatLng, endLatLng), options);
                layer.annotationId = richtext.id;
                layer.annotationType = richtext.annotationType;
                featureGroup.addLayer(layer);
                layer.setText(richtext.value);
                layer.on('click', this._emitEvent);
            });
        }
    };

    /**
     * Emit EVENT_HIGHLIGHT_ANNOTATION event with annotation id.
     * @private
     * @param event
     */
    _emitEvent = (event) => {
        ee.emit(EVENT_HIGHLIGHT_ANNOTATION, event.sourceTarget.annotationId , true);
        this.highlightAnnotation({
            annotationId: event.sourceTarget.annotationId,
            annotationType: event.sourceTarget.annotationType
        });
    }

    /**
     * Handle edit annotation context menu event.
     * @private
     */
    _editAnnotationEvent = () => {
        this.editControlFirst.leafletElement.remove();
        this._recolnatControlMenu.remove();
        this._recolnatPrint.remove();
        this._recolnatZoiExport.remove()
        this.props.onContextMenuEvent(selectedAnnotation.annotationId, selectedAnnotation.annotationType, EDIT_EVENT);
        selectedAnnotation = null;
    };

    /**
     * Handle delete annotation context menu event.
     * @private
     */
    _deleteAnnotationEvent = () => {
        this.props.onContextMenuEvent(selectedAnnotation.annotationId, selectedAnnotation.annotationType, DELETE_EVENT);
        selectedAnnotation = null;
    };

    getContainerPoint = (point) => {
        const map = this.leafletMap.leafletElement;
        const latLng = map.unproject(point, this.boundsZoomLevel);
        return this.leafletMap.leafletElement.latLngToContainerPoint(latLng);
    };

    /**
     * Convert leaflet lat long coordinates to value in pixels.
     * @param latLng
     * @returns {{x: number, y: number}}
     */
    getRealCoordinates = (latLng) => {
        const map = this.leafletMap.leafletElement;
        const point = map.project(latLng, this.boundsZoomLevel);
        return {x: Math.abs(point.x), y: Math.abs(point.y)};
    };

    /**
     * Open selected annotation in edit mode.
     * @param annotation
     */
    editAnnotation = (annotation) => {
        this.showHideToolbar(false);
        const drawnLayers = this.featureGroup.leafletElement;
        const featureGroupEdit = this.featureGroupEdit.leafletElement;
        drawnLayers.eachLayer((layer) => {
            layer.unbindContextMenu();
            if (layer.annotationId === annotation.id) {
                drawnLayers.removeLayer(layer);
                featureGroupEdit.addLayer(layer);
            }
        });

        const control = new L.EditToolbar.Edit(this.leafletMap.leafletElement, {
            featureGroup: featureGroupEdit,
            selectedPathOptions: EDIT_ANNOTATION_OPTIONS
        });
        control.enable();

        this.setState({
            control: control
        });
    };

    /**
     * Stop/Save editing annotation.
     * @param save
     * @returns {*}
     */
    saveOrCancelEdit = (save) => {
        save ? this.state.control.save() : this.state.control.revertLayers();
        this.state.control.disable();
        this.setState({
            control: null
        });

        let editedLayer = null;
        const drawnLayers = this.featureGroup.leafletElement;
        const featureGroupEdit = this.featureGroupEdit.leafletElement;
        featureGroupEdit.eachLayer((layer) => {
            editedLayer = layer;
            featureGroupEdit.removeLayer(layer);
            drawnLayers.addLayer(layer);
        });

        //Return back context menu
        drawnLayers.eachLayer((layer) => {
            layer.bindContextMenu(contextMenu);
        });

        this._recolnatControlMenu.addTo(this.leafletMap.leafletElement);
        this.editControlFirst.leafletElement.addTo(this.leafletMap.leafletElement);
        this._recolnatPrint.addTo(this.leafletMap.leafletElement);
        this._recolnatZoiExport.addTo(this.leafletMap.leafletElement);
        return editedLayer;
    };

    /**
     * Delete annotation with ID
     * @param id
     */
    deleteAnnotation = (id) => {
        const drawnLayers = this.featureGroup.leafletElement;
        drawnLayers.eachLayer((layer) => {
            if (layer.annotationId === id) {
                drawnLayers.removeLayer(layer);
                layer = null;
            }
        });
    };

    highlightAnnotation = (annotation) => {
        const annotationId = annotation.annotationId;
        //Skip if same annotation is already focused.
        if ((this.focusedAnnotation && this.focusedAnnotation.annotationId === annotationId) ||
            this.ratioFocused === annotationId)
            return;

        this.ratioFocused = '';
        //Revert back original style of previous focused annotation.
        if (this.focusedAnnotations) {
            this.focusedAnnotations.map(_ => {
                _.layer.setStyle({color: _.color});
            });
        }
        if (this.focusedAnnotation) {
            if (this.focusedAnnotation.annotationType !== 'marker' &&
                this.focusedAnnotation.annotationType !== 'colorPicker')
                this.focusedAnnotation.setStyle({color: this.focusedStyle});
            else if (this.focusedAnnotation._icon) {
                this.focusedAnnotation._icon.style.border = '';
            }
        }

        this.focusedAnnotations = [];
        if(this.featureGroup) {
            const drawnLayers = this.featureGroup.leafletElement;
            drawnLayers.eachLayer((layer) => {
                if (layer.annotationId === annotationId) {
                    this.focusedAnnotation = layer;
                    if (layer.annotationType !== 'marker' && layer.annotationType !== 'colorPicker') {
                        this.focusedStyle = layer.options.color;
                        layer.setStyle(HIGHLIGHT_OPTIONS);
                    } else {
                        layer._icon.style.border = '1px solid #fffd1e';
                        layer._icon.style.borderRadius = '50%';
                    }
                } else if (annotation.annotationType === 'ratio') {
                    if (layer.annotationId === annotation.ratioLine1 ||
                        layer.annotationId === annotation.ratioLine2) {
                        this.ratioFocused = annotationId;
                        this.focusedAnnotation = null;
                        //Add annotations into array to be able to revert color later.
                        this.focusedAnnotations.push({layer: layer, color: layer.options.color});
                        layer.setStyle(HIGHLIGHT_OPTIONS);
                    }
                }
            });
        }
    };

    setAnnotationColor = (annotationId, color) => {
        const drawnLayers = this.featureGroup.leafletElement;
        drawnLayers.eachLayer((layer) => {
            if (layer.annotationId === annotationId) {
                if (color === "-1") {
                    //annotationType
                    switch (layer.annotationType) {
                        case ANNOTATION_SIMPLELINE:
                            this.focusedStyle = SIMPLELINE_OPTIONS.shapeOptions.color;
                            break;
                        case ANNOTATION_POLYLINE:
                            this.focusedStyle = POLYLINE_OPTIONS.shapeOptions.color;
                            break;
                        case ANNOTATION_RECTANGLE:
                            this.focusedStyle = RECTANGLE_OPTIONS.shapeOptions.color;
                            break;
                        case ANNOTATION_POLYGON:
                            this.focusedStyle = POLYGON_OPTIONS.shapeOptions.color;
                            break;
                        case ANNOTATION_ANGLE:
                            this.focusedStyle = ANGLE_OPTIONS.shapeOptions.color;
                            break;
                        case ANNOTATION_COLORPICKER:
                            this.focusedStyle = COLORPICKER_OPTIONS.color;
                            break;
                        case ANNOTATION_MARKER:
                            this.focusedStyle = MARKER_OPTIONS.color;
                            break;
                        case ANNOTATION_TRANSCRIPTION:
                            this.focusedStyle = TRANSCRIPTION_OPTIONS.color;
                            break;
                        case ANNOTATION_RICHTEXT:
                            this.focusedStyle = RICHTEXT_OPTIONS.color;
                            break;
                    }
                } else {
                    this.focusedStyle = color;
                }
                if (layer.setStyle)
                    layer.setStyle({color: this.focusedStyle});
            }
        });
    };

    getCalibrationAxis = () => {
        let axis = [];
        const drawnLayers = this.featureGroup.leafletElement;
        drawnLayers.eachLayer((layer) => {
            if (layer.annotationId === 'X' || layer.annotationId === 'Y') {
                axis.push(layer.annotationId);
            }
        });
        return axis;
    };

    showHideToolbar = (show) => {
        if (show) {
            if(this.state.enableToolBox)
                this._recolnatControlMenu.addTo(this.leafletMap.leafletElement)
            this.editControlFirst.leafletElement.addTo(this.leafletMap.leafletElement)
            this._recolnatPrint.addTo(this.leafletMap.leafletElement);
            this._recolnatZoiExport.addTo(this.leafletMap.leafletElement);
        } else {
            this.editControlFirst.leafletElement.remove();
            this._recolnatControlMenu.remove();
            this._recolnatPrint.remove();
            this._recolnatZoiExport.remove();
        }
    };

    updateAnnotation = (id, text) => {
        const drawnLayers = this.featureGroup.leafletElement;
        drawnLayers.eachLayer((layer) => {
            if (layer.annotationId === id) {
                layer.setTooltipContent(text);
            }
        });
    };

    _setRepeatMode = (doRepeat) => {
        this.props.onDrawStop();

        SIMPLELINE_OPTIONS.repeatMode = doRepeat;
        POLYLINE_OPTIONS.repeatMode = doRepeat;
        RECTANGLE_OPTIONS.repeatMode = doRepeat;
        POLYGON_OPTIONS.repeatMode = doRepeat;
        ANGLE_OPTIONS.repeatMode = doRepeat;
        COLORPICKER_OPTIONS.repeatMode = doRepeat;
        MARKER_OPTIONS.repeatMode = doRepeat;
        TRANSCRIPTION_OPTIONS.repeatMode = doRepeat;
        RICHTEXT_OPTIONS.repeatMode = doRepeat;

        this.props.saveLeafletSettings(doRepeat);

        this.forceUpdate();
    }

    enableToolBox = (enable) => {
        console.log('Enable toolbox ', enable)
        SIMPLELINE_OPTIONS.repeatMode = enable && this.props.repeatMode
        this.setState({
            enableToolBox: enable
        })
    }
}

export default LeafletImage;
