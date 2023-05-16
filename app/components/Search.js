import React, {Component} from "react";
import {Button, Col, Container, FormGroup, Input, Label, Row, Table} from "reactstrap";
import PageTitle from "./PageTitle";
import SEARCH_IMAGE_CONTEXT from "./pictures/search_icon.svg";
import TableHeader from "./TableHeader";
import {
    ANNOTATION_ANGLE,
    ANNOTATION_CATEGORICAL,
    ANNOTATION_COLORPICKER,
    ANNOTATION_MARKER,
    ANNOTATION_OCCURRENCE,
    ANNOTATION_POLYGON,
    ANNOTATION_POLYLINE,
    ANNOTATION_RECTANGLE,
    ANNOTATION_SIMPLELINE,
    ANNOTATION_TRANSCRIPTION, MODEL_ANNOTATE, MODEL_XPER, NUMERICAL,
    RESOURCE_TYPE_EVENT,
    RESOURCE_TYPE_PICTURE,
    RESOURCE_TYPE_VIDEO,
    SORT_ALPHABETIC_DESC
} from "../constants/constants";
import {
    ee,
    EVENT_HIGHLIGHT_ANNOTATION,
    EVENT_HIGHLIGHT_ANNOTATION_ON_LEAFLET, EVENT_SELECT_SELECTION_TAB,
    EVENT_SELECT_TAB, EVENT_SHOW_ALERT
} from "../utils/library";
import {getTaxonomyDir, loadMetadata, loadTaxonomy} from "../utils/config";
import {sortTagsAlphabeticallyOrByDate} from "../utils/common";
import {getCategoriesOnly, getRootCategories, getTagsOnly} from "./tags/tagUtils";
import {convertSDDtoJson} from "../utils/sdd-processor";
import path from "path";
import lodash from "lodash";
import LoadingSpinner from "./LoadingSpinner";

export const IN_SELECTION = 'IN_SELECTION';
export const IN_PROJECT = 'IN_PROJECT';

export default class Search extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showLoadingSpinner: false,
            searchForm: {
                scope: IN_PROJECT,
                searchText: this.props.search ? this.props.search.searchText : '',
                searchInLibrary: this.props.search && this.props.search.searchInLibrary !== undefined ? this.props.search.searchInLibrary : true,
                searchInAnnotations: this.props.search && this.props.search.searchInAnnotations !== undefined ? this.props.search.searchInAnnotations : true,
                searchInKeywords: this.props.search && this.props.search.searchInKeywords !== undefined ? this.props.search.searchInKeywords : true,
                searchInModels: this.props.search && this.props.search.searchInModels !== undefined ? this.props.search.searchInModels : true
            },
            foundAnnotations: this.props.searchResults && this.props.searchResults.foundAnnotations ?
                this.props.searchResults.foundAnnotations : null,
            foundResources: this.props.searchResults && this.props.searchResults.foundResources ?
                this.props.searchResults.foundResources : null,
            foundKeywords: this.props.searchResults && this.props.searchResults.foundKeywords ?
                this.props.searchResults.foundKeywords : null,
            foundCharacters: this.props.searchResults && this.props.searchResults.foundCharacters ?
                this.props.searchResults.foundCharacters : null,
        }
    }

    componentDidMount() {
    }

    componentWillUnmount() {
        this.props.saveSearch(
            {
                searchText: this.state.searchForm.searchText,
                searchInLibrary: this.state.searchForm.searchInLibrary,
                searchInAnnotations: this.state.searchForm.searchInAnnotations,
                searchInKeywords: this.state.searchForm.searchInKeywords,
                searchInModels: this.state.searchForm.searchInModels
            },
            {
                searchInLibrary: this.state.searchForm.searchInLibrary,
                foundAnnotations: this.state.foundAnnotations,
                foundResources: this.state.foundResources,
                foundKeywords: this.state.foundKeywords,
                foundCharacters: this.state.foundCharacters
            }
        );
    }
    _showLoading = () => {
        this.setState({
            showLoadingSpinner: true
        })
    }

    _hideLoading = () => {
        this.setState({
            showLoadingSpinner: false
        })
    }

    _searchFormChangeHandler = (event) => {
        const {name, value, type} = event.target;
        console.log("_searchFormChangeHandler", event.target)
        const {t} = this.props;
        const searchForm = {...this.state.searchForm};
        if(type === 'checkbox') {
            searchForm[name] = event.target.checked ? true : false;
        } else {
            searchForm[name] = value ? value : '';
        }
        this.setState({
            searchForm: searchForm
        });
    };
    _searchFilterChangeHandler = (event) => {
        this._searchFormChangeHandler(event);
        // setTimeout(event => {this._doSearch()}, 50)
    };

    _handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            this._doSearch();
        }
    };

    _formatResourceType = (type) => {
        if (type === RESOURCE_TYPE_PICTURE) {
            return "Image"
        } else if (type === RESOURCE_TYPE_VIDEO) {
            return "Video"
        } else if (type === RESOURCE_TYPE_EVENT) {
            return "Event"
        } else {
            return "Image"
        }
    }

    _onResetSearch = (event) => {
        console.log("_onResetSearch");
        this.setState({
            searchForm: {
                scope: IN_PROJECT,
                searchText: '',
                searchInLibrary: this.state.searchForm.searchInLibrary,
                searchInAnnotations: this.state.searchForm.searchInAnnotations,
                searchInKeywords: this.state.searchForm.searchInKeywords,
                searchInModels: this.state.searchForm.searchInModels
            },
            foundAnnotations: null,
            foundResources: null,
            foundKeywords: null,
            foundCharacters: null
        });
    };

    _onOpenAnnotation = (picId, annotationId, type) => {
        if (!this.props.openTabs["Search"]) {
            this.props.createTab("Search")
        }
        this.props.setPictureInSelection(picId, 'Search');
        this.props.setSelectedLibraryTab('Search', 'image');
        this.props.goToLibrary();
        setTimeout(() => {
            ee.emit(EVENT_SELECT_SELECTION_TAB, undefined, 'Search');
        }, 100);
        setTimeout(() => {
            ee.emit(EVENT_HIGHLIGHT_ANNOTATION, annotationId, true);
            ee.emit(EVENT_HIGHLIGHT_ANNOTATION_ON_LEAFLET, annotationId, type);
        }, 300);
    }

    _onOpenResource = (picId) => {
        console.log("on open picture ", picId)
        if (!this.props.openTabs["Search"]) {
            this.props.createTab("Search")
        }
        this.props.setPictureInSelection(picId, 'Search');
        this.props.setSelectedLibraryTab('Search', 'image');
        this.props.goToLibrary();
        setTimeout(() => {
            ee.emit(EVENT_SELECT_SELECTION_TAB, undefined, 'Search');
        }, 100);
    }

    _onOpenTag(tag) {
        console.log("on open tag ", tag)
        this.props.goToLibrary();
        setTimeout(() => {
            this.props.openInNewTab(tag);
        }, 100);
        setTimeout(() => {
            ee.emit(EVENT_SELECT_SELECTION_TAB, -1, undefined);
        }, 100);
    }

    _onOpenCategory(path) {
        console.log("on open category ", path)
        let selectedCategory = path[path.length - 1];
        console.log("selectedCategory ", selectedCategory);
        let selectedCategoriesInPath = path;
        console.log("selectedCategoriesInPath ", selectedCategoriesInPath);
        this.props.saveSelectedCategory(selectedCategory, selectedCategoriesInPath);
        this.props.goToKeywords();
    }

    _onOpenTaxonomy(taxonomyId, characterId) {
        console.log("on open taxonomy ", taxonomyId, characterId);
        this.props.goToTaxonomies(taxonomyId, characterId);
    }

    _doSearch() {
        const { t } = this.props;
        console.log("search by", this.state.searchForm);

        if (!this.state.searchForm.searchText) {
            ee.emit(EVENT_SHOW_ALERT , t('search.alert_please_enter_some_text_to_search_by'));
            return;
        }
        this._showLoading();

        // search resources
        // console.log("all resources in project", this.props.pictures);
        let foundResources = null;
        if (this.state.searchForm.searchInLibrary && this.props.pictures) {
            foundResources = [];
            let allResources = [];
            for (const resourceId in this.props.pictures) {
                let resource = this.props.pictures[resourceId];
                let familyValue = '';
                let collectionNameValue = '';
                let institutionCodeValue = '';
                let institutionNameValue = '';
                let collectorNameValue = '';
                let genusValue = '';
                if (resource.erecolnatMetadata) {
                    familyValue = resource.erecolnatMetadata.family ? resource.erecolnatMetadata.family : '';
                    collectionNameValue = resource.erecolnatMetadata.collectionname ? resource.erecolnatMetadata.collectionname : '';
                    institutionNameValue = resource.erecolnatMetadata.institutionname ? resource.erecolnatMetadata.institutionname : '';
                    institutionCodeValue = resource.erecolnatMetadata.institutioncode ? resource.erecolnatMetadata.institutioncode : '';
                    collectorNameValue = resource.erecolnatMetadata.recordedby ? resource.erecolnatMetadata.recordedby : '';
                    genusValue = resource.erecolnatMetadata.genus ? resource.erecolnatMetadata.genus : '';
                } else {
                    let metadata = loadMetadata(resourceId);
                    if (metadata) {
                        familyValue = metadata.naturalScienceMetadata && metadata.naturalScienceMetadata.family ? metadata.naturalScienceMetadata.family : '';
                        collectorNameValue = metadata.iptc && metadata.iptc.creator ? metadata.iptc.creator : '';
                        collectionNameValue = '';
                        institutionNameValue = '';
                        institutionCodeValue = '';
                        genusValue = metadata.naturalScienceMetadata && metadata.naturalScienceMetadata.genre ? metadata.naturalScienceMetadata.genre : '';
                    }
                }
                allResources.push({
                    sha1: resource.sha1,
                    fileBasename: resource.file_basename,
                    type: this._formatResourceType(resource.resourceType),
                    family: familyValue,
                    genus: genusValue,
                    collection: collectionNameValue,
                    institutionCode: institutionCodeValue,
                    institutionName: institutionNameValue,
                    collectorName: collectorNameValue
                });
                foundResources = allResources.filter(pic => {
                    return pic.fileBasename.toLowerCase().includes(this.state.searchForm.searchText.toLowerCase()) ||
                        this._doSearchInFamilyCategory(pic.family, this.state.searchForm.searchText.toLowerCase()) ||
                        pic.genus.toString().toLowerCase().includes(this.state.searchForm.searchText.toLowerCase()) ||
                        pic.collection.toString().toLowerCase().includes(this.state.searchForm.searchText.toLowerCase()) ||
                        pic.institutionCode.toString().toLowerCase().includes(this.state.searchForm.searchText.toLowerCase()) ||
                        pic.institutionName.toString().toLowerCase().includes(this.state.searchForm.searchText.toLowerCase()) ||
                        pic.collectorName.toString().toLowerCase().includes(this.state.searchForm.searchText.toLowerCase())
                });
            }
        }

        // search annotations
        let foundAnnotations = null;
        if (this.state.searchForm.searchInAnnotations && this.props.annotations) {
            foundAnnotations = []
            let allAnnotations = []
            this.props.annotations.map(annotation => {
                let target = '';
                let targetType = '';
                if (this.props.selectedTaxonomy !== null && this.props.taxonomyInstance[this.props.selectedTaxonomy.id] !== undefined) {
                    if (this.props.taxonomyInstance[this.props.selectedTaxonomy.id].taxonomyByAnnotation[annotation.id] !== undefined) {
                        const descriptorId = this.props.taxonomyInstance[this.props.selectedTaxonomy.id].taxonomyByAnnotation[annotation.id].descriptorId;
                        this.props.selectedTaxonomy.descriptors.forEach(descriptor => {
                            if (descriptor.id === descriptorId) {
                                target = descriptor.targetName;
                                return false;
                            }
                        })
                    }
                }
                let value;
                try {
                    switch (annotation.annotationType) {
                        case ANNOTATION_SIMPLELINE:
                        case ANNOTATION_POLYLINE:
                            value = annotation.value_in_mm ? annotation.value_in_mm.toFixed(2) : '';
                            break;
                        case ANNOTATION_POLYGON:
                            value = annotation.area ? annotation.area.toFixed(2) : '';
                            break;
                        case ANNOTATION_ANGLE:
                            value = annotation.value_in_deg ? annotation.value_in_deg.toFixed(2) : '';
                            break;
                        case ANNOTATION_OCCURRENCE:
                            value = annotation.value.toString();
                            break;
                        case ANNOTATION_COLORPICKER:
                        case ANNOTATION_CATEGORICAL:
                        case ANNOTATION_MARKER:
                        case ANNOTATION_RECTANGLE:
                        case ANNOTATION_TRANSCRIPTION:
                            value = annotation.value ? annotation.value : '';
                            break;
                    }
                } catch (err) {
                    console.log(err);
                }

                let fileBasenameValue = this.props.pictures[annotation.pictureId] ?
                    this.props.pictures[annotation.pictureId].file_basename : '';
                allAnnotations.push({
                    id: annotation.id,
                    title: annotation.title,
                    type: annotation.annotationType,
                    value: value,
                    target: target,
                    resourceId: annotation.pictureId,
                    fileBasename: fileBasenameValue
                });
                foundAnnotations = allAnnotations.filter(ann => {
                    return ann.title.toLowerCase().includes(this.state.searchForm.searchText.toLowerCase()) ||
                        ann.target.toLowerCase().includes(this.state.searchForm.searchText.toLowerCase()) ||
                        ann.value.toString().toLowerCase().includes(this.state.searchForm.searchText.toLowerCase())
                });
            });
        }

        // search keywords
        let foundKeywords = null;
        if(this.state.searchForm.searchInKeywords) {
            foundKeywords = [];
            let tagsInUse = [];
            if (this.props.annotationsByTag) {
                tagsInUse.push(...Object.keys(this.props.annotationsByTag));
            }
            if (this.props.picturesByTag) {
                tagsInUse.push(...Object.keys(this.props.picturesByTag));
            }
            tagsInUse = [...new Set(tagsInUse)];
            let rootCategories = sortTagsAlphabeticallyOrByDate(getRootCategories(this.props.tags), SORT_ALPHABETIC_DESC);
            if (rootCategories) {
                for (const rootCategory of rootCategories) {
                    this._doProcessCategory([], rootCategory, this.state.searchForm.searchText, tagsInUse, foundKeywords);
                }
            }
        }

        // search characters
        let foundCharacters = null;
        if (this.state.searchForm.searchInModels && this.props.taxonomies) {
            foundCharacters = [];
            const sortedTaxonomies = this._sortList('name', 'ASC', this.props.taxonomies || []);
            for (const taxonomy of sortedTaxonomies) {
                this._doProcessTaxonomy(taxonomy, this.state.searchForm.searchText, foundCharacters);
            }
        }

        // console.log("foundResources", foundResources);
        // console.log("foundAnnotations", foundAnnotations);
        // console.log("foundKeywords", foundKeywords);
        // console.log("foundCharacters", foundCharacters);

        this.setState({
            showLoadingSpinner: false,
            foundResources,
            foundAnnotations,
            foundKeywords,
            foundCharacters
        })
    }

    _doSearchInFamilyCategory(family, searchText) {
        if (!family) return false;
        if (!searchText) return false;
        if(Array.isArray(family)) {
            let result = false;
            for (let aFamily of family) {
                if (aFamily.toLowerCase().includes(searchText)) {
                    result = true;
                    break;
                }
            }
            return result;
        }
        return family.toLowerCase().includes(searchText)
    }

    _doProcessCategory(path, category, searchText, tagsInUse, foundKeywords) {
        if (!category) return;
        let childrenTags = sortTagsAlphabeticallyOrByDate(getTagsOnly(category.children), SORT_ALPHABETIC_DESC)
            .filter(tag => {
                return tagsInUse.includes(tag.name) && tag.name.toLowerCase().includes(searchText.toLowerCase())
            });
        if (childrenTags && childrenTags.length > 0) {
            foundKeywords.push({
                path: [...path, category],
                tags: childrenTags
            });
        }
        let childrenCategories = sortTagsAlphabeticallyOrByDate(getCategoriesOnly(category.children), SORT_ALPHABETIC_DESC);
        if (childrenCategories) {
            childrenCategories.forEach(subcategory => {
                this._doProcessCategory([...path, category], subcategory, searchText, tagsInUse, foundKeywords);
            })
        }
    }

    _doProcessTaxonomy(taxonomy, searchText, foundCharacters) {
        if (!taxonomy) return;

        let descriptors = [];
        if (taxonomy.model === MODEL_XPER) {
            descriptors = convertSDDtoJson(path.join(getTaxonomyDir(), taxonomy.sddPath)).items
        } else if (taxonomy.model === MODEL_ANNOTATE) {
            descriptors = loadTaxonomy(taxonomy.id);
        }
        const unsortedCharacters = descriptors ?
            descriptors.filter(value => {
                return value.targetName.toLowerCase().includes(searchText.toLowerCase());
            })
                .map(target => {
                    return {
                        id: target.id,
                        name: target.targetName,
                        targetType: target.targetType,
                        color: target.targetColor,
                        annotationType: target.annotationType
                    }
                })
            : [];
        if (unsortedCharacters.length > 0) {
            let sortedCharacters = this._sortList('name', 'ASC', unsortedCharacters);
            foundCharacters.push({
                taxonomy: taxonomy,
                characters: sortedCharacters
            });
        }
    }

    _sortList(sortBy, sortDirection, initList) {
        const list = initList || [];
        const sorted = lodash.sortBy(list, _ => (typeof _[sortBy] === 'string' ? _[sortBy].toLowerCase() : _[sortBy]));
        return sortDirection === 'DESC' ? lodash.reverse(sorted) : sorted;
    }

    render() {
        const {t} = this.props;
        let key = 0;
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

                    <Row className="search-form-container">
                        <div className="search-form">
                            <div className="search-form-item">
                                <Row>
                                    <Col sm={4} md={4} lg={4}>
                                        <div className="search-input-container">
                                            <div className="search-icon">
                                                <i className="fa fa-search margin-auto"/>
                                            </div>

                                            <Input className="search-input" name="searchText" type="text" bsSize="md"
                                                   placeholder={t('search.textbox_placeholder_search_text')}
                                                   title={t('search.title')}
                                                   value={this.state.searchForm.searchText}
                                                   onChange={(e) => {
                                                       this._searchFilterChangeHandler(e)
                                                   }}
                                                   onKeyDown={this._handleKeyDown}
                                                   autoFocus={true}>
                                            </Input>
                                            {this.state.searchForm.searchText &&
                                                <Button className="reset-search-button" color="link"
                                                        onClick={this._onResetSearch}>
                                                    <i title={t('search.btn_reset_search_tooltip')}
                                                       className="fa fa-times pointer" aria-hidden="true"/>
                                                </Button>
                                            }
                                        </div>
                                    </Col>
                                    <Col sm={7} md={7} lg={7}>
                                        <FormGroup check>
                                            <Label check>
                                                <Input type="checkbox" name="searchInLibrary" id="searchInLibrary"
                                                       checked={this.state.searchForm.searchInLibrary}
                                                       onChange={(e) => {
                                                           this._searchFilterChangeHandler(e)
                                                       }}>
                                                </Input>
                                                {t('search.search_form_lbl_library')}
                                            </Label>
                                        </FormGroup>
                                        <FormGroup check>
                                            <Label check>
                                                <Input type="checkbox" name="searchInAnnotations"
                                                       id="searchInAnnotations"
                                                       checked={this.state.searchForm.searchInAnnotations}
                                                       onChange={(e) => {
                                                           this._searchFilterChangeHandler(e)
                                                       }}>
                                                </Input>
                                                {t('search.search_form_lbl_annotations')}
                                            </Label>
                                        </FormGroup>
                                        <FormGroup check>
                                            <Label check>
                                                <Input type="checkbox" name="searchInKeywords"
                                                       id="searchInKeywords"
                                                       checked={this.state.searchForm.searchInKeywords}
                                                       onChange={(e) => {
                                                           this._searchFilterChangeHandler(e)
                                                       }}>
                                                </Input>
                                                {t('search.search_form_lbl_keywords')}
                                            </Label>
                                        </FormGroup>
                                        <FormGroup check>
                                            <Label check>
                                                <Input type="checkbox" name="searchInModels"
                                                       id="searchInModels"
                                                       checked={this.state.searchForm.searchInModels}
                                                       onChange={(e) => {
                                                           this._searchFilterChangeHandler(e)
                                                       }}>
                                                </Input>

                                                {t('search.search_form_lbl_models')}
                                            </Label>
                                        </FormGroup>
                                        <Button className="search_button" color="primary" onClick={(e) => this._doSearch()}>
                                            {t('search.btn_reset_search')}
                                        </Button>
                                    </Col>
                                    <Col sm={1} md={1} lg={1}>
                                        { this.state.showLoadingSpinner &&
                                            <LoadingSpinner text=''/>
                                        }
                                    </Col>
                                </Row>
                            </div>
                        </div>
                    </Row>
                    { !this.state.showLoadingSpinner &&
                        <Row>
                            <Col sm={12} md={12} lg={12}>
                                <div className="search-results">

                                    { this.state.foundResources !== null &&
                                        <div>
                                            <div className="search-results-section-title">
                                                <span
                                                    className="search-results-title-main"> {t('search.title_results_section_library')}
                                                </span>
                                                <span
                                                    className="search-results-title-details">{t('search.title_results_section_found_resources', {found: this.state.foundResources.length})}
                                                </span>
                                            </div>
                                            <Row className="no-margin">
                                                <Col className="no-padding">
                                                    {this.state.foundResources.length > 0 &&
                                                        <div className="table-wrapper">
                                                            <Table hover size="sm" className="targets-table">
                                                                <thead
                                                                    title={t('results.table_header_tooltip_ascendant_or_descendant_order')}
                                                                    style={{width: 50}}>
                                                                <tr>
                                                                    <th style={{width: 40 + 'px'}}>#</th>
                                                                    <th style={{width: 40 + 'px'}}></th>
                                                                    <TableHeader title={t('search.library_table_column_name')}
                                                                                 sortKey="fileBasename"
                                                                                 sortedBy={this.state.sortBy} sort={this._sort}
                                                                                 style={{width: 200 + 'px'}}/>
                                                                    <TableHeader title={t('search.library_table_column_type')}
                                                                                 sortKey="type"
                                                                                 sortedBy={this.state.sortBy} sort={this._sort}
                                                                                 style={{width: 100 + 'px'}}/>
                                                                    <TableHeader title={t('search.library_table_column_family')}
                                                                                 sortKey="family"
                                                                                 sortedBy={this.state.sortBy} sort={this._sort}
                                                                                 style={{width: 100 + 'px'}}/>
                                                                    <TableHeader
                                                                        title={t('search.library_table_column_collection')}
                                                                        sortKey="collection"
                                                                        sortedBy={this.state.sortBy} sort={this._sort}/>
                                                                    <TableHeader
                                                                        title={t('search.library_table_column_genus')}
                                                                        sortKey="genus"
                                                                        sortedBy={this.state.sortBy} sort={this._sort}
                                                                        style={{width: 100 + 'px'}}/>
                                                                    <TableHeader
                                                                        title={t('search.library_table_column_institution_code')}
                                                                        sortKey="institutionCode"
                                                                        sortedBy={this.state.sortBy} sort={this._sort}
                                                                        style={{width: 10 + 'px'}}/>
                                                                    <TableHeader
                                                                        title={t('search.library_table_column_institution_name')}
                                                                        sortKey="institutionName"
                                                                        sortedBy={this.state.sortBy} sort={this._sort}
                                                                        // style={{width: 100 +'px'}}
                                                                    />
                                                                    <TableHeader
                                                                        title={t('search.library_table_column_collector_name')}
                                                                        sortKey="collectorName"
                                                                        sortedBy={this.state.sortBy} sort={this._sort}
                                                                        style={{width: 100 + 'px'}}/>
                                                                </tr>
                                                                </thead>
                                                                <tbody>
                                                                {this.state.foundResources.map((resource, index) => {
                                                                    return (
                                                                        <tr key={key++}>
                                                                            <td scope="row"
                                                                                style={{width: 40 + 'px'}}>{index + 1}</td>
                                                                            <td scope="row" style={{width: 40 + 'px'}}>
                                                                                <img
                                                                                    className='open-resource-btn'
                                                                                    alt="external link"
                                                                                    src={require('./pictures/external-link.svg')}
                                                                                    onClick={e => {
                                                                                        this._onOpenResource(resource.sha1);
                                                                                    }}
                                                                                />
                                                                            </td>
                                                                            <td style={{width: 200 + 'px'}}>{resource.fileBasename}</td>
                                                                            <td style={{width: 100 + 'px'}}>{resource.type}</td>
                                                                            <td style={{width: 100 + 'px'}}>{resource.family}</td>
                                                                            <td>{resource.collection}</td>
                                                                            <td style={{width: 100 + 'px'}}>{resource.genus}</td>
                                                                            <td style={{width: 10 + 'px'}}>{resource.institutionCode}</td>
                                                                            <td>{resource.institutionName}</td>
                                                                            <td>{resource.collectorName}</td>
                                                                        </tr>
                                                                    )
                                                                })}
                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    }
                                                </Col>
                                            </Row>
                                        </div>
                                    }

                                    { this.state.foundAnnotations !== null &&
                                        <div>
                                            <div className="search-results-section-title">
                                                <span
                                                    className="search-results-title-main"> {t('search.title_results_section_annotations')}
                                                </span>
                                                <span
                                                    className="search-results-title-details">{t('search.title_results_section_found_annotations', {found: this.state.foundAnnotations.length})}
                                                </span>
                                            </div>
                                            <Row className="no-margin">
                                                <Col className="no-padding">
                                                    {this.state.foundAnnotations.length > 0 &&
                                                        <div className="table-wrapper">
                                                            <Table hover size="sm" className="targets-table">
                                                                <thead
                                                                    title={t('results.table_header_tooltip_ascendant_or_descendant_order')}
                                                                    style={{width: 50}}>
                                                                <tr>
                                                                    <th style={{width: 40 + 'px'}}>#</th>
                                                                    <th style={{width: 40 + 'px'}}></th>
                                                                    <TableHeader
                                                                        title={t('search.annotations_table_column_file')}
                                                                        sortKey="fileBasename"
                                                                        sortedBy={this.state.sortBy} sort={this._sort}
                                                                        style={{width: 200 + 'px'}}/>
                                                                    <TableHeader
                                                                        title={t('search.annotations_table_column_name')}
                                                                        sortKey="title"
                                                                        sortedBy={this.state.sortBy} sort={this._sort}
                                                                        style={{width: 200 + 'px'}}/>
                                                                    <TableHeader
                                                                        title={t('search.annotations_table_column_type')}
                                                                        sortKey="type"
                                                                        sortedBy={this.state.sortBy} sort={this._sort}
                                                                        style={{width: 100 + 'px'}}/>
                                                                    <TableHeader
                                                                        title={t('search.annotations_table_column_value')}
                                                                        sortKey="value"
                                                                        sortedBy={this.state.sortBy} sort={this._sort}/>
                                                                    <TableHeader
                                                                        title={t('search.annotations_table_column_character')}
                                                                        sortKey="targets"
                                                                        sortedBy={this.state.sortBy} sort={this._sort}
                                                                        style={{width: 200 + 'px'}}/>
                                                                </tr>
                                                                </thead>
                                                                <tbody>
                                                                {this.state.foundAnnotations.map((annotation, index) => {
                                                                    return (
                                                                        <tr key={key++}>
                                                                            <td scope="row"
                                                                                style={{width: 40 + 'px'}}>{index + 1}</td>
                                                                            <td scope="row" style={{width: 40 + 'px'}}>
                                                                                <img
                                                                                    className='open-resource-btn'
                                                                                    alt="external link"
                                                                                    src={require('./pictures/external-link.svg')}
                                                                                    onClick={e => {
                                                                                        this._onOpenAnnotation(annotation.resourceId, annotation.id, annotation.type);
                                                                                    }}
                                                                                />
                                                                            </td>
                                                                            <td style={{width: 200 + 'px'}}>{annotation.fileBasename}</td>
                                                                            <td style={{width: 200 + 'px'}}>{annotation.title}</td>
                                                                            <td style={{width: 100 + 'px'}}>{annotation.type}</td>
                                                                            <td title={annotation.value}> {annotation.value.length < 200
                                                                                ? annotation.value :
                                                                                annotation.value.substring(0, 200) + ' ...'}
                                                                            </td>
                                                                            <td style={{width: 200 + 'px'}}>{annotation.target}</td>
                                                                        </tr>
                                                                    )
                                                                })}
                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    }
                                                </Col>
                                            </Row>
                                        </div>
                                    }

                                    { this.state.foundKeywords !== null &&
                                        <div>
                                            <div className="search-results-section-title">
                                        <span
                                            className="search-results-title-main"> {t('search.title_results_section_keywords')}
                                        </span>
                                                <span
                                                    className="search-results-title-details">
                                            {t('search.title_results_section_found_keywords',
                                                {found: this.state.foundKeywords.reduce((count, item) => count + item.tags.length, 0)})}
                                        </span>
                                            </div>
                                            <Row className="no-margin">
                                                <Col className="no-padding">
                                                    {this.state.foundKeywords.length > 0 &&
                                                        <div className="table-wrapper">
                                                            <Table hover size="sm" className="targets-table">
                                                                <thead
                                                                    title={t('results.table_header_tooltip_ascendant_or_descendant_order')}
                                                                    style={{width: 50}}>
                                                                <tr>
                                                                    <th style={{width: 40 + 'px'}}>#</th>
                                                                    <th style={{width: 40 + 'px'}}></th>
                                                                    <TableHeader title={t('search.keywords_table_column_group')}
                                                                                 sortKey="path"
                                                                                 sortedBy={this.state.sortBy} sort={this._sort}
                                                                                 style={{width: 200 + 'px'}}/>
                                                                    <TableHeader title={t('search.keywords_table_column_tags')}
                                                                                 sortKey="tags"
                                                                                 sortedBy={this.state.sortBy}
                                                                                 sort={this._sort}/>
                                                                </tr>
                                                                </thead>
                                                                <tbody>
                                                                {this.state.foundKeywords.map((keyword, index) => {
                                                                    return (
                                                                        <tr key={key++}>
                                                                            <td scope="row"
                                                                                style={{width: 40 + 'px'}}>{index + 1}</td>
                                                                            <td scope="row" style={{width: 40 + 'px'}}>
                                                                                <img
                                                                                    className='open-resource-btn'
                                                                                    alt="external link"
                                                                                    src={require('./pictures/external-link.svg')}
                                                                                    onClick={e => {
                                                                                        this._onOpenCategory(keyword.path);
                                                                                    }}
                                                                                />
                                                                            </td>
                                                                            <td style={{width: 400 + 'px'}}>{
                                                                                keyword.path.map(item => {
                                                                                    return item.name
                                                                                }).join(' > ')}
                                                                            </td>
                                                                            <td>
                                                                                <div className="tag-items-container">
                                                                                    {keyword.tags.map((tag, index) => {
                                                                                        return (
                                                                                            <span
                                                                                                key={`tg-d-${index}-${tag.name}`}
                                                                                                className="tag-item"
                                                                                                onClick={(event) => this._onOpenTag(tag.name)}>
                                                                                    {tag.name}
                                                                                </span>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )
                                                                })}
                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    }
                                                </Col>
                                            </Row>
                                        </div>
                                    }

                                    { this.state.foundCharacters !== null &&
                                        <div>
                                            <div className="search-results-section-title">
                                        <span
                                            className="search-results-title-main"> {t('search.title_results_section_models')}
                                        </span>
                                                <span
                                                    className="search-results-title-details">
                                        {t('search.title_results_section_found_characters',
                                            {found: this.state.foundCharacters.reduce((count, item) => count + item.characters.length, 0)})}
                                        </span>
                                            </div>
                                            <Row className="no-margin">
                                                <Col className="no-padding">
                                                    {this.state.foundCharacters.length > 0 &&
                                                        <div className="table-wrapper">
                                                            <Table hover size="sm" className="targets-table">
                                                                <thead
                                                                    title={t('results.table_header_tooltip_ascendant_or_descendant_order')}
                                                                    style={{width: 50}}>
                                                                <tr>
                                                                    <th style={{width: 40 + 'px'}}>#</th>
                                                                    <th style={{width: 40 + 'px'}}></th>
                                                                    <TableHeader
                                                                        title={t('search.models_table_column_model_name')}
                                                                        sortKey="taxonomy.name"
                                                                        sortedBy={this.state.sortBy} sort={this._sort}
                                                                        style={{width: 200 + 'px'}}/>
                                                                    <TableHeader
                                                                        title={t('search.models_table_column_characters')}
                                                                        sortKey="characters"
                                                                        sortedBy={this.state.sortBy} sort={this._sort}/>
                                                                </tr>
                                                                </thead>
                                                                <tbody>
                                                                {this.state.foundCharacters.map((foundCharacter, index) => {
                                                                    return (
                                                                        <tr key={key++}>
                                                                            <td scope="row"
                                                                                style={{width: 40 + 'px'}}>{index + 1}</td>
                                                                            <td scope="row" style={{width: 40 + 'px'}}>
                                                                                <img
                                                                                    className='open-resource-btn'
                                                                                    alt="external link"
                                                                                    src={require('./pictures/external-link.svg')}
                                                                                    onClick={e => {
                                                                                        this._onOpenTaxonomy(foundCharacter.taxonomy.id);
                                                                                    }}
                                                                                />
                                                                            </td>
                                                                            <td style={{width: 500 + 'px'}}>
                                                                    <span
                                                                        className="model-name">{foundCharacter.taxonomy.name}</span>
                                                                                <i className="model-type-icon">{foundCharacter.taxonomy.model === MODEL_XPER ? "Xper" : "Ann"}</i>

                                                                            </td>
                                                                            <td>
                                                                                <div className="character-items-container">
                                                                                    {foundCharacter.characters.map((character, index) => {
                                                                                        return (
                                                                                            <span
                                                                                                key={`tg-d-${index}-${character.name}`}
                                                                                                className="character-item"
                                                                                                style={{borderColor: character.color ? character.color : '#ccc'}}
                                                                                                onClick={(event) => this._onOpenTaxonomy(foundCharacter.taxonomy.id, character.id)}>
                                                                                {character.name}{character.targetType ? ' : ' + character.targetType : ''}
                                                                            </span>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )
                                                                })}
                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    }
                                                </Col>
                                            </Row>
                                        </div>
                                    }
                                </div>
                            </Col>
                            <Col sm={9} md={9} lg={9}/>
                        </Row>
                    }
                </div>
            </Container>
        );
    }

}
