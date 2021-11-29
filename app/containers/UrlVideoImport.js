import React from 'react';
import {connect} from 'react-redux';
import {push} from 'connected-react-router';
import Component from '../components/UrlVideoImport';
import {addSubTag, createTag, refreshState, selectFolderGlobally, selectTag, tagPicture} from "../actions/app";
import {ee, EVENT_SELECT_TAB} from "../utils/library";

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
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps, null, {pure: false})(Component);
