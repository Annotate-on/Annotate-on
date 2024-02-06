import React, {PureComponent} from 'react';
import {Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row, Table} from 'reactstrap';
import lodash from 'lodash';
import {remote} from "electron";
import XLSX from 'xlsx';
import TableHeader from "./TableHeader";
import {createPagination, formatDateForFileName, formatValue} from "../utils/js";
import {APP_NAME, CATEGORICAL, INTEREST, MODEL_XPER} from "../constants/constants";
import {convertJsonToSDD} from "../utils/sdd-processor";
import {addProjectToWorkSpace, forceUnlockProject, getTaxonomyDir, updateTargetTypes} from "../utils/config";
import path from 'path';
import {calculateTableHeight, getXlsx} from "../utils/common";
import PickXperDatabase from "./PickXperDatabase";
import {exportSddToDatabase} from "../utils/xper";
// Columns titles are stored in a const because we want them to be the same in
// the React Table & in the exported CSV or XLS(X) files.
const COLUMN_CHARACTER_NAME = 'Character name';
const COLUMN_NUMBER_OF_MEASURES = 'Number of measures';
const COLUMN_CHARACTER_TYPE = 'Character type';
const COLUMN_CATALOG_NUMBER = 'Item';
const COLUMN_ANNOTATION_TYPE = 'Annotation type';
const COLUMN_VALUE = 'Value';
const COLUMN_SD = 'SD';
const COLUMN_MIN = 'Min';
const COLUMN_MAX = 'Max';
const COLUMN_COLOR = 'Color';

const EXPORT_COLUMNS = [
    COLUMN_CHARACTER_NAME,
    COLUMN_CHARACTER_TYPE,
    COLUMN_CATALOG_NUMBER,
    COLUMN_ANNOTATION_TYPE,
    COLUMN_NUMBER_OF_MEASURES,
    COLUMN_VALUE,
    COLUMN_SD,
    COLUMN_MIN,
    COLUMN_MAX,
    COLUMN_COLOR
];
/**
 * This is mainly a datagrid of annotations, but some columns reflect pictures properties.
 */

class Target extends PureComponent {
    constructor(props) {
        super(props);

        const sortBy = 'name';
        const sortDirection = 'ASC';

        const unsortedTargets = [];
        // Process numerical annotations.
        if (this.props.taxonomyInstance && this.props.taxonomyInstance.taxonomyByPicture) {
            for (const sha1 in this.props.taxonomyInstance.taxonomyByPicture) {
                if (this.props.tab.pictures_selection.indexOf(sha1) === -1)
                    continue;
                const picture = this.props.pictures[sha1];
                const catalogNumber = picture.erecolnatMetadata && picture.erecolnatMetadata.catalognumber ?
                    picture.erecolnatMetadata.catalognumber : picture.file_basename;

                for (const descId in this.props.taxonomyInstance.taxonomyByPicture[sha1]) {
                    const values = this.props.taxonomyInstance.taxonomyByPicture[sha1][descId];
                    const descriptor = this.props.selectedTaxonomy.descriptors.find(descriptor => descriptor.id === descId);
                    if (descriptor.annotationType === CATEGORICAL)
                        continue;
                    let itemValue = '';
                    let count = 0;
                    let segregated = null;

                    if (descriptor.annotationType === INTEREST && values.value) {
                        itemValue = values.value.join(',');
                        count = values.value.length;
                    } else {
                        itemValue = `Min: ${formatValue(values.min, 2)} | Max: ${formatValue(values.max, 2)} | M: ${formatValue(values.avg, 2)} | SD: ${formatValue(values.sd, 2)}`;
                        count = values.count;
                        segregated = {
                            value: formatValue(values.avg, 2),
                            sd: formatValue(values.sd, 2),
                            min: formatValue(values.min, 2),
                            max: formatValue(values.max, 2)
                        }
                    }

                    unsortedTargets.push({
                        catalogNumber,
                        targetType: descriptor.targetType,
                        targetName: descriptor.targetName,
                        annotationType: descriptor.annotationType,
                        value: itemValue,
                        count: count,
                        color: descriptor.targetColor,
                        segregated
                    });
                }
            }
        }

        // Process categorical annotations
        if (this.props.taxonomyInstance && this.props.taxonomyInstance.taxonomyByAnnotation) {
            for (const annId in this.props.taxonomyInstance.taxonomyByAnnotation) {
                const annotation = this.props.taxonomyInstance.taxonomyByAnnotation[annId];
                if (annotation.type !== CATEGORICAL)
                    continue;
                if (this.props.tab.pictures_selection.indexOf(annotation.sha1) === -1)
                    continue;
                const picture = this.props.pictures[annotation.sha1];
                const catalogNumber = picture.erecolnatMetadata && picture.erecolnatMetadata.catalognumber ?
                    picture.erecolnatMetadata.catalognumber : picture.file_basename;

                const descriptor = this.props.selectedTaxonomy.descriptors.find(descriptor => descriptor.id === annotation.descriptorId);

                const satesValues = [];
                if(descriptor.states){
                    descriptor.states.map(_ => {
                        if (annotation.value.indexOf(_.id) !== -1) {
                            satesValues.push(_.name);
                        }
                    });
                }
                unsortedTargets.push({
                    catalogNumber,
                    targetType: descriptor.targetType,
                    targetName: descriptor.targetName,
                    annotationType: descriptor.annotationType,
                    value: satesValues.join(',\n '),
                    count: 1,
                    color: descriptor.targetColor
                });
            }
        }

        const sortedTargets = this._sortList(sortBy, sortDirection, unsortedTargets);

        this.state = {
            sortBy,
            sortDirection,
            sortedTargets,
            pageSize: 20,
            currentPage: 1,
            showPickXperBasePopup:false
        };
    }

    componentDidMount() {
        if (this.props.editTargetId) {
            this.handleContextMenu(null, {action: 'edit', atarget: this.props.editTargetId})
        }
        this._setTableHeight();
    }

    componentDidUpdate(prevProps, prevState) {
        if (!prevProps.tabVisible) {
            this._setTableHeight();
        }
    }

    _sort = (sortBy, sortDirection) => {
        const sortedTargets = this._sortList(sortBy, sortDirection);
        this.setState({sortBy, sortDirection, sortedTargets});
    };

    _sortList(sortBy, sortDirection, initList) {
        const list = initList || this.state.sortedTargets;
        const sorted = lodash.sortBy(list, _ => (typeof _[sortBy] === 'string' ? _[sortBy].toLowerCase() : _[sortBy]));
        return sortDirection === 'DESC' ? lodash.reverse(sorted) : sorted;
    }

    _setTableHeight = () => {
        let height = calculateTableHeight(this.pane , 50);
        this.setState({
            height: height
        });
    };

    _handleExportToXperDatabase = () => {
        if (this.props.selectedTaxonomy && this.props.taxonomyInstance) {
            this.setState({
                showPickXperBasePopup: true
            });
        } else {
            alert("There is no selected taxomomy!");
        }
    }

    _exportDataToSddFile = () => {
        const now = new Date();
        const { t } = this.props;
        let file = remote.dialog.showSaveDialog(remote.getCurrentWindow () ,{
            title: t('results.characters.dialog_title_save_in_sdd'),
            defaultPath: `Characters-${formatDateForFileName(now)}.sdd.xml`
        });
        if (!file || file.length < 1) return;

        if (this.props.selectedTaxonomy && this.props.taxonomyInstance) {
            const taxonomy = this.props.taxonomies.find(_ => _.id === this.props.selectedTaxonomy.id);
            convertJsonToSDD(path.join(getTaxonomyDir(), taxonomy.sddPath), file, this.props.taxonomyInstance, this.props.selectedTaxonomy, this.props.pictures);
        }
    };

    _exportDataToSddXperDatabase = (database) => {
        const { t } = this.props;
        const result = remote.dialog.showMessageBox(remote.getCurrentWindow(), {
            type: 'warning',
            buttons: ['Yes', 'No'],
            message: t('global.confirmation'),
            cancelId: 1,
            detail: t('global.alert_all_data_in_selected_xper_3_knowledge_base_will_be_replaced')
        });
        if(!result) {
            const taxonomy = this.props.taxonomies.find(_ => _.id === this.props.selectedTaxonomy.id);
            exportSddToDatabase(path.join(getTaxonomyDir(), taxonomy.sddPath),
                this.props.taxonomyInstance,
                this.props.selectedTaxonomy,
                this.props.pictures,
                database,
                () => {
                    console.log("on export ssd completed")
                    const result = remote.dialog.showMessageBox(remote.getCurrentWindow () ,{
                        type: 'info',
                        detail: "",
                        message: t('results.characters.alert_message_data_exported_successfully_to_xper_database'),
                        buttons: ['OK'],
                        cancelId: 1
                    });
                });
        }
    };

    _exportData = (separator) => {
        const now = new Date();
        const { t } = this.props;
        let file = remote.dialog.showSaveDialog(remote.getCurrentWindow () ,{
            title: t('results.characters.dialog_title_save'),
            defaultPath: `Characters-${formatDateForFileName(now)}.csv`
        });

        if (!file || file.length < 1) return;

        const data = this.state.sortedTargets.map(target => {
            let value, sd = '', min = '', max = '';
            if ('segregated' in target && target.segregated != null) {
                value = target.segregated.value;
                sd = target.segregated.sd;
                min = target.segregated.min;
                max = target.segregated.max;
            } else {
                value = target.value;
            }

            if (separator === ";") {
                value = value.toString().replace(/\./g, ",");
                sd = sd.toString().replace(/\./g, ",");
                min = min.toString().replace(/\./g, ",");
                max = max.toString().replace(/\./g, ",");
            }

            return [
                target.targetName,
                target.targetType,
                target.catalogNumber,
                target.annotationType,
                target.count,
                value,
                sd,
                min,
                max,
                target.color
            ]
        });

        const worksheet = XLSX.utils.aoa_to_sheet([EXPORT_COLUMNS, ...data]);
        getXlsx(worksheet , separator , file);
    };

    render() {
        let key = 0;
        let canExportToSdd = false;
        if (this.props.selectedTaxonomy) {
            const taxonomy = this.props.taxonomies.find(tax => tax.id === this.props.selectedTaxonomy.id);
            if(taxonomy) canExportToSdd = taxonomy.model === MODEL_XPER;
        }
        const isDropdownDisabled = this.state.sortedTargets.length === 0;
        const { t } = this.props;
        return (
            <div className="bst rcn_targets">
                {this.state.showPickXperBasePopup &&
                    <PickXperDatabase
                        openModal={this.state.showPickXperBasePopup}
                        onClose={() => {
                            this.setState({showPickXperBasePopup: false});
                        }}
                        onPickDatabase={(database) => {
                            console.log("selected database", database)
                            this._exportDataToSddXperDatabase(database);
                        }}
                    />
                }
                <Row className="action-bar">
                    <Col md={1}>
                        <Dropdown title={t('results.dropdown_tooltip_export_the_selected_characters_to_a_csv_file')} isOpen={this.state.dropdownOpen}
                                  size="sm" color="primary" toggle={() => {
                            this.setState(prevState => ({
                                dropdownOpen: !prevState.dropdownOpen
                            }));
                        }}>
                            <DropdownToggle caret color="primary" disabled={isDropdownDisabled}>
                                {t('results.dropdown_export_results')}
                            </DropdownToggle>
                            <DropdownMenu>
                                <DropdownItem onClick={() => {
                                    this._exportData(';')
                                }}>{t('results.dropdown_item_use_semicolon_separator')}
                                </DropdownItem>
                                <DropdownItem onClick={() => {
                                    this._exportData(',')
                                }}>{t('results.dropdown_item_use_comma_separator')}
                                </DropdownItem>
                                {canExportToSdd ?
                                    <DropdownItem onClick={() => {this._exportDataToSddFile()}}>
                                        {t('results.dropdown_item_export_to_sdd_file')}
                                    </DropdownItem> : ''}
                                {canExportToSdd ?
                                    <DropdownItem onClick={() => {this._handleExportToXperDatabase()}}>
                                        {t('results.dropdown_item_export_to_xper')}

                                    </DropdownItem> : ''}
                            </DropdownMenu>
                        </Dropdown>
                    </Col>
                </Row>
                <Row className="no-margin">
                    <Col className="no-padding">
                        <div className="table-wrapper" id="wrapper" ref={_ => (this.pane = _)}
                             style={{height: this.state.height}}>

                            <Table hover size="sm" className="targets-table">
                                <thead title={t('results.table_header_tooltip_ascendant_or_descendant_order')}>
                                <tr>
                                    <th>#</th>
                                    <TableHeader title={t('results.characters.table_column_character_name')} sortKey="targetName"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title={t('results.characters.table_column_character_type')} sortKey="targetType"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <th>{t('results.characters.table_column_value')}</th>
                                    <TableHeader title={t('results.characters.table_column_item')} sortKey="catalogNumber"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title={t('results.characters.table_column_annotation_type')} sortKey="annotationType"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title={t('results.characters.table_column_number_of_measures')} sortKey="count"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                    <TableHeader title={t('results.characters.table_column_color')} sortKey="color"
                                                 sortedBy={this.state.sortBy} sort={this._sort}/>
                                </tr>
                                </thead>
                                <tbody>
                                {this.state.sortedTargets.map((target, index) => {
                                    if (index >= this.state.pageSize * (this.state.currentPage - 1) && index < this.state.pageSize * this.state.currentPage)
                                        return (
                                            <tr key={key++}>
                                                <th scope="row">{index + 1}</th>
                                                <td>
                                                    {target.targetName}
                                                </td>
                                                <td>{target.targetType}</td>
                                                <td>{target.value}</td>
                                                <td>{target.catalogNumber}</td>
                                                <td>{target.annotationType}</td>
                                                <td>{target.count}</td>
                                                <td><span style={{backgroundColor: target.color}}
                                                          className="color-circle"/>&nbsp;{target.color}</td>
                                            </tr>
                                        );
                                })}
                                </tbody>
                            </Table>

                            {createPagination('targets', this.state.sortedTargets, this.state.currentPage, this.state.pageSize, (data) => {
                                this.setState(data)
                            })}
                        </div>
                    </Col>
                </Row>

            </div>
        );
    }
}

export default Target;
