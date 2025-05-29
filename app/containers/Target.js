import {connect} from 'react-redux';

import Component from '../components/Target';
import {withTranslation} from "react-i18next";
import lodash from "lodash";

const mapStateToProps = (state, ownProps) => {
    let taxonomyInstance = {};
    if (state.app.selectedTaxonomy) {
        taxonomyInstance = state.app.taxonomyInstance[state.app.selectedTaxonomy.id];
    }
    return {
        pictures: state.app.pictures,
        selectedTaxonomy: state.app.selectedTaxonomy,
        tab: state.app.open_tabs[ownProps.tabName],
        taxonomyInstance,
        taxonomies: state.app.taxonomies,
        relationsByAnnotations: state.app.relationsByAnnotations,
        annotations: lodash.flatten([
            ...Object.values(state.app.annotations_measures_linear),
            ...Object.values(state.app.annotations_rectangular),
            ...Object.values(state.app.annotations_points_of_interest),
            ...Object.values(state.app.annotations_color_picker),
            ...Object.values(state.app.annotations_polygon),
            ...Object.values(state.app.annotations_angle),
            ...Object.values(state.app.annotations_occurrence),
            ...Object.values(state.app.annotations_categorical),
            ...Object.values(state.app.annotations_transcription),
            ...Object.values(state.app.annotations_richtext),
            ...Object.values(state.app.annotations_eventAnnotations),
            ...Object.values(state.app.annotations_chronothematique),
            ...Object.values(state.app.annotations_circle_of_interest),
            ...Object.values(state.app.annotations_polygon_of_interest),
            ...Object.values(state.app.annotations_ratio),
        ])
    };
};

const mapDispatchToProps = dispatch => {
    return {};
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
