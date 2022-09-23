import i18next from "i18next";
import styled from "styled-components";
import MOZAIC from "./pictures/mozaic_icon.svg";
import LIST from "./pictures/list_icon.svg";
import classnames from "classnames";
import MAP_WHITE from "./pictures/map-location-dot-solid-white.svg";
import React, {Component} from 'react';
import LeafletMap from "./LeafletMap";
import {ee, EVENT_SELECT_TAB, EVENT_OPEN_TAB} from "../utils/library";
import _ from "lodash";
import {createNewCategory, createNewTag, getMapSelectionCategory, getRootCategoriesNames} from "./tags/tagUtils";
import {TAG_MAP_SELECTION, TAG_AUTO, TAG_DPI_NO} from "../constants/constants";
import Chance from "chance";
import {getNewTabName} from "./event/utils";
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
    height: 100%;
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
            if(resource.exifPlace) {
                const exifPlaceArr = resource.exifPlace.split(',');
                if(!exifPlaceArr && exifPlaceArr.length != 2) {
                    console.log('wrong format of exifPlace');
                    resourcesWithoutGeoLocation.push(resource);
                } else {
                    const location = {
                        latLng : [+exifPlaceArr[0], +exifPlaceArr[1]],
                        resource : resource
                    };
                    resourcesWithGeoLocation.push(location);
                }
            } else if(resource.erecolnatMetadata && resource.erecolnatMetadata.decimallatitude && resource.erecolnatMetadata.decimallongitude) {
                const location = {
                    latLng : [+resource.erecolnatMetadata.decimallatitude, +resource.erecolnatMetadata.decimallongitude],
                    resource : resource
                };
                resourcesWithGeoLocation.push(location);
            } else {
                resourcesWithoutGeoLocation.push(resource);
            }
        }
        const newSelection = _.intersection(resourcesWithGeoLocation.map(e => {
            return e.resource.sha1;
        }), this.state.selectedResources)
        this.setState({
            resourcesWithGeoLocation: resourcesWithGeoLocation,
            resourcesWithoutGeoLocation: resourcesWithoutGeoLocation,
            selectedResources: newSelection
        })
    }

    _onOpenResource = (picId) => {
        this.props.setPictureInSelection(picId, this.props.tabName);
        ee.emit(EVENT_SELECT_TAB, 'image')
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
            if(!this.state.selectedResources.includes(resourceId)) {
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
