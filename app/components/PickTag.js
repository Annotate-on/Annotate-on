import React, {Component, Fragment} from 'react';
import {
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
} from 'reactstrap';
import {remote} from "electron";
import TagManager from "../containers/TagManager";
import {TAG_AUTO} from "../constants/constants";

const REMOVE_TAG = require('./pictures/delete_tag.svg');
const EDIT_TAG = require('./pictures/edit-tag.svg');

export default class extends Component {
    constructor(props) {
        super(props);

        // Merge all tags into one array
        const tags = [];
        this._extractChildren(this.props.tags, tags);
        this._sortTags(tags);

        this.state = {
            newTagName: '',
            editTag: false,
            openModal: props.openModal,
            tags
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.openModal !== this.props.openModal)
            this.setState({
                openModal: this.props.openModal
            });
    }

    componentWillReceiveProps(nextProps) {
        // Merge all tags into one array
        const tags = [];
        this._extractChildren(nextProps.tags, tags);
        this._sortTags(tags);
        this.setState({tags});
    }

    render() {
        return (
            <div>
                <Modal isOpen={this.state.openModal} className="myCustomModal" toggle={this._toggle} contentClassName="custom-modal-style" wrapClassName="bst rcn_inspector pick-tag"
                       scrollable={true}
                       autoFocus={false}>
                    <ModalHeader toggle={this._toggle}>Pick a Keyword</ModalHeader>
                    <ModalBody>
                        <TagManager pickATag={true} isModalOrTab={true} isModalView={true} onTagSelected={this.props.onTagSelected}/>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={this._toggle}>Close</Button>
                    </ModalFooter>
                </Modal>
            </div>
        );
    }

    _extractChildren = (tags, tagsList) => {
        if (tags) {
            tags.map(tag => {
                if (tag.name !== TAG_AUTO){
                    const {name, creationDate, creationTimestamp} = tag;
                    tagsList.push({name, creationDate, creationTimestamp});
                    if (tag.children) {
                        this._extractChildren(tag.children, tagsList)
                    }
                }
            });
        }
    };

    _sortTags = (tags) => {
        return tags.sort((a, b) => {
            return (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0));
        });
    };

    _renderTags = (tags) => {
        let key = 0;
        return tags.map(_ => {
            return (<Fragment key={`pick_tag_${key++}_`}>
                <span
                    className="annotation-tag"
                    onClick={() => {
                        this.props.onTagSelected(_.name);
                    }}
                >{_.name}&nbsp;
                    <img src={EDIT_TAG}
                         alt="edit tag"
                         className='edit-tag'
                         onClick={e => {
                             e.stopPropagation();
                             this.setState({
                                 editTag: true,
                                 newTagName: _.name,
                                 originalTagName: _.name
                             });
                         }}/>
                         <img src={REMOVE_TAG}
                              alt="remove tag"
                              className='delete-tag'
                              onClick={e => {
                                  e.stopPropagation();
                                  const result = remote.dialog.showMessageBox({
                                      type: 'question',
                                      buttons: ['Yes', 'No'],
                                      message: `Tag: "${_.name}"`,
                                      cancelId: 1,
                                      detail: `Are you sure you want to delete it?`
                                  });
                                  if (result === 0) this.props.deleteTag(_.name);
                              }}/>
                </span>
                </Fragment>
            );
        })
    };

    _saveTag = () => {
        const tagName = this.state.newTagName;
        if (tagName.length === 0) {
            remote.dialog.showErrorBox('Error', 'Enter tag name!');
            return;
        }
        if (this.state.editTag === false)
            this.props.createTag(tagName);
        else
            this.props.editTag(this.state.originalTagName, tagName);

        this.setState({
            newTagName: '',
            originalTagName: '',
            editTag: false,
        });
        this.input.focus();
    };

    _toggle = () => {
        this.setState({
            newTagName: '',
            originalTagName: '',
            editTag: false,
        });
        this.props.onClose();
    };

}
