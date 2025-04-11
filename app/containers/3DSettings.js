import {connect} from 'react-redux';
import {updateTaxonomyValues} from "../actions/app";
import {withTranslation} from "react-i18next";
import _3DSettings from "../components/3DSettings";

const mapStateToProps = (state, ownProps) => {
    return {
        tabData: state.app.open_tabs[ownProps.tabName]
    };
};

const mapDispatchToProps = dispatch => {
    return {
        updateTaxonomyValues: (tabName) => dispatch(updateTaxonomyValues(tabName))
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(_3DSettings));
