import {connect} from 'react-redux';

import Component from '../components/XperMonoFilter';
import {withTranslation} from "react-i18next";
import {
    addSubCategory, createAnnotationXper, createAnnotationXperSummary,
    createCategory,
    tagPicture,
    xperMatchResources
} from "../actions/app";

const mapStateToProps = state => {
    return {
        xperMatchedResources: state.app.xperMatchedResources,
        tags: state.app.tags,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        xperMatchResources: (folder, xper, resource) => {
            dispatch(xperMatchResources(folder, xper, resource));
        },
        createCategory: (category) => {
            dispatch(createCategory(category));
        },
        addSubCategory: (parentName , item , isCategory , parentId) => {
            dispatch(addSubCategory(parentName , item , isCategory , parentId));
        },
        tagPicture: (pictureId, tagName) => {
            dispatch(tagPicture(pictureId, tagName));
        },
        createAnnotationXper: (pictureId, xperData) => {
            dispatch(createAnnotationXper(pictureId, xperData));
        },
        createAnnotationXperSummary: (pictureId, xperData) => {
            dispatch(createAnnotationXperSummary(pictureId, xperData));
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
