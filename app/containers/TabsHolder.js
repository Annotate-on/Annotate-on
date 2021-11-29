import {connect} from 'react-redux';
import {push} from 'connected-react-router';

import {closeTab, createTab, renameTab} from '../actions/app';
import Component from '../components/TabsHolder';
import {ee, EVENT_SELECT_TAB} from "../utils/library";

const mapStateToProps = state => {
  return {
    openTabs: state.app.open_tabs
  };
};

const mapDispatchToProps = dispatch => {
  return {
    createTab: (view) => {
      dispatch(createTab(view));
    },
    closeTab: (name) => {
      dispatch(closeTab(name));
    },
    goTo: (path) => {
      dispatch(push(path));
    },
    renameTab: (oldName, newName) => {
      dispatch(renameTab(oldName, newName));
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
