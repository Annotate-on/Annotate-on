import React, {PureComponent} from 'react';
import {Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row, Table} from "reactstrap";
import TableHeader from "./TableHeader";
import {createPagination, formatDateForFileName} from "../utils/js";
import {calculateTableHeight, getXlsx} from "../utils/common";
import {remote} from "electron";
import XLSX from "xlsx";
import lodash from "lodash";

const EXPORT_COLUMNS = [
    'Catalog #',
    'File name',
    'Scientific name',
    'KB name',
    'KB id',
    'KB language',
    'Item id',
    'Item name',
    'Item Detail',
    'Descriptor id',
    'Descriptor name',
    'Descriptor type',
    'Group id',
    'Group name',
    'State id',
    'State name',
    'Measurement unit',
    'Min',
    'Max',
    'Min include',
    'Max include'
];

class XperData extends PureComponent {
    constructor(props) {
        super(props);

        const initPicturesList = this.props.tabData[this.props.tabName].pictures_selection.map(_ => this.props.pictures[_]);
        const annotation_list = this.props.annotations_categorical;

        const xper_annotations = annotation_list.filter(annotation => {
            return !!annotation.xperData;
        });

        let data = [];
        let index = 0;
        xper_annotations.forEach(annotation => {
            index++;
            const picture = this.props.pictures[annotation.pictureId];
            if (!picture) return;
            const catalog_number = picture.erecolnatMetadata ? picture.erecolnatMetadata.catalognumber : 'N/A';
            const file_name = picture.file_basename;
            const scientific_name = picture.erecolnatMetadata ? picture.erecolnatMetadata.scientificname: '';
            const kb_name = annotation.xperData.kb_name;
            const kb_id = annotation.xperData.kb_id;
            const kb_language = annotation.xperData.kb_language;
            annotation.xperData.items.forEach(item => {
                const item_id = item.id;
                const item_name = item.name;
                const item_detail = item.detail;
                item.descriptors.forEach(descriptor => {
                    const descriptor_id = descriptor.id;
                    const descriptor_name = descriptor.name;
                    const descriptor_type = descriptor.type;
                    let group_id = descriptor.groups[0].id;
                    let group_name = descriptor.groups[0].name;
                    if(descriptor.groups && descriptor.groups.length === 0) {
                        group_id = descriptor.groups[0].id;
                        group_name = descriptor.groups[0].name;
                    }
                    if(descriptor.type === 'CategoricalDescriptor') {
                        descriptor.states.forEach(state => {
                            let value = {};
                            value.catalog_number = catalog_number;
                            value.file_name = file_name;
                            value.scientific_name = scientific_name;
                            value.kb_name = kb_name;
                            value.kb_id = kb_id;
                            value.kb_language = kb_language;
                            value.item_id = item_id;
                            value.item_name = item_name;
                            value.detail = item_detail;
                            value.descriptor_id = descriptor_id;
                            value.descriptor_name = descriptor_name;
                            value.descriptor_type = descriptor_type;
                            value.group_id = group_id;
                            value.group_name = group_name;
                            value.state_id = state.id;
                            value.state_name = state.name;
                            data.push(value);
                        });
                    } else if(descriptor.type === 'QuantitativeDescriptor') {
                        let value = {};
                        value.catalog_number = catalog_number;
                        value.file_name = file_name;
                        value.scientific_name = scientific_name;
                        value.kb_name = kb_name;
                        value.kb_id = kb_id;
                        value.kb_language = kb_language;
                        value.item_id = item_id;
                        value.item_name = item_name;
                        value.detail = item_detail;
                        value.descriptor_id = descriptor_id;
                        value.descriptor_name = descriptor_name;
                        value.descriptor_type = descriptor_type;
                        value.group_id = group_id;
                        value.group_name = group_name;
                        value.measurement_unit = descriptor.measurementUnit;
                        value.min = descriptor.values.min;
                        value.max = descriptor.values.max;
                        value.min_include = descriptor.values.minInclude;
                        value.max_include = descriptor.values.maxInclude;
                        data.push(value);
                    }
                });
            });
        });

        const sortBy = 'catalog_number';
        const sortDirection = 'ASC';
        this.state = {
            initPicturesList,
            annotation_list,
            data,
            sortBy: sortBy,
            sortDirection: sortDirection,
            pageSize: 20,
            currentPage: 1,
            sortedData : this._sortList(sortBy, sortDirection, data)
        }
    }

    componentDidMount() {
        this._setTableHeight();
    }

    componentDidUpdate(prevProps, prevState) {
        if (!prevProps.tabVisible) {
            this._setTableHeight();
        }
    }

    _setTableHeight = () => {
        let height = calculateTableHeight(this.pane , 50);
        this.setState({
            height: height
        });
    }

    _sortList(sortBy, sortDirection, initList) {
        const sorted = lodash.sortBy(initList, _ => {
                try {
                    return typeof [sortBy] === 'string' ? [sortBy].toLowerCase() : _[sortBy];
                } catch (e) {
                    return '';
                }
            });
        return sortDirection === 'DESC' ? lodash.reverse(sorted) : sorted;
    }

    exportXlsx = (separator) => {
        const now = new Date();
        let file = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
            title: 'Xper KB Data',
            defaultPath: `${formatDateForFileName(now)}.csv`
        });
        if (!file || file.length < 1) return;

        let rows = this.state.sortedData.map(row => {
           return [
                row.catalog_number,
                row.file_name,
                row.scientific_name,
                row.kb_name,
                row.kb_id,
                row.kb_language,
                row.item_id + '',
                row.item_name,
                row.detail,
                row.descriptor_id + '',
                row.descriptor_name,
                row.descriptor_type,
                row.group_id + '',
                row.group_name,
                row.state_id ? row.state_id + '' : '',
                row.state_name,
                row.measurement_unit,
                row.min,
                row.max,
                row.min_include,
                row.max_include
           ];
        });
        let data =[EXPORT_COLUMNS, ...rows];
        console.log("worksheet data ", data);
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        getXlsx(worksheet , separator , file);
    }

    render() {
        const { t } = this.props;
        let key = 0;
        const  isDropdownDisabled = false;
        return (
            <div>
                <Row className="action-bar">
                    <Col md={1}>
                        <div>
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
                        </div>
                    </Col>
                </Row>

                <Row className="no-margin">
                    <Col className="no-padding">
                        <div className="scrollable-table-wrapper" id="wrapper" ref={_ => (this.pane = _)}
                             style={{height: this.state.height}}>
                            <Table hover size="sm" className="targets-table">
                                <thead title={t('results.table_header_tooltip_ascendant_or_descendant_order')}>
                                <tr>
                                    <th>#</th>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_catalog')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_file_name')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_scientific_name')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_kb_name')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_kb_id')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_kb_language')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_item_id')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_item_name')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_item_detail')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_descriptor_id')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_descriptor_name')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_descriptor_type')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_group_id')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_group_name')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_state_id')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_state_name')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_measurement_unit')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_min')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_max')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_min_include')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_max_include')}/>
                                </tr>
                                </thead>
                                <tbody>
                                {this.state.sortedData.map((item, index) => {
                                    if (index >= this.state.pageSize * (this.state.currentPage - 1) && index < this.state.pageSize * this.state.currentPage) {
                                        return (
                                            <tr key={key++}>
                                                <td>{index + 1}</td>
                                                <td>{item.catalog_number}</td>
                                                <td>{item.file_name}</td>
                                                <td>{item.scientific_name}</td>
                                                <td>{item.kb_name}</td>
                                                <td>{item.kb_id}</td>
                                                <td>{item.kb_language}</td>
                                                <td>{item.item_id}</td>
                                                <td>{item.item_name}</td>
                                                <td>{item.detail && item.detail.length > 100 ? item.detail.substring(0, 47) + '...' : item.detail}</td>
                                                <td>{item.descriptor_id}</td>
                                                <td>{item.descriptor_name}</td>
                                                <td>{item.descriptor_type}</td>
                                                <td>{item.group_id}</td>
                                                <td>{item.group_name}</td>
                                                <td>{item.state_id}</td>
                                                <td>{item.state_name}</td>
                                                <td>{item.measurement_unit}</td>
                                                <td>{item.min}</td>
                                                <td>{item.max}</td>
                                                <td>{item.min_include ? item.min_include + "" : ""}</td>
                                                <td>{item.max_include ? item.max_include + "" : ""}</td>
                                            </tr>
                                        );
                                    }
                                })}
                                </tbody>
                            </Table>
                            {createPagination('xper_data', this.state.data, this.state.currentPage, this.state.pageSize, (data) => {
                                this.setState(data);
                            })}
                        </div>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default XperData;
