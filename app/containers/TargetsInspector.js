import { connect } from 'react-redux';

import Component from '../components/TargetsInspector';
import {
    createTargetDescriptor,
    updateAnnotationValueInTaxonomyInstance
} from "../actions/app";
import lodash from "lodash";

const mapStateToProps = (state, ownProps) => {
    let taxonomyInstance = {};
    if(state.app.selectedTaxonomy) {
        taxonomyInstance = state.app.taxonomyInstance[state.app.selectedTaxonomy.id]||{};
    }
    return {
        annotationsOccurrence: lodash.flatten([...Object.values(state.app.annotations_occurrence)]),
        tab: state.app.open_tabs[ownProps.tabName],
        selectedTaxonomy: state.app.selectedTaxonomy,
        taxonomyInstance,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        createTargetDescriptor: (taxonomyId, id, targetName, targetType, targetColor, unit, annotationType, includeInCalculation) => {
            dispatch(createTargetDescriptor(taxonomyId, id, targetName, targetType, targetColor, unit, annotationType, includeInCalculation))},
        updateAnnotationValueInTaxonomyInstance: (annotations, taxonomyId , inPictureValues , sha1 , descriptorId) => {
            dispatch(updateAnnotationValueInTaxonomyInstance(annotations, taxonomyId , inPictureValues , sha1 , descriptorId));
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Component);
