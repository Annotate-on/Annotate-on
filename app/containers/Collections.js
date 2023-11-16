import {connect} from 'react-redux';
import Component from '../components/Collections'
import {push} from "connected-react-router";
import lodash from "lodash";
import {withTranslation} from "react-i18next";

const mapStateToProps = (state) => {
    return {
        pictures: state.app.pictures,
        allPictures: state.app.pictures,
        tabData: state.app.open_tabs,
        cartels: state.app.cartel_by_picture,
        annotations: lodash.flatten([...Object.values(state.app.annotations_measures_linear),
            ...Object.values(state.app.annotations_rectangular),
            ...Object.values(state.app.annotations_points_of_interest),
            ...Object.values(state.app.annotations_color_picker),
            ...Object.values(state.app.annotations_polygon),
            ...Object.values(state.app.annotations_angle),
            ...Object.values(state.app.annotations_occurrence),
            ...Object.values(state.app.annotations_categorical),
            ...Object.values(state.app.annotations_richtext),
            ...Object.values(state.app.annotations_circle_of_interest),
            ...Object.values(state.app.annotations_transcription)]),
    };
};

const mapDispatchToProps = dispatch => {
    return {
        goToCollectionExport: (tabName) => {
            dispatch(push(`/collection-export/${tabName}`));
        },
    };
};
export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
