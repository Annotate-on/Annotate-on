import {connect} from 'react-redux';

import Component from '../components/Loading';
import {withTranslation} from "react-i18next";

const mapStateToProps = state => {
    return {
        appState: state.app,
        counter: state.app.counter,
        selectedMenu: state.app.selected_menu
    };
};

export default withTranslation()(connect(mapStateToProps)(Component));
