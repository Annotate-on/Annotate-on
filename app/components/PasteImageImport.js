import React, {PureComponent} from 'react';
import {Button} from 'reactstrap';
import {ee, EVENT_SELECT_TAB, EVENT_SHOW_LOADING_ON_RESOURCE_IMPORT} from "../utils/library";

export default class extends PureComponent {

    constructor(props) {
        super(props);
        this.state = {pastedImage: null};
    }

    componentDidMount() {
        document.addEventListener('paste', this.onPaste);
    }

    componentWillUnmount() {
        document.removeEventListener('paste', this.onPaste);
    }

    onPaste = (pasteEvent) => {
        pasteEvent.preventDefault();
        const item = pasteEvent.clipboardData.items[0];
        console.log("paste..." + item.type)
        if (item.type.indexOf("image") === 0) {
            const blob = item.getAsFile();

            const reader = new FileReader();
            reader.onload = (event) => {
                this.setState({
                    pastedImage: event.target.result
                });
                // document.getElementById("container").src = event.target.result;
            };

            reader.readAsDataURL(blob);
        }
    }

    render() {
        return (
            <div className="bst rcn_urldownloader">
                <div className="file-drop-zone">
                    {this.state.pastedImage ? <img src={this.state.pastedImage}/> : <span>Paste here.</span>}
                </div>
                <Button
                    className="btn btn-success"
                    disabled={this.state.pastedImage === null || this.props.parentFolder === null}
                    onClick={() => {
                        ee.emit(EVENT_SHOW_LOADING_ON_RESOURCE_IMPORT);
                        setTimeout(() => {
                            this.props.saveImage(this.state.pastedImage);
                        }, 30)
                    }}
                >Save</Button>
                &emsp;
                <Button className="cancel_button btn btn-danger" size="md" color="warning" onClick={() => {
                    this.props.goToLibrary();
                    setTimeout(() => {
                        ee.emit(EVENT_SELECT_TAB, 'library')
                    }, 100)
                }}
                >
                    Cancel
                </Button>
            </div>
        );
    }
}
