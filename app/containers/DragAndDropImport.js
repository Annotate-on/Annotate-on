import React from 'react';
import {connect} from 'react-redux';
import {push} from 'connected-react-router';
import Component from '../components/DragAndDropImport';
import {withTranslation} from "react-i18next";

const mapStateToProps = state => {
    return {};
};

const mapDispatchToProps = dispatch => {
    return {
        goToLibrary: () => {
            dispatch(push('/selection'));
        },
    };
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps, null, {pure: false})(Component));
