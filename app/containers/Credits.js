import {connect} from 'react-redux';
import {push} from "connected-react-router";
import Component from "../components/Credits";
import {ee, EVENT_SELECT_TAB} from "../utils/library";


const mapStateToProps = state => {
    return {
        appState: state.app,
        selectedMenu: state.app.selected_menu,
        projectName: state.app.selectedProjectName
    };
};

const mapDispatchToProps = dispatch => {
    return {
        goToLoading: () => {
            dispatch(push('/credits'));
        },
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Component);