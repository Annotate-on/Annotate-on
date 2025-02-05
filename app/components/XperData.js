import React, {PureComponent} from 'react';
import {Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row, Table} from "reactstrap";
import TableHeader from "./TableHeader";
import {createPagination} from "../utils/js";
import {calculateTableHeight} from "../utils/common";

class XperData extends PureComponent {
    constructor(props) {
        super(props);

        const initPicturesList = this.props.tabData[this.props.tabName].pictures_selection.map(_ => this.props.allPictures[_]);
        const annotation_list = this.props.annotations;

        this.state = {
            initPicturesList,
            annotation_list,
            sortBy: props.sortBy,
            sortDirection: props.sortDirection,
            selectedPictures: [],
            selectAll: false,
            pageSize: 20,
            currentPage: 1
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

    render() {
        const { t } = this.props;
        let key = 0;
        // const  isDropdownDisabled = this.state.initPicturesList.length === 0;
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
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_item_alternative_name')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_item_detail')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_descriptor_id')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_descriptor_name')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_descriptor_type')}/>
                                    <TableHeader title={t('results.xper_kb_annotations.table_column_descriptor_global_weight')}/>
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
                                </tbody>
                            </Table>
                            {createPagination('collections', this.state.initPicturesList, this.state.currentPage, this.state.pageSize, (data) => {
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
