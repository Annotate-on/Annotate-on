import { push } from 'connected-react-router';
import lodash from "lodash";
import { withTranslation } from "react-i18next";
import { connect } from 'react-redux';
import Component from '../components/CollectionExport';
import { ee, EVENT_SELECT_TAB } from "../utils/library";

const mapStateToProps = state => {
    return {
        appState: state.app,
        annotations: lodash.flatten([...Object.values(state.app.annotations_measures_linear),
            ...Object.values(state.app.annotations_rectangular),
            ...Object.values(state.app.annotations_points_of_interest),
            ...Object.values(state.app.annotations_color_picker),
            ...Object.values(state.app.annotations_polygon),
            ...Object.values(state.app.annotations_angle),
            ...Object.values(state.app.annotations_occurrence),
            ...Object.values(state.app.annotations_categorical),
            ...Object.values(state.app.annotations_richtext),
            ...Object.values(state.app.annotations_transcription)]),
        allPictures: state.app.pictures,
        tabData: state.app.open_tabs,
        cartels: state.app.cartel_by_picture
    };
};

const mapDispatchToProps = dispatch => {
    return {
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps, null, {pure: false})(Component));