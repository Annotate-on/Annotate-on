import React, {Component} from 'react';
import {Spinner} from "reactstrap";

class LoadingSpinner extends Component {

    render() {
        return (
            <div className="import-loading-spinner">
                <Spinner color="primary" />
                <h5 className="import-loading-spinner-text">{this.props.text || 'loading....'}</h5>
            </div>
        );
    }
}

export default LoadingSpinner;