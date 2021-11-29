import {connect} from 'react-redux';
import Component from '../components/Calibration';
import {updateTaxonomyValues} from "../actions/app";

const mapStateToProps = (state, ownProps) => {
    return {
        calibrations: state.app.calibrations,
        picturesByCalibration: state.app.pictures_by_calibration,
        picturesSelection: Object.keys(state.app.pictures),
        tabData: state.app.open_tabs[ownProps.tabName]
    };
};

const mapDispatchToProps = dispatch => {
    return {
        updateTaxonomyValues: (tabName) => dispatch(updateTaxonomyValues(tabName))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Component);
