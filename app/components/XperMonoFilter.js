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

export const SUPPORTED_LANGUAGES = [
    'en',
    'fr',
]

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

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = {
            openModal: props.openModal,
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
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.openModal !== this.props.openModal) {
            this.setState({
                openModal: this.props.openModal
            });
        }
    }

    _formChangeHandler = (event) => {
        console.log('Form Change', event.target);
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

    _onSearchXper = () => {
        console.log('Search Xper', this.state);
    }

    _toggle = () => {
        this.setState({});
        if (this.props.onClose) {
            this.props.onClose();
        }
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
                                                                return <option key={lang} value={lang}
                                                                               title={t('global.languages.' + lang.toUpperCase())}>{t('global.languages.' + lang.toUpperCase())}</option>
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
                                                    <_ResultItem>
                                                        <_ResultItemButton>
                                                            <img alt="Select Xper KB" src={PLUS}/>
                                                        </_ResultItemButton>
                                                        <_ResultItemDetails>
                                                            <div>
                                                                <strong>Androsace Ecrins</strong>
                                                            </div>
                                                            <div>
                                                                Details, Authors, Dates
                                                            </div>
                                                        </_ResultItemDetails>
                                                    </_ResultItem>
                                                    <_ResultItem>
                                                        <_ResultItemButton>
                                                            <img alt="Select Xper KB" src={PLUS}/>
                                                        </_ResultItemButton>
                                                        <_ResultItemDetails>
                                                            <div>
                                                                <strong>Androsace Ecrins</strong>
                                                            </div>
                                                            <div>
                                                                Details, Authors, Dates
                                                            </div>
                                                        </_ResultItemDetails>
                                                    </_ResultItem>
                                                </_ResultsPlaceholder>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
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
