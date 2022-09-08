import {connect} from 'react-redux';
import Component from '../components/Metadata';
import {tagPicture, untagPicture, updatePictureDate} from "../actions/app";
import {withTranslation} from "react-i18next";

const mapStateToProps = (state, ownProps) => {
    return {};
};

const mapDispatchToProps = dispatch => {
    return {
        tagPicture: (pictureId, tagName) => {
            dispatch(tagPicture(pictureId, tagName));
        },
        untagPicture: (pictureId, tagName) => {
            dispatch(untagPicture(pictureId, tagName));
        },
        updatePictureDate: (sha1, date, exifPlace) => {
            dispatch(updatePictureDate(sha1, date, exifPlace));
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
