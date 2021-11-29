import React, {PureComponent} from 'react';
import {Button} from 'reactstrap';
import path from "path";
import {ee, EVENT_SELECT_TAB, EVENT_SHOW_LOADING_ON_RESOURCE_IMPORT} from "../utils/library";
import {SUPPORTED_VIDEO_FORMAT_REGEXP} from "../constants/constants";

const REMOVE_FILE = require('./pictures/trash.svg');

export default class extends PureComponent {

    constructor(props) {
        super(props);
        this.state = {droppedFiles: []};
    }

    render() {
        return (
            <div className="bst rcn_urldownloader">
                <div className="file-drop-zone"
                     onDragOver={e => {
                         e.target.className = "file-drop-zone-hover"
                         e.preventDefault();
                         e.stopPropagation();
                     }}
                     onDragLeave={e => {
                         e.target.className = "file-drop-zone"

                     }}
                     onDrop={ev => {
                         ev.preventDefault();
                         ev.stopPropagation();
                         ev.target.className = "file-drop-zone"

                         const files = [];
                         if (ev.dataTransfer.items) {
                             // Use DataTransferItemList interface to access the file(s)
                             for (const item of ev.dataTransfer.items) {
                                 // If dropped items aren't files, reject them
                                 if (item.kind === 'file') {
                                     const file = item.getAsFile();
                                     const ext = path.extname(file.name).toLowerCase();
                                     if (this.props.fileType && this.props.fileType === 'video'){
                                         if (ext.search(SUPPORTED_VIDEO_FORMAT_REGEXP) !== -1) {
                                             files.push(file.path);
                                         }
                                     }else {
                                         if (ext.search(/jpg|jpeg|png/g) !== -1) {
                                             files.push(file.path);
                                         }
                                     }
                                 }
                             }

                             this.setState(state => ({
                                 droppedFiles: [...state.droppedFiles, ...files]
                             }));
                         }
                     }}
                >Drop here files from file system.
                </div>
                <ul className="selected-files">
                    {this.state.droppedFiles.map((file, index) => {
                        return (
                        <li key={index}>{file}
                            <img alt="remove file"
                                 src={REMOVE_FILE}
                                 onClick={() => {
                                     this.state.droppedFiles.splice(index, 1);
                                     this.setState(state => ({
                                         droppedFiles: [...state.droppedFiles]
                                     }));
                                 }
                                 }
                            />
                        </li>
                        )
                    })}
                </ul>
                <Button
                    className="btn btn-success"
                    disabled={this.state.droppedFiles.length === 0 || this.props.parentFolder === null}
                    onClick={() => {
                        ee.emit(EVENT_SHOW_LOADING_ON_RESOURCE_IMPORT);
                        setTimeout( ()=> {
                            this.props.fileType && this.props.fileType === 'video' ?  this.props._saveVideos(this.state.droppedFiles) : this.props.saveImages(this.state.droppedFiles)

                        } , 30)
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
