import React, {Component} from 'react';
import {Alert} from "reactstrap";
import Button from "react-rte/lib/ui/Button";

class FinishEventModalDialog extends Component {

    constructor(props) {
        super(props);
    }

    saveEvent = () => {
        this.props.save();
    }

    render() {
        return (
                this.props.isOpen ?
                    <div className="event-modal-confirmation">
                        <Alert color="danger" className="emc-alert-wrapper" isOpen={this.props.isOpen}  fade={true}>
                            <div className="emc-wrap">
                                <div className="emc-wrap-one">
                                    <b>Stop event ?</b>
                                </div>
                                <div
                                    className="emc-wrap-two"
                                    onClick={ ()=> {this.props.toggle()}}>
                                    x
                                </div>
                            </div>
                            <div className="emc-message">
                                If you stop the event, we will not be able to continue the analysis. Are you sure you want to stop the event?
                            </div>
                            <div className="emc-actions">
                                <Button style={{marginRight: '5px'}} onClick={ ()=> {this.props.toggle()}}>Cancel</Button>
                                <Button onClick={ ()=> {this.saveEvent()}}>Save</Button>
                            </div>
                        </Alert>
                    </div> : null
        );
    }
}

export default FinishEventModalDialog;