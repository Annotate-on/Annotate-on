import React from 'react';
import {connect} from 'react-redux';
import {push} from "connected-react-router";
import {ee, EVENT_SELECT_TAB} from "../utils/library";
import {withTranslation} from "react-i18next";
import MapView from "../components/MapView";
import {setPictureInSelection} from "../actions/app";

const mapStateToProps = state => {
    return {};
};

const mapDispatchToProps = dispatch => {
    return {
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        },
        setPictureInSelection: (pictureId, tabName) => {
            dispatch(setPictureInSelection(pictureId, tabName));
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(MapView));
