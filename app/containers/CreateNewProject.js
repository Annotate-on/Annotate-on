import React from 'react';
import {connect} from 'react-redux';
import {push} from 'connected-react-router';
import Component from '../components/CreateNewProject';
import {setNewState} from "../actions/app";
import {ee, EVENT_SELECT_TAB} from "../utils/library";

const mapStateToProps = state => {
    return {
        appState: state.app,
        counter: state.app.counter,
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
        setNewState: (app) => {
            dispatch(setNewState(app));
        },
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps, null, {pure: false})(Component);


