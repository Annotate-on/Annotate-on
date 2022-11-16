import {connect} from 'react-redux';

import {
    createTag,
    deleteTag,
    editTag,
    selectTag,
    tagPicture,
    untagPicture,
    addSubTag,
    openInNewTab,
    mergeTags,
    saveTagSort,
    deleteTagExpression,
    createTagExpression,
    updateTagExpressionOperator,
    unselectTag,
    addTagInFilter
} from '../actions/app';
import Component from '../components/Tags';
import {withTranslation} from "react-i18next";

const mapStateToProps = (state, ownProps) => {
    return {
        picturesByTag: state.app.pictures_by_tag,
        selectedTags: state.app.selected_tags,
        tags: state.app.tags,
        tagsByPicture: state.app.tags_by_picture,
        annotationsByTag: state.app.annotations_by_tag,
        tab: state.app.open_tabs[ownProps.tabName],
        tabData: state.app.open_tabs
    };
};

const mapDispatchToProps = dispatch => {
    return {
        createTag: name => {
            dispatch(createTag(name));
        },
        editTag: (oldName, newName) => {
            dispatch(editTag(oldName, newName));
        },
        deleteTag: name => {
            dispatch(deleteTag(name));
        },
        selectTag: (name, skipCheck, tabName) => {
            dispatch(selectTag(name, skipCheck, tabName));
        },
        tagPicture: (pictureId, tagName) => {
            dispatch(tagPicture(pictureId, tagName));
        },
        unselectTag: (name, tabName) => {
            dispatch(unselectTag(name, tabName));
        },
        untagPicture: (pictureId, tagName) => {
            dispatch(untagPicture(pictureId, tagName));
        },
        addSubTag: (addTo, tag) => {
            dispatch(addSubTag(addTo, tag));
        },
        mergeTags: (target, source) => {
            dispatch(mergeTags(target, source));
        },
        openInNewTab: (name) => {
            dispatch(openInNewTab(name));
        },
        saveTagSort: (tabName, direction) => {
            dispatch(saveTagSort(tabName, direction));
        },
        addTagInFilter: (name, skipCheck, tabName) => {
            dispatch(addTagInFilter(name, skipCheck, tabName));
        },
        createTagExpression: (tabName) => {
            dispatch(createTagExpression(tabName));
        },
        deleteTagExpression: (id, tabName) => {
            dispatch(deleteTagExpression(id, tabName));
        },
        updateTagExpressionOperator: (id, value, tabName) => {
            dispatch(updateTagExpressionOperator(id, value, tabName));
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
