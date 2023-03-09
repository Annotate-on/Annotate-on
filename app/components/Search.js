import React, {Component} from "react";
import {Button, Col, Container, FormGroup, Input, Label, Row} from "reactstrap";
import PageTitle from "./PageTitle";
import SEARCH_IMAGE_CONTEXT from "./pictures/search_icon.svg";


export const IN_SELECTION = 'IN_SELECTION';
export const IN_PROJECT = 'IN_PROJECT';

export default class Search extends Component {

    constructor(props) {
        super(props);
        this.state = {
            searchForm: {
                searchText: '',
                scope: IN_SELECTION
            }
        }
    }

    componentDidMount() {
    }

    _searchFormChangeHandler = ( event ) => {
        const { name, value } = event.target;
        const { t } = this.props;
        const searchForm = {...this.state.searchForm};
        searchForm[name] = value ? value : '';
        this.setState({
            searchForm: searchForm
        });
    };

    _handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            console.log("enter pressed!")
            this._doSearch();
        }
    };

    _doSearch() {
        console.log("search by", this.state.searchForm)
        alert('search by ' + this.state.searchForm.searchText + ' in ' + this.state.searchForm.scope);
    }

    render() {
        const {t} = this.props;
        return (
            <Container className="bst search-page">
                <div>
                    <PageTitle
                        logo={SEARCH_IMAGE_CONTEXT}
                        pageTitle={t('search.title')}
                        showProjectInfo={true}
                        projectName={this.props.projectName}
                        selectedTaxonomy={this.props.selectedTaxonomy}
                        docLink="search"
                    >
                    </PageTitle>

                    <Row>
                        <div className="search-form">
                            <div className="search-form-item">
                                <Row>
                                    <Col sm={3} md={3} lg={3}>
                                        <Input name="searchText" type="text" bsSize="md"
                                               placeholder={t('search.textbox_placeholder_search_text')}
                                               title={t('search.title')}
                                               value={this.state.searchForm.searchText}
                                               onChange={this._searchFormChangeHandler}
                                               onKeyDown={this._handleKeyDown}
                                        >
                                        </Input>
                                    </Col>
                                    <Col sm={9} md={9} lg={9}>
                                        <FormGroup check>
                                            <Label check>
                                                <Input type="radio" name="scope"
                                                       value={IN_SELECTION}
                                                       checked={IN_SELECTION === this.state.searchForm.scope}
                                                       onChange={this._searchFormChangeHandler}
                                                />{' '}{t('search.lbl_search_in_selection')}
                                            </Label>
                                        </FormGroup>
                                        <FormGroup check>
                                            <Label check>
                                                <Input type="radio" name="scope"
                                                       value={IN_PROJECT}
                                                       checked={IN_PROJECT === this.state.searchForm.scope}
                                                       onChange={this._searchFormChangeHandler}
                                                />{' '}{t('search.lbl_search_in_project')}
                                            </Label>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </div>
                        </div>
                    </Row>
                    <Row>
                        <Col sm={12} md={12} lg={12}>
                            <div className="search-results"></div>
                            {/*Search results*/}
                        </Col>
                        <Col sm={9} md={9} lg={9}/>
                    </Row>
                </div>
            </Container>
        );
    }

}
