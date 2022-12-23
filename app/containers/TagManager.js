import {connect} from 'react-redux';

import {
    deleteTag,
    editTag,
    flatOldTags,
    createCategory,
    addSubCategory,
    importTagModel, editTagById, editCategoryById, mergeTMTags, addTagsId
} from '../actions/app';
import Component from '../components/TagManager';
import {withTranslation} from "react-i18next";

const mapStateToProps = (state, ownProps) => {
    return {
        picturesByTag: state.app.pictures_by_tag,
        tags: state.app.tags,
        tagsByPicture: state.app.tags_by_picture,
        annotationsByTag: state.app.annotations_by_tag,
        tagsByAnnotation: state.app.tags_by_annotation,
        selectedTaxonomy: state.app.selectedTaxonomy,
        projectName: state.app.selectedProjectName
    };
};

const mapDispatchToProps = dispatch => {
    return {
        addSubCategory: (parentName , newCategory , isCategory , parentId) => {
            dispatch(addSubCategory(parentName , newCategory, isCategory , parentId));
        },
        createCategory: (category) => {
            dispatch(createCategory(category));
        },
        mergeTMTags: (targetId , item  , parentId) => {
            dispatch(mergeTMTags(targetId , item  , parentId));
        },
        flatOldTags: () => {
            dispatch(flatOldTags());
        },
        editTag: (oldName, newName) => {
            dispatch(editTag(oldName, newName));
        },
        editTagById: (tag, newName) => {
            dispatch(editTagById(tag, newName));
        },
        editCategoryById: (cat, newName) => {
            dispatch(editCategoryById(cat, newName));
        },
        deleteTag: name => {
            dispatch(deleteTag(name));
        },
        importTagModel: newTags => {
            dispatch(importTagModel(newTags));
        },
        addTagsId: () => {
            dispatch(addTagsId());
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
