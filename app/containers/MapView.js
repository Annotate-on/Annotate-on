import React from 'react';
import {connect} from 'react-redux';
import {push} from "connected-react-router";
import {ee, EVENT_SELECT_TAB} from "../utils/library";
import {withTranslation} from "react-i18next";
import MapView from "../components/MapView";
import {
    addSubCategory,
    createCategory,
    createTag,
    openInNewTab,
    setPictureInSelection,
    tagPicture
} from "../actions/app";

const mapStateToProps = state => {
    return {
        openTabs : state.app.open_tabs,
        tags: state.app.tags,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        },
        setPictureInSelection: (pictureId, tabName) => {
            dispatch(setPictureInSelection(pictureId, tabName));
        },
        createCategory: (category) => {
            dispatch(createCategory(category));
        },
        addSubCategory: (parentName , item , isCategory , parentId) => {
            dispatch(addSubCategory(parentName , item , isCategory , parentId));
        },
        openInNewTab: (tag) => {
            dispatch(openInNewTab(tag));
        },
        tagPicture: (pictureId, tagName) => {
            dispatch(tagPicture(pictureId, tagName));
        },
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(MapView));
