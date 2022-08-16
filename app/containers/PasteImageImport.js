import React from 'react';
import {connect} from 'react-redux';
import {push} from 'connected-react-router';
import Component from '../components/PasteImageImport';

const mapStateToProps = state => {
    return {};
};

const mapDispatchToProps = dispatch => {
    return {
        goToLibrary: () => {
            dispatch(push('/selection'));
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps, null, {pure: false})(Component);
