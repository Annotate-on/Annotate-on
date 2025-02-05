import {connect} from 'react-redux';
import Component from '../components/XperData'
import {push} from "connected-react-router";
import lodash from "lodash";
import {withTranslation} from "react-i18next";

const mapStateToProps = (state) => {
    return {
        pictures: state.app.pictures,
        allPictures: state.app.pictures,
        tabData: state.app.open_tabs,
        annotations: lodash.flatten([...Object.values(state.app.annotations_categorical)])
    };
};

const mapDispatchToProps = dispatch => {
    return {
        goToXperDataExport: (tabName) => {
            dispatch(push(`/xper-data-export/${tabName}`));
        },
    };
};
export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
