import React from 'react';
import {connect} from 'react-redux';
import Component from '../components/Taxonomies';
import {
    importTaxonomy,
    removeTaxonomy,
    removeImageDetectModel,
    saveTaxonomy,
    setSelectedTaxonomy,
    updateTaxonomiesStatus,
    saveImageDetectModel,
    editImageDetectModel,
    updateImageDetectModelStatus
} from "../actions/app";
import {push} from "connected-react-router";
import {ee, EVENT_SELECT_TAB} from "../utils/library";
import {withTranslation} from "react-i18next";

const mapStateToProps = state => {
    return {
        taxonomies: state.app.taxonomies,
        selectedTaxonomy: state.app.selectedTaxonomy,
        projectName: state.app.selectedProjectName,
        imageDetectModels: state.app.imageDetectModels
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
        saveImageDetectModel: (id, name, model, version, url_service, user, password, description, confidence, modelClasses) => {
            return new Promise(resolve => {
                dispatch(saveImageDetectModel(id, name, model, version, url_service, user, password, description, confidence, modelClasses));
                resolve();
            })
        },
        editImageDetectModel: (id, name, model, version, url_service, user, password, description, confidence, modelClasses) => {
            return new Promise(resolve => {
                dispatch(editImageDetectModel(id, name, model, version, url_service, user, password, description, confidence, modelClasses));
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
        removeImageDetectModel: (id) => {
            dispatch(removeImageDetectModel(id));
        },
        setSelectedTaxonomy: (id) => {
            dispatch(setSelectedTaxonomy(id))
        },
        updateTaxonomiesStatus: (id, isActive, model) => {
            dispatch(updateTaxonomiesStatus(id, isActive, model));
        },
        updateImageDetectModelStatus: (id, isActive, model) => {
            dispatch(updateImageDetectModelStatus(id, isActive, model));
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

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps, null, {pure: false})(Component));
