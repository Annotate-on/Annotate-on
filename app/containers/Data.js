import {connect} from 'react-redux';
import lodash from 'lodash';

import Component from '../components/Data';
import {updateTabularView} from "../actions/app";
import {withTranslation} from "react-i18next";

const mapStateToProps = (state, ownProps) => {
    console.log('data own props ' , ownProps)
    return {
        annotations: lodash.flatten([...Object.values(state.app.annotations_measures_linear),
            ...Object.values(state.app.annotations_rectangular),
            ...Object.values(state.app.annotations_points_of_interest),
            ...Object.values(state.app.annotations_color_picker),
            ...Object.values(state.app.annotations_polygon),
            ...Object.values(state.app.annotations_angle),
            ...Object.values(state.app.annotations_occurrence),
            ...Object.values(state.app.annotations_categorical),
            ...Object.values(state.app.annotations_transcription),
            ...Object.values(state.app.annotations_richtext)]),
        pictures: state.app.pictures,
        tagsByAnnotation: state.app.tags_by_annotation,
        picturesByCalibration: state.app.pictures_by_calibration,
        tabData: state.app.open_tabs[ownProps.tabName],
        selectedTaxonomy: state.app.selectedTaxonomy,
        projectName: state.app.selectedProjectName,
        taxonomyInstance: state.app.taxonomyInstance,
        tagsByPicture: state.app.tags_by_picture,

    };
};

const mapDispatchToProps = dispatch => {
    return {
        updateTabularView: (tabName, activeTab) => {
            dispatch(updateTabularView(tabName, activeTab));
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
