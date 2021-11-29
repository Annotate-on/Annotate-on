import React from 'react';
import {connect} from 'react-redux';
import {push} from 'connected-react-router';
import Component from '../components/ImportEventWizard';
import {
    addSubTag, createAnnotateEvent,
    createTag, deleteAnnotateEvent,
    emptyTagsList,
    refreshState,
    selectFolderGlobally,
    selectTag, setPictureInSelection,
    tagPicture
} from "../actions/app";
import {ee, EVENT_SELECT_TAB} from "../utils/library";

const mapStateToProps = state => {
    return {
        selectedTags: state.app.selected_tags,
        tags: state.app.tags,
        tagsByPicture: state.app.tags_by_picture,
        tagsSelectionMode: state.app.tags_selection_mode,
        allPictures: state.app.pictures,
        tabData: state.app.open_tabs,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        goToLoading: () => {
            dispatch(push('/loading'));
        },
        emptyTagsList: () => {
            dispatch(emptyTagsList());
        },
        goToImport: (selectedFolder) => {
            dispatch(push('/import/' + selectedFolder));
        },
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
        goToImage: () => {
            dispatch(push('/image'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'image')
            }, 100)
        },
        createTag: name => {
            dispatch(createTag(name));
        },
        addSubTag: (addTo, tag) => {
            dispatch(addSubTag(addTo, tag));
        },
        createAnnotateEvent: (event) => {
          dispatch(createAnnotateEvent(event))
        },
        deleteAnnotateEvent: (eventId) => {
            dispatch(deleteAnnotateEvent(eventId));
        },
        setPictureInSelection: (pictureId, tabName) => {
            dispatch(setPictureInSelection(pictureId, tabName));
        },

    };
};

export default connect(mapStateToProps, mapDispatchToProps, null, {pure: false})(Component);
