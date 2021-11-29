import {connect} from 'react-redux';
import {push} from "connected-react-router";
import Component from '../components/App';
import {
  addSubCategory,
  addSubTag, createCategory,
  createTag, flatOldTags,
  refreshState,
  selectFolderGlobally,
  selectMenu,
  selectTag,
  tagPicture
} from "../actions/app";
import {ee, EVENT_SELECT_TAB} from "../utils/library";

const mapStateToProps = state => {
  return {
    appState: state.app,
    counter: state.app.counter,
    selectedMenu: state.app.selected_menu,
    picturesSize: Object.keys(state.app.pictures).length
  };
};

const mapDispatchToProps = dispatch => {
  return {
    goToHome: () => {
      dispatch(push('/import'));
    },
    goToLibrary: () => {
      dispatch(push('/selection'));
      setTimeout(() => {
        ee.emit(EVENT_SELECT_TAB, 'library')
      }, 100)
    },
    setSelectedMenu: (menu) => {
      dispatch(selectMenu(menu))
    },
    tagPicture: (pictureId, tagName) => {
      dispatch(tagPicture(pictureId, tagName));
    },
    selectTag: (name, skipCheck) => {
      dispatch(selectTag(name, skipCheck));
    },
    refreshState: (loadedState, picturesObject) => {
      dispatch(refreshState(loadedState, picturesObject));
    },
    selectFolderGlobally: (path) => {
      dispatch(selectFolderGlobally(path));
    },
    createTag: name => {
      dispatch(createTag(name, true));
    },
    addSubTag: (addTo, tag) => {
      dispatch(addSubTag(addTo, tag));
    },
    addSubCategory: (parentName , item , isCategory , parentId) => {
      dispatch(addSubCategory(parentName , item , isCategory , parentId));
    },
    flatOldTags: () => {
      dispatch(flatOldTags());
    },
    createCategory: (category) => {
      dispatch(createCategory(category));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Component);
