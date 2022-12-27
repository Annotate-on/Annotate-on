import {connect} from 'react-redux';
import {push} from "connected-react-router";
import { withTranslation } from 'react-i18next';
import ImportComboBox from "../components/ImportComboBox";

const mapStateToProps = state => {
    return {
        appState: state.app,
        counter: state.app.counter,
        selectedMenu: state.app.selected_menu,
        picturesSize: Object.keys(state.app.pictures).length,
        projectName: state.app.selectedProjectName,
        selectedTaxonomy: state.app.selectedTaxonomy,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        goToImportWizard: (selectedFolder) => {
            dispatch(push('/importwizard/' + selectedFolder));
        },
        goToImportVideoWizard: (selectedFolder) => {
            dispatch(push('/importVideoWizard/' + selectedFolder));
        },
        goToImportEventWizard: (selectedFolder , tabName) => {
            dispatch(push('/importEventWizard/' + selectedFolder));
        },
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(ImportComboBox));
