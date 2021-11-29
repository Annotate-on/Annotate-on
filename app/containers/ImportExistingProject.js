import React from 'react';
import {connect} from 'react-redux';
import {push} from 'connected-react-router';
import Component from '../components/ImportExistingProject';
import {flatOldTags, setNewState} from "../actions/app";

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
        goToLibrary: () => {
            dispatch(push('/loading'));
        },
        goToSettings: () => {
            dispatch(push('/settings'));
        },
        setNewState: (app) => {
            dispatch(setNewState(app));
        },
        flatOldTags: () => {
            dispatch(flatOldTags());
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps, null, {pure: false})(Component);