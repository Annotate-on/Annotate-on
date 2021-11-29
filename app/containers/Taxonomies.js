import React from 'react';
import {connect} from 'react-redux';
import Component from '../components/Taxonomies';
import {
    importTaxonomy,
    removeTaxonomy,
    saveTaxonomy,
    setSelectedTaxonomy,
    updateTaxonomiesStatus
} from "../actions/app";
import {push} from "connected-react-router";
import {ee, EVENT_SELECT_TAB} from "../utils/library";

const mapStateToProps = state => {
    return {
        taxonomies: state.app.taxonomies,
        selectedTaxonomy: state.app.selectedTaxonomy,
        projectName: state.app.selectedProjectName
    };
};

const mapDispatchToProps = dispatch => {
    return {
        saveTaxonomy: (id, name, path, model, version) => {
            return new Promise(resolve => {
                dispatch(saveTaxonomy(id, name, path, model, version));
                resolve();
            })
        },
        importTaxonomy: (id, name, path, version, taxonomyDefinition , targetTypes) => {
            return new Promise(resolve => {
                dispatch(importTaxonomy(id, name, path, version, taxonomyDefinition , targetTypes));
                resolve();
            })
        },
        removeTaxonomy: (id) => {
            dispatch(removeTaxonomy(id));
        },
        setSelectedTaxonomy: (id) => {
            dispatch(setSelectedTaxonomy(id))
        },
        updateTaxonomiesStatus: (id, isActive, model) => {
            dispatch(updateTaxonomiesStatus(id, isActive, model));
        },
        goTo: (path) => {
            dispatch(push(path));
        },
        goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
                ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps, null, {pure: false})(Component);
