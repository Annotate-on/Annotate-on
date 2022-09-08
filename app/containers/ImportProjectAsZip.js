import React from 'react';
import {connect} from 'react-redux';
import {push} from 'connected-react-router';
import Component from '../components/ImportProjectAsZip';
import {flatOldTags, setNewState} from "../actions/app";
import {ee, EVENT_SELECT_TAB} from "../utils/library";
import {withTranslation} from "react-i18next";

const mapStateToProps = state => {
    return {
        counter: state.app.counter,
        appState: state.app,
        selectedMenu: state.app.selected_menu
    };
};

const mapDispatchToProps = dispatch => {
    return {
        goToLoading: () => {
            dispatch(push('/loading'));
        },
        goToSettings: () => {
            dispatch(push('/settings'));
        },
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        },
        setNewState: (app) => {
            dispatch(setNewState(app));
        },
        flatOldTags: () => {
            dispatch(flatOldTags());
        },
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps, null, {pure: false})(Component));
