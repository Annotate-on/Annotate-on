import React from 'react';
import {connect} from 'react-redux';
import Component from '../components/XperSettings';
import {saveTaxonomy} from "../actions/app";
import {MODEL_XPER} from "../constants/constants";
import {push} from "connected-react-router";
import {withTranslation} from "react-i18next";
import {ee, EVENT_SELECT_TAB} from "../utils/library";

const mapStateToProps = state => {
    return {
        appState: state.app,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        saveTaxonomy: (id, name, path, version) => {
            dispatch(saveTaxonomy(id, name, path, MODEL_XPER, version));
        },goToLibrary: () => {
            dispatch(push('/selection'));
            setTimeout(() => {
            ee.emit(EVENT_SELECT_TAB, 'library')
            }, 100)
        }
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps, null, {pure: false})(Component));
