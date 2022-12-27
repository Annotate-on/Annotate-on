import {connect} from 'react-redux';
import PureComponent from '../components/Folders';
import {
    moveFolder,
    prepareFolderForDeletion,
    renameFolder,
    selectFolder,
    unselectAllFolders,
    unselectFolder
} from '../actions/app';
import {push} from "connected-react-router";
import {ee, EVENT_HIDE_WAITING, EVENT_SHOW_WAITING} from "../utils/library";
import {withTranslation} from "react-i18next";

const mapStateToProps = (state, ownProps) => {
    return {
        tabData: state.app.open_tabs,
        tab: state.app.open_tabs[ownProps.tabName]
    };
};

const mapDispatchToProps = dispatch => {
    return {
        selectFolder: (tab, path) => {
            ee.emit(EVENT_SHOW_WAITING, "Filtering images...");
            dispatch(selectFolder(tab, path));
            ee.emit(EVENT_HIDE_WAITING);
        },
        unselectFolder: (tab, path) => {
            ee.emit(EVENT_SHOW_WAITING, "Filtering images...");
            dispatch(unselectFolder(tab, path));
            ee.emit(EVENT_HIDE_WAITING);
        },
        unselectAllFolders: (tab) => {
            ee.emit(EVENT_SHOW_WAITING, "Filtering images...");
            dispatch(unselectAllFolders(tab));
            ee.emit(EVENT_HIDE_WAITING);
        },
        moveFolder: (moveTo, folder) => {
            ee.emit(EVENT_SHOW_WAITING, "Moving folder...");
            dispatch(moveFolder(moveTo, folder));
            ee.emit(EVENT_HIDE_WAITING);
        },
        renameFolder: (newName, path) => {
            dispatch(renameFolder(newName, path));
        },
        deleteFolder: (path) => {
            dispatch(prepareFolderForDeletion(path));
        },
        goToImport: (selectedFolder) => {
            dispatch(push('/import/' + selectedFolder));
        },
        goToImportWizard: (selectedFolder) => {
            dispatch(push('/importwizard/' + selectedFolder));
        },
        goToImportVideoWizard: (selectedFolder) => {
            dispatch(push('/importVideoWizard/' + selectedFolder));
        },
        goToImportEventWizard: (selectedFolder , tabName) => {
            dispatch(push('/importEventWizard/' + selectedFolder + '/' + tabName));
        },
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(PureComponent));
