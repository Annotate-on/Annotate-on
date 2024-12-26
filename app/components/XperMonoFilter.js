import React, {Component, Fragment} from 'react';
import {
    Button, Col, Container, Form, FormGroup, Input, Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader, Row,
} from 'reactstrap';

import styled from "styled-components";
import PLUS from "./pictures/plus.svg";
import {searchItemsInKb, searchKb} from "../utils/xper_mono";
import Chance from "chance";
import {categoryExists} from "./event/utils";
import {createNewCategory, createNewTag, getXperCategory} from "./tags/tagUtils";
import {TAG_XPER} from "../constants/constants";
import {tagExist} from "../utils/tags";
import {SUPPORTED_LANGUAGES} from "../i18n";

const chance = new Chance();

const _ResultsPlaceholder = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    flex-direction: column;
    border: 1px solid #dee2e6;
`;

const _ResultItem = styled.div`
    display: flex;
    justify-content: space-between;
    flex-direction: row;
    border-bottom: 1px solid #dee2e6;
    padding: 10px;
    width: 100%;
`;

const _ResultItemButton = styled.div`
    margin: 0px 10px 5px 0px;
    width: 30px;
    height: 30px;
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
    width: 100%;
`;

const _MatchingResultsContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    flex-direction: column;
    width: 100%;
    padding: 10px;
`;

const _MatchingResultsInfoContainer = styled.div`
    font-size: 14px;
    width: 100%;
    padding-bottom: 10px;
`;

export default class extends Component {
    constructor(props) {
        super(props);
        console.log('XperMonoFilter props', props);
        this.state = {
            openModal: props.openModal,
            folder: props.folder,
            searchTerm: '',
            selectedLanguage: props.i18n.language,
            searchTaxonomy: false,
            searchStratigraphy: false,
            searchHabitat: false,
            searchGeography: false,
            searchItems: false,
            searchItemGroups: false,
            searchDescriptor: false,
            searchDescriptorGroups: false,
            searchStates: false,
            searchKeywords: false,
            kbSearchResults: [],
            tagName: '',
            addAsTag: false,
            addKbNameAsTag: true
        };
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

    _formChangeHandler = (event) => {
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

    _matchResourcesWithKBHandler = (kb) => {
        searchItemsInKb({kb: kb.id, lang: this.state.selectedLanguage}, (result) => {
            if(result && this.props.xperMatchResources) {
                this.props.xperMatchResources(this.state.folder, {kb: kb, items:result});
            }
            this.setState({
                tagName: this.state.searchTerm,
                addAsTag: false
            });
        });
    }

    _onCreateXperTag = () => {
        console.log('_onCreateXperTag xperMatchedResources', this.state.xperMatchedResources.matchedResources);
        if(!this.state.xperMatchedResources.matchedResources) {
            console.log('No matched resources');
            return;
        }
        const customTagName = this.state.addAsTag ? this.state.tagName : null;
        const kbTagName = this.state.addKbNameAsTag ? "KB " + this.props.xperMatchedResources.xper.kb.name : null;
        const tags = [];
        if(customTagName) {
            tags.push(customTagName);
        }
        if(kbTagName) {
            tags.push(kbTagName);
        }
        console.log('tags = ', tags);
        if (!categoryExists(this.props.tags, 'Xper')) {
            this.props.createCategory(createNewCategory(chance.guid(), 'Xper'));
        }
        setTimeout(() => {
            const folder = this.state.xperMatchedResources.folder;
            const xperCategory = getXperCategory(this.props.tags);
            if (kbTagName && !tagExist(this.props.tags, kbTagName)) {
                this.props.addSubCategory(TAG_XPER, createNewTag(chance.guid(), kbTagName), false , xperCategory.id)
            }
            if (customTagName && !tagExist(this.props.tags, customTagName)) {
                this.props.addSubCategory(TAG_XPER, createNewTag(chance.guid(), customTagName), false , xperCategory.id)
            }
            for (const resource of this.state.xperMatchedResources.matchedResources) {
                if(kbTagName) {
                    this.props.tagPicture(resource.sha1, kbTagName);
                }
                if (customTagName) {
                    this.props.tagPicture(resource.sha1, customTagName);
                }
            }
            this._toggle(tags, folder);
        }, 100);
    }

    _onSearchXper = () => {
        console.log('Search Xper', this.state);
        this.props.xperMatchResources(null, null);
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
            if(result) {
                this.setState({
                    kbSearchResults: result
                });
            }
        });
    }

    _toggle = (tags, folder) => {
        if (this.props.onClose) {
            this.props.onClose(tags, folder);
        }
        this.props.xperMatchResources(null, null);
        this.setState({
            searchTerm: '',
            selectedLanguage: 'fr',
            searchTaxonomy: false,
            searchStratigraphy: false,
            searchHabitat: false,
            searchGeography: false,
            searchItems: false,
            searchItemGroups: false,
            searchDescriptor: false,
            searchDescriptorGroups: false,
            searchStates: false,
            searchKeywords: false,
            kbSearchResults: [],
            tagName: '',
            addAsTag: false,
            addKbNameAsTag: true
        });
    };

    render() {
        const {t} = this.props;
        return (
            <div>
                <Modal isOpen={this.state.openModal} className="myMiddleSizedModal" toggle={this._toggle}
                       contentClassName="custom-modal-style" wrapClassName="bst"
                       scrollable={false}
                       autoFocus={false}>
                    <ModalHeader toggle={this._toggle}>
                        {t('folders.xper_mono_search_dialog.title')}
                    </ModalHeader>
                    <ModalBody>
                        <Form onSubmit={(e) => {
                            e.preventDefault();
                        }} className="tag-form">
                            <Container>
                                <Row className="xper-mono-search">
                                    <Col sm={1} md={1} lg={1}/>
                                    <Col sm={10} md={10} lg={10}>
                                        <Container>
                                            <Row>
                                                <Col sm={10} md={10} lg={10} className="options-form-field-label">
                                                    <Input type="text" name="searchTerm" id="search_term"
                                                           value={this.state.searchTerm}
                                                           placeholder={t('folders.xper_mono_search_dialog.search_terms_placeholder')}
                                                           onChange={this._formChangeHandler}/>
                                                </Col>
                                                <Col sm={2} md={2} lg={2}>
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
                                            </Row>
                                            <Row className="search-options">
                                                <Container>
                                                    <Row>
                                                        <Col sm={3} md={3} lg={3}>
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
                                                        <Col sm={3} md={3} lg={3}>
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
                                                        <Col sm={3} md={3} lg={3}>
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
                                                        <Col sm={3} md={3} lg={3}>
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
                                                    </Row>
                                                    <Row>
                                                        <Col sm={3} md={3} lg={3}>
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
                                                        <Col sm={3} md={3} lg={3}>
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
                                                        <Col sm={3} md={3} lg={3}>
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
                                                        <Col sm={3} md={3} lg={3}>
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
                                                    </Row>
                                                    <Row>
                                                        <Col sm={3} md={3} lg={3}>
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
                                                        <Col sm={3} md={3} lg={3}>
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
                                    </Col>
                                    <Col sm={1} md={1} lg={1}/>
                                </Row>
                                {this.state.kbSearchResults.length > 0 &&
                                    <Row>
                                        <Col sm={12} md={12} lg={12}>
                                            <Row>
                                                <Col sm={12} md={12} lg={12}>
                                                    <h5>{t('folders.xper_mono_search_dialog.lbl-results')}</h5>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col sm={12} md={12} lg={12}>
                                                    <_ResultsPlaceholder>
                                                        {
                                                            this.state.kbSearchResults.map((kb, index) => {
                                                                return (
                                                                    <_ResultItem key={index}>
                                                                        <_ResultItemButton>
                                                                            <img alt="Select Xper KB" src={PLUS}/>
                                                                        </_ResultItemButton>
                                                                        <_ResultItemDetails>
                                                                            <div>
                                                                                <h4>{kb.name}</h4>
                                                                            </div>
                                                                            <div>
                                                                                <h6>{kb.authors}</h6>
                                                                            </div>
                                                                            <div>
                                                                                {kb.detail}
                                                                            </div>
                                                                            {(kb.logoUrl && kb.logoUrl.length > 0) &&
                                                                                <div>
                                                                                    <img src={kb.logoUrl} alt={""} style={{width: '100px'}}/>
                                                                                </div>
                                                                            }
                                                                        </_ResultItemDetails>
                                                                        <Button color="primary"
                                                                                size="sm"
                                                                                style={{height: 40}}
                                                                                onClick={() => this._matchResourcesWithKBHandler(kb)}>
                                                                            {t('folders.xper_mono_search_dialog.btn_match_resources')}
                                                                        </Button>
                                                                    </_ResultItem>
                                                                )
                                                            })
                                                        }
                                                        {
                                                            this.state.xperMatchedResources && this.state.xperMatchedResources.matchedResources &&
                                                            <_MatchingResultsContainer>
                                                                <Container>
                                                                    <Row>
                                                                        <Col sm={12} md={12} lg={12}>
                                                                            <_MatchingResultsInfoContainer>
                                                                                {t('folders.xper_mono_search_dialog.btn_match_resources_info', {
                                                                                    numOfMatchedResources: this.state.xperMatchedResources.matchedResources.length,
                                                                                    numOfProcessedResources: this.state.xperMatchedResources.numOfProcessedResources,
                                                                                    folder: this.state.folder.path,
                                                                                    kbName: this.state.xperMatchedResources.xper.kb.name
                                                                                })}
                                                                            </_MatchingResultsInfoContainer>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <Col sm={3} md={3} lg={3}>
                                                                            <Input type="text" name="tagName" id="tag-name"
                                                                                   value={this.state.tagName}
                                                                                   onChange={this._formChangeHandler}/>
                                                                        </Col>
                                                                        <Col sm={2} md={2} lg={2}>
                                                                            <FormGroup>
                                                                                <Input name="addAsTag" id="add-as-tag"
                                                                                       type="checkbox"
                                                                                       checked={this.state.addAsTag}
                                                                                           disabled={!this.state.tagName}
                                                                                       onChange={this._formChangeHandler}/>
                                                                                <Label for="add-as-tag"
                                                                                       className="form-check-label pointer">
                                                                                    {t('folders.xper_mono_search_dialog.lbl_add_as_tag')}
                                                                                </Label>
                                                                            </FormGroup>
                                                                        </Col>
                                                                        <Col sm={3} md={3} lg={3}>
                                                                            <FormGroup>
                                                                                <Input name="addKbNameAsTag" id="add-kb-name-as-tag"
                                                                                       type="checkbox"
                                                                                       checked={this.state.addKbNameAsTag}
                                                                                       onChange={this._formChangeHandler}/>
                                                                                <Label for="add-kb-name-as-tag"
                                                                                       className="form-check-label pointer">
                                                                                    {t('folders.xper_mono_search_dialog.lbl_include_kb_name_as_tag')}
                                                                                </Label>
                                                                            </FormGroup>
                                                                        </Col>
                                                                        <Col sm={2} md={2} lg={2}>
                                                                        </Col>
                                                                        <Col sm={2} md={2} lg={2}>
                                                                            <Button color="primary" disabled={
                                                                                this.state.xperMatchedResources.matchedResources.length === 0 ||
                                                                                (!this.state.addAsTag && !this.state.addKbNameAsTag) ||
                                                                                (!this.state.tagName && !this.state.addKbNameAsTag)
                                                                            } onClick={() => this._onCreateXperTag()}>
                                                                                {t('folders.xper_mono_search_dialog.btn_tag_images')}
                                                                            </Button>

                                                                        </Col>
                                                                    </Row>
                                                                </Container>
                                                            </_MatchingResultsContainer>
                                                        }
                                                    </_ResultsPlaceholder>
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>
                                }
                            </Container>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" disabled={!this.state.searchTerm || this.state.searchTerm.length === 0}
                                onClick={() => this._onSearchXper()}>{t('global.search')}</Button>
                        <Button color="secondary" onClick={this._toggle}>{t('global.close')}</Button>
                    </ModalFooter>
                </Modal>
            </div>
        );
    }
}
