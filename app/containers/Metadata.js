import {connect} from 'react-redux';
import Component from '../components/Metadata';
import {tagPicture, untagPicture, updatePictureDate} from "../actions/app";
import {withTranslation} from "react-i18next";
import {push} from "connected-react-router";
import {ee, EVENT_SELECT_TAB} from "../utils/library";
import {MAP_VIEW} from "../constants/constants";

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
        updatePictureDate: (sha1, date, exifPlace, placeName, coverage) => {
            dispatch(updatePictureDate(sha1, date, exifPlace, placeName, coverage));
        },
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, {
                    tab: 'library',
                    param: {
                        picView: MAP_VIEW,
                        fitToBounds: "false"
                    }
                })
            }, 100)
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
