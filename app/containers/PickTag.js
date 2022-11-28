import {connect} from 'react-redux';

import {createTag, deleteTag, editTag, selectTag} from '../actions/app';
import Component from '../components/PickTag';
import {withTranslation} from "react-i18next";

const mapStateToProps = state => {
    return {
        selectedTags: state.app.selected_tags,
        tags: state.app.tags,
        tagsByPicture: state.app.tags_by_picture
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
        selectTag: name => {
            dispatch(selectTag(name));
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
