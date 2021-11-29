import {connect} from 'react-redux';
import {push} from "connected-react-router";
import Component from '../components/SwitchProject';
import {ee, EVENT_SELECT_TAB} from "../utils/library";
import {setNewState} from "../actions/app";

const mapStateToProps = state => {
    return {
        appState: state.app,
        counter: state.app.counter,
        selectedMenu: state.app.selected_menu,
        projectName: state.app.selectedProjectName
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
        goToHome: () => {
            dispatch(push('/import'));
        },
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        },
        setNewState: (app) => {
            dispatch(setNewState(app));
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Component);
