import React, {Component} from "react";
import {Col, Container, FormGroup, Input, Label, Row, Table} from "reactstrap";
import PageTitle from "./PageTitle";
import SEARCH_IMAGE_CONTEXT from "./pictures/search_icon.svg";
import TableHeader from "./TableHeader";
import {
    ANNOTATION_ANGLE, ANNOTATION_CATEGORICAL, ANNOTATION_COLORPICKER, ANNOTATION_MARKER,
    ANNOTATION_OCCURRENCE,
    ANNOTATION_POLYGON,
    ANNOTATION_POLYLINE, ANNOTATION_RECTANGLE,
    ANNOTATION_SIMPLELINE, ANNOTATION_TRANSCRIPTION
} from "../constants/constants";
import {
    ee,
    EVENT_HIGHLIGHT_ANNOTATION,
    EVENT_HIGHLIGHT_ANNOTATION_ON_LEAFLET, EVENT_SELECT_SELECTION_TAB,
    EVENT_SELECT_TAB
} from "../utils/library";
import {loadMetadata} from "../utils/config";

export const IN_SELECTION = 'IN_SELECTION';
export const IN_PROJECT = 'IN_PROJECT';

export default class Search extends Component {

    constructor(props) {
        super(props);
        this.state = {
            searchForm: {
                searchText: '',
                scope: IN_SELECTION
            },
            foundAnnotations: [],
            foundResources: []
        }
    }

    componentDidMount() {
    }

    _searchFormChangeHandler = (event) => {
        const {name, value} = event.target;
        const {t} = this.props;
        const searchForm = {...this.state.searchForm};
        searchForm[name] = value ? value : '';
        this.setState({
            searchForm: searchForm
        });
    };

    _handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            this._doSearch();
        }
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
            ee.emit(EVENT_HIGHLIGHT_ANNOTATION, annotationId , true);
            ee.emit(EVENT_HIGHLIGHT_ANNOTATION_ON_LEAFLET, annotationId , type);
        }, 500);
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

    _doSearch() {
        console.log("search by", this.state.searchForm);
        console.log("all annotations in project", this.props.annotations);
        if (!this.state.searchForm.searchText) {
            alert('Please enter some text to search by!');
            return;
        }
        // search resources
        console.log("all pictures in project", this.props.pictures);
        let foundPictures = []
        if (this.props.pictures) {
            let allPictures = []
            for (const pictureId in this.props.pictures) {
                let picture = this.props.pictures[pictureId];
                console.log('processing picture', picture);
                let familyValue = '';
                let collectionNameValue = '';
                let institutionCodeValue = '';
                let institutionNameValue = '';
                let collectorNameValue = '';
                let genusValue = '';
                if (picture.erecolnatMetadata) {
                    console.log("loaded metadata erecolnat", picture.erecolnatMetadata);
                    familyValue = picture.erecolnatMetadata.family ? picture.erecolnatMetadata.family : '';
                    collectionNameValue = picture.erecolnatMetadata.collectionname ? picture.erecolnatMetadata.collectionname : '';
                    institutionNameValue = picture.erecolnatMetadata.institutionname ? picture.erecolnatMetadata.institutionname : '';
                    institutionCodeValue = picture.erecolnatMetadata.institutioncode ? picture.erecolnatMetadata.institutioncode : '';
                    collectorNameValue = picture.erecolnatMetadata.recordedby ? picture.erecolnatMetadata.recordedby : '';
                    genusValue = picture.erecolnatMetadata.genus ? picture.erecolnatMetadata.genus : '';
                } else {
                    let metadata = loadMetadata(pictureId);
                    console.log("loaded metadata", metadata);
                    if(metadata) {
                        familyValue = metadata.naturalScienceMetadata && metadata.naturalScienceMetadata.family ? metadata.naturalScienceMetadata.family : '';
                        collectorNameValue = metadata.iptc &&  metadata.iptc.creator ? metadata.iptc.creator : '';
                        collectionNameValue = '';
                        institutionNameValue = '';
                        institutionCodeValue = '';
                        genusValue = metadata.naturalScienceMetadata && metadata.naturalScienceMetadata.genre ? metadata.naturalScienceMetadata.genre : '';
                    }
                }
                allPictures.push({
                    sha1: picture.sha1,
                    fileBasename: picture.file_basename,
                    type: picture.type,
                    family: familyValue,
                    genus: genusValue,
                    collection: collectionNameValue,
                    institutionCode: institutionCodeValue,
                    institutionName: institutionNameValue,
                    collectorName: collectorNameValue
                });
                console.log("all pictures", allPictures);
                foundPictures = allPictures.filter(pic => {
                    return pic.fileBasename.toLowerCase().includes(this.state.searchForm.searchText.toLowerCase()) ||
                        pic.family.toLowerCase().includes(this.state.searchForm.searchText.toLowerCase()) ||
                        pic.genus.toString().toLowerCase().includes(this.state.searchForm.searchText.toLowerCase()) ||
                        pic.collection.toString().toLowerCase().includes(this.state.searchForm.searchText.toLowerCase()) ||
                        pic.institutionCode.toString().toLowerCase().includes(this.state.searchForm.searchText.toLowerCase()) ||
                        pic.institutionName.toString().toLowerCase().includes(this.state.searchForm.searchText.toLowerCase()) ||
                        pic.collectorName.toString().toLowerCase().includes(this.state.searchForm.searchText.toLowerCase())
                });
            }
        }

        // search annotations
        let foundAnnotations = []
        if (this.props.annotations) {
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

                allAnnotations.push({
                    id: annotation.id,
                    title: annotation.title,
                    type: annotation.annotationType,
                    value: value,
                    target: target,
                    resourceId: annotation.pictureId,
                    fileBasename: this.props.pictures[annotation.pictureId].file_basename
                });
                foundAnnotations = allAnnotations.filter(ann => {
                    return ann.title.toLowerCase().includes(this.state.searchForm.searchText.toLowerCase()) ||
                        ann.target.toLowerCase().includes(this.state.searchForm.searchText.toLowerCase()) ||
                        ann.value.toString().toLowerCase().includes(this.state.searchForm.searchText.toLowerCase())
                });
            });
        }
        console.log("foundPictures", foundPictures);
        console.log("foundAnnotations", foundAnnotations);
        this.setState({
            foundResources: foundPictures,
            foundAnnotations: foundAnnotations,
        })
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
                                               autoFocus={true}
                                        >
                                        </Input>
                                    </Col>
                                    <Col sm={9} md={9} lg={9}>
                                        {/*<FormGroup check>*/}
                                        {/*    <Label check>*/}
                                        {/*        <Input type="radio" name="scope"*/}
                                        {/*               value={IN_SELECTION}*/}
                                        {/*               checked={IN_SELECTION === this.state.searchForm.scope}*/}
                                        {/*               onChange={this._searchFormChangeHandler}*/}
                                        {/*        />{' '}{t('search.lbl_search_in_selection')}*/}
                                        {/*    </Label>*/}
                                        {/*</FormGroup>*/}
                                        {/*<FormGroup check>*/}
                                        {/*    <Label check>*/}
                                        {/*        <Input type="radio" name="scope"*/}
                                        {/*               value={IN_PROJECT}*/}
                                        {/*               checked={IN_PROJECT === this.state.searchForm.scope}*/}
                                        {/*               onChange={this._searchFormChangeHandler}*/}
                                        {/*        />{' '}{t('search.lbl_search_in_project')}*/}
                                        {/*    </Label>*/}
                                        {/*</FormGroup>*/}
                                    </Col>
                                </Row>
                            </div>
                        </div>
                    </Row>
                    <Row>
                        <Col sm={12} md={12} lg={12}>
                            <div className="search-results">
                                <div className="search-results-section-title">
                                    <span className="search-results-title-main"> {t('search.title_results_section_library')}</span>
                                    <span className="search-results-title-details">{t('search.title_results_section_found_resources', {found: this.state.foundResources.length})}</span>
                                </div>
                                <Row className="no-margin">
                                    <Col className="no-padding">
                                        {this.state.foundResources &&
                                            <div className="scrollable-table-wrapper" style={{height: 300}}>
                                                <Table hover size="sm" className="targets-table">
                                                    <thead
                                                        title={t('results.table_header_tooltip_ascendant_or_descendant_order')} style={{width: 50}}>
                                                    <tr>
                                                        <th>#</th>
                                                        <th></th>
                                                        <TableHeader title={t('search.library_table_column_name')}
                                                                     sortKey="fileBasename"
                                                                     sortedBy={this.state.sortBy} sort={this._sort}
                                                                     style={{width: 200 +'px'}}/>
                                                        <TableHeader title={t('search.library_table_column_type')}
                                                                     sortKey="type"
                                                                     sortedBy={this.state.sortBy} sort={this._sort}
                                                                     style={{width: 100 +'px'}}/>
                                                        <TableHeader title={t('search.library_table_column_family')}
                                                                     sortKey="family"
                                                                     sortedBy={this.state.sortBy} sort={this._sort}
                                                                     style={{width: 100 +'px'}}/>
                                                        <TableHeader title={t('search.library_table_column_collection')}
                                                                     sortKey="collection"
                                                                     sortedBy={this.state.sortBy} sort={this._sort}/>
                                                        <TableHeader
                                                            title={t('search.library_table_column_genus')}
                                                            sortKey="genus"
                                                            sortedBy={this.state.sortBy} sort={this._sort}
                                                            style={{width: 100 +'px'}}/>
                                                        <TableHeader
                                                            title={t('search.library_table_column_institution_code')}
                                                            sortKey="institutionCode"
                                                            sortedBy={this.state.sortBy} sort={this._sort}
                                                            style={{width: 50 +'px'}}/>
                                                        <TableHeader
                                                            title={t('search.library_table_column_institution_name')}
                                                            sortKey="institutionName"
                                                            sortedBy={this.state.sortBy} sort={this._sort}
                                                            style={{width: 100 +'px'}}/>
                                                        <TableHeader
                                                            title={t('search.library_table_column_collector_name')}
                                                            sortKey="collectorName"
                                                            sortedBy={this.state.sortBy} sort={this._sort}
                                                            style={{width: 100 +'px'}}/>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {this.state.foundResources.map((resource, index) => {
                                                        return (
                                                            <tr key={key++}>
                                                                <td scope="row" style={{width: 50}}>{index + 1}</td>
                                                                <td scope="row" style={{width: 50}}>
                                                                    <img
                                                                        className='open-resource-btn'
                                                                        alt="external link"
                                                                        src={require('./pictures/external-link.svg')}
                                                                        onClick={ e => {
                                                                            this._onOpenResource(resource.sha1);
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td style={{width: 200 +'px'}}>{resource.fileBasename}</td>
                                                                <td style={{width: 100 +'px'}}>{resource.type}</td>
                                                                <td style={{width: 100 +'px'}}>{resource.family}</td>
                                                                <td style={{width: 100 +'px'}}>{resource.collection}</td>
                                                                <td style={{width: 100 +'px'}}>{resource.genus}</td>
                                                                <td style={{width: 50 +'px'}}>{resource.institutionCode}</td>
                                                                <td style={{width: 100 +'px'}}>{resource.institutionName}</td>
                                                                <td style={{width: 100 +'px'}}>{resource.collectorName}</td>
                                                            </tr>
                                                        )
                                                    })}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        }
                                    </Col>
                                </Row>


                                <div className="search-results-section-title">
                                    <span className="search-results-title-main"> {t('search.title_results_section_annotations')}</span>
                                    <span className="search-results-title-details">{t('search.title_results_section_found_annotations', {found: this.state.foundAnnotations.length})}</span>
                                </div>
                                <Row className="no-margin">
                                <Col className="no-padding">
                                    {this.state.foundAnnotations &&
                                        <div className="scrollable-table-wrapper" style={{height: 300}}>
                                            <Table hover size="sm" className="targets-table">
                                                <thead
                                                    title={t('results.table_header_tooltip_ascendant_or_descendant_order')} style={{width: 50}}>
                                                    <tr>
                                                        <th>#</th>
                                                        <th></th>
                                                        <TableHeader title={t('search.annotations_table_column_file')}
                                                                     sortKey="fileBasename"
                                                                     sortedBy={this.state.sortBy} sort={this._sort}
                                                                     style={{width: 200 +'px'}}/>
                                                        <TableHeader title={t('search.annotations_table_column_name')}
                                                                     sortKey="title"
                                                                     sortedBy={this.state.sortBy} sort={this._sort}
                                                                     style={{width: 200 +'px'}}/>
                                                        <TableHeader title={t('search.annotations_table_column_type')}
                                                                     sortKey="type"
                                                                     sortedBy={this.state.sortBy} sort={this._sort}
                                                                     style={{width: 100 +'px'}}/>
                                                        <TableHeader title={t('search.annotations_table_column_value')}
                                                                     sortKey="value"
                                                                     sortedBy={this.state.sortBy} sort={this._sort}/>
                                                        <TableHeader
                                                            title={t('search.annotations_table_column_character')}
                                                            sortKey="targets"
                                                            sortedBy={this.state.sortBy} sort={this._sort}
                                                            style={{width: 200 +'px'}}/>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                {this.state.foundAnnotations.map((annotation, index) => {
                                                    return (
                                                        <tr key={key++}>
                                                            <td scope="row" style={{width: 50}}>{index + 1}</td>
                                                            <td scope="row" style={{width: 50}}>
                                                                <img
                                                                    className='open-resource-btn'
                                                                    alt="external link"
                                                                    src={require('./pictures/external-link.svg')}
                                                                    onClick={ e => {
                                                                        this._onOpenAnnotation(annotation.resourceId, annotation.id, annotation.type);
                                                                    }}
                                                                />
                                                            </td>
                                                            <td style={{width: 200 +'px'}}>{annotation.fileBasename}</td>
                                                            <td style={{width: 200 +'px'}}>{annotation.title}</td>
                                                            <td style={{width: 100 +'px'}}>{annotation.type}</td>
                                                            <td title={annotation.value}> {annotation.value.length < 200
                                                                ? annotation.value :
                                                                annotation.value.substring(0, 200) + ' ...'}
                                                            </td>
                                                            <td style={{width: 200 +'px'}}>{annotation.target}</td>
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
                        </Col>
                        <Col sm={9} md={9} lg={9}/>
                    </Row>
                </div>
            </Container>
        );
    }
}
