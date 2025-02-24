import React, {Component, Fragment} from 'react';
import {
    Button, Col, Container, Form, FormGroup, Input, Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader, Row,
} from 'reactstrap';

import styled from "styled-components";
import PLUS from "./pictures/xper_logo.svg";
import {
    getDescriptorsForItem,
    getDescriptorsForItems,
    getKnowledgeBasesDetails,
    searchItemsInKb,
    searchKb, summarizeItem
} from "../utils/xper_mono";
import Chance from "chance";
import {categoryExists} from "./event/utils";
import {createNewCategory, createNewTag, getXperCategory} from "./tags/tagUtils";
import {TAG_XPER} from "../constants/constants";
import {tagExist} from "../utils/tags";
import {SUPPORTED_LANGUAGES} from "../i18n";
import {stripHTMLUsingTempElement, containsHTMLTags} from "../utils/js";
import {ee, EVENT_XPER_SUMMARIZATION_RESPONSE} from "../utils/library";
import Markdown from "react-markdown";
import EDIT_SUMMARY from "./pictures/edit-annotation.svg";
import SAVE_SUMMARY from "./pictures/save.svg";
import {DotLoader} from "react-spinners";

const chance = new Chance();

const _SearchFormContainer = styled.div`
    border: 1px solid #dee2e6;
    border-radius: 5px;
    padding-top: 10px;
`;

const _ResultsPlaceholder = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    flex-direction: column;
`;

const _ResultsContainer = styled.div`
    overflow-y: auto;
    height: 400px;
    border: 1px solid #dee2e6;
    border-radius: 5px;
    margin-top: 10px;
`;

const _ResultItem = styled.div`
    display: flex;
    justify-content: space-between;
    flex-direction: row;
    border-bottom: 1px solid #dee2e6;
    padding: 5px 15px 5px 0px;
    width: 100%;
    align-items: center;
`;

const _ResultItemButton = styled.div`
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    align-items: center;
    justify-items: center;
    margin-left: 10px;
    margin-right: 10px;
    cursor: pointer;

    img {
        cursor: pointer;
    }
`;

const _ResultItemDetails = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    flex-direction: column;
    flex-grow: 1;
    padding-left: 10px;
    border-left: 1px solid #dee2e6;

    h4 {
        margin-bottom: 0;
    }
`;

const _MatchingResultsContainer = styled.div`
    margin-top: 10px;
    border: 1px solid #0188ff;
    border-radius: 5px;
    padding-top: 5px;
`;

const _MatchingResultsInfoContainer = styled.div`
    font-size: 15px;
    font-weight: bold;
    width: 100%;
    padding-bottom: 5px;
    padding-top: 5px;
`;

const _MatchedPicturesForItemContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #dee2e6;
    padding-top: 3px;
    padding-bottom: 3px;
`;

const _KbDetailsContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    flex-direction: column;
    width: 100%;
    border: 1px solid #dee2e6;
    border-radius: 5px;
`;

const _KbDetailsAttribute = styled.div`
    padding: 5px;
    font-size: 14px;
    width: 100%;
`;

const _KbDetailsHeader = styled.div`
    padding: 5px;
    font-size: 16px;
    background-color: #eee;
    width: 100%;
`;

const _KbDetailsLabel = styled.span`
    font-weight: bold;
    margin-right: 10px;
`;

const _ItemDetailsScrollContainer = styled.div`
    height: 350px;
    overflow-y: auto;
    border: 1px solid #dee2e6;
    border-radius: 5px;
`;

const _ItemDetailsActions = styled.div`
    padding: 5px 0 5px 0;
    display: flex;
    justify-content: space-between;
`;

const _ItemSummarizedDescription = styled.div`
    overflow-y: auto;
    border: 1px solid #dee2e6;
    border-radius: 5px;
    height: 200px;
    padding: 5px;
`;

const _ItemDetailsContainer = styled.div`
    padding: 5px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    flex-direction: column;
    width: 100%;
`;

const _ItemDetailsValueContainer = styled.div`
    display: flex;
    padding: 5px 8px 5px 8px;
    margin-bottom: 10px;
    width: 100%;
    border: 1px solid #dee2e6;
    border-radius: 5px;

    .form-check-input {
        position: relative !important;
        margin-top: 0 !important;
        margin-left: 0 !important;
    }

    .item-details-text {
        margin-left: 5px;
    }
`;

const _ItemDescriptorContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 5px 5px 5px 20px;
    margin-bottom: 5px;
    width: 100%;
    border-bottom: 1px solid #dee2e6;

    .form-check-input {
        position: relative !important;
        margin-top: 0 !important;
        margin-left: 0 !important;
    }
`;

const _ItemDescriptorNameContainer = styled.label`
    height: 10px;
    font-weight: bold;
    margin-top: 0;
    margin-left: 5px;
    margin-bottom: 0 !important;
`;

const _ItemCategoricalDescriptorContainer = styled.ul`
    padding-top: 5px;
    margin-bottom: 0 !important;
    padding-left: 20px;
`;

const _ItemQuantitativeDescriptorContainer = styled.div`
    display: flex;
    margin-top: 10px;

    div {
        margin-left: 5px;
        margin-right: 20px;
    }
`;

const _ItemDescriptorValueNotProvidedContainer = styled.div`
    color: #c84d4d;
    margin-top: 5px;
    margin-left: 5px;
`;

function _getScientificName(resource) {
    return resource.erecolnatMetadata && resource.erecolnatMetadata.scientificname
        ? Array.isArray(resource.erecolnatMetadata.scientificname) ?
            resource.erecolnatMetadata.scientificname.map(name => name.toLowerCase().trim()).join(';') :
            resource.erecolnatMetadata.scientificname.toLowerCase().trim() : '';
}

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = {
            openModal: props.openModal,
            folder: props.folder,
            resource: props.resource,
            searchTerm: this._isMatchResourceMode() ? _getScientificName(this.props.resource) : '',
            selectedLanguage: props.i18n.language,
            searchTaxonomy: !this._isMatchResourceMode(),
            searchStratigraphy: !this._isMatchResourceMode(),
            searchHabitat: !this._isMatchResourceMode(),
            searchGeography: !this._isMatchResourceMode(),
            searchItems: true,
            searchItemGroups: !this._isMatchResourceMode(),
            searchDescriptor: !this._isMatchResourceMode(),
            searchDescriptorGroups: !this._isMatchResourceMode(),
            searchStates: !this._isMatchResourceMode(),
            searchKeywords: !this._isMatchResourceMode(),
            kbSearchResults: [],
            tagName: '',
            addAsTag: false,
            addKbNameAsTag: true,
            createAnnotations: true,
            kbWithDetails: {},
            openKbDetailsModal: false,
            itemWithDetails: {},
            openItemDetailsModal: false,
            selectedItem: null,
            descriptorSelection: {},
            itemDetailsSelection: {},
            itemDetailsSummarization: {},
            kbSearchDone: false,
            matchResourceDone: false,
            itemSummarizationInProcess: false,
            itemSummarizationEdit: false,
            itemDetailsSummarizationValue: ''
        };
    }

    componentDidMount() {
        ee.on(EVENT_XPER_SUMMARIZATION_RESPONSE, this._xperSummarizationResponse);
        if (this._isMatchResourceMode()) {
            this._onSearchXper();
        }
    }

    componentWillUnmount() {
        ee.removeListener(EVENT_XPER_SUMMARIZATION_RESPONSE, this._xperSummarizationResponse);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.openModal !== this.props.openModal) {
            this.setState({
                openModal: this.props.openModal
            });
        }
        if (prevProps.folder !== this.props.folder) {
            this.setState({
                folder: this.props.folder
            });
        }
        if (prevProps.xperMatchedResources !== this.props.xperMatchedResources) {
            this.setState({
                xperMatchedResources: this.props.xperMatchedResources
            });
        }
    }

    _isMatchResourceMode = () => {
        return !!this.props.resource;
    }

    _formChangeHandler = (event) => {
        console.log('_formChangeHandler', event.target.name, event.target.type, event.target.value, event.target.checked);
        const {name, type, value, checked} = event.target;
        if (type === 'checkbox') {
            this.setState({
                [name]: checked
            });
        } else {
            this.setState({
                [name]: value
            });
        }
    };

    _descriptorSelectionChangeHandler = (event) => {
        const {name, type, value, checked} = event.target;
        const item = this.state.selectedItem;
        this.setState({
            descriptorSelection: {
                ...this.state.descriptorSelection,
                [item]: {
                    ...this.state.descriptorSelection[item],
                    [name]: checked
                }
            }
        });
    };

    _itemDetailsSelectionChangeHandler = (event) => {
        const {name, type, value, checked} = event.target;
        const item = this.state.selectedItem;
        this.setState({
            itemDetailsSelection: {
                ...this.state.itemDetailsSelection,
                [item]: checked
            }
        });
    };

    _itemDetailsSummarizationLangChangeHandler = (event) => {
        const {name, type, value, checked} = event.target;
        const item = this.state.selectedItem;
        this.setState({
            itemDetailsSummarization: {
                ...this.state.itemDetailsSummarization,
                [item]: {
                    lang: value,
                    summary: ''
                }
            }
        });
    };

    _matchResourcesWithKBHandler = (kb) => {
        searchItemsInKb({kb: kb.id, lang: this.state.selectedLanguage}, (result) => {
            if (result && this.props.xperMatchResources) {
                this.props.xperMatchResources(this.state.folder, {kb: kb, items: result}, this.state.resource);
            }
            this.setState({
                tagName: this.state.searchTerm,
                addAsTag: false,
                itemWithDetails: {},
                openItemDetailsModal: false,
                descriptorSelection: {},
                itemDetailsSelection: {},
                itemDetailsSummarization: {},
                matchResourceDone: true
            });
        });
    }

    _onSelectDescriptors = (item) => {
        getDescriptorsForItem({item: item, lang: this.state.selectedLanguage}, (result) => {
            if (result) {
                let descriptorSelection = {};
                for (const descriptor of result.descriptors) {
                    descriptorSelection[descriptor.id] = true;
                }
                this.setState({
                    itemWithDetails: {
                        ...this.state.itemWithDetails,
                        [item]: result
                    },
                    selectedItem: item
                });
                if (!this.state.descriptorSelection || !this.state.descriptorSelection[item]) {
                    this.setState({
                        descriptorSelection: {
                            ...this.state.descriptorSelection,
                            [item]: descriptorSelection
                        }
                    });
                }
                if(!this.state.itemDetailsSummarization[item]) {
                    this.setState({
                        itemDetailsSummarization: {
                            ...this.state.itemDetailsSummarization,
                            [item]: {lang: this.state.selectedLanguage, summary: ''}
                        }
                    });
                }
                this._toggleItemDetails();
            }
        });
    }

    _onCreateXperTag = () => {
        if (!this.state.xperMatchedResources.matchedResources) {
            console.log('No matched resources');
            return;
        }
        let missingItemDescriptors = [];
        if (!this.state.descriptorSelection || Object.keys(this.state.descriptorSelection).length === 0) {
            missingItemDescriptors = this.state.xperMatchedResources.matchedResources.map((matchedResource) => {
                return matchedResource.item;
            });
        } else {
            for (const matchedResource of this.state.xperMatchedResources.matchedResources) {
                if (!this.state.descriptorSelection[matchedResource.item]) {
                    missingItemDescriptors.push(matchedResource.item);
                }
            }
        }
        let allDescriptorSelection = {...this.state.descriptorSelection};
        let allItemsWithDetails = {...this.state.itemWithDetails};
        let allItemDetailsSummarization = {...this.state.itemDetailsSummarization};
        if (missingItemDescriptors.length > 0) {
            getDescriptorsForItems({items: missingItemDescriptors, lang: this.state.selectedLanguage}, (result) => {
                if (result) {
                    for (const item of result) {
                        allItemsWithDetails[item.id] = item;
                        let descriptorSelection = {};
                        for (const descriptor of item.descriptors) {
                            descriptorSelection[descriptor.id] = true;
                        }
                        allDescriptorSelection[item.id] = descriptorSelection;
                    }
                }
                this._doCreateXperTag(allItemsWithDetails, allDescriptorSelection, allItemDetailsSummarization);
            });
        } else {
            this._doCreateXperTag(allItemsWithDetails, allDescriptorSelection, allItemDetailsSummarization);
        }
    }

    _doCreateXperTag = (itemsWithDetails, descriptorsSelection, itemsSummarization) => {
        // console.log('Creating Xper tag', this.state);
        console.log('Creating Xper tag', itemsWithDetails, descriptorsSelection, itemsSummarization);
        const customTagName = this.state.addAsTag ? this.state.tagName : null;
        const kbTagName = this.state.addKbNameAsTag ? "KB " + this.props.xperMatchedResources.xper.kb.name : null;
        const tags = [];
        if (customTagName) {
            tags.push(customTagName);
        }
        if (kbTagName) {
            tags.push(kbTagName);
        }
        let resourcesXperData = {};
        for (const matchedResource of this.state.xperMatchedResources.matchedResources) {
            for (const resource of matchedResource.resources) {
                let resourceXperData = resourcesXperData[resource.sha1] ? resourcesXperData[resource.sha1] : {
                    "kb_name": this.props.xperMatchedResources.xper.kb.name,
                    "kb_id": this.props.xperMatchedResources.xper.kb.id,
                    "kb_language": this.state.selectedLanguage,
                    "items": [],
                };
                let itemWithDetail = itemsWithDetails[matchedResource.item]
                if (itemWithDetail) {
                    if (itemWithDetail.descriptors) {
                        itemWithDetail.descriptors = itemWithDetail.descriptors.filter(descriptor => descriptorsSelection[itemWithDetail.id][descriptor.id]);
                    } else {
                        itemWithDetail.descriptors = []
                    }
                    if (this.state.itemDetailsSelection[itemWithDetail.id] && itemWithDetail.detail) {
                        if (containsHTMLTags(itemWithDetail.detail)) {
                            itemWithDetail.detail = stripHTMLUsingTempElement(itemWithDetail.detail);
                        }
                    } else {
                        itemWithDetail.detail = '';
                    }
                    if(itemsSummarization[itemWithDetail.id]) {
                        itemWithDetail.summary = itemsSummarization[itemWithDetail.id].summary;
                    }
                    resourceXperData.items.push(itemsWithDetails[matchedResource.item]);
                } else {
                    for (const item of this.state.xperMatchedResources.xper.items) {
                        if (item.id === matchedResource.item) {
                            resourceXperData.items.push(item);
                            break;
                        }
                    }
                }
                resourcesXperData[resource.sha1] = resourceXperData;
            }
        }

        if (!categoryExists(this.props.tags, 'Xper')) {
            this.props.createCategory(createNewCategory(chance.guid(), 'Xper'));
        }
        setTimeout(() => {
            const folder = this.state.xperMatchedResources.folder;
            const xperCategory = getXperCategory(this.props.tags);
            if (kbTagName && !tagExist(this.props.tags, kbTagName)) {
                this.props.addSubCategory(TAG_XPER, createNewTag(chance.guid(), kbTagName), false, xperCategory.id)
            }
            if (customTagName && !tagExist(this.props.tags, customTagName)) {
                this.props.addSubCategory(TAG_XPER, createNewTag(chance.guid(), customTagName), false, xperCategory.id)
            }
            for (const resource in resourcesXperData) {
                if (kbTagName) {
                    this.props.tagPicture(resource, kbTagName);
                }
                if (customTagName) {
                    this.props.tagPicture(resource, customTagName);
                }
                if (this.state.createAnnotations) {
                    this.props.createAnnotationXper(resource, resourcesXperData[resource]);
                    this.props.createAnnotationXperSummary(resource, resourcesXperData[resource]);
                }
            }
            this.props.xperMatchResources(null, null, null);
            if (this._isMatchResourceMode()) {
                this.setState({
                    addAsTag: false,
                    addKbNameAsTag: true,
                    createAnnotations: true,
                    kbWithDetails: {},
                    openKbDetailsModal: false,
                    itemWithDetails: {},
                    openItemDetailsModal: false,
                    descriptorSelection: {},
                    itemDetailsSelection: {},
                    itemDetailsSummarization: {},
                    kbSearchDone: false,
                    matchResourceDone: false,
                    itemSummarizationInProcess: false,
                    itemSummarizationEdit: false,
                    itemDetailsSummarizationValue: ''
                });
            }
            this._toggle(tags, folder);
        }, 100);
    }

    resetState = () => {
        this.setState({
            searchTerm: '',
            selectedLanguage: this.props.i18n.language,
            searchTaxonomy: true,
            searchStratigraphy: true,
            searchHabitat: true,
            searchGeography: true,
            searchItems: true,
            searchItemGroups: true,
            searchDescriptor: true,
            searchDescriptorGroups: true,
            searchStates: true,
            searchKeywords: true,
            kbSearchResults: [],
            tagName: '',
            addAsTag: false,
            addKbNameAsTag: true,
            createAnnotations: true,
            kbWithDetails: {},
            openKbDetailsModal: false,
            itemWithDetails: {},
            openItemDetailsModal: false,
            descriptorSelection: {},
            itemDetailsSelection: {},
            itemDetailsSummarization: {},
            kbSearchDone: false,
            matchResourceDone: false,
            itemSummarizationEdit: false,
            itemSummarizationInProcess: false,
            itemDetailsSummarizationValue: ''
        });
    }

    _onSearchXper = () => {
        this.props.xperMatchResources(null, null, null);
        searchKb({
            q: this.state.searchTerm,
            lang: this.state.selectedLanguage,
            taxonomy: this.state.searchTaxonomy,
            stratigraphy: this.state.searchStratigraphy,
            habitat: this.state.searchHabitat,
            geography: this.state.searchGeography,
            item: this.state.searchItems,
            item_group: this.state.searchItemGroups,
            descriptor: this.state.searchDescriptor,
            descriptor_group: this.state.searchDescriptorGroups,
            state: this.state.searchStates,
            keyword: this.state.searchKeywords
        }, (result) => {
            if (result) {
                this.setState({
                    kbSearchResults: result,
                    kbSearchDone: true
                });
            }
        });
    }

    _onShowKbDetailsHandler = (kb) => {
        getKnowledgeBasesDetails({kb: kb.id, lang: this.state.selectedLanguage}, (result) => {
            if (result) {
                this.setState({
                    kbWithDetails: result
                });
                this._toggleKbDetails();
            }
        });
    }

    _toggleKbDetails = () => {
        this.setState({
            openKbDetailsModal: !this.state.openKbDetailsModal
        });
    };

    _toggleItemDetails = () => {
        this.setState({
            openItemDetailsModal: !this.state.openItemDetailsModal,
        });
    };

    _onBulkChangeDescriptorSelection = (select) => {
        let descriptorSelection = this.state.descriptorSelection[this.state.selectedItem];
        for (const descriptor in descriptorSelection) {
            descriptorSelection[descriptor] = select;
        }
        this.setState({
            descriptorSelection: {
                ...this.state.descriptorSelection,
                [this.state.itemWithDetails.id]: descriptorSelection
            }
        });
    };

    _onCancelSummarizeItem = () => {
        let summarizedItemLang = this.state.itemDetailsSummarization[this.state.selectedItem].lang;
        this.setState(
            {
                itemSummarizationInProcess: false,
                itemDetailsSummarization: {
                    ...this.state.itemDetailsSummarization,
                    [this.state.selectedItem]: {
                        lang: summarizedItemLang,
                        summary: ''
                    }
                }
            }
        );
    }

    _onSummarizeItem = () => {
        let xperData =  {
            "kb_name": this.props.xperMatchedResources.xper.kb.name,
            "kb_id": this.props.xperMatchedResources.xper.kb.id,
            "kb_language": this.state.selectedLanguage,
            "items": [],
        };
        let itemsWithDetails = {...this.state.itemWithDetails};
        let descriptorsSelection = {...this.state.descriptorSelection};
        let itemWithDetail = {...itemsWithDetails[this.state.selectedItem]}
        if (itemWithDetail) {
            if (itemWithDetail.descriptors) {
                itemWithDetail.descriptors = itemWithDetail.descriptors.filter(descriptor => descriptorsSelection[itemWithDetail.id][descriptor.id]);
            } else {
                itemWithDetail.descriptors = []
            }
            if (this.state.itemDetailsSelection[itemWithDetail.id] && itemWithDetail.detail) {
                if (containsHTMLTags(itemWithDetail.detail)) {
                    itemWithDetail.detail = stripHTMLUsingTempElement(itemWithDetail.detail);
                }
            } else {
                itemWithDetail.detail = '';
            }
            xperData.items.push(itemWithDetail);
        }
        const chance = new Chance();
        const requestId = chance.guid();

        summarizeItem({
            requestId: requestId,
            xperData: xperData,
            lang: this.state.itemDetailsSummarization[this.state.selectedItem].lang
        }, () => {
                return this.state.itemSummarizationInProcess;
            }
        ).then(r => {
            this.setState({
                itemSummarizationInProcess: false
            });
        });

        this.setState({
            itemSummarizationInProcess: true,
            itemDetailsSummarization: {
                ...this.state.itemDetailsSummarization,
                [this.state.selectedItem]: {
                    lang: this.state.itemDetailsSummarization[this.state.selectedItem].lang,
                    summary: ''
                }
            }
        });
    };

    _xperSummarizationResponse = (data) => {
        if(!this.state.itemSummarizationInProcess) return;
        let summarizedItemDescription = this.state.itemDetailsSummarization[this.state.selectedItem].summary + data ;
        let summarizedItemLang = this.state.itemDetailsSummarization[this.state.selectedItem].lang;
        this.setState(
            {itemDetailsSummarization: {
                    ...this.state.itemDetailsSummarization,
                    [this.state.selectedItem]: {
                        lang: summarizedItemLang,
                        summary: summarizedItemDescription
                    }}
            }
        );
    }

    _onEditItemSummarization = () => {
        this.setState({
            itemSummarizationEdit: true,
            itemDetailsSummarizationValue: this.state.itemDetailsSummarization[this.state.selectedItem].summary
        });
    }

    _onSaveItemSummarization = () => {
        let summarizedItemDescription = this.state.itemDetailsSummarizationValue;
        let summarizedItemLang = this.state.itemDetailsSummarization[this.state.selectedItem].lang;
        this.setState({
            itemSummarizationEdit: false,
            itemDetailsSummarizationValue: '',
            itemDetailsSummarization: {
                ...this.state.itemDetailsSummarization,
                [this.state.selectedItem]: {
                    lang: summarizedItemLang,
                    summary: summarizedItemDescription
                }}
        });
    }

    _openLink = (url) => {
        require("electron").shell.openExternal(url);
    };

    _toggle = (tags, folder) => {
        if (this.props.onClose) {
            this.props.onClose(tags, folder);
        }
        this.props.xperMatchResources(null, null, null);
        if (!this._isMatchResourceMode()) {
            this.resetState()
        }
    };

    _shouldDisplayNoMatchedResources() {
        if (this.state.kbSearchResults.length === 0 && this.state.kbSearchDone) return true;
        return this.state.matchResourceDone &&
            (!this.state.xperMatchedResources
                || !this.state.xperMatchedResources.matchedResources
                || this.state.xperMatchedResources.matchedResources.length === 0);
    }

    findItem = (item_id) => {
        for (const item of this.state.xperMatchedResources.xper.items) {
            if (item.id === item_id) {
                return item.name;
            }
        }
    }

    render() {
        const {t} = this.props;
        return (
            <div>
                <Modal isOpen={this.state.openModal} className="my50PctSizedModal" toggle={this._toggle}
                       contentClassName="custom-modal-style" wrapClassName="bst"
                       scrollable={false}
                       autoFocus={false}>
                    <ModalHeader toggle={this._toggle}>
                        {t('folders.xper_mono_search_dialog.title')}
                    </ModalHeader>
                    <ModalBody className="xper-mono-search">
                        {!this._isMatchResourceMode() && this.renderSearchFormContainer(t)}

                        {this.renderMatchedResultsContainer(t)}

                        {this.renderKbSearchResultsContainer(t)}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={this._toggle}>{t('global.close')}</Button>
                    </ModalFooter>
                </Modal>
                {this.renderKbDetailsModal(t)}
                {this.renderItemDetailsModal(t)}
            </div>
        );
    }

    renderKbSearchResultsContainer(t) {
        return this.state.kbSearchResults.length > 0 &&
            <_ResultsContainer>
                <_ResultsPlaceholder>
                    {
                        this.state.kbSearchResults.map((kb, index) => {
                            return (
                                <_ResultItem key={index} style={(this.state.xperMatchedResources
                                    && this.state.xperMatchedResources.xper
                                    && this.state.xperMatchedResources.xper.kb.id === kb.id) ? {backgroundColor: '#bfdeff'} : {}}>
                                    <_ResultItemButton
                                        title={t('folders.xper_mono_search_dialog.btn_tooltip_show_kb_details')}>
                                        <img alt="Select Xper KB" src={PLUS}
                                             onClick={() => this._onShowKbDetailsHandler(kb)}
                                             style={{width: '25px'}}/>
                                        {(kb.logoUrl && kb.logoUrl.length > 0) &&
                                            <div>
                                                <img src={kb.logoUrl} alt={""} style={{width: '25px'}}/>
                                            </div>
                                        }
                                    </_ResultItemButton>
                                    <_ResultItemDetails>
                                        <div style={{cursor: 'pointer', fontSize: '16px', fontWeight: "bold"}}
                                             onClick={() => this._onShowKbDetailsHandler(kb)}>
                                            {kb.name}
                                        </div>
                                        {kb.authors &&
                                            <div style={{
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: "bold",
                                                marginTop: '5px',
                                                color: "dimgrey"
                                            }} onClick={() => this._onShowKbDetailsHandler(kb)}> {kb.authors}</div>
                                        }
                                        {kb.detail &&
                                            <div style={{
                                                cursor: 'pointer',
                                                marginTop: '5px'
                                            }} onClick={() => this._onShowKbDetailsHandler(kb)}>{kb.detail}</div>
                                        }
                                    </_ResultItemDetails>
                                    <Button color="secondary"
                                            size=""
                                            style={{whiteSpace: 'nowrap'}}
                                            onClick={() => this._matchResourcesWithKBHandler(kb)}>
                                        {t('folders.xper_mono_search_dialog.btn_match_resources')}
                                    </Button>
                                </_ResultItem>
                            )
                        })
                    }
                </_ResultsPlaceholder>
            </_ResultsContainer>;
    }

    renderMatchedResultsContainer(t) {
        if (this._shouldDisplayNoMatchedResources()) {
            return (
                <div style={{
                    fontSize: '14px',
                    margin: '10px 5px 5px 5px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    height: '100%',
                }}>
                    {t('folders.xper_mono_search_dialog.lbl_no_xper_matching_resource_found')}
                </div>
            );
        }

        return (
            this.state.xperMatchedResources && this.state.xperMatchedResources.matchedResources && this.state.xperMatchedResources.matchedResources.length > 0 ? (
                <_MatchingResultsContainer>
                    <Container className="matching-results-container">
                        <Row>
                            <Col sm={12} md={12} lg={12}>
                                <_MatchingResultsInfoContainer>
                                    {this.state.xperMatchedResources.matchedResources.map((matchedResource, index) => (
                                        <div key={index}>
                                            <_MatchedPicturesForItemContainer>
                                                <div style={{fontSize: '14px'}}>
                                                    {t('folders.xper_mono_search_dialog.btn_match_resources_info', {
                                                        numOfMatchedResources: matchedResource.resources.length,
                                                        numOfProcessedResources: this.state.xperMatchedResources.numOfProcessedResources,
                                                        item: this.findItem(matchedResource.item),
                                                    })}
                                                </div>
                                                <Button color="secondary"
                                                        onClick={() => this._onSelectDescriptors(matchedResource.item)}>
                                                    {t('folders.xper_mono_search_dialog.btn_select_descriptors')}
                                                </Button>
                                            </_MatchedPicturesForItemContainer>
                                        </div>
                                    ))}
                                </_MatchingResultsInfoContainer>
                            </Col>
                        </Row>

                        <Fragment>
                            <Row style={{marginTop: '5px'}}>
                                <Col sm={4} md={4} lg={4}>
                                    <Input type="text" name="tagName" id="tag-name"
                                           value={this.state.tagName}
                                           onChange={this._formChangeHandler}/>
                                </Col>
                                <Col sm={2} md={2} lg={2}>
                                    <FormGroup style={{marginTop: '7px', marginBottom: '0px'}}>
                                        <Input name="addAsTag" id="add-as-tag"
                                               type="checkbox"
                                               checked={this.state.addAsTag}
                                               disabled={!this.state.tagName}
                                               onChange={this._formChangeHandler}/>
                                        <Label for="add-as-tag" className="form-check-label pointer">
                                            {t('folders.xper_mono_search_dialog.lbl_add_as_tag')}
                                        </Label>
                                    </FormGroup>
                                </Col>
                                <Col sm={3} md={3} lg={3}>
                                    <FormGroup style={{marginTop: '7px', marginBottom: '0px'}}>
                                        <Input name="addKbNameAsTag" id="add-kb-name-as-tag"
                                               type="checkbox"
                                               checked={this.state.addKbNameAsTag}
                                               onChange={this._formChangeHandler}/>
                                        <Label for="add-kb-name-as-tag" className="form-check-label pointer">
                                            {t('folders.xper_mono_search_dialog.lbl_include_kb_name_as_tag')}
                                        </Label>
                                    </FormGroup>
                                </Col>
                                <Col sm={3} md={3} lg={3}>
                                    <FormGroup style={{marginTop: '7px', marginBottom: '0px'}}>
                                        <Input name="createAnnotations" id="create_annotations"
                                               type="checkbox"
                                               checked={this.state.createAnnotations}
                                               onChange={this._formChangeHandler}/>
                                        <Label for="create_annotations" className="form-check-label pointer">
                                            {t('folders.xper_mono_search_dialog.lbl_create_annotations')}
                                        </Label>
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row>
                                <Col style={{display: 'flex', justifyContent: 'center', marginTop: '10px'}}>
                                    <Button color="primary" disabled={
                                        (!this.state.addAsTag && !this.state.addKbNameAsTag) ||
                                        (!this.state.tagName && !this.state.addKbNameAsTag)
                                    } onClick={() => this._onCreateXperTag()}>
                                        {t('folders.xper_mono_search_dialog.btn_tag_images')}
                                    </Button>
                                </Col>
                            </Row>
                        </Fragment>
                    </Container>
                </_MatchingResultsContainer>
            ) : (<div/>)
        );
    }

    renderSearchFormContainer(t) {
        return <_SearchFormContainer>
            <Form onSubmit={(e) => {
                e.preventDefault();
            }} className="tag-form">
                <Container>
                    <Row>
                        <Col sm={7} md={7} lg={7} className="options-form-field-label">
                            <Input type="text" name="searchTerm" id="search_term"
                                   value={this.state.searchTerm}
                                   placeholder={t('folders.xper_mono_search_dialog.search_terms_placeholder')}
                                   onChange={this._formChangeHandler}/>
                        </Col>
                        <Col sm={3} md={3} lg={3}>
                            <Input type="select" name="selectedLanguage" bsSize="md"
                                   title={t('global.options.select_language.tooltip')}
                                   placeholder={t('folders.xper_mono_search_dialog.language_placeholder')}
                                   value={this.state.selectedLanguage}
                                   onChange={this._formChangeHandler}>
                                {
                                    SUPPORTED_LANGUAGES.map(lang => {
                                        return (
                                            <option key={lang}
                                                    value={lang}
                                                    title={t('global.languages.' + lang.toUpperCase())}>
                                                {t('global.languages.' + lang.toUpperCase())}
                                            </option>
                                        )
                                    })
                                }
                            </Input>
                        </Col>
                        <Col sm={2} md={2} lg={2} style={{display: 'flex', justifyContent: 'flex-end'}}>
                            <Button color="primary"
                                    disabled={!this.state.searchTerm || this.state.searchTerm.length === 0}
                                    onClick={() => this._onSearchXper()}>{t('global.search')}</Button>
                        </Col>
                    </Row>
                    <Row className="search-options">
                        <Container>
                            <Row>
                                <Col sm={2} md={2} lg={2}>
                                    <FormGroup>
                                        <Input name="searchTaxonomy" id="search-taxonomy"
                                               type="checkbox"
                                               checked={this.state.searchTaxonomy}
                                               onChange={this._formChangeHandler}/>
                                        <Label for="search-taxonomy"
                                               className="form-check-label pointer">
                                            {t('folders.xper_mono_search_dialog.lbl_taxonomy')}
                                        </Label>
                                    </FormGroup>
                                </Col>
                                <Col sm={2} md={2} lg={2}>
                                    <FormGroup>
                                        <Input name="searchStratigraphy"
                                               id="search-stratigraphy" type="checkbox"
                                               checked={this.state.searchStratigraphy}
                                               onChange={this._formChangeHandler}/>
                                        <Label for="search-stratigraphy"
                                               className="form-check-label pointer">
                                            {t('folders.xper_mono_search_dialog.lbl_stratigraphy')}
                                        </Label>
                                    </FormGroup>
                                </Col>
                                <Col sm={2} md={2} lg={2}>
                                    <FormGroup>
                                        <Input name="searchHabitat" id="search-habitat"
                                               type="checkbox"
                                               checked={this.state.searchHabitat}
                                               onChange={this._formChangeHandler}/>
                                        <Label for="search-habitat"
                                               className="form-check-label pointer">
                                            {t('folders.xper_mono_search_dialog.lbl_habitat')}
                                        </Label>
                                    </FormGroup>
                                </Col>
                                <Col sm={2} md={2} lg={2}>
                                    <FormGroup>
                                        <Input name="searchGeography" id="search-geography"
                                               type="checkbox"
                                               checked={this.state.searchGeography}
                                               onChange={this._formChangeHandler}/>
                                        <Label for="search-geography"
                                               className="form-check-label pointer">
                                            {t('folders.xper_mono_search_dialog.lbl_geography')}
                                        </Label>
                                    </FormGroup>
                                </Col>
                                <Col sm={2} md={2} lg={2}>
                                    <FormGroup>
                                        <Input name="searchItems" id="search-items"
                                               type="checkbox" checked={this.state.searchItems}
                                               onChange={this._formChangeHandler}/>
                                        <Label for="search-items"
                                               className="form-check-label pointer">
                                            {t('folders.xper_mono_search_dialog.lbl_items')}
                                        </Label>
                                    </FormGroup>
                                </Col>

                            </Row>
                            <Row>
                                <Col sm={2} md={2} lg={2}>
                                    <FormGroup>
                                        <Input name="searchItemGroups" id="search-item-groups"
                                               type="checkbox"
                                               checked={this.state.searchItemGroups}
                                               onChange={this._formChangeHandler}>test</Input>
                                        <Label for="search-item-groups"
                                               className="form-check-label pointer">
                                            {t('folders.xper_mono_search_dialog.lbl_item_groups')}
                                        </Label>
                                    </FormGroup>
                                </Col>
                                <Col sm={2} md={2} lg={2}>
                                    <FormGroup>
                                        <Input name="searchDescriptor" id="search-descriptor"
                                               type="checkbox"
                                               checked={this.state.searchDescriptor}
                                               onChange={this._formChangeHandler}/>
                                        <Label for="search-descriptor"
                                               className="form-check-label pointer">
                                            {t('folders.xper_mono_search_dialog.lbl_descriptor')}
                                        </Label>
                                    </FormGroup>
                                </Col>
                                <Col sm={2} md={2} lg={2}>
                                    <FormGroup>
                                        <Input name="searchDescriptorGroups"
                                               id="search-descriptor-groups" type="checkbox"
                                               checked={this.state.searchDescriptorGroups}
                                               onChange={this._formChangeHandler}/>
                                        <Label for="search-descriptor-groups"
                                               className="form-check-label pointer">
                                            {t('folders.xper_mono_search_dialog.lbl_descriptor_groups')}
                                        </Label>
                                    </FormGroup>
                                </Col>
                                <Col sm={2} md={2} lg={2}>
                                    <FormGroup>
                                        <Input name="searchStates" id="search-states"
                                               type="checkbox" checked={this.state.searchStates}
                                               onChange={this._formChangeHandler}/>
                                        <Label for="search-states"
                                               className="form-check-label pointer">
                                            {t('folders.xper_mono_search_dialog.lbl_states')}
                                        </Label>
                                    </FormGroup>
                                </Col>
                                <Col sm={2} md={2} lg={2}>
                                    <FormGroup>
                                        <Input name="searchKeywords" id="search-keywords"
                                               type="checkbox"
                                               checked={this.state.searchKeywords}
                                               onChange={this._formChangeHandler}/>
                                        <Label for="search-keywords"
                                               className="form-check-label pointer">
                                            {t('folders.xper_mono_search_dialog.lbl_keywords')}
                                        </Label>
                                    </FormGroup>
                                </Col>
                            </Row>
                        </Container>
                    </Row>
                </Container>
            </Form>
        </_SearchFormContainer>;
    }

    renderKbDetailsModal(t) {
        return <Modal isOpen={this.state.openKbDetailsModal} className="my45PctSizedModal"
                      toggle={this._toggleKbDetails}
                      contentClassName="custom-modal-style" wrapClassName="bst"
                      scrollable={false}
                      autoFocus={false}>
            <ModalHeader toggle={this._toggleKbDetails}>
                {this.state.kbWithDetails.name}
            </ModalHeader>
            <ModalBody>
                <_KbDetailsContainer>
                    <_KbDetailsHeader>
                        {t('folders.xper_mono_kb_details_dialog.lbl_general_information')}
                    </_KbDetailsHeader>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_description')} :</_KbDetailsLabel>
                        <span>{this.state.kbWithDetails.detail}</span>
                    </_KbDetailsAttribute>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_authors')} :</_KbDetailsLabel>
                        <span>{this.state.kbWithDetails.authors}</span>
                    </_KbDetailsAttribute>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_key_language')} :</_KbDetailsLabel>
                        <span>{this.state.kbWithDetails.language}</span>
                    </_KbDetailsAttribute>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_study_field')} :</_KbDetailsLabel>
                        <span>{this.state.kbWithDetails.studyField}</span>
                    </_KbDetailsAttribute>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_key_creation_context')} :</_KbDetailsLabel>
                        <span>{this.state.kbWithDetails.keyCreationContext}</span>
                    </_KbDetailsAttribute>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_target_public')} :</_KbDetailsLabel>
                        <span>{this.state.kbWithDetails.targetAudience}</span>
                    </_KbDetailsAttribute>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_copyrights')} :</_KbDetailsLabel>
                        <span>@{this.state.kbWithDetails.copyrights}</span>
                    </_KbDetailsAttribute>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_associated_website')} :</_KbDetailsLabel>
                        <span>?</span>
                    </_KbDetailsAttribute>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_interactive_identification_key_url')} :</_KbDetailsLabel>
                        <span>
                            <a href="#"
                               onClick={() => this._openLink(this.state.kbWithDetails.interactiveIdentificationUrl)}>
                                {this.state.kbWithDetails.interactiveIdentificationUrl}
                            </a>
                        </span>
                    </_KbDetailsAttribute>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_data_publication_url')} :</_KbDetailsLabel>
                        <span>
                            <a onClick={() => this._openLink(this.state.kbWithDetails.dataHtmlUrl)}>
                                {this.state.kbWithDetails.dataHtmlUrl}
                            </a>
                        </span>
                    </_KbDetailsAttribute>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_key_data_featuring_article')} :</_KbDetailsLabel>
                        <span>?</span>
                    </_KbDetailsAttribute>
                    <_KbDetailsHeader>
                        {t('folders.xper_mono_kb_details_dialog.lbl_taxonomic_information')}
                    </_KbDetailsHeader>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_taxa_types')} :</_KbDetailsLabel>
                        <span>{this.state.kbWithDetails.taxa ? this.state.kbWithDetails.taxa.scientificName : ''}</span>
                    </_KbDetailsAttribute>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_items_taxonomic_rank')} :</_KbDetailsLabel>
                        <span>{this.state.kbWithDetails.taxa ? this.state.kbWithDetails.taxa.rank : ''}</span>
                    </_KbDetailsAttribute>
                    <_KbDetailsHeader>
                        {t('folders.xper_mono_kb_details_dialog.lbl_biogeographic information')}
                    </_KbDetailsHeader>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_geographic_areas')} :</_KbDetailsLabel>
                        <span>
                            {this.state.kbWithDetails.geographies ?
                                this.state.kbWithDetails.geographies.map(t => t.translatedName).join(', ') : ''}
                        </span>
                    </_KbDetailsAttribute>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_biogeographic_area')} :</_KbDetailsLabel>
                        <span>{this.state.kbWithDetails.biogeoInfo}</span>
                    </_KbDetailsAttribute>

                    <_KbDetailsHeader>
                        {t('folders.xper_mono_kb_details_dialog.lbl_stratigraphic_information')}
                    </_KbDetailsHeader>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_stratigraphic_distribution')} :</_KbDetailsLabel>
                        <span>{this.state.kbWithDetails.stratigraphies ?
                            this.state.kbWithDetails.stratigraphies.map(t => t.translatedName).join(', ') : ''}
                        </span>
                    </_KbDetailsAttribute>
                    <_KbDetailsHeader>
                        {t('folders.xper_mono_kb_details_dialog.lbl_current_base_status')}
                    </_KbDetailsHeader>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{this.state.kbWithDetails.nbItems} {t('folders.xper_mono_kb_details_dialog.lbl_items')}</_KbDetailsLabel>
                        <_KbDetailsLabel>- {this.state.kbWithDetails.nbDescriptors} {t('folders.xper_mono_kb_details_dialog.lbl_descriptors')}</_KbDetailsLabel>
                        <_KbDetailsLabel>- {this.state.kbWithDetails.nbResources} {t('folders.xper_mono_kb_details_dialog.lbl_resources')}</_KbDetailsLabel>
                    </_KbDetailsAttribute>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_created_on')} :</_KbDetailsLabel>
                        <span>{this.state.kbWithDetails.createTime}</span>
                    </_KbDetailsAttribute>
                    <_KbDetailsAttribute>
                        <_KbDetailsLabel>{t('folders.xper_mono_kb_details_dialog.lbl_last_update_on')} :</_KbDetailsLabel>
                        <span>{this.state.kbWithDetails.lastKbUpdate}</span>
                    </_KbDetailsAttribute>
                </_KbDetailsContainer>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={this._toggleKbDetails}>{t('global.close')}</Button>
            </ModalFooter>
        </Modal>;
    }

    renderItemDetailsModal(t) {
        let itemWithDetails = this.state.itemWithDetails[this.state.selectedItem] ? this.state.itemWithDetails[this.state.selectedItem] : {};
        return <Modal isOpen={this.state.openItemDetailsModal} className="my45PctSizedModal"
                      toggle={() => this._toggleItemDetails(false)}
                      contentClassName="custom-modal-style" wrapClassName="bst"
                      scrollable={false}
                      autoFocus={false}>
            <ModalHeader toggle={() => this._toggleItemDetails(false)}>
                {itemWithDetails.name}
            </ModalHeader>
            <ModalBody>
                <_ItemDetailsValueContainer>
                    <div>
                        <Input name={itemWithDetails.id} id={itemWithDetails.id}
                               type="checkbox"
                               disabled={this.state.itemSummarizationEdit || this.state.itemSummarizationInProcess}
                               checked={
                                   !!this.state.itemDetailsSelection[itemWithDetails.id]
                               }
                               onChange={this._itemDetailsSelectionChangeHandler}/>
                    </div>
                    <div className="item-details-text" dangerouslySetInnerHTML={{__html: itemWithDetails.detail}}/>
                </_ItemDetailsValueContainer>
                <_ItemDetailsScrollContainer>
                    <_ItemDetailsContainer>
                        {itemWithDetails.descriptors && itemWithDetails.descriptors.map((descriptor, index) => {
                            return (
                                <_ItemDescriptorContainer key={index}>
                                    <div>
                                        <Input name={descriptor.id} id={descriptor.id}
                                               type="checkbox"
                                               disabled={this.state.itemSummarizationEdit || this.state.itemSummarizationInProcess}
                                               checked={
                                                   this.state.descriptorSelection[itemWithDetails.id] ?
                                                       this.state.descriptorSelection[itemWithDetails.id][descriptor.id] : false
                                               }
                                               onChange={this._descriptorSelectionChangeHandler}/>
                                        <_ItemDescriptorNameContainer
                                            htmlFor={descriptor.id}>{descriptor.name}</_ItemDescriptorNameContainer>
                                    </div>
                                    {(descriptor.type === "QuantitativeDescriptor" && !descriptor.values) &&
                                        <_ItemDescriptorValueNotProvidedContainer>{t('folders.xper_mono_item_details_dialog.lbl_descriptor_value_not_provided')}</_ItemDescriptorValueNotProvidedContainer>
                                    }
                                    {descriptor.type === "QuantitativeDescriptor" && descriptor.values &&
                                        <_ItemQuantitativeDescriptorContainer>
                                            <div>{t('folders.xper_mono_item_details_dialog.lbl_measurementUnit') + ":" + (descriptor.values.measurementUnit ? descriptor.values.measurementUnit : "")}</div>
                                            <div>{t('folders.xper_mono_item_details_dialog.lbl_min')} : {descriptor.values.min}</div>
                                            <div>{t('folders.xper_mono_item_details_dialog.lbl_min_include')} : {descriptor.values.minInclude}</div>
                                            <div>{t('folders.xper_mono_item_details_dialog.lbl_max')} : {descriptor.values.max}</div>
                                            <div>{t('folders.xper_mono_item_details_dialog.lbl_max_include')} : {descriptor.values.maxInclude}</div>
                                        </_ItemQuantitativeDescriptorContainer>
                                    }
                                    {(descriptor.type !== "QuantitativeDescriptor" && (!descriptor.states || descriptor.states.length === 0)) &&
                                        <_ItemDescriptorValueNotProvidedContainer>{t('folders.xper_mono_item_details_dialog.lbl_descriptor_value_not_provided')}</_ItemDescriptorValueNotProvidedContainer>
                                    }
                                    {descriptor.type !== "QuantitativeDescriptor" && descriptor.states && descriptor.states.length > 0 &&
                                        <_ItemCategoricalDescriptorContainer>
                                            {descriptor.states && descriptor.states.map((state, index) => {
                                                return (
                                                    <li key={index}>{state.name}</li>
                                                )
                                            })}
                                        </_ItemCategoricalDescriptorContainer>
                                    }
                                </_ItemDescriptorContainer>
                            )
                        })}
                    </_ItemDetailsContainer>
                </_ItemDetailsScrollContainer>
                <_ItemDetailsActions>
                    {
                        this.state.itemSummarizationInProcess ?
                            <>
                                <Button color="danger" style={{marginRight: 20}}
                                        onClick={() => this._onCancelSummarizeItem()}>Cancel</Button>
                                <DotLoader size={30} color={'#C84D4D'}/>
                            </>
                            :
                            <>
                                <Button color="success" style={{marginRight: 5}}
                                        disabled={this.state.itemSummarizationEdit}
                                        onClick={() => this._onSummarizeItem()}>{t('folders.xper_mono_item_details_dialog.btn_summarize_ai')}</Button>
                                <Input type="select"
                                       name="summarizationLanguage"
                                       style={{width:60}}
                                       title={t('global.options.select_language.tooltip')}
                                       disabled={this.state.itemSummarizationEdit}
                                       value={this.state.itemDetailsSummarization[this.state.selectedItem] ?
                                           this.state.itemDetailsSummarization[this.state.selectedItem].lang
                                           : this.state.selectedLanguage}
                                       onChange={this._itemDetailsSummarizationLangChangeHandler}>
                                    {
                                        SUPPORTED_LANGUAGES.map(lang => {
                                            return <option key={lang} value={lang} title={t('global.languages.'+lang.toUpperCase())}>{lang}</option>
                                        })
                                    }
                                </Input>
                            </>
                    }
                    {
                        this.state.itemSummarizationEdit ?
                            <img src={SAVE_SUMMARY}
                                 style={{width: '25px', cursor: 'pointer', marginLeft: '5px'}}
                                 alt="save summarization"
                                 title={t('folders.xper_mono_item_details_dialog.tooltip_save_summarization')}
                                 onClick={event => {
                                     event.preventDefault();
                                     this._onSaveItemSummarization();
                                 }}/>
                            :
                            !this.state.itemSummarizationInProcess &&
                            this.state.itemDetailsSummarization[this.state.selectedItem] &&
                            this.state.itemDetailsSummarization[this.state.selectedItem].summary &&
                            <img src={EDIT_SUMMARY}
                                 style={{width: '25px', cursor: 'pointer', marginLeft: '5px'}}
                                 alt="edit summarization"
                                 title={t('folders.xper_mono_item_details_dialog.tooltip_edit_summarization')}
                                 onClick={event => {
                                     event.preventDefault();
                                     this._onEditItemSummarization();
                                 }}/>
                    }

                    <div style={{flexGrow: 1}}>&nbsp;</div>
                    <Button color="secondary"
                            style={{marginRight: 5}}
                            disabled={this.state.itemSummarizationEdit || this.state.itemSummarizationInProcess}
                            onClick={() => this._onBulkChangeDescriptorSelection(true)}>{t('global.btn_select_all')}</Button>
                    <Button color="secondary"
                            disabled={this.state.itemSummarizationEdit || this.state.itemSummarizationInProcess}
                            onClick={() => this._onBulkChangeDescriptorSelection(false)}>{t('global.btn_unselect_all')}</Button>
                </_ItemDetailsActions>
                <_ItemSummarizedDescription>
                    {
                        this.state.itemSummarizationEdit ?
                            <textarea name="itemDetailsSummarizationValue"
                                value={this.state.itemDetailsSummarizationValue ?
                                    this.state.itemDetailsSummarizationValue : ''}
                                onChange={this._formChangeHandler}
                                style={{width: '100%', height: '180px', border: 'none'}}
                            />
                            :
                            <Markdown>
                                {this.state.itemDetailsSummarization[this.state.selectedItem] ?
                                    this.state.itemDetailsSummarization[this.state.selectedItem].summary : ''}
                            </Markdown>
                    }
                </_ItemSummarizedDescription>
            </ModalBody>
            <ModalFooter>
                <Button color="primary"
                        disabled={this.state.itemSummarizationEdit || this.state.itemSummarizationInProcess}
                        onClick={this._toggleItemDetails}>{t('global.save')}</Button>
            </ModalFooter>
        </Modal>;
    }
}
