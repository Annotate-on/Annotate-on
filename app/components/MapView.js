import i18next from "i18next";
import styled from "styled-components";
import MOZAIC from "./pictures/mozaic_icon.svg";
import LIST from "./pictures/list_icon.svg";
import classnames from "classnames";
import MAP_WHITE from "./pictures/map-location-dot-solid-white.svg";
import React, {Component} from 'react';
import LeafletMap from "./LeafletMap";
import {ee, EVENT_SELECT_TAB} from "../utils/library";

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
`;

export default class MapView extends Component {

    constructor(props) {
        super(props);
        this.state = {
            locations : []
        }
    }

    componentDidMount() {
        console.log('componentDidMount :')
        console.log(this.props)
        this._doFindLocations();
    }

    componentDidUpdate(prevProps, prevState) {
        console.log('componentDidUpdate prev props:')
        console.log(prevProps)
        console.log('componentDidUpdate new props:')
        console.log(this.props)
        console.log('componentDidUpdate state:')
        console.log(prevState)
        if (this.props.pictures !== prevProps.pictures) {
            this._doFindLocations();
        }
    }

    _doFindLocations = () => {
        console.log('_doFindLocations')
        console.log('number of pictures ' + this.props.pictures.length);

        let locations = [];
        for (const pic of this.props.pictures) {
            if(pic.exifPlace) {
                const exifPlaceArr = pic.exifPlace.split(',');
                if(!exifPlaceArr && exifPlaceArr.length != 2) {
                    console.log('wrong format of exifPlace');
                } else {
                    const location = {
                        latLng : [+exifPlaceArr[0], +exifPlaceArr[1]],
                        picture : pic
                    };
                    locations.push(location);
                }
            }
            if(pic.erecolnatMetadata && pic.erecolnatMetadata.decimallatitude && pic.erecolnatMetadata.decimallongitude) {
                const location = {
                    latLng : [+pic.erecolnatMetadata.decimallatitude, +pic.erecolnatMetadata.decimallongitude],
                    picture : pic
                };
                locations.push(location);
            }
        }
        console.log('_doFindLocations found locations =>')
        console.log(locations)
        // this.locations = locations;
        this.setState({
            locations: locations
        })
    }

    _onSelection = (picId) => {
        this.props.setPictureInSelection(picId, this.props.tabName);
        ee.emit(EVENT_SELECT_TAB, 'image')
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
                    {/*<_MapPlaceholder>*/}
                        <LeafletMap locations={this.state.locations} onSelection={this._onSelection}></LeafletMap>
                        {/*<Map></Map>*/}
                    {/*</_MapPlaceholder>*/}
                </_Panel>

            </_Root>
        );
    }

}
