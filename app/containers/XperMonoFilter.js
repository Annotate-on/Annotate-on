import {connect} from 'react-redux';

import Component from '../components/XperMonoFilter';
import {withTranslation} from "react-i18next";

const mapStateToProps = state => {
    return {
    };
};

const mapDispatchToProps = dispatch => {
    return {
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
