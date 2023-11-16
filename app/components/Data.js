import path from 'path';
import React, {Fragment, PureComponent} from 'react';
import XLSX from 'xlsx';
import lodash from 'lodash';
import Select from 'react-select';

import {createPagination, formatDateForFileName} from '../utils/js';
import {
    Col,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Nav,
    NavItem,
    NavLink,
    Row,
    TabContent,
    Table,
    TabPane
} from 'reactstrap';
import classnames from 'classnames';
import Target from "../containers/Target";
import TableHeader from "./TableHeader";
import {remote} from "electron";
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
    ANNOTATION_CIRCLE_OF_INTEREST,
    ANNOTATION_TRANSCRIPTION, APP_NAME,
    MODEL_XPER
} from "../constants/constants";
import Collections from "../containers/Collections";
import XmpMetadata from "../containers/XmpMetadata";
import {METADATA_DETERMINATIONS_TITLES, METADATA_TITLES} from "../utils/erecolnat-metadata";
import {loadMetadata} from "../utils/config";
import ChronoThematicAnnotations from "../containers/ChronoThematicAnnotations";
import EventAnnotations from "../containers/EventAnnotations";
import {calculateTableHeight, getXlsx} from "../utils/common";
import LibraryTabs from "../containers/LibraryTabs";
import PageTitle from "./PageTitle";

const EXPORT_COLUMNS = [
    'Name',
    'Type',
    'Value',
    'Units',
    'Character',
    'Character type',
    'Reference',
    'Tags',
    'Author',
    'Place',
    'dpiX',
    'dpiY',
    'File',
    'Folder',
    'Note',
    'LatLng',
    'Place name',
    'Temporal coverage',
    'X',
    'Y',
    'W',
    'H',
    'Coordinates',
    'All_points_x_y',
    'Picture Tags',

    'Basis of Record',
    'Catalog Number',
    'Collection Code',
    'Collection ID',
    'Collection Name',
    'DWCA ID',
    'Family',
    'Genus',
    'Institution Code',
    'Institution ID',
    'Institution Name',
    'Modified',
    'Scientific Name',
    'Specific Epithet',
    'Collector name',
    'Collect number',
    'Date of collect',
    'Latitude',
    'Longitude',

    'Created',
    'Family',
    'Genus',
    'Higher Classification',
    'Identification Verification Status',
    'Modified',
    'Scientific Name',
    'Scientific Name Authorship',
    'Specific Epithet',
    'Taxon ID',

    "Catalog Number",
    "Reference",
    "Family",
    "Genus",
    "Scientific name",
    "Collection number",
    "Title",
    "Creator",
    "Subject/Keywords",
    "Description",
    "Publisher",
    "Contributor",
    "Date",
    "Type",
    "Format",
    "Identifier",
    "Source",
    "Language",
    "Relation",
    "Coverage / place",
    "Rights Usage Terms",
    "Contact",
    "Dimensions",
    "Resolution",
    "Orientation",
];

/**
 * This is mainly a datagrid of annotations, but some columns reflect pictures properties.
 */
class Data extends PureComponent {
    constructor(props) {
        super(props);

        this.exportXlsx = this.exportXlsx.bind(this);
        this.toggle = this.toggle.bind(this);

        const targets = {};
        const targetOptions = [];
        const tagOptions = [];

        const unsortedAnnotations = this.props.annotations.map(annotation => {
            let target = '';
            let targetType = '';
            if (this.props.selectedTaxonomy !== null && this.props.taxonomyInstance[this.props.selectedTaxonomy.id] !== undefined) {
                if (this.props.taxonomyInstance[this.props.selectedTaxonomy.id].taxonomyByAnnotation[annotation.id] !== undefined) {
                    const descriptorId = this.props.taxonomyInstance[this.props.selectedTaxonomy.id].taxonomyByAnnotation[annotation.id].descriptorId;
                    this.props.selectedTaxonomy.descriptors.forEach(descriptor => {
                        if (descriptor.id === descriptorId) {
                            target = descriptor.targetName;
                            targetType = descriptor.targetType;
                            if (targetOptions.filter(_ => _.value === descriptor.targetName).length === 0) {
                                const obj = {
                                    value: descriptor.targetName,
                                    label: descriptor.targetName
                                };
                                targetOptions.push(obj)
                            }
                            return false;
                        }
                    })
                }
            }

            const picture = this.props.pictures[annotation.pictureId];
            if (!picture)
                return;

            if (this.props.tabData.pictures_selection.indexOf(picture.sha1) === -1)
                return;

            const dirname = path.dirname(picture.file);
            const dpi = this._getImageCalibration(picture);
            let tags = '';
            if (this.props.tagsByAnnotation[annotation.id]) {
                tags = this.props.tagsByAnnotation[annotation.id].join(', ');
                this.props.tagsByAnnotation[annotation.id].map(tag => {
                    if (tagOptions.filter(_ => _.value === tag).length === 0) {
                        const obj = {
                            value: tag,
                            label: tag
                        };
                        tagOptions.push(obj)
                    }
                });
            }
            const catalognumber = picture.erecolnatMetadata ? picture.erecolnatMetadata.catalognumber : 'N/A';
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
                    case ANNOTATION_CIRCLE_OF_INTEREST:
                    case ANNOTATION_TRANSCRIPTION:
                        value = annotation.value ? annotation.value : '';
                        break;
                }
            } catch (err) {
                console.log(err);
            }

            // Format picture metadata
            let pictureMetadata = [];

            if (picture.erecolnatMetadata) {
                for (let key in METADATA_TITLES) {
                    if ('determinations' === key)
                        continue
                    pictureMetadata.push(picture.erecolnatMetadata[key])
                }
                if ('determinations' in picture.erecolnatMetadata) {
                    if(picture.erecolnatMetadata.determinations && picture.erecolnatMetadata.determinations.length > 0){
                    for (let key in METADATA_DETERMINATIONS_TITLES) {
                        pictureMetadata.push(picture.erecolnatMetadata.determinations[0][key])
                        }
                    }else{
                        console.log('determinations object empty!')
                    }
                }
            } else {
                let metadata = loadMetadata(picture.sha1);

                if (metadata) {
                    // Pad with empty values
                    for (let c = 0; c < 29; c++) {
                        pictureMetadata.push('');
                    }
                    pictureMetadata.push(...[...Object.values(metadata.naturalScienceMetadata), ...Object.values(metadata.iptc),
                        `${metadata.exif.dimensionsX} x ${metadata.exif.dimensionsY}`,
                        `${metadata.exif.resolutionX} x ${metadata.exif.resolutionY}`,
                        metadata.exif.orientation])
                }
            }

            let pictureTags = [];
            if (this.props.tagsByPicture && picture.sha1 in this.props.tagsByPicture) {
                pictureTags = this.props.tagsByPicture[picture.sha1].join(", ");
            }

            return {
                title: annotation.title,
                value: value + (annotation.measure !== undefined ? annotation.measure : ''),
                targets: target,
                targetsType: targetType,
                catalogNumber: catalognumber,
                tags: tags,
                author: '',
                place: '',
                dpix: dpi.dpix,
                dpiy: dpi.dpiy,
                fileBasename: picture.file_basename,
                dirname: dirname,
                id: annotation.id,
                note: annotation.text,
                originalValue: value,
                units: annotation.measure !== undefined ? annotation.measure : '',
                vertices: annotation.vertices,
                x: annotation.x !== undefined ? annotation.x : null,
                y: annotation.y !== undefined ? annotation.y : null,
                type: annotation.annotationType,
                pictureTags,
                pictureMetadata,
                coverage: annotation.coverage
            }

        }).filter(_ => _ !== undefined);

        const sortBy = 'measure';
        const sortDirection = 'ASC';
        const sortedAnnotations = this._sortList(sortBy, sortDirection, unsortedAnnotations);

        this.state = {
            targets: targets,
            sortedAnnotations,
            unsortedAnnotations,
            activeTab: props.match.params.editTargetTab === 'true' ? '2' : '1',
            sortBy,
            sortDirection,
            selectedOption: null,
            targetOptions,
            tagOptions,
            selectedTagOptions: null,
            selectedTargetOptions: null,
            pageSize: 20,
            currentPage: 1
        };
    }

    _filter = (selectedTagOptions, selectedTargetOptions) => {
        selectedTagOptions = selectedTagOptions || this.state.selectedTagOptions;
        selectedTargetOptions = selectedTargetOptions || this.state.selectedTargetOptions;

        //Filter annotations list by selected tags.
        let filteredAnnotationsByTags = [];
        if (selectedTagOptions !== null && selectedTagOptions.length > 0) {
            selectedTagOptions.map(tag => {
                filteredAnnotationsByTags.push(...this.state.unsortedAnnotations.filter(annotation => {
                    return annotation.tags.indexOf(tag.value) > -1;
                }));
            });

            filteredAnnotationsByTags = lodash.uniqWith(filteredAnnotationsByTags, (left, right) => {
                return left.id === right.id;
            });
        } else {
            filteredAnnotationsByTags.push(...this.state.unsortedAnnotations);
        }

        //Filter annotations list by selected targets
        let filteredAnnotationsByTargets = [];
        if (selectedTargetOptions !== null && selectedTargetOptions.length > 0) {
            selectedTargetOptions.map(target => {
                filteredAnnotationsByTargets.push(...filteredAnnotationsByTags.filter(annotation => {
                    return annotation.targets.indexOf(target.label) > -1;
                }));
            });

            filteredAnnotationsByTargets = lodash.uniqWith(filteredAnnotationsByTargets, (left, right) => {
                return left.id === right.id;
            });
        } else {
            filteredAnnotationsByTargets.push(...filteredAnnotationsByTags);
        }

        const filteredAnnotations = this._sortList(this.state.sortBy, this.state.sortDirection, filteredAnnotationsByTargets);

        this.setState({
            selectedTagOptions: selectedTagOptions || this.state.selectedTagOptions,
            selectedTargetOptions: selectedTargetOptions || this.state.selectedTargetOptions,
            sortedAnnotations: filteredAnnotations,
            currentPage: 1
        });
    };

    _sort = (sortBy, sortDirection) => {
        const sortedAnnotations = this._sortList(sortBy, sortDirection, this.state.sortedAnnotations);
        this.setState({sortBy, sortDirection, sortedAnnotations});
    };

    _sortList(sortBy, sortDirection, initList) {
        const list = initList || this.state.unsortedAnnotations;
        const sorted = lodash.sortBy(list, _ => {
                try {
                    return typeof [sortBy] === 'string' ? [sortBy].toLowerCase() : _[sortBy];
                } catch (e) {
                    return '';
                }
            })
        ;
        return sortDirection === 'DESC' ? lodash.reverse(sorted) : sorted;
    }

    toggle(tab) {
        if (this.props.tabData.activeTab !== tab) {
            this.props.updateTabularView(this.props.tabName, tab)
        }
    }

    _getImageCalibration = (picture) => {
        let imageCalibration = null;
        if (picture.sha1 in this.props.picturesByCalibration) {
            imageCalibration = this.props.picturesByCalibration[picture.sha1]
            return {
                dpix: imageCalibration.dpix,
                dpiy: imageCalibration.dpiy

            }
        } else {
            return {
                dpix: picture.dpix,
                dpiy: picture.dpiy
            }
        }

    };

    _makeRectangle = annotation => {
        let result = {
            x: '',
            y: '',
            w: '',
            h: '',
        };

        if (annotation['x'] !== null && annotation['y'] !== null) {
            const xMin = annotation['x'] - 2.5;
            const yMin = annotation['y'] - 2.5;

            result = {
                x: xMin,
                y: yMin,
                w: 5,
                h: 5,
            };

            return result;
        }

        if (annotation.vertices === null || annotation.vertices === undefined) {
            return result;
        }

        let xValues = [];
        let yValues = [];

        annotation.vertices.forEach(point => {
            xValues.push(point['x']);
            yValues.push(point['y']);
        });

        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);

        const height = yMax - yMin;
        const width = xMax - xMin;

        result = {
            x: xMin,
            y: yMin,
            w: width,
            h: height,
        };
        return result;
    };

    _printVertices = annotation => {
        let output = ''
        if (annotation.vertices) {
            annotation.vertices.map((vertex, index) => {
                if (index === 0)
                    output += `[${vertex.x}, ${vertex.y}]`
                else
                    output += `, [${vertex.x}, ${vertex.y}]`
            })
        } else {
            output = `[${annotation.x}, ${annotation.y}]`
        }
        return output;
    }

    _printCustomerVertices = annotation => {
        let outputX = `"all_points_x":[`, outputY = `"all_points_y":[`
        if (annotation.vertices) {
            annotation.vertices.map((vertex, index) => {
                if (index === 0) {
                    outputX += vertex.x;
                    outputY += vertex.y;
                } else {
                    outputX += `, ${vertex.x}`
                    outputY += `, ${vertex.y}`
                }
            })
            outputX += "]"
            outputY += "]"
        } else {
            outputX += `${annotation.x}]`
            outputY += `${annotation.y}]`
        }
        return outputX + ", " + outputY;
    }

    render() {
        let key = 0;
        const { t } = this.props;
        const isDropdownDisabled = this.state.sortedAnnotations.length === 0;
        return (
            <div className="bst rcn_data">
                <PageTitle
                    showProjectInfo={true}
                    projectName={this.props.projectName}
                    selectedTaxonomy={this.props.selectedTaxonomy}
                    titleWidget = {
                        <LibraryTabs
                            tabName={this.props.tabName}
                            numberOfResources={this.props.tabData.pictures_selection.length}
                        />
                    }
                    docLink="results"
                ></PageTitle>
                <Row className="no-margin">
                    <Col lg={12} className="no-padding">
                        <Nav tabs>
                            <NavItem>
                                <NavLink disabled={this.props.selectedTaxonomy === null}
                                         className={classnames({active: this.props.tabData.activeTab === '1'})}
                                         onClick={() => {
                                             this.toggle('1');
                                         }}
                                >
                                    {t('results.tab_characters')}
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({active: this.props.tabData.activeTab === '2'})}
                                    onClick={() => {
                                        this.toggle('2');
                                        setTimeout(this._setTableHeight, 300);
                                    }}
                                >
                                    {t('results.tab_annotations')}
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({active: this.props.tabData.activeTab === '3'})}
                                    onClick={() => {
                                        this.toggle('3');
                                    }}
                                >
                                    {t('results.tab_collections')}
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({active: this.props.tabData.activeTab === '4'})}
                                    onClick={() => {
                                        this.toggle('4');
                                    }}
                                >
                                    {t('results.tab_metadata')}
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({active: this.props.tabData.activeTab === '5'})}
                                    onClick={() => {
                                        this.toggle('5');
                                    }}
                                >
                                    {t('results.tab_chrono_thematic')}
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({active: this.props.tabData.activeTab === '6'})}
                                    onClick={() => {
                                        this.toggle('6');
                                    }}
                                >
                                    {t('results.tab_event-annotations')}
                                </NavLink>
                            </NavItem>
                        </Nav>
                        <TabContent activeTab={this.props.tabData.activeTab}>
                            <TabPane tabId="1">
                                <Target tabVisible={this.props.tabData.activeTab === "1"}
                                        tabName={this.props.tabName}
                                        editTargetId={this.props.match.params.targetId}/>
                            </TabPane>
                            <TabPane tabId="2">
                                <Row className="action-bar">
                                    <Col md={1}>
                                        <Dropdown title={t('results.dropdown_tooltip_export_the_selected_characters_to_a_csv_file')}
                                                  isOpen={this.state.dropdownOpen}
                                                  size="sm" color="primary" toggle={() => {
                                            this.setState(prevState => ({
                                                dropdownOpen: !prevState.dropdownOpen
                                            }));
                                        }}>
                                            <DropdownToggle caret color="primary" disabled={isDropdownDisabled}>
                                                {t('results.dropdown_export_to_csv')}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <DropdownItem onClick={() => {
                                                    this.exportXlsx(';')
                                                }}>{t('results.dropdown_item_use_semicolon_separator')}</DropdownItem>
                                                <DropdownItem onClick={() => {
                                                    this.exportXlsx(',')
                                                }}>{t('results.dropdown_item_use_comma_separator')}</DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </Col>
                                </Row>
                                <Row className="action-bar">
                                    <Col md={6}>
                                        <br/>
                                        {t('results.annotations.lbl_filter_by_tags')}
                                        <br/><br/>
                                        <Select
                                            value={this.state.selectedTagOptions}
                                            onChange={selectedTagOptions => {
                                                this._filter(selectedTagOptions, null);
                                            }}
                                            isMulti={true}
                                            options={this.state.tagOptions}
                                        />
                                        <br/>
                                        <br/>
                                    </Col>
                                    <Col md={6}>
                                        <br/>
                                        {t('results.annotations.lbl_filter_by_characters')}
                                        <br/><br/>
                                        <Select
                                            value={this.state.selectedTargetOptions}
                                            onChange={selectedTargetOptions => {
                                                this._filter(null, selectedTargetOptions);
                                            }}
                                            isMulti={true}
                                            options={this.state.targetOptions}
                                        />
                                        <br/>
                                        <br/>
                                    </Col>
                                </Row>
                                <Row className="no-margin">
                                    <Col className="no-padding">
                                        <div className="scrollable-table-wrapper" ref={_ => (this.pane = _)}
                                             style={{height: this.state.height}}>
                                            <Table hover size="sm" className="targets-table">
                                                <thead title={t('results.table_header_tooltip_ascendant_or_descendant_order')}>
                                                <tr>
                                                    <th>#</th>
                                                    <TableHeader title={t('results.annotations.table_column_name')} sortKey="title"
                                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                                    <TableHeader title={t('results.annotations.table_column_type')} sortKey="type"
                                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                                    <TableHeader title={t('results.annotations.table_column_value')} sortKey="value"
                                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                                    <TableHeader title={t('results.annotations.table_column_character')} sortKey="targets"
                                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                                    <TableHeader title={t('results.annotations.table_column_character_type')} sortKey="character_type"
                                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                                    <TableHeader title={t('results.annotations.table_column_reference')} sortKey="catalogNumber"
                                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                                    <TableHeader title={t('results.annotations.table_column_tags')} sortKey="tags"
                                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                                    <TableHeader title={t('results.annotations.table_column_dpix')} sortKey="dpix"
                                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                                    <TableHeader title={t('results.annotations.table_column_dpiy')} sortKey="dpiy"
                                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                                    <TableHeader title={t('results.annotations.table_column_file')} sortKey="fileBasename"
                                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                                    <TableHeader title={t('results.annotations.table_column_note')} sortKey="note"
                                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                                    <TableHeader title={t('results.annotations.table_column_folder')} sortKey="dirname"
                                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                                    <TableHeader title={t('results.annotations.table_column_x')}/>
                                                    <TableHeader title={t('results.annotations.table_column_y')}/>
                                                    <TableHeader title={t('results.annotations.table_column_w')}/>
                                                    <TableHeader title={t('results.annotations.table_column_h')}/>
                                                    <TableHeader title={t('results.annotations.table_column_coverage_spatial_location')}/>
                                                    <TableHeader title={t('results.annotations.table_column_coverage_spatial_place_name')}/>
                                                    <TableHeader title={t('results.annotations.table_column_coverage_temporal_name')}/>
                                                    <TableHeader title={t('results.annotations.table_column_coverage_temporal_start')}/>
                                                    <TableHeader title={t('results.annotations.table_column_coverage_temporal_end')}/>
                                                </tr>
                                                </thead>
                                                <tbody>

                                                {this.state.sortedAnnotations.map((annotation, index) => {
                                                    if (index >= this.state.pageSize * (this.state.currentPage - 1) && index < this.state.pageSize * this.state.currentPage) {
                                                        let result = this._makeRectangle(annotation);
                                                        return (
                                                            <tr key={key++}>
                                                                <th scope="row">{index + 1}</th>
                                                                <td>{annotation.title}</td>
                                                                <td>{annotation.type}</td>
                                                                <td>{annotation.value}</td>
                                                                <td>{annotation.targets}</td>
                                                                <td>{annotation.targetsType}</td>
                                                                <td>{annotation.catalogNumber}</td>
                                                                <td>{annotation.tags}</td>
                                                                <td>{annotation.dpix}</td>
                                                                <td>{annotation.dpiy}</td>
                                                                <td>{annotation.fileBasename}</td>
                                                                <td>{annotation.note}</td>
                                                                <td>{this._formatDirnameColumn(annotation.dirname)}</td>
                                                                <td>{result.x.toFixed(2)}</td>
                                                                <td>{result.y.toFixed(2)}</td>
                                                                <td>{result.w.toFixed(2)}</td>
                                                                <td>{result.h.toFixed(2)}</td>
                                                                <td>{annotation.coverage && annotation.coverage.spatial && annotation.coverage.spatial.location ?
                                                                    (annotation.coverage.spatial.location.latitude + "," + annotation.coverage.spatial.location.latitude) : ''}</td>
                                                                <td>{annotation.coverage && annotation.coverage.spatial ? annotation.coverage.spatial.placeName : ''}</td>
                                                                <td>{annotation.coverage && annotation.coverage.temporal ? annotation.coverage.temporal.period : ''}</td>
                                                                <td>{annotation.coverage && annotation.coverage.temporal ? annotation.coverage.temporal.start : ''}</td>
                                                                <td>{annotation.coverage && annotation.coverage.temporal ? annotation.coverage.temporal.end : ''}</td>
                                                            </tr>
                                                        )
                                                    }
                                                })}
                                                </tbody>
                                            </Table>
                                            {createPagination('annotations', this.state.sortedAnnotations, this.state.currentPage, this.state.pageSize, (data) => {
                                                this.setState(data);
                                            })}
                                        </div>
                                    </Col>
                                </Row>
                            </TabPane>
                            <TabPane tabId="3">
                                <Collections tabVisible={this.props.tabData.activeTab === "3"}
                                             tabName={this.props.tabName}
                                />
                            </TabPane>
                            <TabPane tabId="4">
                                <XmpMetadata tabVisible={this.props.tabData.activeTab === "4"}
                                             tabName={this.props.tabName}
                                />
                            </TabPane>
                            <TabPane tabId="5">
                                <ChronoThematicAnnotations tabVisible={this.props.tabData.activeTab === "5"}
                                             tabName={this.props.tabName}
                                />
                            </TabPane>
                            <TabPane tabId="6">
                                <EventAnnotations
                                    tabVisible={this.props.tabData.activeTab === "6"}
                                    tabName={this.props.tabName}
                                    tagsByAnnotation={this.props.tagsByAnnotation}
                                />
                            </TabPane>
                        </TabContent>
                    </Col>
                </Row>
            </div>
        );
    }

    componentDidMount() {
        this._setTableHeight();
    }

    _formatDirnameColumn(path) {
        if (path.length > 24) {
            const array = path.split('\\');
            return array[0] + '\\...\\' + array[array.length - 1];
        } else {
            return path;
        }
    }

    _setTableHeight = () => {
        if (this.props.selectedTaxonomy === null && this.props.tabData.activeTab === '1') {
            this.toggle('2');
        }
        let height = calculateTableHeight(this.pane , 0);
        this.setState({
            height: height
        });
    }

    exportXlsx(separator) {
        const now = new Date();
        let file = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
            title: 'Annotations',
            defaultPath: `${formatDateForFileName(now)}.csv`
        });
        if (!file || file.length < 1) return;

        const data = this.state.sortedAnnotations.map(annotation => {
            let fragmentRegion = this._makeRectangle(annotation);
            const vertices = this._printVertices(annotation);
            const customerVertices = this._printCustomerVertices(annotation);
            let latLngValue = annotation.coverage && annotation.coverage.spatial && annotation.coverage.spatial.location
                ? annotation.coverage.spatial.location.latitude + "," + annotation.coverage.spatial.location.longitude : '';
            let placeNameValue = annotation.coverage && annotation.coverage.spatial ? annotation.coverage.spatial.placeName: '';
            let temporalValue = '';
            if(annotation.coverage && annotation.coverage.temporal) {
                let nameOfPeriod = annotation.coverage.temporal.period ? annotation.coverage.temporal.period : '';
                let start = annotation.coverage.temporal.start;
                let end = annotation.coverage.temporal.end;
                temporalValue = `${nameOfPeriod ? 'name='+ nameOfPeriod + ';' : ''}${start ? 'start='+ start + ';' : ''}${end ? 'end='+ end + ';' : ''}`;
            }
            if (separator === ";") {
                return [
                    annotation.title,
                    annotation.type,
                    annotation.originalValue.replace(/\./g, ","),
                    annotation.units,
                    annotation.targets,
                    annotation.targetsType,
                    annotation.catalogNumber,
                    annotation.tags,
                    annotation.author,
                    annotation.place,
                    annotation.dpix,
                    annotation.dpiy,
                    annotation.fileBasename,
                    annotation.dirname,
                    annotation.note,
                    latLngValue,
                    placeNameValue,
                    temporalValue,
                    fragmentRegion.x,
                    fragmentRegion.y,
                    fragmentRegion.w,
                    fragmentRegion.h,
                    vertices,
                    customerVertices,
                    annotation.pictureTags,
                    ...annotation.pictureMetadata
                ];
            } else {
                return [
                    annotation.title,
                    annotation.type,
                    annotation.originalValue,
                    annotation.units,
                    annotation.targets,
                    annotation.targetsType,
                    annotation.catalogNumber,
                    annotation.tags,
                    annotation.author,
                    annotation.place,
                    annotation.dpix,
                    annotation.dpiy,
                    annotation.fileBasename,
                    annotation.dirname,
                    annotation.note,
                    latLngValue,
                    placeNameValue,
                    temporalValue,
                    fragmentRegion.x,
                    fragmentRegion.y,
                    fragmentRegion.w,
                    fragmentRegion.h,
                    vertices,
                    customerVertices,
                    annotation.pictureTags,
                    ...annotation.pictureMetadata
                ];
            }
        });

        const worksheet = XLSX.utils.aoa_to_sheet([EXPORT_COLUMNS, ...data]);
        getXlsx(worksheet , separator , file);

    }
}

export default Data;
