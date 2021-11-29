import {connect} from 'react-redux';

import Component from '../components/Loading';

const mapStateToProps = state => {
    return {
        appState: state.app,
        counter: state.app.counter,
        selectedMenu: state.app.selected_menu
    };
};

export default connect(mapStateToProps)(Component);
