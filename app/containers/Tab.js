import {connect} from 'react-redux';
import {push} from 'connected-react-router';

import {createTag} from '../actions/app';
import Component from '../components/Tab';
import {ee, EVENT_SELECT_TAB} from "../utils/library";

const mapStateToProps = state => {
    return {
        openTabs: state.app.open_tabs
    };
};

const mapDispatchToProps = dispatch => {
    return {
        createTag: name => {
            dispatch(createTag(name));
        },
        goTo: (path) => {
            dispatch(push(path));
        },
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Component);
