import {connect} from "react-redux";
import {
    selectLibraryTab,
} from "../actions/app";
import { withTranslation } from 'react-i18next';
import LibraryTabs from "../components/LibraryTabs";


const mapStateToProps = (state, ownProps) => {
    return {
        // this.props.openTabs[this.props.tabName].view = path.tab;
        selectedTab: state.app.open_tabs[ownProps.tabName].view,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        setSelectedLibraryTab: (tab, libraryTab) => {
            dispatch(selectLibraryTab(tab, libraryTab))
        },
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(LibraryTabs));
