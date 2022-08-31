import {connect} from 'react-redux';
import {push} from "connected-react-router";
import Component from '../components/Settings';
import {ee, EVENT_SELECT_TAB} from "../utils/library";
import {flatOldTags, setNewState} from "../actions/app";
import {withTranslation} from "react-i18next";

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
        goToAddNewProject: () => {
            dispatch(push('/add-project'));
        },
        goToImportExistingProject: () => {
            dispatch(push('/import-existing-project'));
        },
        goToZipImport: () => {
            dispatch(push('/import-project-as-zip'));
        },
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
        flatOldTags: () => {
            dispatch(flatOldTags());
        },
        setNewState: (app) => {
            dispatch(setNewState(app));
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
