import {connect} from 'react-redux';

import Component from '../components/TargetDescriptors';
import {
    createTargetDescriptor,
    deleteTargetDescriptor,
    deleteTargetType,
    editTargetDescriptor,
    editTargetType,
    saveTargetType,
    setSelectedTaxonomy
} from "../actions/app";
import {push} from "connected-react-router";
import {ee, EVENT_SELECT_TAB} from "../utils/library";
import {withTranslation} from "react-i18next";

const mapStateToProps = state => {
    return {
        taxonomy: state.app.selectedTaxonomy,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        createTargetDescriptor: (taxonomyId, id, targetName, targetType, targetColor, unit, annotationType, includeInCalculation, states) => {
            dispatch(createTargetDescriptor(taxonomyId, id, targetName, targetType, targetColor, unit, annotationType, includeInCalculation, states));
        },
        editTargetDescriptor: (taxonomyId, id, targetName, targetType, targetColor, unit, annotationType, includeInCalculation, states) => {
            dispatch(editTargetDescriptor(taxonomyId, id, targetName, targetType, targetColor, unit, annotationType, includeInCalculation, states));
        },
        deleteTargetDescriptor: (taxonomyId, id) => {
            dispatch(deleteTargetDescriptor(taxonomyId, id));
        },
        saveTargetType: (taxonomyId, name) => {
            dispatch(saveTargetType(taxonomyId, name));
        },
        setSelectedTaxonomy: (id) => {
            dispatch(setSelectedTaxonomy(id))
        },
        deleteTargetType: (taxonomyId, name) => {
            dispatch(deleteTargetType(taxonomyId, name));
        },
        editTargetType: (taxonomyId, name , newName) => {
            dispatch(editTargetType(taxonomyId, name , newName));
        },
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(Component));
