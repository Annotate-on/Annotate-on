import i18next from "i18next";
import styled from "styled-components";
import MOZAIC from "./pictures/mozaic_icon.svg";
import LIST from "./pictures/list_icon.svg";
import classnames from "classnames";
import MAP_WHITE from "./pictures/map-regular-white.svg";
import React, {Component} from 'react';
import LeafletMap from "./LeafletMap";
import Map from "./Map";
import {NAV_SIZE} from "../constants/constants";
import MozaicPlayer from "./MozaicPlayer";
import {MARGIN as INSPECTOR_MARGIN, WIDTH as INSPECTOR_WIDTH} from "./Inspector";
import Inspector from "../containers/Inspector";

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
            sortDirection: props.sortDirection
        }
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
                        <LeafletMap></LeafletMap>
                        {/*<Map></Map>*/}
                    {/*</_MapPlaceholder>*/}
                </_Panel>

            </_Root>
        );
    }

}
