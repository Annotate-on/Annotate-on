import {remote} from 'electron';
import React, {Component} from 'react';
import styled from 'styled-components';

import {
    SORT_ALPHABETIC_ASC,
    SORT_ALPHABETIC_DESC,
    SORT_DATE_ASC,
    SORT_DATE_DESC,
    TAGS_SELECTION_MODE_AND,
    TAGS_SELECTION_MODE_OR
} from '../constants/constants';
import {Col, Collapse, Container, Form, Input, Row} from 'reactstrap';
import classnames from "classnames";
import {ContextMenu, ContextMenuTrigger, MenuItem} from "react-contextmenu";
import {ee, EVENT_SHOW_ALERT} from "../utils/library";
import {TYPE_CATEGORY, TYPE_TAG} from "./event/Constants";
import {containsOnlyWhiteSpace} from "./tags/tagUtils";
import {sortTagsAlphabeticallyOrByDate} from "../utils/common";

const _Root = styled.div`
  height: 100%;
  width: 330px;
  overflow-y: hidden;
`;

const SORT_DIALOG = 'SORT_DIALOG';
const MERGE_DIALOG = 'MERGE_DIALOG';
const SEARCH_DIALOG = 'SEARCH_DIALOG';
const ADD_DIALOG = 'ADD_DIALOG';
const OPEN = require('./pictures/open-in-tab.svg');
const SELECTED_ICON = require('./pictures/selected_icon.svg');
const MERGE_ICON = require('./pictures/merge-icon.svg');
const SAVE_ICON = require('./pictures/save-tag.svg');
const CANCEL_ICON = require('./pictures/cancel-edit.svg');

const COLLAPSE_ICON = require('./pictures/arrow_up.svg');
const EXPAND_ICON = require('./pictures/arrow_down.svg');
const TAGS = require('./pictures/tags.svg');
let showModif = '';

export default class extends Component {
    constructor(props) {
        super(props);

        this.toggle = this.toggle.bind(this);

        let selectedTags = [], tagsSelectionMode = TAGS_SELECTION_MODE_OR, sortDirection = SORT_ALPHABETIC_DESC;
        // If this component is created from tab, tabName will no be empty.
        // We are going to use selected tags list from proper source.
        if (this.props.tabName) {
            selectedTags = this.props.tabData[this.props.tabName].selected_tags;
            tagsSelectionMode = this.props.tabData[this.props.tabName].tags_selection_mode;
            sortDirection = this.props.tabData[this.props.tabName].sortDirection ? this.props.tabData[this.props.tabName].sortDirection : SORT_ALPHABETIC_DESC;
        }

        const sortedTags = this._sortTags([...this.props.tags], sortDirection);

        this.state = {
            collapse: true,
            newTagName: '',
            draggableTags: [],
            selectedTags: selectedTags,
            tagsSelectionMode: tagsSelectionMode,
            sortedTags: sortedTags,
            showDialog: '',
            sortDirection,
            tagsCount: this._countTags(props.tags)
        }
    }

    toggle = () => {
        this.setState(state => ({collapse: !state.collapse}));
    }

    componentWillReceiveProps(nextProps) {
        let selectedTags, tagsSelectionMode, sortDirection;
        if (this.props.tabName) {
            selectedTags = nextProps.tab.selected_tags;
            tagsSelectionMode = nextProps.tab.tags_selection_mode;
            sortDirection = this.props.tabData[this.props.tabName].sortDirection ? this.props.tabData[this.props.tabName].sortDirection : SORT_ALPHABETIC_DESC;
        } else {
            selectedTags = nextProps.selectedTags;
            sortDirection = SORT_ALPHABETIC_DESC;
        }
        this.setState({
            selectedTags, tagsSelectionMode,
            sortedTags: this._sortTags([...nextProps.tags], sortDirection),
            sortDirection,
            tagsCount: this._countTags(nextProps.tags)
        });
    }

    _countTags = (tags) => {
        return tags.reduce((accumulator, currentValue) => {
            if (currentValue.children) {
                accumulator += this._countTags(currentValue.children);
            }
            return accumulator + 1;
        }, 0);
    };

    _editTagsList = (_) => {
        const selected = this.state.selectedTags.indexOf(_.name) !== -1 ? 'selected-tag' : '';
        return (<Row className={selected + ' tag'} key={`tag_${_.name}`}>
            <Col md={12} lg={12} sm={12} className="edit-tag-col">
                <Form inline onSubmit={this.handleEditTagSubmit}>
                    <Input bsSize="sm"
                           type="text"
                           name="name"
                           innerRef={_ => {
                               if (_)
                                   _.focus();
                           }}
                           value={this.state.newEditTagName}
                           onChange={(event) => {
                               this.setState({newEditTagName: event.target.value});
                           }}
                    />
                    <img alt="save tag" className='save-tag' width={13} src={SAVE_ICON} onClick={this.handleEditTagSubmit}/>
                    <img alt="cancel edit" className='cancel-edit' width={13} src={CANCEL_ICON}
                         onClick={e => {
                             e.preventDefault();
                             this.setState({
                                 editTag: ''
                             });
                         }}/>
                </Form>
            </Col>
        </Row>);
    };

    _onDragStart = (event, tagName) => {
        if (this.state.draggableTags.length > 0) {
            event.dataTransfer.setData('draggableTags', JSON.stringify(this.state.draggableTags));
            event.dataTransfer.setData('draggingList', 'true');
        } else {
            event.dataTransfer.setData('tagName', tagName);
            event.dataTransfer.setData('draggingList', 'false');
        }
    };

    _onDragEnd = () => {
        this.setState({draggableTags: []})
    };

    _onDrop = (e, tagName , type) => {
        const { t } = this.props;
        if (type !== TYPE_CATEGORY){
            alert(t('tags.alert_must_be_added_to_category'));
            return  false;
        }

        if ((e.dataTransfer.getData('draggableImages') === '' &&
            e.dataTransfer.getData('sha1') === '') && (e.dataTransfer.getData('draggableTags') === '' &&
            e.dataTransfer.getData('tagName') === ''))
            return false;

        if (e.dataTransfer.getData('draggingList') === 'true') {
            const images = JSON.parse(e.dataTransfer.getData('draggableImages'));
            images.map(sha1 => this.props.tagPicture(sha1, tagName));
        } else if (e.dataTransfer.getData('sha1')) {
            this.props.tagPicture(e.dataTransfer.getData('sha1'), tagName);
        } else if (e.dataTransfer.getData('tagName') && e.dataTransfer.getData('tagName') !== tagName) {
            if (this.state.mergeTags) {
                this.props.mergeTags(tagName, e.dataTransfer.getData('tagName'));
            } else {
                this.props.addSubTag(tagName, e.dataTransfer.getData('tagName'));
            }
        }

        this.setState({draggableTags: []})
    };

    _createTagsList = (_) => {
        const { t } = this.props;
        const isTag = _.type !== TYPE_CATEGORY;
        const selected = this.state.selectedTags.indexOf(_.name) !== -1;
        const numberOfTaggedPics = this.props.picturesByTag.hasOwnProperty(_.name) ? this.props.picturesByTag[_.name].length : 0;
        const numberOfTaggedAnnotations = this.props.annotationsByTag.hasOwnProperty(_.name) ? this.props.annotationsByTag[_.name].length : 0;
        const dndSelected = this.state.draggableTags.filter(tag => tag === _.name).length > 0;
        const mergeActive = this.state.showDialog === MERGE_DIALOG;
        let selectedChild = false;

        const children = _.showChildren && _.children && _.children.length > 0 && _.children.map(tag => {
            const response = this._renderTags(tag);

            if (response) {
                selectedChild = selectedChild || response.hasSelectedChild;
                return response.html;
            } else return '';
        });

        this.state.searchTag ? _.showChildren = true : '';
        const attr = {className: this.state.searchTag && _.name.toLowerCase().includes(this.state.searchTag.toLowerCase()) ? 'tag-name bold' : 'tag-name'};
        let enableClicks = true;
        if (this.props.tabData[this.props.tabName]) {
            enableClicks = !this.props.tabData[this.props.tabName].manualOrderLock;
        }

        const html = (
            <div className={classnames('tag', {'multi-selected-tag': dndSelected})}   key={`tag_${_.name}`}>
                <div className='tag-col'
                     onMouseOver={e => {
                         e.stopPropagation();
                         showModif = _.name;
                         this.forceUpdate();
                     }}
                     onMouseOut={e => {
                         e.stopPropagation();
                         showModif = '';
                         setTimeout(_ => {
                             this.forceUpdate();
                         }, 100);
                     }}
                     onClick={(event) => {
                         if (enableClicks)
                             this.handleClickOnTag(event, _.name , _.type)
                         else
                             ee.emit(EVENT_SHOW_ALERT, t('tags.alert_cannot_change_selection_when_manual_order'));
                     }}
                     draggable="true"
                     onDragStart={e => this._onDragStart(e, _.name)}
                     onDragEnd={this._onDragEnd}
                     onDragOver={e => {
                         e.preventDefault();
                         e.stopPropagation();
                     }}
                     onDrop={e => {
                         e.preventDefault();
                         e.stopPropagation();
                         this._onDrop(e, _.name , _.type)
                     }}
                >
                    {mergeActive ?
                        <img className='merge_icon' src={MERGE_ICON}
                             width={15}
                             alt="merge icon"
                        /> : ''}

                    <span  style={{background: isTag ? 'orange' : ''}} className={classnames('tag-col-left', {'selected': selected}, {'selected-child': selectedChild})}>
                        <ContextMenuTrigger holdToDisplay={-1}
                                            disable={!enableClicks || _.type === TYPE_CATEGORY}
                                            attributes={attr}
                                            renderTag="span"
                                            id="tag_context_menu"
                                            collect={() => {
                                                return {
                                                    tagName: _.name
                                                };
                                            }}>{_.name}</ContextMenuTrigger>

                        {_.children && _.children.length > 0 ?
                            <img alt="collapse icon" className="caret" src={_.showChildren ? COLLAPSE_ICON : EXPAND_ICON} onClick={e => {
                                e.stopPropagation();
                                if (selectedChild || this.state.searchTag) return;
                                _.showChildren = !_.showChildren;
                                this.forceUpdate();
                            }}/> : <span className="caret-empty"/>}

                        {
                            _.type === TYPE_CATEGORY ? null : <span className="tag-badge">{numberOfTaggedPics + numberOfTaggedAnnotations}</span>
                        }
                </span>
                </div>
                <div className="sub-tags">
                    {children}
                </div>
            </div>);

        return {html, hasSelectedChild: selected || selectedChild};

    };

    handleNewTagNameChange = event => {
        this.setState({newTagName: event.target.value});
    };

    handleEditTagSubmit = event => {
        console.log("Edit Form submitted....%o", event);
        const { t } = this.props;
        event.preventDefault();
        if (containsOnlyWhiteSpace(this.state.newEditTagName)){
            alert(t('alert_name_is_whitespace'));
            return false;
        }
        const newName = this.state.newEditTagName;
        const oldName = this.state.editTag;
        this.setState({editTag: '', newEditTagName: ''});
        this.props.editTag(oldName, newName);
    };

    handleCreateNewTagSubmit = event => {
        event.preventDefault();
        const _ = this.state.newTagName;
        this.setState({newTagName: ''});
        this.props.createTag(_);
        this.newTagInput.focus();

        if (this.props.autoSelectNew) {
            this.props.selectTag(_, false, this.props.tabName);
        }
    };

    handleClickOnTag = (event, tagName , tagType) => {
        if (event.shiftKey) {
            if (tagType === TYPE_CATEGORY){
                console.log('category selected do nothing..')
                return false;
            }
            const tags = this.state.draggableTags;
            if (tags.filter(tag => tag === tagName).length === 0) {
                tags.push(tagName);
            } else {
                tags.splice(tags.indexOf(tagName), 1);
            }
            this.setState({
                draggableTags: tags.filter(tag => tag.type === TYPE_TAG)
            });
        } else {
            const selected = this.state.selectedTags.indexOf(tagName) !== -1;
            if (tagType === TYPE_CATEGORY){
                console.log('category selected do nothing..')
                return false;
            }
            selected ? this.props.unselectTag(tagName, this.props.tabName) : this.props.selectTag(tagName, false, this.props.tabName);
        }
    };

    click_tagsSelectionMode = mode => {
        this.setState({tagsSelectionMode: mode});
        this.props.setTagsSelectionMode(mode, this.props.tabName);
    };

    render() {
        const { t } = this.props;
        let selectedTags;
        if (this.props.tab) {
            selectedTags = this.props.tab.selected_tags.length;
        } else {
            selectedTags = this.props.selectedTags.length;
        }
        return (
            <_Root>
                <Container className="bst rcn_tags">
                    <Row className="tags-header">
                        <Col className="tags-title" md={7} lg={7}><img src={TAGS} alt="tags-logo"/> {t('tags.title')}
                            ({selectedTags}/{this.state.tagsCount})
                            <img className="toogleCollapse" onClick={this.toggle}
                                 src={(this.state.collapse ? require('./pictures/arrow_down.svg') : require('./pictures/arrow_up.svg'))} alt="arrow-up-down"/>
                        </Col>
                        <Col
                            className={classnames('tags-actions')}
                            md={5} lg={5}>
                            <span title={t('tags.tooltip_sort_tags')}
                                  className={classnames({'hidden': !this.state.collapse || this.props.autoSelectNew}, "sort-icon", {'sort-selected-icon': this.state.showDialog === SORT_DIALOG})}
                                  onClick={_ => {
                                      if (this.state.showDialog === SORT_DIALOG)
                                          this.setState({showDialog: '', mergeTags: false});
                                      else
                                          this.setState({showDialog: SORT_DIALOG, mergeTags: false});
                                  }}/>
                            <span title={t('tags.tooltip_search_tags')}
                                  className={classnames({'hidden': !this.state.collapse || this.props.autoSelectNew}, "search-icon", {'search-selected-icon': this.state.showDialog === SEARCH_DIALOG})}
                                  onClick={_ => {
                                      if (this.state.showDialog === SEARCH_DIALOG)
                                          this.setState({showDialog: '', mergeTags: false});
                                      else
                                          this.setState({showDialog: SEARCH_DIALOG, mergeTags: false});
                                  }}/>
                            {this.state.showDialog === SORT_DIALOG ?
                                <div className="sort-dialog">
                                    <div
                                        className={classnames('dialog-item', {'dialog-item-selected': this.state.sortDirection === SORT_ALPHABETIC_DESC})}
                                        onClick={_ => {
                                            this._handleOnSortChange(SORT_ALPHABETIC_DESC);
                                            this.setState({showDialog: '', mergeTags: false});
                                        }}>{t('popup_sort.alphabetical')}
                                        <img alt="selected icon" src={SELECTED_ICON}/>
                                    </div>
                                    <div
                                        className={classnames('dialog-item', {'dialog-item-selected': this.state.sortDirection === SORT_ALPHABETIC_ASC})}
                                        onClick={_ => {
                                            this._handleOnSortChange(SORT_ALPHABETIC_ASC);
                                            this.setState({showDialog: '', mergeTags: false});
                                        }}>{t('popup_sort.alphabetical_inverted')}
                                        <img alt="selected icon" src={SELECTED_ICON}/>
                                    </div>
                                    <div
                                        className={classnames('dialog-item', {'dialog-item-selected': this.state.sortDirection === SORT_DATE_DESC})}
                                        onClick={_ => {
                                            this._handleOnSortChange(SORT_DATE_DESC);
                                            this.setState({showDialog: '', mergeTags: false});
                                        }}>{t('popup_sort.newest_to_oldest')}
                                        <img alt="selected icon" src={SELECTED_ICON}/>
                                    </div>
                                    <div
                                        className={classnames('dialog-item', {'dialog-item-selected': this.state.sortDirection === SORT_DATE_ASC})}
                                        onClick={_ => {
                                            this._handleOnSortChange(SORT_DATE_ASC);
                                            this.setState({showDialog: '', mergeTags: false});
                                        }}>{t('popup_sort.oldest_to_newest')}
                                        <img alt="selected icon" src={SELECTED_ICON}/>
                                    </div>
                                </div> : ''
                            }
                        </Col>
                    </Row>
                    <Collapse className="tags-collapse" isOpen={this.state.collapse}>
                        {this.state.showDialog !== '' && this.state.showDialog !== 'SORT_DIALOG' ?
                            <Row>
                                <Col className="action-panel">
                                    {this.state.showDialog === MERGE_DIALOG ?
                                        <span>{t('tags.lbl_drag_and_drop_tags_to_merge_them')}</span> : ''}

                                    {this.state.showDialog === SEARCH_DIALOG ?
                                        <Input autoFocus placeholder={t('global.search')} type="text"
                                               value={this.state.searchTag || ''}
                                               onChange={e => this.setState({searchTag: e.target.value})}/> : ''
                                    }

                                    {this.state.showDialog === ADD_DIALOG ?
                                        <Form onSubmit={this.handleCreateNewTagSubmit}>
                                            <Input autoFocus placeholder={t('tags.textbox_placeholder_tag_name')}
                                                   type="text"
                                                   name="name"
                                                   value={this.state.newTagName}
                                                   onChange={this.handleNewTagNameChange}
                                                   innerRef={_ => this.newTagInput = _}
                                            />
                                        </Form> : ''
                                    }
                                </Col>
                            </Row> : ''
                        }
                        <Row
                            className={classnames({'not_visible': this.props.autoSelectNew})}>
                            <Col md={1} lg={1}>
                                <Input type="checkbox"
                                       name="name"
                                       checked={this.state.tagsSelectionMode === TAGS_SELECTION_MODE_AND}
                                       onChange={() => {
                                           if (this.state.tagsSelectionMode === TAGS_SELECTION_MODE_OR) {
                                               this.click_tagsSelectionMode(TAGS_SELECTION_MODE_AND);
                                           } else {
                                               this.click_tagsSelectionMode(TAGS_SELECTION_MODE_OR);
                                           }
                                       }}
                                />
                            </Col>
                            <Col md={10} lg={10} className="tagCheckBoxLabel">{t('tags.checkbox_show_resources_with_all_selected_keywords')}
                            </Col>
                        </Row>

                        <div className="tags" id="tagRoot" draggable={true}
                             onDragOver={e => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 if (e.target.classList.contains('tags'))
                                     e.target.classList.add('root-hover');
                             }}

                             onDragEnd={e => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 document.getElementById('tagRoot').classList.remove('root-hover');
                             }}

                             onDragExit={e => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 e.target.classList.remove('root-hover');
                             }}

                             onDrop={e => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 document.getElementById('tagRoot').classList.remove('root-hover');
                                 this._onDrop(e, "ROOT");
                             }}>
                            {this.state.sortedTags.map(_ => {
                                const response = this._renderTags(_);
                                return response && response.html;
                            })}
                        </div>
                        <div>
                            {!this.props.isImport ?
                                <ContextMenu id="tag_context_menu">
                                    <MenuItem data={{action: 'open'}} onClick={this._handleContextMenu}>
                                        <img alt="open" src={OPEN}/> {t('tags.context_menu_open_selection_in_new_tab')}
                                    </MenuItem>
                                </ContextMenu> : ''}
                        </div>
                    </Collapse>
                </Container>
            </_Root>
        );
    }

    _handleContextMenu = (e, data) => {
        const { t } = this.props;
        switch (data.action) {
            case 'edit':
                this.setState({
                    editTag: data.tagName,
                    newEditTagName: data.tagName
                });
                break;
            case 'delete':
                const result = remote.dialog.showMessageBox(remote.getCurrentWindow () ,{
                    type: 'question',
                    buttons: ['Yes', 'No'],
                    message: t('tags.alert_delete_tag_message', {tag: data.tagName}),
                    cancelId: 1,
                    detail: t('global.delete_confirmation')
                });
                if (result === 0) this.props.deleteTag(data.tagName);
                break;
            case 'open':
                this.props.openInNewTab(data.tagName);
                break;
        }
    };

    _renderTags = (_) => {
        if (this.state.searchTag) {
            if (!(_.name.toLowerCase().includes(this.state.searchTag.toLowerCase()) ||
                (_.children && this._tagExist(_.children, this.state.searchTag.toLowerCase()))
            )) {
                return
            }
        }
        if (this.state.editTag === _.name) {
            return {html: this._editTagsList(_), hasSelectedChild: false};
        } else {
            const response = this._createTagsList(_);
            return {html: response.html, hasSelectedChild: response.hasSelectedChild};
        }
    };

    _tagExist = (tags, name) => {
        return tags.some(tag => {
            if (tag.name.toLowerCase().includes(name)) {
                return true;
            } else if (tag.children && tag.children.length > 0) {
                return this._tagExist(tag.children, name);
            } else {
                return false;
            }
        });
    };

    _handleOnSortChange = (sortBy) => {
        this.props.saveTagSort(this.props.tabName, sortBy);
        this.setState({
            sortedTags: this._sortTags(this.state.sortedTags, sortBy)
        });
    };

    _sortTags = (tags, direction) => {
        tags.map(tag => {
            if (tag.children) {
                this._sortTags(tag.children, direction);
            }
        });
        return sortTagsAlphabeticallyOrByDate(tags , direction);
    };

}
