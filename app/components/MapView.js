import i18next from "i18next";
import styled from "styled-components";
import MOZAIC from "./pictures/mozaic_icon.svg";
import LIST from "./pictures/list_icon.svg";
import classnames from "classnames";
import MAP_WHITE from "./pictures/map-location-dot-solid-white.svg";
import React, {Component} from 'react';
import LeafletMap from "./LeafletMap";
import {
    ee,
    EVENT_SELECT_TAB,
    EVENT_HIGHLIGHT_ANNOTATION,
    EVENT_HIGHLIGHT_ANNOTATION_ON_LEAFLET
} from "../utils/library";
import _ from "lodash";
import {createNewTag, getMapSelectionCategory} from "./tags/tagUtils";
import {
    TAG_MAP_SELECTION,
    MARKER_TYPE_METADATA,
    MARKER_TYPE_ANNOTATION
} from "../constants/constants";
import Chance from "chance";
import {getDecimalLocation, getNewTabName, validateLocationInput} from "./event/utils";
import TIMELINE from "./pictures/clock-regular.svg";
const chance = new Chance();

const _Root = styled.div`
  width: 100%;
  height: 100%;
`;

const _Panel = styled.div`
  height: 100%;
  overflow: scroll;
  box-shadow: inset 0 -0.5px 0 0 #dddddd, inset 0.5px 0 0 0 #dddddd;
  ::-webkit-scrollbar {
      width: 0;
      background: transparent;
    }
`;

const _MapPlaceholder = styled.div`
    width: 100%;
    height: calc(100% - 40px);
    position: relative;
`;

const _DockedPanel = styled.div`
    position: absolute;
    display: flex;
    z-index: 1000;
`;

export default class MapView extends Component {

    constructor(props) {
        super(props);
        this.state = {
            resourcesWithGeoLocation: [],
            resourcesWithoutGeoLocation: [],
            selectedResources: []
        }
    }

    componentDidMount() {
        this._doFindLocations();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.resources !== prevProps.resources) {
            this._doFindLocations();
        }
    }

    _doFindLocations = () => {
        let resourcesWithGeoLocation = [];
        let resourcesWithoutGeoLocation = [];

        for (const resource of this.props.resources) {
            const annotations = this._mergeAnnotations(this.props, resource.sha1)
            let locationsFromAnnotations = [];
            if(annotations) {
                annotations.filter(annotation => {
                    if(annotation.coverage && annotation.coverage.spatial ) {
                        let latLng = getDecimalLocation(`${annotation.coverage.spatial.location.latitude},${annotation.coverage.spatial.location.longitude}`)
                        if(latLng) {
                            const location = {
                                type: MARKER_TYPE_ANNOTATION,
                                latLng : latLng,
                                resource : resource,
                                annotation: annotation,
                                current: resource.sha1 === this.props.currentPictureSelection.sha1
                            };
                            locationsFromAnnotations.push(location);
                        }
                    }
                });
            }
            let locationFromMetadata;
            if(resource.exifPlace) {
                const valid = validateLocationInput(resource.exifPlace);
                if(valid) {
                    locationFromMetadata = {
                        type: MARKER_TYPE_METADATA,
                        latLng : getDecimalLocation(resource.exifPlace),
                        resource : resource,
                        current: resource.sha1 === this.props.currentPictureSelection.sha1
                    };
                }
            } else if(resource.erecolnatMetadata && resource.erecolnatMetadata.decimallatitude && resource.erecolnatMetadata.decimallongitude) {
                locationFromMetadata = {
                    type: MARKER_TYPE_METADATA,
                    latLng : [+resource.erecolnatMetadata.decimallatitude, +resource.erecolnatMetadata.decimallongitude],
                    resource : resource,
                    current: resource.sha1 === this.props.currentPictureSelection.sha1
                };
            }
            if (!locationFromMetadata && !locationsFromAnnotations) {
                resourcesWithoutGeoLocation.push(resource);
            } else {
                if(locationFromMetadata) {
                    resourcesWithGeoLocation.push(locationFromMetadata)
                }
                if(locationsFromAnnotations) {
                    resourcesWithGeoLocation.push(...locationsFromAnnotations)
                }
            }
        }
        const newSelection = _.intersection(resourcesWithGeoLocation.map(e => {
            return e.resource.sha1;
        }), this.state.selectedResources);

        this.setState({
            resourcesWithGeoLocation: resourcesWithGeoLocation,
            resourcesWithoutGeoLocation: resourcesWithoutGeoLocation,
            selectedResources: newSelection
        })
    }

    _mergeAnnotations = (props, resourceId) => {
        return [
            ...(props.annotationsChronothematique && props.annotationsChronothematique[resourceId] || []),
            ...(props.eventAnnotations && props.eventAnnotations[resourceId] || []),
            ...(props.annotationsPointsOfInterest && props.annotationsPointsOfInterest[resourceId] || []),
            ...(props.annotationsMeasuresLinear && props.annotationsMeasuresLinear[resourceId] || []),
            ...(props.annotationsRectangular && props.annotationsRectangular[resourceId] || []),
            ...(props.annotationsPolygon && props.annotationsPolygon[resourceId] || []),
            ...(props.annotationsAngle && props.annotationsAngle[resourceId] || []),
            ...(props.annotationsOccurrence && props.annotationsOccurrence[resourceId] || []),
            ...(props.annotationsColorPicker && props.annotationsColorPicker[resourceId] || []),
            ...(props.annotationsRatio && props.annotationsRatio[resourceId] || []),
            ...(props.annotationsTranscription && props.annotationsTranscription[resourceId] || []),
            ...(props.annotationsCategorical && props.annotationsCategorical[resourceId] || []),
            ...(props.annotationsCircleOfInterest && props.annotationsCircleOfInterest[resourceId] || []),
            ...(props.annotationsRichtext && props.annotationsRichtext[resourceId] || [])
        ];
    };

    _onOpenResource = (picId, annotation) => {
        console.log("_onOpenResource", picId, annotation, this.props.tabName)
        this.props.setPictureInSelection(picId, this.props.tabName);
        setTimeout(() => {
            ee.emit(EVENT_SELECT_TAB, 'image');
        }, 100)
        if(annotation) {
            setTimeout(() => {
                ee.emit(EVENT_HIGHLIGHT_ANNOTATION, annotation.id , true);
                ee.emit(EVENT_HIGHLIGHT_ANNOTATION_ON_LEAFLET, annotation.id, annotation.annotationType);
            }, 100)
        }
    }

    _onSelectResource = (resourceId) => {
        let newSelection;
        if(!this.state.selectedResources.includes(resourceId)) {
            newSelection = [...this.state.selectedResources, resourceId]
        } else {
            newSelection = this.state.selectedResources.filter(e => {
                return e !== resourceId;
            });
        }
        this.setState({
            selectedResources: newSelection
        })
    }

    _onSelectResources = (resourcesId) => {
        let filteredSelection;
        filteredSelection = this.state.selectedResources.filter(e => {
            return !resourcesId.includes(e);
        });
        let newSelection = [...filteredSelection];
        for (const resourceId of resourcesId) {
            if(!this.state.selectedResources.includes(resourceId) && !newSelection.includes(resourceId)) {
                newSelection.push(resourceId);
            }
        }
        this.setState({
            selectedResources: newSelection
        })
    }

    _onOpenNewTabSelection = () => {
        if(!this.state.selectedResources.length) {
            console.log('selection is empty');
            return;
        }
        this._doOpenResourcesInNewTab(this.state.selectedResources);
    }

    _onOpenNewTabWithoutGeolocation = () => {
        if(!this.state.resourcesWithoutGeoLocation.length) {
            console.log('selection is empty');
            return;
        }
        let resourceIds = this.state.resourcesWithoutGeoLocation.map(value => value.sha1);
        this._doOpenResourcesInNewTab(resourceIds);
    }

    _doOpenResourcesInNewTab = (resources) => {
        console.log('openResourcesInNewTab', resources);
        if(!resources.length) {
            console.log('selection is empty');
            return;
        }
        const newTag = getNewTabName(this.props.openTabs);
        const mapSelectionCategory = getMapSelectionCategory(this.props.tags);
        this.props.addSubCategory(TAG_MAP_SELECTION, createNewTag(chance.guid() , newTag), false , mapSelectionCategory.id);
        for (const resource of resources) {
            this.props.tagPicture(resource, newTag);
        }
        setTimeout(() => {
            this.props.openInNewTab(newTag);
        }, 100);
    }

    render() {
        const { t } = i18next;
        return (
            <_Root>
                <div className="lib-actions">
                    <div className="switch-view">
                        <div title={t('library.switch_to_mozaic_view_tooltip')} className="mozaic-view"
                             onClick={this.props.openMozaicView}>
                            <img alt="mozaic view" src={MOZAIC}/>
                        </div>
                        <div title={t('library.mozaic_view.switch_to_list_view_tooltip')} className="list-view"
                             onClick={this.props.openListView}>
                            <img alt="list view" src={LIST}/>
                        </div>
                        <div
                            className={classnames("map-view", "selected-view")}>
                            <img alt="map view" src={MAP_WHITE}/>
                        </div>
                        <div title={t('library.switch_to_timeline_view_tooltip')} className="timeline-view"
                             onClick={this.props.openTimelineView}>
                            <img alt="list view" src={TIMELINE}/>
                        </div>
                    </div>
                </div>

                <_Panel>
                    <_MapPlaceholder>
                        <_DockedPanel className = "map-docked-panel">
                            <div>
                            <span>{t('library.map-view.number_of_resources_without_geolocation', {count:this.state.resourcesWithoutGeoLocation.length})}</span>
                            <i className="fa fa-external-link" aria-hidden="true" title={"Open in new selection"}
                               onClick={this._onOpenNewTabWithoutGeolocation}                            />
                            </div>
                            <div>
                            <span>{t('library.map-view.number_of_selected_resources', {count:this.state.selectedResources.length})}</span>
                            <i className="fa fa-external-link" aria-hidden="true" title={"Open in new selection"}
                               onClick={this._onOpenNewTabSelection}
                            />
                            </div>
                        </_DockedPanel>
                        <LeafletMap locations={this.state.resourcesWithGeoLocation}
                                    fitToBounds = {this.props.fitToBounds}
                                    selectedResources = {this.state.selectedResources}
                                    onOpenResource={this._onOpenResource}
                                    onSelectResource={this._onSelectResource}
                                    onSelectResources={this._onSelectResources}
                        >
                        </LeafletMap>
                    </_MapPlaceholder>
                </_Panel>
            </_Root>
        );
    }
}
