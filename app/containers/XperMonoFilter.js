import {connect} from 'react-redux';

import Component from '../components/XperMonoFilter';
import {withTranslation} from "react-i18next";
import {xperMatchResources} from "../actions/app";

const mapStateToProps = state => {
    console.log('mapStateToProps xperMatchedResources');
    console.log(state);
    return {
        xperMatchedResources: state.app.xperMatchedResources
    };
};

const mapDispatchToProps = dispatch => {
    return {
        xperMatchResources: (folder, xper) => {
            dispatch(xperMatchResources(folder, xper));
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
