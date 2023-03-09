import {push} from "connected-react-router";
import {ee, EVENT_SELECT_TAB} from "../utils/library";
import {withTranslation} from "react-i18next";
import {connect} from "react-redux";
import Search from "../components/Search";

const mapStateToProps = state => {
    return {
        selectedTaxonomy: state.app.selectedTaxonomy,
        projectName: state.app.selectedProjectName
    };
};

const mapDispatchToProps = dispatch => {
    return {
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Search));
