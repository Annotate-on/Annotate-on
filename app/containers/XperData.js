import {connect} from 'react-redux';
import Component from '../components/XperData'
import lodash from "lodash";
import {withTranslation} from "react-i18next";

const mapStateToProps = (state) => {
    return {
        pictures: state.app.pictures,
        tabData: state.app.open_tabs,
        annotations_categorical: lodash.flatten([...Object.values(state.app.annotations_categorical)])
    };
};

const mapDispatchToProps = dispatch => {
    return {};
};
export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
