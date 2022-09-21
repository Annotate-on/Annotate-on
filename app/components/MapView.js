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
                    resourcesWithoutGeoLocation.push(location);
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
                resourcesWithoutGeoLocation.push(location);
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
                               onClick={() => {
                                   ee.emit(EVENT_OPEN_TAB, 'library')
                               }}
                            />
                            </div>
                            <div>
                            <span>{t('library.map-view.number_of_selected_resources', {count:this.state.selectedResources.length})}</span>
                            <i className="fa fa-external-link" aria-hidden="true" title={"Open in new selection"}
                               onClick={() => {
                                   ee.emit(EVENT_OPEN_TAB, 'library')
                               }}
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
