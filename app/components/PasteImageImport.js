import React, {PureComponent} from 'react';
import {Button} from 'reactstrap';
import {ee, EVENT_SELECT_TAB, EVENT_SHOW_LOADING_ON_RESOURCE_IMPORT} from "../utils/library";

export default class extends PureComponent {

    constructor(props) {
        super(props);
        this.state = {pastedImage: null, fileName: ''};
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
        console.debug("paste..." + item.type)
        if (item.type.indexOf("image") === 0) {
            const file = item.getAsFile();

            const reader = new FileReader();
            reader.onload = (event) => {
                this.setState({
                    pastedImage: event.target.result,
                    file
                });
            };

            reader.readAsDataURL(file);
        }
    }

    render() {
        return (
            <div className="bst rcn_urldownloader">
                <div className="file-drop-zone">
                    {this.state.pastedImage ? <div>
                        <img className="img-fluid" src={this.state.pastedImage}/>
                        <br/>
                        <input type="text" onChange={(event) => {
                            this.setState({
                                fileName: event.target.value
                            })
                        }} />
                    </div>: <span>Paste here.</span>}
                </div>
                <Button
                    className="btn btn-success"
                    disabled={this.state.pastedImage === null || this.props.parentFolder === null
                || this.state.fileName === ''}
                    onClick={() => {
                        ee.emit(EVENT_SHOW_LOADING_ON_RESOURCE_IMPORT);
                        setTimeout(() => {
                            this.props.saveImage(this.state.file, this.state.fileName);
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
