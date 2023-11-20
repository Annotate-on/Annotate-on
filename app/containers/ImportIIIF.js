import { push } from 'connected-react-router';
import { withTranslation } from "react-i18next";
import { connect } from 'react-redux';
import { addSubTag, createCategory, createTag, refreshState, selectFolderGlobally, selectTag, tagPicture } from "../actions/app";
import Component from '../components/ImportIIIF';
import { EVENT_SELECT_TAB, ee } from "../utils/library";

const mapStateToProps = state => {
    return {
        pictures: state.app.pictures,
        tags: state.app.tags,
        selectedTags: state.app.selected_tags
    };
};

const mapDispatchToProps = dispatch => {
    return {
        tagPicture: (pictureId, tagName) => {
            dispatch(tagPicture(pictureId, tagName));
        },
        selectTag: (name, skipCheck) => {
            dispatch(selectTag(name, skipCheck));
        },
        refreshState: (picturesObject) => {
            dispatch(refreshState(picturesObject));
        },
        selectFolderGlobally: (path) => {
            dispatch(selectFolderGlobally(path));
        },
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        },
        createTag: name => {
            dispatch(createTag(name));
        },
        addSubTag: (addTo, tag) => {
            dispatch(addSubTag(addTo, tag));
        },
        createCategory: (id, name) => {
            dispatch(createCategory(id, name));
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps, null, {pure: false})(Component));