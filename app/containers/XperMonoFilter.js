import {connect} from 'react-redux';

import Component from '../components/XperMonoFilter';
import {withTranslation} from "react-i18next";
import {
    addSubCategory,
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
        xperMatchResources: (folder, xper) => {
            dispatch(xperMatchResources(folder, xper));
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
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
